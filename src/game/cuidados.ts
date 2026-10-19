import { BALANCE } from "./balance";

/** Acción de cuidado que se resuelve con un gesto sobre el diorama. */
export type AccionCuidado = "jugar" | "limpiar" | "curar" | "mimar";

export interface FaseCuidado {
  id: string;
  etiqueta: string;
  icono: "pelota" | "jabon" | "agua" | "toalla" | "curita" | "corazon";
  detalle: string;
  objetivo: number;
}

const { limpieza, juegoPelota, caricias } = BALANCE.cuidados;

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
  if (accion === "mimar") {
    return [{ id: "caricias", etiqueta: "Caricias", icono: "corazon", detalle: "Acaricia su pelaje en varias zonas para llenar el medidor.", objetivo: caricias.zonas }];
  }
  const [jabon, agua, toalla] = limpieza.fases;
  return [
    { id: jabon, etiqueta: "Jabón", icono: "jabon", detalle: `Friega el jabón sobre ${limpieza.manchas} manchas hasta cubrirlas de espuma.`, objetivo: limpieza.manchas },
    { id: agua, etiqueta: "Agua", icono: "agua", detalle: "Enjuaga con la regadera toda la espuma: quedará el pelaje mojado.", objetivo: limpieza.manchas },
    { id: toalla, etiqueta: "Toalla", icono: "toalla", detalle: "Seca cada zona mojada con la toalla para terminar el baño.", objetivo: limpieza.manchas }
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
