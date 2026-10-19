import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Comprueba que las superficies táctiles cumplen el mínimo de 44 px y que los
// minijuegos declaran controles y recompensas coherentes con la interfaz.
const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
const gesto = await readFile(new URL("../src/hooks/useGestoSeguro.ts", import.meta.url), "utf8");
const minijuegos = await readFile(new URL("../src/game/minijuegos.tsx", import.meta.url), "utf8");
const entrada = await readFile(new URL("../src/hooks/useEntrada.ts", import.meta.url), "utf8");
const pantallaJuego = await readFile(new URL("../src/screens/MiniJuegoScreen.tsx", import.meta.url), "utf8");
const pantallaPrincipal = await readFile(new URL("../src/screens/GameScreen.tsx", import.meta.url), "utf8");

/** Devuelve el cuerpo de todas las reglas CSS cuyo selector contiene la clase. */
function reglasDe(clase) {
  const bloques = [];
  const patron = new RegExp(`[^{}]*\\.${clase}[^{}]*\\{([^}]*)\\}`, "g");
  let coincidencia = patron.exec(css);
  while (coincidencia) {
    bloques.push(coincidencia[1]);
    coincidencia = patron.exec(css);
  }
  return bloques;
}

/** Menor min-height declarada: comprueba también los breakpoints compactos. */
function altoMinimo(clase) {
  const alturas = reglasDe(clase).flatMap((cuerpo) => {
    const valor = /min-height:\s*([\d.]+)px/.exec(cuerpo);
    return valor ? [Number.parseFloat(valor[1])] : [];
  });
  return alturas.length ? Math.min(...alturas) : 0;
}

function ampliacionGeneral(clase) {
  const cuerpos = reglasDe(`${clase}::after`);
  const valor = cuerpos.map((cuerpo) => /inset:\s*-(\d+)px/.exec(cuerpo)).find(Boolean);
  return valor ? Number(valor[1]) : 0;
}

// 1) Objetivos táctiles de 44 px mínimo (o zona ampliada con ::after).
const objetivos = ["action-button", "food-choice", "direction-key", "icon-button", "top-action", "buy-button", "shop-tab"];
for (const clase of objetivos) {
  const alto = altoMinimo(clase);
  const margen = ampliacionGeneral(clase);
  assert.ok(alto + margen * 2 >= 44, `.${clase}: objetivo táctil insuficiente en algún breakpoint (${alto} px + ${margen * 2} px)`);
  console.log(`[OK] .${clase}: mínimo CSS ${alto} px${margen ? ` + ${margen * 2} px de zona ampliada` : ""}.`);
}
assert.match(css, /\.mobile-tools \.icon-button\s*\{[^}]*min-height:\s*44px/, "Los botones del encabezado móvil deben medir 44 px físicamente");
assert.match(css, /\.food-choice\s*\{[^}]*min-height:\s*44px/, "Los alimentos arrastrables deben medir 44 px también en móvil");

// 2) Un único flujo de puntero: nada de mezclar onTap con drag de librería.
assert.ok(gesto.includes("onPointerDown") && gesto.includes("onPointerUp"), "El gesto debe centralizarse en pointerdown/pointerup");
assert.ok(gesto.includes("onPointerCancel"), "Hay que limpiar los gestos huérfanos con pointercancel");
assert.match(gesto, /onCancelar\?\.\(\)/, "Al cancelar un arrastre debe desaparecer su vista previa");
assert.ok(!/\btouch-action:\s*pan-(x|y)/.test(css), "Los elementos arrastrables no deben usar touch-action: pan-x/pan-y");
assert.ok(/\.game-stage\s*{[^}]*touch-action:\s*none/.test(css), "El diorama debe reservar el gesto con touch-action: none");
const umbral = /umbral\s*\?\?\s*(\d+)/.exec(gesto);
assert.ok(umbral && Number(umbral[1]) >= 10, "El umbral tap/arrastre debe ser de al menos 10 px");
console.log(`[OK] Un solo flujo de puntero con umbral de ${umbral ? umbral[1] : "?"} px y limpieza de gestos huérfanos.`);

// 3) Minijuegos: duración y recompensas dentro de rango jugable.
const duraciones = [...minijuegos.matchAll(/duracion:\s*(\d+)/g)].map((m) => Number(m[1]));
assert.ok(duraciones.length >= 3, "Deben registrarse al menos tres minijuegos");
assert.ok(duraciones.every((segundos) => segundos >= 15 && segundos <= 90), `Duraciones fuera de rango: ${duraciones.join(", ")}`);
const minimos = [...minijuegos.matchAll(/minimo:\s*(\d+)/g)].map((m) => Number(m[1]));
const maximos = [...minijuegos.matchAll(/maximo:\s*(\d+)/g)].map((m) => Number(m[1]));
assert.ok(minimos.every((minimo, i) => minimo > 0 && minimo <= maximos[i]), "La recompensa mínima debe ser positiva y menor que la máxima");
assert.ok(maximos.every((maximo) => maximo <= 120), "Ningún minijuego puede repartir monedas sin techo");
console.log(`[OK] Minijuegos: duraciones ${duraciones.join("s, ")}s y recompensas entre ${minimos[0]} y ${maximos[0]} monedas.`);
assert.match(entrada, /evento\.code === "Tab"/, "Los diálogos deben atrapar Tab");
assert.match(entrada, /data-focus-scope/, "El mando no debe navegar fuera del diálogo activo");
assert.match(pantallaPrincipal, /inert=\{bloqueadoPorModal\}/, "El juego de fondo debe quedar inerte bajo un diálogo");
assert.match(pantallaJuego, /<Juego pausado=\{pausado\}/, "El plugin debe permanecer montado al pausar");
assert.match(pantallaJuego, /document\.visibilityState !== "hidden"/, "Al ocultar la pestaña debe pausarse el minijuego");
assert.match(pantallaPrincipal, /webglDisponible \? \(/, "El 3D solo debe importarse en dispositivos compatibles");
assert.match(pantallaPrincipal, /<Fallback2D/, "El diorama siempre debe tener un fallback 2D");
console.log("[OK] Diálogos: foco atrapado, fondo inerte y plugins conservados durante la pausa.");
console.log("[OK] Interacción verificada: táctil, gesto y plugins de minijuegos.");
