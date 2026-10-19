/**
 * Mini-bus de efectos dentro del Canvas: la lógica de juego pide "lanza 6
 * corazones aquí" y el sistema de partículas responde, sin re-render de React.
 */

export type TipoEfecto = "corazon" | "burbuja" | "destello" | "gota" | "migaja";

export interface SolicitudEfecto {
  tipo: TipoEfecto;
  x: number;
  y: number;
  z: number;
  cantidad?: number;
  fuerza?: number;
}

type Oyente = (solicitud: SolicitudEfecto) => void;

const oyentes = new Set<Oyente>();

export function suscribirEfectos(oyente: Oyente): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

export function emitirEfecto(solicitud: SolicitudEfecto): void {
  for (const oyente of oyentes) {
    try {
      oyente(solicitud);
    } catch {
      // Un fallo visual nunca debe cortar el juego.
    }
  }
}
