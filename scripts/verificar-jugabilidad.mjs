import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const raiz = fileURLToPath(new URL("..", import.meta.url));

// Bundlear TypeScript con el mismo compilador que Vite permite probar el motor real.
async function cargarModulo(ruta) {
  const resultado = await build({
    entryPoints: [resolve(raiz, ruta)],
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
    logLevel: "silent"
  });
  const codigo = Buffer.from(resultado.outputFiles[0].contents).toString("base64");
  return import(`data:text/javascript;base64,${codigo}`);
}

const reloj = await cargarModulo("src/game/relojMinijuego.ts");
const entrada = await cargarModulo("src/game/entrada.ts");
const capacidades = await cargarModulo("src/tres/capacidades.ts");
const storage = await cargarModulo("src/game/storage.ts");
const simulacion = await cargarModulo("src/game/simulacion.ts");

const inicio = 1_000;
let turno = reloj.crearRelojMinijuego(25, inicio);
turno = reloj.avanzarRelojMinijuego(turno, 3_500);
assert.equal(turno.restanteMs, 22_500, "El reloj debe avanzar con tiempo monotónico");
turno = reloj.pausarRelojMinijuego(turno, 4_300);
assert.equal(turno.restanteMs, 21_700, "Pausar conserva el tiempo exacto restante");
turno = reloj.avanzarRelojMinijuego(turno, 94_300);
assert.equal(turno.restanteMs, 21_700, "Pausado no pierde tiempo aunque pasen 90 s");
turno = reloj.reanudarRelojMinijuego(turno, 94_300);
turno = reloj.avanzarRelojMinijuego(turno, 95_000);
assert.equal(turno.restanteMs, 21_000, "Reanudar retoma los milisegundos exactos");
assert.equal(reloj.avanzarRelojMinijuego(turno, 94_999), turno, "Un reloj atrasado no suma tiempo");
assert.equal(reloj.avanzarRelojMinijuego(turno, 200_000).restanteMs, 0, "La cuenta atrás termina en cero");
console.log("[OK] Reloj de minijuego: pausa, reanudación, reloj atrasado y cierre exacto.");

assert.equal(entrada.TECLAS_ENTRADA.KeyQ, "pestanaAnterior");
assert.equal(entrada.TECLAS_ENTRADA.KeyE, "pestanaSiguiente");
assert.equal(entrada.TECLAS_ENTRADA.Enter, "confirmar");
const mapeoMando = new Map(entrada.BOTONES_MANDO.map(({ indice, accion }) => [indice, accion]));
assert.equal(mapeoMando.size, entrada.BOTONES_MANDO.length, "Un botón de mando no puede producir dos acciones");
assert.equal(mapeoMando.get(4), "pestanaAnterior", "LB cambia pestaña, no pulsa izquierda");
assert.equal(mapeoMando.get(5), "pestanaSiguiente", "RB cambia pestaña, no pulsa derecha");
assert.equal(mapeoMando.get(9), "pausa", "Start pausa");
console.log("[OK] Entrada semántica: Enter/A confirman, Q/E y LB/RB cambian pestañas sin puntuar en minijuegos.");

assert.equal(capacidades.soportaWebGL(), false, "Sin DOM debe existir fallback");
try {
  globalThis.document = { createElement: () => ({ getContext: () => null }) };
  assert.equal(capacidades.soportaWebGL(), false, "Sin contexto WebGL se activa el fallback");
  globalThis.document = { createElement: () => { throw new Error("WebGL bloqueado"); } };
  assert.equal(capacidades.soportaWebGL(), false, "El detector no debe lanzar excepciones");
  globalThis.document = { createElement: () => ({ getContext: () => ({ getExtension: () => null }) }) };
  assert.equal(capacidades.soportaWebGL(), true, "Con WebGL se puede usar el diorama 3D");
} finally {
  delete globalThis.document;
}
console.log("[OK] WebGL: sin DOM, contexto bloqueado o excepción activan el fallback 2D.");

const ahora = Date.UTC(2026, 4, 15, 12, 0);
const nueva = storage.crearPartidaInicial(ahora);
const tutorial = simulacion.simularProgreso(nueva, ahora + 3_600_000).partida;
assert.equal(tutorial.mascota.necesidades.hambre, nueva.mascota.necesidades.hambre);
assert.equal(tutorial.mascota.edadTotalMs, 0, "El tutorial congela la edad");

const comenzada = simulacion.comenzarPartida(nueva, ahora);
const veinteMinutos = simulacion.simularProgreso(comenzada, ahora + 1_200_000).partida;
assert.ok(veinteMinutos.mascota.necesidades.hambre < comenzada.mascota.necesidades.hambre);
assert.equal(veinteMinutos.mascota.edadTotalMs, 1_200_000);
assert.equal(simulacion.simularProgreso(veinteMinutos, ahora + 1_000_000).partida, veinteMinutos, "El reloj atrasado se ignora");

const avancePrueba = simulacion.simularHoras(comenzada, 6, ahora + 30_000);
assert.ok(avancePrueba.mascota.necesidades.hambre < comenzada.mascota.necesidades.hambre, "Fast-forward debe aplicar decaimiento real");
assert.equal(avancePrueba.ultimaMarcaValidada, ahora + 30_000, "Fast-forward debe rebasar la marca del guardado a tiempo real");
const siguienteTick = simulacion.simularProgreso(avancePrueba, ahora + 42_000).partida;
assert.ok(siguienteTick.mascota.necesidades.hambre <= avancePrueba.mascota.necesidades.hambre, "El reloj normal debe seguir avanzando inmediatamente tras el fast-forward");

const sieteDias = simulacion.simularProgreso(comenzada, ahora + 7 * 86_400_000).partida;
assert.ok(sieteDias.mascota.edadTotalMs <= 12 * 3_600_000, "Una semana sin jugar aplica como máximo 12 h");
assert.equal(sieteDias.ultimaMarcaValidada, ahora + 7 * 86_400_000);

const pausada = simulacion.alternarPausa(comenzada, ahora + 60_000);
const esperando = simulacion.simularProgreso(pausada, ahora + 4 * 3_600_000).partida;
assert.deepEqual(esperando.mascota.necesidades, pausada.mascota.necesidades);
assert.equal(esperando.mascota.edadTotalMs, pausada.mascota.edadTotalMs);
const reanudada = simulacion.alternarPausa(esperando, ahora + 4 * 3_600_000);
assert.equal(reanudada.mascota.edadTotalMs, esperando.mascota.edadTotalMs);
console.log("[OK] Simulación real: tutorial y pausa congelan necesidades; avance y límite offline funcionan.");
console.log("[OK] Fast-forward: simula necesidades y deja la marca de guardado en tiempo real.");

const merienda = simulacion.alimentar(comenzada, "onigiri", ahora + 1_000);
assert.ok(merienda, "La comida inicial debe estar disponible");
assert.equal(merienda.comidas.onigiri, comenzada.comidas.onigiri - 1);
assert.ok(merienda.mascota.necesidades.hambre >= comenzada.mascota.necesidades.hambre);
const premio = simulacion.cobrarMinijuego(comenzada, "eco-patitas", 12, 24, ahora + 1_000);
assert.equal(premio.monedas, comenzada.monedas + 24);
assert.equal(premio.recordsMinijuegos["eco-patitas"], 12);
console.log("[OK] Acciones: una merienda consume una unidad; un minijuego acredita premio y récord.");