import { useEffect, useRef } from "react";
import { BALANCE } from "../game/balance";
import { simularProgreso } from "../game/simulacion";
import type { Partida, ResumenAusencia } from "../game/types";

interface Opciones {
  obtenerPartida: () => Partida;
  actualizar: (actualizador: (partida: Partida) => Partida) => void;
  alAusencia: (resumen: ResumenAusencia) => void;
}

const AUSENCIA_MINIMA_MS = 120000;

/**
 * Reloj del juego: simula en tiempo real y, al volver de otra pestaña o app,
 * aplica el progreso y avisa con un resumen amable.
 */
export function useTiempoReal({ obtenerPartida, actualizar, alAusencia }: Opciones): void {
  const referencias = useRef({ obtenerPartida, actualizar, alAusencia });
  referencias.current = { obtenerPartida, actualizar, alAusencia };

  useEffect(() => {
    let ultimaVezVisto = Date.now();

    const simular = (avisar: boolean) => {
      const partida = referencias.current.obtenerPartida();
      // El tutorial y la pausa congelan todos los relojes, incluida esta simulación.
      if (!partida.iniciada || partida.pausada || partida.mascota.seFue) return;
      const ahora = Date.now();
      const resultado = simularProgreso(partida, ahora);
      // Si hubo una compra o un mimo en el mismo tick, se recalcula sobre el
      // estado más reciente en vez de sobrescribir aquella acción.
      referencias.current.actualizar((actual) => actual === partida
        ? resultado.partida
        : simularProgreso(actual, ahora).partida);
      if (avisar && resultado.resumen && resultado.resumen.minutos >= 1) {
        referencias.current.alAusencia(resultado.resumen);
      }
    };

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "hidden") {
        ultimaVezVisto = Date.now();
        return;
      }
      const ausencia = Date.now() - ultimaVezVisto;
      ultimaVezVisto = Date.now();
      simular(ausencia >= AUSENCIA_MINIMA_MS);
    };

    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") simular(false);
    }, BALANCE.intervaloMs);
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("focus", alCambiarVisibilidad);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("focus", alCambiarVisibilidad);
    };
  }, []);
}
