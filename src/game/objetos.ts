import type { ObjetoJuego } from "./types";

// La habitación consulta este catálogo para mostrar lo que ya pertenece a la mascota.
export const OBJETOS = [
  {
    "id": "plantita",
    "nombre": "Plantita de té",
    "descripcion": "Una compañera verde para la ventana.",
    "categoria": "decoracion",
    "modelo": "planta",
    "color": "#80b998",
    "precio": 18
  },
  {
    "id": "pelota-melocoton",
    "nombre": "Pelota melocotón",
    "descripcion": "Un juguete blandito para perseguir.",
    "categoria": "juguete",
    "modelo": "pelota",
    "color": "#f29d91",
    "precio": 22
  },
  {
    "id": "lampara-luna",
    "nombre": "Lámpara de luna",
    "descripcion": "Luz cálida para las noches tranquilas.",
    "categoria": "mueble",
    "modelo": "lampara",
    "color": "#f1cc75",
    "precio": 28
  },
  {
    "id": "cojin-nube",
    "nombre": "Cojín nube",
    "descripcion": "Su rincón favorito para echar una cabezadita.",
    "categoria": "mueble",
    "modelo": "cojin",
    "color": "#a9cfe0",
    "precio": 24
  },
  {
    "id": "gorrito-fresa",
    "nombre": "Gorrito de fresa",
    "descripcion": "Una coronita de tela para los días especiales.",
    "categoria": "ropa",
    "modelo": "gorrito",
    "color": "#e98799",
    "precio": 32
  }
] as const satisfies readonly ObjetoJuego[];

const cacheObjetos = new Map<string, ObjetoJuego>();

export function obtenerObjeto(id: string): ObjetoJuego | undefined {
  const cacheado = cacheObjetos.get(id);
  if (cacheado) return cacheado;
  const objeto = OBJETOS.find((entrada) => entrada.id === id);
  if (objeto) cacheObjetos.set(id, objeto);
  return objeto;
}