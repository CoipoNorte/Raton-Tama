import type { Alimento } from "./types";

// Iconos SVG y valores de cuidado viven junto al alimento para ampliar sin tocar la UI.
export const COMIDAS = [
  {
    "id": "onigiri",
    "nombre": "Onigiri de sésamo",
    "descripcion": "Un bocadito suave para la pancita.",
    "icono": "🍙",
    "modelo": "onigiri",
    "precio": 6,
    "efecto": { "hambre": 25, "animo": 3 }
  },
  {
    "id": "fresa",
    "nombre": "Fresas dulces",
    "descripcion": "Pequeñas, jugosas y llenas de alegría.",
    "icono": "🍓",
    "modelo": "fruta",
    "precio": 8,
    "efecto": { "hambre": 15, "animo": 16 }
  },
  {
    "id": "leche-matcha",
    "nombre": "Leche de matcha",
    "descripcion": "Un sorbito cremoso para recuperar energía.",
    "icono": "🥛",
    "modelo": "bebida",
    "precio": 10,
    "efecto": { "hambre": 16, "energia": 14, "animo": 7 }
  },
  {
    "id": "mochi",
    "nombre": "Mochi de melocotón",
    "descripcion": "Un dulce pegajoso que le hace sonreír.",
    "icono": "🍡",
    "modelo": "pastel",
    "precio": 12,
    "efecto": { "hambre": 18, "animo": 20 }
  },
  {
    "id": "quesito",
    "nombre": "Quesito de nube",
    "descripcion": "Un clásico contundente para días largos.",
    "icono": "🧀",
    "modelo": "queso",
    "precio": 9,
    "efecto": { "hambre": 31, "animo": 2 }
  }
] as const satisfies readonly Alimento[];

const cacheComidas = new Map<string, Alimento>();

export function obtenerComida(id: string): Alimento | undefined {
  const cacheada = cacheComidas.get(id);
  if (cacheada) return cacheada;
  const comida = COMIDAS.find((entrada) => entrada.id === id);
  if (comida) cacheComidas.set(id, comida);
  return comida;
}