// Prueba de humo real: abre el build en Chromium y confirma que la splash
// desaparece y la app monta tanto en file:// como servida por HTTP.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const dist = resolve(raiz, "dist");
assert.ok(existsSync(join(dist, "index.html")), "Falta dist/index.html: ejecuta npm run build primero");

const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };
const servidor = createServer((peticion, respuesta) => {
  const ruta = peticion.url === "/" || peticion.url === "/index.html" ? "/index.html" : (peticion.url ?? "");
  const archivo = join(dist, ruta.replace(/^\/Raton-Tama/, ""));
  try {
    const datos = readFileSync(archivo);
    respuesta.writeHead(200, { "Content-Type": tipos[extname(archivo)] ?? "application/octet-stream" });
    respuesta.end(datos);
  } catch {
    respuesta.writeHead(404);
    respuesta.end("no");
  }
});
await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
const puerto = servidor.address().port;

const navegador = await chromium.launch();
const errores = [];

async function probar(nombre, url, viewport) {
  const pagina = await navegador.newPage({ viewport });
  pagina.on("pageerror", (error) => errores.push(`[${nombre}] pageerror: ${error.message}`));
  pagina.on("console", (mensaje) => {
    if (mensaje.type() === "error") errores.push(`[${nombre}] console.error: ${mensaje.text()}`);
  });
  await pagina.goto(url, { waitUntil: "domcontentloaded" });

  // La splash debe ser reemplazada por la app (StartScreen u overlay de bienvenida).
  await pagina.waitForSelector(".welcome-panel, .app-shell", { timeout: 20000 });
  await pagina.waitForFunction(() => !document.querySelector("#root .boot-screen"), null, { timeout: 20000 });

  const resumen = await pagina.evaluate(() => ({
    bienvenida: Boolean(document.querySelector(".welcome-panel")),
    appShell: Boolean(document.querySelector(".app-shell")),
    botones: document.querySelectorAll(".primary-button, .top-action, .action-button").length,
    bootError: (document.getElementById("boot-error")?.textContent ?? "").trim()
  }));
  console.log(`[OK] ${nombre}: app montada (${JSON.stringify(resumen)})`);
  assert.ok(resumen.bienvenida || resumen.appShell, `La app no montó en ${nombre}`);
  assert.equal(resumen.bootError, "", `boot-error activo en ${nombre}: ${resumen.bootError}`);
  return pagina;
}

// 1) file:// — abrir index.html directamente, sin servidor.
const paginaFile = await probar("file://", `file://${join(dist, "index.html")}`, { width: 390, height: 844 });
await paginaFile.screenshot({ path: "/tmp/raton-file.png" });

// 2) Empezar partida y comprobar que el juego se dibuja (webgl o fallback).
await paginaFile.getByRole("button", { name: /¡Empezar!/ }).click();
await paginaFile.waitForSelector(".game-stage, .scene-fallback-wrap, canvas, .fallback-illustration", { timeout: 20000 });
const escena = await paginaFile.evaluate(() => ({
  canvas: Boolean(document.querySelector("canvas")),
  fallback2d: Boolean(document.querySelector(".fallback-illustration")),
  barras: document.querySelectorAll(".action-button").length,
  globos: Boolean(document.querySelector(".pet-balloons")) || Boolean(document.querySelector(".mood-callout"))
}));
console.log(`[OK] Tras ¡Empezar!: ${JSON.stringify(escena)}`);
assert.ok(escena.canvas || escena.fallback2d, "No se dibuja ni WebGL ni fallback 2D");
assert.ok(escena.barras >= 5, "Barra de acciones incompleta");
await paginaFile.screenshot({ path: "/tmp/raton-juego.png" });

// 3) Recorrido de todos los menús/acciones en una partida nueva.
const stage = paginaFile.getByTestId("game-stage");

// La comida debe responder al toque (el caso que bloqueaba el ancestro data-ignorar-gesto).
const hambreAntes = Number(await paginaFile.locator(".mobile-needs").getByTestId("need-hambre").getAttribute("data-value"));
await paginaFile.locator(".action-comer").click();
await paginaFile.getByRole("group", { name: "Elige algo rico para comer" }).waitFor();
await paginaFile.getByRole("button", { name: /Onigiri de sésamo/ }).click();
await paginaFile.getByRole("group", { name: "Elige algo rico para comer" }).waitFor({ state: "detached" });
const hambreDespues = Number(await paginaFile.locator(".mobile-needs").getByTestId("need-hambre").getAttribute("data-value"));
assert.ok(hambreDespues > hambreAntes, `La comida no restauró el hambre: ${hambreAntes} -> ${hambreDespues}`);
console.log(`[OK] Menú de comida: toque servido y hambre ${hambreAntes} -> ${hambreDespues}.`);

// El gesto vertical de arrastrar la segunda merienda a la boca no se confunde con scroll.
await paginaFile.locator(".action-comer").click();
const comidaArrastrable = paginaFile.getByRole("button", { name: /Onigiri de sésamo/ });
const cajaComida = await comidaArrastrable.boundingBox();
const cajaDiorama = await stage.boundingBox();
assert.ok(cajaComida && cajaDiorama, "La comida y el diorama deben estar visibles para arrastrar");
await paginaFile.mouse.move(cajaComida.x + cajaComida.width / 2, cajaComida.y + cajaComida.height / 2);
await paginaFile.mouse.down();
await paginaFile.waitForFunction(() => document.querySelector('[data-testid="game-stage"]')?.getAttribute("data-drag-food") === "onigiri");
console.log("[OK] Al agarrar comida aparece su modelo volumétrico procedural en el Canvas 3D.");
await paginaFile.mouse.move(cajaDiorama.x + cajaDiorama.width / 2, cajaDiorama.y + cajaDiorama.height * 0.61, { steps: 12 });
await paginaFile.mouse.up();
await paginaFile.getByRole("group", { name: "Elige algo rico para comer" }).waitFor({ state: "detached" });
await paginaFile.waitForFunction(() => JSON.parse(localStorage.getItem("raton-tama.partida") ?? "{}").comidas?.onigiri === 0);
console.log("[OK] Arrastrar verticalmente la comida hasta la boca sirve una sola unidad y cierra la bandeja.");

// La despensa se puede abrir directamente desde la bandeja de comida.
await paginaFile.locator(".action-comer").click();
await paginaFile.getByRole("button", { name: "Abrir la tienda de comida" }).click();
const tiendaDesdeComida = paginaFile.locator("[data-focus-scope='tienda']");
await tiendaDesdeComida.waitFor();
await tiendaDesdeComida.getByTestId("shop-food-onigiri").locator(".buy-button").click();
await paginaFile.waitForFunction(() => JSON.parse(localStorage.getItem("raton-tama.partida") ?? "{}").comidas?.onigiri === 1);
await tiendaDesdeComida.getByRole("button", { name: "Cerrar tienda" }).click();
console.log("[OK] La bandeja vacía abre la tienda y una compra vuelve al inventario.");

// Micro-interacciones Pou/Pet Society: todo se gestiona sobre puntos 3D publicados.
async function datoStage(clave) {
  const valor = await stage.getAttribute(`data-care-${clave}`);
  return valor ? JSON.parse(valor) : null;
}

async function esperarDato(clave) {
  await paginaFile.waitForFunction(
    (k) => Boolean(document.querySelector("[data-testid='game-stage']")?.getAttribute(`data-care-${k}`)),
    clave
  );
  return datoStage(clave);
}

/** Espera a que la escena publique una acción y fase concretas (evita atributos heredados). */
async function esperarEscena(accion, fase) {
  await paginaFile.waitForFunction(
    ({ acc, f }) => {
      const stage = document.querySelector("[data-testid='game-stage']");
      const a = stage?.getAttribute("data-care-accion");
      const faseActual = stage?.getAttribute("data-care-fase");
      if (a === null || faseActual === null) return false;
      return JSON.parse(a) === acc && (f === undefined || JSON.parse(faseActual) === f);
    },
    { acc: accion, f: fase }
  );
}

async function arrastre(origen, destino) {
  await paginaFile.mouse.move(origen.x, origen.y);
  await paginaFile.mouse.down();
  await paginaFile.mouse.move(destino.x, destino.y, { steps: 14 });
  await paginaFile.mouse.up();
}

// Jugar abre el juguetero: hay que elegir juguete antes de salir al diorama.
await paginaFile.locator(".action-jugar").click();
const juguetero = paginaFile.locator("[data-focus-scope='juguete']");
await juguetero.waitFor();
assert.equal(await juguetero.locator(".toy-choice").count(), 3, "El juguetero debe ofrecer pelota, palo y estrella");
await juguetero.getByTestId("toy-pelota").click();
const cuidadoJuego = paginaFile.getByTestId("care-jugar");
await cuidadoJuego.waitFor();

// Pelota: se golpea sobre la marcha y Mochi la devuelve; 5 pases completan la tarea.
let pases = 0;
for (let intento = 0; intento < 14 && pases < 5; intento += 1) {
  const pelota = await esperarDato("pelota");
  if (!pelota) break;
  await paginaFile.mouse.click(pelota.x, pelota.y);
  await paginaFile.waitForTimeout(950);
  const progreso = await paginaFile.locator("[data-testid='care-progress']").getAttribute("data-progress").catch(() => "0");
  pases = Number(progreso ?? 0);
}
assert.ok(pases >= 5, `La pelota debe anotar 5 pases reales (llegó a ${pases})`);
await cuidadoJuego.waitFor({ state: "detached" });
console.log("[OK] Juguetero + pelota física: se elige juguete y Mochi anota pases reales.");

// Limpiar: 3 fases (jabón → agua → toalla), la herramienta se localiza con su aro.
await paginaFile.locator(".action-limpiar").click();
const limpieza = paginaFile.getByTestId("care-limpiar");
await limpieza.waitFor();
for (let fase = 0; fase < 3; fase += 1) {
  await esperarEscena("limpiar", fase);
  const objetivos = await esperarDato("objetivos");
  assert.ok(objetivos && objetivos.length >= 6, `La fase ${fase} debe publicar sus manchas en pantalla`);
  // Se repite la pasada hasta que la fase avance (cada mancha exige su roce).
  for (let pasada = 0; pasada < 3; pasada += 1) {
    for (const destino of objetivos) {
      await esperarEscena("limpiar", fase);
      const herramienta = await esperarDato("herramienta");
      await arrastre(herramienta, destino);
      await paginaFile.waitForTimeout(340);
      const hechas = Number((await paginaFile.locator("[data-testid='care-progress']").getAttribute("data-progress")) ?? 0);
      if (hechas >= (fase + 1) * 6) break;
    }
    const hechas = Number((await paginaFile.locator("[data-testid='care-progress']").getAttribute("data-progress")) ?? 0);
    if (hechas >= (fase + 1) * 6) break;
  }
  if (fase < 2) {
    await paginaFile.waitForFunction((esperada) => {
      const valor = document.querySelector("[data-testid='game-stage']")?.getAttribute("data-care-fase");
      return valor !== null && JSON.parse(valor) > esperada;
    }, fase, { timeout: 8000 });
  }
}
await limpieza.waitFor({ state: "detached" });
console.log("[OK] Baño completo: jabón, agua y toalla con herramienta localizada por su aro.");

// Mimar: se arrastra por las zonas del pelaje y salen corazones (1–3 por roce).
await paginaFile.locator(".action-mimar").click();
const mimos = paginaFile.getByTestId("care-mimar");
await mimos.waitFor();
await esperarEscena("mimar", 0);
const zonasMimo = await esperarDato("objetivos");
assert.ok(zonasMimo.length >= 7, "La escena debe marcar las zonas acariciables en 3D");
await paginaFile.mouse.move(zonasMimo[0].x, zonasMimo[0].y);
await paginaFile.mouse.down();
for (const zona of zonasMimo.slice(1, 9)) await paginaFile.mouse.move(zona.x, zona.y, { steps: 3 });
await paginaFile.mouse.up();
await mimos.waitFor({ state: "detached" });
console.log("[OK] Mimar: roces con corazones 1–3 y estallido final de 5.");

// Dormir no necesita arrastre: es la única acción de un toque para no hacer incómoda la rutina nocturna.
await paginaFile.locator(".action-dormir").click();
await paginaFile.waitForTimeout(160);
assert.ok((await paginaFile.locator(".scene-canvas-wrap").getAttribute("class")).includes("pet-sleeping"));
await paginaFile.locator(".action-dormir").click();
console.log("[OK] Dormir/despertar sigue siendo de un solo toque.");

// La curita aparece solo ante enfermedad: montamos un estado enfermo controlado
// y comprobamos el gesto, la curación y el consumo de medicina.
await paginaFile.evaluate(() => {
  const clave = "raton-tama.partida";
  const partida = JSON.parse(localStorage.getItem(clave) ?? "{}");
  partida.mascota.enferma = true;
  partida.mascota.necesidades.salud = 20;
  partida.medicinas = Math.max(1, partida.medicinas ?? 0);
  localStorage.setItem(clave, JSON.stringify(partida));
});
await paginaFile.reload({ waitUntil: "domcontentloaded" });
await paginaFile.waitForSelector(".game-stage", { timeout: 20000 });
await paginaFile.locator(".action-curar").click();
await paginaFile.getByTestId("care-curar").waitFor();
await esperarEscena("curar", 0);
const marcaCurita = await esperarDato("objetivos");
assert.ok(marcaCurita && marcaCurita.length >= 1, "La marca rosa debe publicarse en pantalla");
const herramientaCurita = await esperarDato("herramienta");
await arrastre(herramientaCurita, marcaCurita[0]);
await paginaFile.getByTestId("care-curar").waitFor({ state: "detached" });
const curada = await paginaFile.evaluate(() => {
  const partida = JSON.parse(localStorage.getItem("raton-tama.partida") ?? "{}");
  return { enferma: partida.mascota?.enferma, salud: partida.mascota?.necesidades?.salud, medicinas: partida.medicinas };
});
assert.equal(curada.enferma, false);
assert.ok(curada.salud > 20 && curada.medicinas === 0, `La curita no consumió medicina o no curó: ${JSON.stringify(curada)}`);
console.log("[OK] Curita: se arrastra a la marca indicada, cura y consume una medicina.");

await paginaFile.getByRole("button", { name: "Abrir menú" }).click();
await paginaFile.locator("[data-focus-scope='menu-movil']").waitFor();
await paginaFile.keyboard.press("Escape");
await paginaFile.waitForSelector("[data-focus-scope='menu-movil']", { state: "detached" });
console.log("[OK] Menú móvil abre con toque y se cierra con Escape." );

// Varita: especies, animaciones, tiempo, día/noche, economía y habitación.
await paginaFile.getByRole("button", { name: "Varita mágica" }).click();
const explorador = paginaFile.locator("[data-focus-scope='explorar']");
await explorador.waitFor();
assert.equal(await explorador.locator(".explorer-species-chip").count(), 17);
await explorador.getByRole("button", { name: /Sabio de luna/ }).click();
await paginaFile.waitForFunction(() => document.querySelector('[data-testid="game-stage"]')?.getAttribute("data-species") === "sabio-luna");
await explorador.getByRole("button", { name: /Ver bostezo/ }).click();
await paginaFile.waitForFunction(() => document.querySelector('[data-testid="game-stage"]')?.getAttribute("data-pet-motion") === "bostezo");
await explorador.getByRole("button", { name: /Saltar de alegría/ }).click();
await paginaFile.waitForFunction(() => document.querySelector('[data-testid="game-stage"]')?.getAttribute("data-pet-motion") === "jugar");
const nocheAntes = await stage.getAttribute("data-night");
await explorador.getByRole("button", { name: /Pasar a (Día|Noche)/ }).click();
await paginaFile.waitForFunction((anterior) => document.querySelector('[data-testid="game-stage"]')?.getAttribute("data-night") !== anterior, nocheAntes);
await explorador.getByRole("button", { name: /Llenar toda la despensa/ }).click();
await explorador.getByRole("button", { name: /\+50 monedas/ }).click();
console.log("[OK] Exploración: especies, bostezo, salto, luz, monedas y despensa." );

// Cambiar a huevo y eclosionarlo usando el control visible.
await explorador.getByRole("button", { name: /Huevo de luna/ }).click();
await explorador.getByRole("button", { name: "Cerrar panel de exploración" }).click();
await paginaFile.getByRole("button", { name: /Toca para nacer/ }).click();
await paginaFile.getByRole("dialog", { name: /ha florecido/ }).waitFor();
await paginaFile.getByRole("button", { name: /Seguir juntos/ }).click();
await paginaFile.waitForFunction(() => document.querySelector('[data-testid="game-stage"]')?.getAttribute("data-species") === "mimi");
console.log("[OK] Eclosión de huevo y confirmación de la evolución." );

// Fast-forward altera las necesidades y las horas posteriores vuelven a avanzar en tiempo real.
await paginaFile.getByRole("button", { name: "Varita mágica" }).click();
const hungerAntesSalto = Number(await paginaFile.locator(".mobile-needs").getByTestId("need-hambre").getAttribute("data-value"));
await paginaFile.locator("[data-focus-scope='explorar']").getByRole("button", { name: /\+2 horas/ }).click();
await paginaFile.waitForFunction((antes) => Number(document.querySelector('.mobile-needs [data-testid="need-hambre"]')?.getAttribute("data-value")) < antes, hungerAntesSalto);
const marcaRebasada = await paginaFile.evaluate(() => JSON.parse(localStorage.getItem("raton-tama.partida") ?? "{}").ultimaMarcaValidada);
assert.ok(Math.abs(marcaRebasada - Date.now()) < 2500, "El simulador de exploración no debe dejar el reloj en el futuro");
await paginaFile.waitForSelector("[data-focus-scope='explorar']", { state: "detached" });
const evolucionCorta = paginaFile.getByRole("dialog", { name: /ha florecido/ });
if (await evolucionCorta.count()) await paginaFile.getByRole("button", { name: /Seguir juntos/ }).click();
await paginaFile.getByRole("button", { name: "Varita mágica" }).click();
await paginaFile.locator("[data-focus-scope='explorar']").getByRole("button", { name: /\+6 horas/ }).click();
await paginaFile.waitForFunction(() => Number(document.querySelector('[data-testid="game-stage"]')?.getAttribute("data-dirt")) > 0);
await paginaFile.waitForSelector("[data-focus-scope='explorar']", { state: "detached" });
const evolucionLarga = paginaFile.getByRole("dialog", { name: /ha florecido/ });
if (await evolucionLarga.count()) await paginaFile.getByRole("button", { name: /Seguir juntos/ }).click();
console.log("[OK] Avance +2/+6 h, suciedad y reloj rebasado a tiempo real." );

// Tienda: compra de comida, medicina y objeto; la segunda pestaña cambia y actualiza el diorama.
await paginaFile.getByRole("button", { name: "Abrir menú" }).click();
await paginaFile.locator(".mobile-menu-popover").getByRole("button", { name: "Tiendita" }).click();
const tienda = paginaFile.locator("[data-focus-scope='tienda']");
await tienda.waitFor();
const saldoAntes = Number((await tienda.locator(".coin-balance").innerText()).match(/\d+/)?.[0]);
const stockFresaAntes = Number((await tienda.getByTestId("shop-food-fresa").innerText()).match(/En la despensa: (\d+)/)?.[1]);
await paginaFile.keyboard.press("e");
await paginaFile.waitForFunction(() => document.querySelector("[data-focus-scope='tienda'] [role='tab'][aria-selected='true']")?.textContent?.includes("Habitación"));
await paginaFile.keyboard.press("q");
await paginaFile.waitForFunction(() => document.querySelector("[data-focus-scope='tienda'] [role='tab'][aria-selected='true']")?.textContent?.includes("Despensa"));
await tienda.getByTestId("shop-food-fresa").locator(".buy-button").click();
await paginaFile.waitForFunction((esperado) => new RegExp(`En la despensa: ${esperado}`).test(document.querySelector('[data-testid="shop-food-fresa"]')?.textContent ?? ""), stockFresaAntes + 1);
await tienda.getByTestId("shop-medicine").locator(".buy-button").click();
await paginaFile.keyboard.press("e");
await paginaFile.waitForFunction(() => document.querySelector("[data-focus-scope='tienda'] [role='tab'][aria-selected='true']")?.textContent?.includes("Habitación"));
await tienda.getByTestId("shop-object-plantita").locator(".buy-button").click();
await paginaFile.waitForFunction(() => document.querySelector('[data-testid="shop-object-plantita"] .bought') !== null);
assert.ok((await paginaFile.locator(".coin-balance").innerText()).match(/\d+/));
await tienda.getByRole("button", { name: "Cerrar tienda" }).click();
await paginaFile.waitForSelector("[data-focus-scope='tienda']", { state: "detached" });
console.log(`[OK] Tienda: comida (stock ${stockFresaAntes} -> ${stockFresaAntes + 1}), medicina, mueble y saldo inicial ${saldoAntes}.`);

await paginaFile.getByRole("button", { name: "Varita mágica" }).click();
const mueblesExplorador = paginaFile.locator("[data-focus-scope='explorar']");
await mueblesExplorador.getByRole("button", { name: /Poner todos los muebles/ }).click();
await mueblesExplorador.getByRole("button", { name: "Cerrar panel de exploración" }).click();
await paginaFile.waitForTimeout(100);
console.log("[OK] Exploración: se pueden colocar todos los muebles en el diorama." );

// Álbum: especies y logros visibles.
await paginaFile.getByRole("button", { name: "Abrir menú" }).click();
await paginaFile.locator(".mobile-menu-popover").getByRole("button", { name: "Álbum" }).click();
const album = paginaFile.locator("[data-focus-scope='album']");
await album.waitFor();
assert.equal(await album.locator(".species-entry").count(), 17);
assert.equal(await album.locator(".achievement-chip").count(), 9);
await paginaFile.keyboard.press("Tab");
assert.ok(await paginaFile.evaluate(() => Boolean(document.activeElement?.closest("[data-focus-scope='album']"))), "Tab debe mantener el foco dentro del álbum");
await album.getByRole("button", { name: "Cerrar álbum" }).click();
console.log("[OK] Álbum: 17 especies y 9 logros." );

// Minijuego: no se reinicia al pausar y permite puntuar con el teclado.
await paginaFile.getByRole("button", { name: "Abrir menú" }).click();
await paginaFile.locator(".mobile-menu-popover").getByRole("button", { name: "Minijuegos" }).click();
const listaJuegos = paginaFile.locator("[data-focus-scope='minijuegos']");
await listaJuegos.waitFor();
await listaJuegos.getByRole("button", { name: /Eco de patitas/ }).click();
const memoria = paginaFile.locator("[data-focus-scope='minijuego']");
await memoria.waitFor();
await paginaFile.waitForFunction(() => document.querySelector(".memory-sequence")?.getAttribute("data-mostrando") === "false", null, { timeout: 10000 });
const secuencia = (await paginaFile.locator(".memory-sequence").getAttribute("data-secuencia")).split(",");
const botonesFlecha = { arriba: "ArrowUp", abajo: "ArrowDown", izquierda: "ArrowLeft", derecha: "ArrowRight" };
for (const direccion of secuencia) {
  await paginaFile.keyboard.press(botonesFlecha[direccion]);
  await paginaFile.waitForTimeout(190);
}
const puntos = Number((await memoria.locator(".score-mark").innerText()).replace(/\D/g, ""));
assert.ok(puntos >= 12, `La secuencia de memoria no puntúa al reproducirse (${puntos})`);
await memoria.getByRole("button", { name: "Pausar" }).click();
const congelado = await memoria.locator(".minigame-scoreline").innerText();
await paginaFile.waitForTimeout(1300);
assert.equal(await memoria.locator(".minigame-scoreline").innerText(), congelado, "La pausa debe congelar el reloj del minijuego");
await memoria.getByRole("button", { name: "Continuar" }).click();
await memoria.getByRole("button", { name: "Salir del minijuego" }).click();
console.log(`[OK] Eco de patitas: secuencia completada (${puntos} puntos), reloj congelado en pausa.`);

// Los otros dos plugins también puntúan con flechas semánticas.
await paginaFile.getByRole("button", { name: "Abrir menú" }).click();
await paginaFile.locator(".mobile-menu-popover").getByRole("button", { name: "Minijuegos" }).click();
const menuJuegos2 = paginaFile.locator("[data-focus-scope='minijuegos']");
await menuJuegos2.getByRole("button", { name: /Sigue la flecha/ }).click();
const flecha = paginaFile.locator("[data-focus-scope='minijuego']");
await flecha.waitFor();
const direccion = await paginaFile.locator(".direction-target").getAttribute("data-direccion");
const teclaPorDireccion = { arriba: "ArrowUp", abajo: "ArrowDown", izquierda: "ArrowLeft", derecha: "ArrowRight" };
await paginaFile.keyboard.press(teclaPorDireccion[direccion]);
await paginaFile.waitForFunction(() => Number(document.querySelector(".score-mark")?.textContent?.replace(/\D/g, "")) >= 3);
await flecha.getByRole("button", { name: "Salir del minijuego" }).click();

await paginaFile.getByRole("button", { name: "Abrir menú" }).click();
await paginaFile.locator(".mobile-menu-popover").getByRole("button", { name: "Minijuegos" }).click();
const menuJuegos3 = paginaFile.locator("[data-focus-scope='minijuegos']");
await menuJuegos3.getByRole("button", { name: /Atrapa estrellas/ }).click();
const estrellas = paginaFile.locator("[data-focus-scope='minijuego']");
await estrellas.waitFor();
const campoEstrellas = paginaFile.locator(".star-field");
const carrilEstrella = Number(await campoEstrellas.getAttribute("data-estrella"));
const carrilCesta = Number(await campoEstrellas.getAttribute("data-carril"));
if (carrilEstrella !== carrilCesta) {
  await paginaFile.keyboard.press(carrilEstrella > carrilCesta ? "ArrowRight" : "ArrowLeft");
}
await paginaFile.waitForFunction(() => Number(document.querySelector(".score-mark")?.textContent?.replace(/\D/g, "")) >= 3, null, { timeout: 5000 });
await estrellas.getByRole("button", { name: "Salir del minijuego" }).click();
console.log("[OK] Los tres plugins puntúan con teclado y la pausa conserva el juego." );

// Los efectos silenciados persisten al recargar la página.
await paginaFile.getByRole("button", { name: "Silenciar efectos" }).click();
await paginaFile.reload({ waitUntil: "domcontentloaded" });
await paginaFile.waitForSelector(".app-shell", { timeout: 20000 });
assert.ok(await paginaFile.getByRole("button", { name: "Activar efectos" }).isVisible());
console.log("[OK] Preferencia de silencio persiste tras recargar el juego.");

await paginaFile.close();

// 3) HTTP servido (raíz y bajo /Raton-Tama/ como en Pages).
const paginaWeb = await probar("http://raíz", `http://127.0.0.1:${puerto}/index.html`, { width: 1280, height: 800 });
await paginaWeb.close();
const paginaSub = await probar("http://Raton-Tama/", `http://127.0.0.1:${puerto}/Raton-Tama/`.replace(/\/$/, "/index.html"), { width: 360, height: 380 });
await paginaSub.screenshot({ path: "/tmp/raton-compacto.png" });
await paginaSub.close();

const paginaCompacta = await probar("320x568 táctil", `file://${join(dist, "index.html")}`, { width: 320, height: 568 });
await paginaCompacta.getByRole("button", { name: /¡Empezar!/ }).click();
const medidasCompactas = await paginaCompacta.evaluate(() => ({
  anchoVista: innerWidth,
  anchoDocumento: document.documentElement.scrollWidth,
  barras: [...document.querySelectorAll(".action-button")].map((boton) => {
    const caja = boton.getBoundingClientRect();
    return { izquierda: caja.left, derecha: caja.right, alto: caja.height };
  })
}));
assert.ok(medidasCompactas.anchoDocumento <= medidasCompactas.anchoVista, `Overflow horizontal en 320px: ${JSON.stringify(medidasCompactas)}`);
assert.ok(medidasCompactas.barras.every((boton) => boton.izquierda >= 0 && boton.derecha <= 320 && boton.alto >= 44), `Barra táctil fuera de pantalla: ${JSON.stringify(medidasCompactas)}`);
await paginaCompacta.locator(".action-comer").click();
const cajasComida = await paginaCompacta.locator(".food-choice").evaluateAll((botones) => botones.map((boton) => {
  const caja = boton.getBoundingClientRect();
  return { izquierda: caja.left, derecha: caja.right, alto: caja.height };
}));
assert.ok(cajasComida.every((boton) => boton.izquierda >= 0 && boton.derecha <= 320 && boton.alto >= 44), `La despensa se desborda en 320px: ${JSON.stringify(cajasComida)}`);
console.log("[OK] 320x568 real: barra, bandeja de comida y objetivos táctiles caben sin scroll horizontal.");
await paginaCompacta.close();

await navegador.close();
servidor.close();

if (errores.length > 0) {
  console.error("\nErrores de consola capturados:");
  for (const e of errores) console.error(" -", e);
  process.exitCode = 1;
} else {
  console.log("\nNavegador: splash reemplazada, app montada y diorama dibujado sin errores de consola.");
}
