import { COMIDAS } from "./comidas";
import { OBJETOS } from "./objetos";
import type { Partida } from "./types";

export const ECONOMIA = {
  "monedasIniciales": 36,
  "recompensaCaricia": 0,
  "recompensaAccion": 1,
  "bonusGeneracion": 24,
  "minijuegos": {
    "monedasPorPunto": 2,
    "minimo": 4,
    "maximo": 48
  },
  "precioMedicina": 16,
  "inventarioInicial": {
    "onigiri": 2,
    "fresa": 1
  }
} as const;

export function comprarComida(partida: Partida, comidaId: string): Partida | null {
  const item = COMIDAS.find((comida) => comida.id === comidaId);
  if (!item || partida.monedas < item.precio) return null;
  return {
    ...partida,
    monedas: partida.monedas - item.precio,
    comidas: { ...partida.comidas, [item.id]: (partida.comidas[item.id] ?? 0) + 1 }
  };
}

export function comprarObjeto(partida: Partida, objetoId: string): Partida | null {
  const item = OBJETOS.find((objeto) => objeto.id === objetoId);
  if (!item || partida.monedas < item.precio || partida.objetos.includes(objetoId)) return null;
  return { ...partida, monedas: partida.monedas - item.precio, objetos: [...partida.objetos, objetoId] };
}

export function comprarMedicina(partida: Partida): Partida | null {
  if (partida.monedas < ECONOMIA.precioMedicina) return null;
  return { ...partida, monedas: partida.monedas - ECONOMIA.precioMedicina, medicinas: partida.medicinas + 1 };
}