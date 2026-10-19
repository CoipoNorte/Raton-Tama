import type { AccionEntrada } from "./types";

// El hardware solo se traduce aquí; las pantallas escuchan acciones semánticas.
export const TECLAS_ENTRADA: Record<string, AccionEntrada> = {
  ArrowUp: "arriba", KeyW: "arriba",
  ArrowDown: "abajo", KeyS: "abajo",
  ArrowLeft: "izquierda", KeyA: "izquierda",
  ArrowRight: "derecha", KeyD: "derecha",
  Enter: "confirmar", NumpadEnter: "confirmar",
  Escape: "cancelar", KeyP: "pausa", KeyM: "menu",
  KeyQ: "pestanaAnterior", KeyE: "pestanaSiguiente",
  Digit1: "accionRapida1", Digit2: "accionRapida2",
  Digit3: "accionRapida3", Digit4: "accionRapida4"
};

export const BOTONES_MANDO = [
  { indice: 0, accion: "confirmar" },
  { indice: 1, accion: "cancelar" },
  { indice: 2, accion: "accionRapida1" },
  { indice: 3, accion: "accionRapida2" },
  { indice: 4, accion: "pestanaAnterior" },
  { indice: 5, accion: "pestanaSiguiente" },
  { indice: 6, accion: "accionRapida3" },
  { indice: 7, accion: "accionRapida4" },
  { indice: 8, accion: "menu" },
  { indice: 9, accion: "pausa" }
] as const satisfies readonly { indice: number; accion: AccionEntrada }[];