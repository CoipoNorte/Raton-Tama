/**
 * Canal de animación compartido dentro del Canvas: la lógica de cuidado escribe
 * (dónde mira, si salta, si mastica) y la criatura lo lee en el bucle de render.
 * Así las reacciones quedan sincronizadas sin re-render de React cada cuadro.
 */

export interface EstadoCriatura {
  /** Punto que está siguiendo la vista (espacio local de la criatura). */
  mirar: { x: number; y: number; z: number } | null;
  /** 0..1 impulso de salto (se decae solo). */
  saltar: number;
  /** 0..1 ganas de masticar. */
  masticar: number;
  /** 0..1 felicidad de las caricias. */
  feliz: number;
  /** 0..1 brillo de estar mojado. */
  mojado: number;
  /** 0..1 sacudida para secarse. */
  temblar: number;
}

export function crearEstadoCriatura(): EstadoCriatura {
  return { mirar: null, saltar: 0, masticar: 0, feliz: 0, mojado: 0, temblar: 0 };
}
