import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fuente = await readFile(new URL("../src/game/balance.ts", import.meta.url), "utf8");
const declaracion = fuente.indexOf("export const BALANCE");
const inicio = fuente.indexOf("{", fuente.indexOf("=", declaracion));
let profundidad = 0;
let fin = -1;
let comilla = "";
let escape = false;
for (let indice = inicio; indice < fuente.length; indice += 1) {
  const caracter = fuente[indice];
  if (comilla) {
    if (escape) escape = false;
    else if (caracter === "\\") escape = true;
    else if (caracter === comilla) comilla = "";
    continue;
  }
  if (caracter === '"') { comilla = caracter; continue; }
  if (caracter === "{") profundidad += 1;
  if (caracter === "}") {
    profundidad -= 1;
    if (profundidad === 0) { fin = indice; break; }
  }
}
assert.ok(fin > inicio, "No se encontró el objeto BALANCE");
const balance = JSON.parse(fuente.slice(inicio, fin + 1));
const tasas = balance.decaimientoPorHora;
const ritmos = [tasas.hambre, tasas.animo, tasas.energiaDia, tasas.energiaNoche, tasas.higiene, tasas.vinculo];
assert.ok(ritmos.every((ritmo) => ritmo > 0), "Todas las necesidades deben tener un ritmo positivo");
assert.ok(100 / tasas.hambre >= 1.8, "La reserva de hambre debe permitir intervalos razonables de cuidado");
assert.ok(100 / tasas.animo >= 2.5, "El ánimo no puede agotarse de forma imposible");
assert.ok(100 / tasas.energiaDia >= 4, "La energía diurna debe durar varias horas");
assert.ok(100 / tasas.higiene >= 10, "La higiene debe dar tiempo suficiente para volver al juego");
assert.ok(tasas.saludConDescuidos < 5, "La salud nunca debe caer de forma agresiva");
assert.ok(balance.limiteOfflineMs <= 12 * 60 * 60 * 1000, "La recuperación offline debe tener un límite amable de 12 horas");
assert.ok(balance.recuperacionPorHora.energiaDormida > tasas.energiaDia, "Dormir debe recuperar más energía de la que consume el día");
assert.ok(balance.recuperacionPorHora.saludDescansando > 0, "El descanso debe ayudar a recuperarse");
assert.ok(Object.values(balance.etapasMs).every((duracion) => duracion > 0), "Cada etapa debe tener una duración configurada");

console.log(`[OK] Balance: hambre ${100 / tasas.hambre} h, ánimo ${100 / tasas.animo} h y energía diurna ${100 / tasas.energiaDia} h antes de agotarse.`);
console.log("[OK] Descuidos suaves, recuperación al dormir y progreso offline limitado a 12 h.");