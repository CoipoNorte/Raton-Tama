import type { Especie } from "./types";

// Las rutas y sus umbrales son datos: una especie nueva no requiere tocar el motor.
export const ESPECIES = [
  {
    "id": "huevo-luna",
    "nombre": "Huevo de luna",
    "etapa": "huevo",
    "descripcion": "Una promesa tibia, a punto de despertar.",
    "color": "#f7d982",
    "acento": "#f29aab",
    "mejillas": "#f49ba7",
    "evoluciones": [
      { "destino": "mimi", "prioridad": 10, "condicion": { "vinculoMinimo": 76 } },
      { "destino": "nube", "prioridad": 8, "condicion": { "animoMinimo": 76 } },
      { "destino": "chispita", "prioridad": 0 }
    ]
  },
  {
    "id": "mimi",
    "nombre": "Mimi",
    "etapa": "bebe",
    "descripcion": "Una ratoncita dulce que siempre vuelve a buscarte.",
    "color": "#f4bd9f",
    "acento": "#f397ad",
    "mejillas": "#ee8399",
    "evoluciones": [
      { "destino": "gardenia", "prioridad": 8, "condicion": { "vinculoMinimo": 68, "calidadMinima": 68 } },
      { "destino": "lunaluz", "prioridad": 0 }
    ]
  },
  {
    "id": "nube",
    "nombre": "Nube",
    "etapa": "bebe",
    "descripcion": "Le encantan las siestas blanditas y los mimos.",
    "color": "#b9d9ed",
    "acento": "#9bbde0",
    "mejillas": "#e99fb0",
    "evoluciones": [
      { "destino": "lunaluz", "prioridad": 8, "condicion": { "animoMinimo": 68 } },
      { "destino": "marino", "prioridad": 0 }
    ]
  },
  {
    "id": "chispita",
    "nombre": "Chispita",
    "etapa": "bebe",
    "descripcion": "Pequeña, curiosa y siempre lista para jugar.",
    "color": "#f5c77f",
    "acento": "#f28e87",
    "mejillas": "#ec8c97",
    "evoluciones": [
      { "destino": "chispa-nino", "prioridad": 8, "condicion": { "animoMinimo": 68 } },
      { "destino": "marino", "prioridad": 0 }
    ]
  },
  {
    "id": "gardenia",
    "nombre": "Gardenia",
    "etapa": "nino",
    "descripcion": "Colecciona pétalos y secretos de jardín.",
    "color": "#e9b6a4",
    "acento": "#eb91a7",
    "mejillas": "#e9889e",
    "evoluciones": [
      { "destino": "lirio", "prioridad": 8, "condicion": { "vinculoMinimo": 74 } },
      { "destino": "cometa", "prioridad": 0 }
    ]
  },
  {
    "id": "lunaluz",
    "nombre": "Lunaluz",
    "etapa": "nino",
    "descripcion": "Su rincón favorito es la ventana bajo las estrellas.",
    "color": "#c4c8ed",
    "acento": "#9da8dd",
    "mejillas": "#e89bb2",
    "evoluciones": [
      { "destino": "cometa", "prioridad": 8, "condicion": { "animoMinimo": 72 } },
      { "destino": "bruma", "prioridad": 0 }
    ]
  },
  {
    "id": "marino",
    "nombre": "Marino",
    "etapa": "nino",
    "descripcion": "Una exploradora tranquila de mares de juguete.",
    "color": "#9fd4cb",
    "acento": "#76b9b6",
    "mejillas": "#e88e9f",
    "evoluciones": [
      { "destino": "bruma", "prioridad": 8, "condicion": { "higieneMinima": 68 } },
      { "destino": "cometa", "prioridad": 0 }
    ]
  },
  {
    "id": "chispa-nino",
    "nombre": "Chispa",
    "etapa": "nino",
    "descripcion": "Una bolita veloz con una imaginación enorme.",
    "color": "#f0bf6d",
    "acento": "#ef8e70",
    "mejillas": "#e47d89",
    "evoluciones": [
      { "destino": "cometa", "prioridad": 8, "condicion": { "animoMinimo": 75 } },
      { "destino": "bruma", "prioridad": 0 }
    ]
  },
  {
    "id": "lirio",
    "nombre": "Lirio",
    "etapa": "adolescente",
    "descripcion": "Cuida de todos y deja un poquito de magia en cada rincón.",
    "color": "#e4a7b5",
    "acento": "#c986a7",
    "mejillas": "#e68198",
    "evoluciones": [
      { "destino": "majesta", "prioridad": 8, "condicion": { "saludMinima": 70 } },
      { "destino": "aurora", "prioridad": 0 }
    ]
  },
  {
    "id": "cometa",
    "nombre": "Cometa",
    "etapa": "adolescente",
    "descripcion": "Una soñadora luminosa que nunca deja de jugar.",
    "color": "#a9c8e6",
    "acento": "#819dde",
    "mejillas": "#e58ca3",
    "evoluciones": [
      { "destino": "sol", "prioridad": 8, "condicion": { "animoMinimo": 75 } },
      { "destino": "aurora", "prioridad": 0 }
    ]
  },
  {
    "id": "bruma",
    "nombre": "Bruma",
    "etapa": "adolescente",
    "descripcion": "Serena y observadora, encuentra belleza en lo sencillo.",
    "color": "#a8cfc5",
    "acento": "#82b7aa",
    "mejillas": "#e594a3",
    "evoluciones": [
      { "destino": "aurora", "prioridad": 8, "condicion": { "saludMinima": 72 } },
      { "destino": "majesta", "prioridad": 0 }
    ]
  },
  {
    "id": "majesta",
    "nombre": "Majesta",
    "etapa": "adulto",
    "descripcion": "Tiene un corazón enorme y sabe escuchar sin prisa.",
    "color": "#daa3a9",
    "acento": "#b9809c",
    "mejillas": "#d77b8f",
    "evoluciones": [
      { "destino": "sabio-luna", "prioridad": 8, "condicion": { "vinculoMinimo": 70, "descuidosMaximos": 3 } },
      { "destino": "abuela-brisa", "prioridad": 0 }
    ]
  },
  {
    "id": "aurora",
    "nombre": "Aurora",
    "etapa": "adulto",
    "descripcion": "Un espíritu apacible que hace hogar dondequiera que va.",
    "color": "#a9c4d9",
    "acento": "#8b9ecc",
    "mejillas": "#d98199",
    "evoluciones": [
      { "destino": "abuela-brisa", "prioridad": 8, "condicion": { "higieneMinima": 65 } },
      { "destino": "sabio-luna", "prioridad": 0 }
    ]
  },
  {
    "id": "sol",
    "nombre": "Sol",
    "etapa": "adulto",
    "descripcion": "Su risa contagiosa convierte cualquier día en una fiesta.",
    "color": "#ebc36d",
    "acento": "#ef9a75",
    "mejillas": "#df7585",
    "evoluciones": [
      { "destino": "abuelo-miel", "prioridad": 8, "condicion": { "animoMinimo": 72 } },
      { "destino": "abuela-brisa", "prioridad": 0 }
    ]
  },
  {
    "id": "sabio-luna",
    "nombre": "Sabio de luna",
    "etapa": "anciano",
    "descripcion": "Guarda historias tiernas para compartir con quien viene después.",
    "color": "#c5c5db",
    "acento": "#a29dc3",
    "mejillas": "#d893a5",
    "evoluciones": []
  },
  {
    "id": "abuela-brisa",
    "nombre": "Abuela Brisa",
    "etapa": "anciano",
    "descripcion": "Su abrazo huele a manta limpia y a tarde de primavera.",
    "color": "#d3b7c7",
    "acento": "#b895b3",
    "mejillas": "#d98299",
    "evoluciones": []
  },
  {
    "id": "abuelo-miel",
    "nombre": "Abuelo Miel",
    "etapa": "anciano",
    "descripcion": "Siempre tiene una merienda guardada para sus amistades.",
    "color": "#d5ae7d",
    "acento": "#bd8e74",
    "mejillas": "#d8848e",
    "evoluciones": []
  }
] as const satisfies readonly Especie[];

const cacheEspecies = new Map<string, Especie>();

// El índice se construye al pedir una especie y después se reutiliza.
export function obtenerEspecie(id: string): Especie {
  const guardada = cacheEspecies.get(id);
  if (guardada) return guardada;
  const especie = ESPECIES.find((entrada) => entrada.id === id) ?? ESPECIES[1];
  cacheEspecies.set(id, especie);
  return especie;
}

export function etapaSiguiente(etapa: Especie["etapa"]): Especie["etapa"] | null {
  const etapas: Especie["etapa"][] = ["huevo", "bebe", "nino", "adolescente", "adulto", "anciano"];
  const indice = etapas.indexOf(etapa);
  return etapas[indice + 1] ?? null;
}