import type { Logro, Partida } from "./types";

// Los logros son datos: contador + objetivo. Añadir uno no toca la interfaz.
export const LOGROS = [
  { "id": "primer-mimo", "nombre": "Hola, peque", "descripcion": "Acaricia a tu compañerito 5 veces.", "icono": "heart", "contador": "caricias", "objetivo": 5 },
  { "id": "buena-mesa", "nombre": "Hora de merendar", "descripcion": "Prepara 5 meriendas.", "icono": "utensils", "contador": "comidas", "objetivo": 5 },
  { "id": "jardin-juntos", "nombre": "Mejor amistad", "descripcion": "Comparte 3 sesiones de juego.", "icono": "sparkles", "contador": "juegos", "objetivo": 3 },
  { "id": "primer-ahorro", "nombre": "Un pequeño tesoro", "descripcion": "Consigue 30 monedas jugando.", "icono": "coins", "contador": "monedasGanadas", "objetivo": 30 },
  { "id": "manitas-limpias", "nombre": "Manitas limpias", "descripcion": "Deja su rincón reluciente 3 veces.", "icono": "brush", "contador": "limpiezas", "objetivo": 3 },
  { "id": "merendador", "nombre": "Buena mesa", "descripcion": "Sirve 15 meriendas en total.", "icono": "utensils", "contador": "comidas", "objetivo": 15 },
  { "id": "corazoncito", "nombre": "Corazoncito", "descripcion": "Reparte 25 mimos.", "icono": "heart", "contador": "caricias", "objetivo": 25 },
  { "id": "coleccionista", "nombre": "Coleccionista", "descripcion": "Reúne 120 monedas con tus juegos.", "icono": "coins", "contador": "monedasGanadas", "objetivo": 120 },
  { "id": "complice", "nombre": "Cómplices", "descripcion": "Comparte 40 gestos de cuidado.", "icono": "award", "contador": "cuidados", "objetivo": 40 }
] as const satisfies readonly Logro[];

export function actualizarLogros(partida: Partida): Partida {
  const ganados = new Set(partida.logros);
  for (const logro of LOGROS) {
    if (partida.contadores[logro.contador] >= logro.objetivo) ganados.add(logro.id);
  }
  return { ...partida, logros: [...ganados] };
}
