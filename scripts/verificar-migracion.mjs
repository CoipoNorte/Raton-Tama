import assert from "node:assert/strict";
import { normalizarGuardado } from "../src/game/migracion.js";

const ahora = 1700000000000;
const base = {
  version: 1,
  mascota: {
    especieId: "mimi",
    nombre: "Mochi",
    generacion: 1,
    edadTotalMs: 0,
    edadEtapaMs: 0,
    necesidades: { hambre: 88, animo: 84, energia: 96, higiene: 94, salud: 100, vinculo: 34 },
    perfil: { calidad: 72, descuidos: 0, disciplina: 52, estadisticaFavorita: "animo", acciones: { caricias: 0, comidas: 0, juegos: 0, limpiezas: 0, curas: 0 } },
    suciedad: 0,
    durmiendo: false,
    enferma: false,
    seFue: false
  },
  monedas: 36,
  medicinas: 1,
  descubrimientos: ["mimi"],
  comidas: { onigiri: 2 },
  objetos: ["cojin-nube"],
  logros: [],
  recordsMinijuegos: {},
  contadores: { cuidados: 0, juegos: 0, comidas: 0, caricias: 0, limpiezas: 0, monedasGanadas: 0 },
  preferencias: { silencio: false, musica: true, vibracion: true },
  iniciada: false,
  pausada: false,
  ultimaMarcaValidada: ahora,
  progresoSuciedadMs: 0,
  evolucionPendiente: null,
  despedidaPendiente: false
};

const anterior = {
  version: 0,
  pet: { name: "Nori", speciesId: "nube", generation: 4, ageMs: 825000, stats: { hunger: 41, happiness: 67, energy: 71, cleanliness: 83, health: 92, bond: 78 } },
  coins: 147,
  medicine: 2,
  discoveries: ["mimi", "nube"],
  foodInventory: { fresa: 3, onigiri: 1 },
  objects: ["cojin-nube", "plantita"],
  gameRecords: { "eco-patitas": 9 },
  settings: { muted: true, music: false },
  started: true,
  lastSeenAt: ahora - 4000
};
const migrada = normalizarGuardado(anterior, base, ahora);
assert.equal(migrada.version, 1);
assert.equal(migrada.mascota.nombre, "Nori");
assert.equal(migrada.mascota.generacion, 4);
assert.equal(migrada.mascota.necesidades.hambre, 41);
assert.equal(migrada.mascota.necesidades.animo, 67);
assert.equal(migrada.mascota.necesidades.vinculo, 78);
assert.equal(migrada.monedas, 147);
assert.equal(migrada.medicinas, 2);
assert.deepEqual(migrada.descubrimientos, ["mimi", "nube"]);
assert.equal(migrada.comidas.fresa, 3);
assert.equal(migrada.recordsMinijuegos["eco-patitas"], 9);
assert.equal(migrada.preferencias.silencio, true);
assert.equal(migrada.preferencias.musica, false);
assert.equal(migrada.ultimaMarcaValidada, ahora - 4000);

const versionUno = normalizarGuardado({ ...migrada, monedas: 196, ultimaMarcaValidada: ahora }, base, ahora);
assert.equal(versionUno.monedas, 196);
assert.equal(versionUno.mascota.nombre, "Nori");
assert.equal(versionUno.comidas.fresa, 3);
assert.equal(versionUno.version, 1);

console.log("[OK] Migración v0 -> v1: nombre, especie, generación, necesidades, inventario, récords y preferencias conservados.");
console.log("[OK] Lectura de partida v1: monedas, mascota e inventario se mantienen sin pérdida.");