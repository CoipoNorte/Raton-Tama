import { BALANCE } from "./balance";

/** Acción de cuidado con modo guiado (panel + progreso). Mimar no es un modo:
 * acariciar es una interacción libre, disponible en cualquier momento. */
export type AccionCuidado = "jugar" | "limpiar" | "curar";

export interface FaseCuidado {
  id: string;
  etiqueta: string;
  icono: "pelota" | "jabon" | "agua" | "toalla" | "curita" | "corazon";
  detalle: string;
  objetivo: number;
}

const { limpieza, juegoPelota } = BALANCE.cuidados;

/**
 * Cada cuidado se describe como una lista de fases; la UI y el 3D leen
 * exactamente el mismo dato, así que añadir un paso nuevo es tocar el catálogo.
 */
export function fasesCuidado(accion: AccionCuidado): FaseCuidado[] {
  if (accion === "jugar") {
    return [{ id: "pelota", etiqueta: "Pelota", icono: "pelota", detalle: "Pega a la pelota y Mochi la devolverá. Cuando la atrape, ¡punto!", objetivo: juegoPelota.pases }];
  }
  if (accion === "curar") {
    return [{ id: "curita", etiqueta: "Curita", icono: "curita", detalle: "Arrastra la curita hasta la marca rosa y pégala encima.", objetivo: 1 }];
  }
  const [jabon, agua, toalla] = limpieza.fases;
  return [
    { id: jabon, etiqueta: "Jabón", icono: "jabon", detalle: `Friega ${limpieza.manchas} manchas dos veces hasta cubrirlas de espuma.`, objetivo: limpieza.manchas },
    { id: agua, etiqueta: "Agua", icono: "agua", detalle: "Enjuaga dos veces cada mancha: primero sale la espuma, luego queda mojado.", objetivo: limpieza.manchas },
    { id: toalla, etiqueta: "Toalla", icono: "toalla", detalle: "Seca dos veces cada zona mojada para terminar el baño.", objetivo: limpieza.manchas }
  ];
}

export function objetivoCuidado(accion: AccionCuidado): number {
  return fasesCuidado(accion).reduce((total, fase) => total + fase.objetivo, 0);
}

export function faseActual(accion: AccionCuidado, progreso: number): number {
  const fases = fasesCuidado(accion);
  let acumulado = 0;
  for (let indice = 0; indice < fases.length; indice += 1) {
    acumulado += fases[indice].objetivo;
    if (progreso < acumulado) return indice;
  }
  return Math.max(0, fases.length - 1);
}
