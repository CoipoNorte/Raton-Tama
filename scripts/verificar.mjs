import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pruebas = [
  "verificar-catalogos.mjs",
  "verificar-balance.mjs",
  "verificar-migracion.mjs",
  "verificar-jugabilidad.mjs",
  "verificar-interaccion.mjs",
  "verificar-responsive.mjs"
];

for (const prueba of pruebas) {
  const resultado = spawnSync(process.execPath, [resolve(raiz, "scripts", prueba)], { stdio: "inherit" });
  if (resultado.error) throw resultado.error;
  if (resultado.status !== 0) process.exit(resultado.status ?? 1);
}

console.log("\nTodas las verificaciones terminaron correctamente.");
