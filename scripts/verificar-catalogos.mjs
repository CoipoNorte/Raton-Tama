import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function archivo(ruta) {
  return readFile(new URL(`../src/game/${ruta}`, import.meta.url), "utf8");
}

function encontrarCierre(texto, inicio, apertura, cierre) {
  let profundidad = 0;
  let comilla = "";
  let escape = false;
  for (let indice = inicio; indice < texto.length; indice += 1) {
    const caracter = texto[indice];
    if (comilla) {
      if (escape) escape = false;
      else if (caracter === "\\") escape = true;
      else if (caracter === comilla) comilla = "";
      continue;
    }
    if (caracter === '"' || caracter === "'") {
      comilla = caracter;
      continue;
    }
    if (caracter === apertura) profundidad += 1;
    if (caracter === cierre) {
      profundidad -= 1;
      if (profundidad === 0) return indice;
    }
  }
  throw new Error(`No se encontró el cierre ${cierre}`);
}

async function leerArreglo(ruta, nombre) {
  const texto = await archivo(ruta);
  const declaracion = texto.indexOf(`export const ${nombre}`);
  assert.notEqual(declaracion, -1, `Falta el catálogo ${nombre}`);
  const inicio = texto.indexOf("[", texto.indexOf("=", declaracion));
  const fin = encontrarCierre(texto, inicio, "[", "]");
  return JSON.parse(texto.slice(inicio, fin + 1));
}

function validarIds(entradas, nombre) {
  const ids = entradas.map((entrada) => entrada.id);
  assert.ok(ids.every((id) => typeof id === "string" && id.length > 0), `${nombre}: todos los ids deben tener texto`);
  assert.equal(new Set(ids).size, ids.length, `${nombre}: hay ids duplicados`);
  return new Set(ids);
}

const especies = await leerArreglo("especies.ts", "ESPECIES");
const comidas = await leerArreglo("comidas.ts", "COMIDAS");
const objetos = await leerArreglo("objetos.ts", "OBJETOS");
const logros = await leerArreglo("logros.ts", "LOGROS");
const idsEspecies = validarIds(especies, "Especies");
validarIds(comidas, "Comidas");
validarIds(objetos, "Objetos");
validarIds(logros, "Logros");

const idsGlobales = [...especies, ...comidas, ...objetos, ...logros].map((entrada) => entrada.id);
assert.equal(new Set(idsGlobales).size, idsGlobales.length, "Hay ids duplicados entre catálogos");
for (const entrada of [...comidas, ...objetos]) assert.ok(entrada.precio > 0, `${entrada.id}: el precio debe ser positivo`);

// Los logros solo pueden contar contadores que existen en la partida.
const contadores = ["cuidados", "juegos", "comidas", "caricias", "limpiezas", "monedasGanadas"];
const iconosLogro = new Set(["heart", "utensils", "sparkles", "coins", "brush", "award"]);
const idsLogros = new Set(logros.map((logro) => logro.id));
for (const logro of logros) {
  assert.ok(contadores.includes(logro.contador), `${logro.id}: el contador "${logro.contador}" no existe en la partida`);
  assert.ok(Number.isInteger(logro.objetivo) && logro.objetivo > 0, `${logro.id}: el objetivo debe ser un entero positivo`);
  assert.ok(iconosLogro.has(logro.icono), `${logro.id}: el icono "${logro.icono}" no está mapeado en el álbum`);
  assert.ok(logro.descripcion.length > 0 && logro.nombre.length > 0, `${logro.id}: falta nombre o descripción`);
}
// Cada logro debe ser alcanzable: ningún objetivo puede duplicar el mismo hito sin sentido.
assert.equal(new Set(logros.map((logro) => `${logro.contador}:${logro.objetivo}`)).size, logros.length, "Hay logros con el mismo contador y objetivo");
assert.ok(idsLogros.size === logros.length, "Hay ids de logro duplicados");

const ordenEtapas = ["huevo", "bebe", "nino", "adolescente", "adulto", "anciano"];
const porId = new Map(especies.map((especie) => [especie.id, especie]));
for (const especie of especies) {
  const indice = ordenEtapas.indexOf(especie.etapa);
  assert.notEqual(indice, -1, `${especie.id}: etapa desconocida`);
  if (especie.etapa === "anciano") assert.equal(especie.evoluciones.length, 0, `${especie.id}: una especie anciana no puede evolucionar más`);
  else assert.ok(especie.evoluciones.length > 0, `${especie.id}: falta una ruta de evolución`);
  if (especie.etapa !== "anciano") assert.ok(especie.evoluciones.some((ruta) => !ruta.condicion), `${especie.id}: necesita una ruta de respaldo alcanzable`);
  for (const ruta of especie.evoluciones) {
    assert.ok(idsEspecies.has(ruta.destino), `${especie.id}: referencia rota a ${ruta.destino}`);
    assert.equal(porId.get(ruta.destino).etapa, ordenEtapas[indice + 1], `${especie.id}: la ruta no avanza una etapa`);
  }
}

const raiz = especies.find((especie) => especie.etapa === "huevo");
assert.ok(raiz, "Debe existir una especie de huevo inicial");
const estadoVisita = new Map();
const alcanzables = new Set();
function visitar(id) {
  assert.notEqual(estadoVisita.get(id), "visitando", `Ciclo de evolución en ${id}`);
  if (estadoVisita.get(id) === "visitado") return;
  estadoVisita.set(id, "visitando");
  alcanzables.add(id);
  for (const ruta of porId.get(id).evoluciones) visitar(ruta.destino);
  estadoVisita.set(id, "visitado");
}
visitar(raiz.id);
assert.equal(alcanzables.size, especies.length, `Hay especies inalcanzables: ${especies.filter((especie) => !alcanzables.has(especie.id)).map((especie) => especie.id).join(", ")}`);

const textoMinijuegos = await archivo("minijuegos.tsx");
const inicioRegistro = textoMinijuegos.indexOf("export const MINIJUEGOS");
const inicioLista = textoMinijuegos.indexOf("[", inicioRegistro);
const finLista = encontrarCierre(textoMinijuegos, inicioLista, "[", "]");
const contenidoMinijuegos = textoMinijuegos.slice(inicioLista, finLista + 1);
const posiciones = [...contenidoMinijuegos.matchAll(/id:\s*"([^"]+)"/g)];
const juegos = posiciones.map((coincidencia, indice) => {
  const siguiente = posiciones[indice + 1]?.index ?? contenidoMinijuegos.length;
  return { id: coincidencia[1], bloque: contenidoMinijuegos.slice(coincidencia.index, siguiente) };
});
validarIds(juegos, "Minijuegos");
assert.ok(juegos.length >= 3, "Se requieren al menos tres minijuegos registrados");
for (const juego of juegos) {
  assert.match(juego.bloque, /nombre:/, `${juego.id}: falta nombre`);
  assert.match(juego.bloque, /componente:/, `${juego.id}: falta componente`);
  assert.match(juego.bloque, /duracion:\s*\d+/, `${juego.id}: falta duración`);
  assert.match(juego.bloque, /recompensa:\s*\{/, `${juego.id}: falta recompensa`);
  assert.match(juego.bloque, /controlesSoportados:/, `${juego.id}: faltan controles`);
}

console.log(`[OK] Especies: ${especies.length}, referencias válidas y árbol completo sin ciclos.`);
console.log(`[OK] Comidas: ${comidas.length}; objetos: ${objetos.length}; logros: ${logros.length} con contadores e iconos válidos.`);
console.log(`[OK] Minijuegos: ${juegos.length} plugins con componente, duración, recompensa y controles.`);