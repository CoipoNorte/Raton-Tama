import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calcularMarcoDiorama } from "../src/game/geometria.js";

const tamanos = [
  [320, 360],
  [320, 568],
  [360, 360],
  [360, 640],
  [375, 400],
  [568, 320],
  [800, 360],
  [768, 1024],
  [1440, 900],
  [2560, 1080]
];

for (const [ancho, alto] of tamanos) {
  const marco = calcularMarcoDiorama(ancho, alto);
  assert.ok(marco.cabe, `El diorama se desborda en ${ancho}x${alto}: ${JSON.stringify(marco)}`);
  assert.ok(marco.ancho <= ancho, `El ancho del diorama se deforma en ${ancho}x${alto}`);
  assert.ok(marco.alto >= 150 && marco.alto <= alto, `El diorama no es jugable en ${ancho}x${alto}`);
  const modo = marco.compacto ? "horizontal denso" : marco.retratoDenso ? "vertical denso" : "normal";
  console.log(`[OK] ${ancho}x${alto}: área real ${Math.round(marco.ancho)}x${Math.round(marco.alto)} px (${modo}).`);
}

const estilos = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
assert.match(estilos, /@media \(max-height: 430px\) and \(orientation: portrait\)/, "Falta el modo de 360 px vertical");
assert.match(estilos, /@media \(max-height: 470px\) and \(orientation: landscape\)/, "Falta el modo horizontal de poca altura");
console.log("[OK] Modos densos activados para pantallas verticales y horizontales de poca altura.");