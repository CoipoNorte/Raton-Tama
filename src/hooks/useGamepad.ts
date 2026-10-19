import { useEffect, useRef, useState } from "react";
import { BOTONES_MANDO } from "../game/entrada";
import type { AccionEntrada } from "../game/types";

type Manejador = (accion: AccionEntrada) => void;
type Direccion = "arriba" | "abajo" | "izquierda" | "derecha";

interface Repeticion {
  inicio: number;
  ultimoPulso: number;
}

export function useGamepad(onAction: Manejador): boolean {
  const [conectado, setConectado] = useState(false);
  const manejadorRef = useRef(onAction);
  manejadorRef.current = onAction;

  useEffect(() => {
    let frame = 0;
    let vivo = true;
    let anteriorBotones = new Map<number, boolean>();
    const repeticiones = new Map<Direccion, Repeticion>();
    let estadoConectado = false;

    const emitirBoton = (pad: Gamepad, indice: number, accion: AccionEntrada) => {
      const pulsado = Boolean(pad.buttons[indice]?.pressed);
      const antes = anteriorBotones.get(indice) ?? false;
      if (pulsado && !antes) manejadorRef.current(accion);
      anteriorBotones.set(indice, pulsado);
    };

    const emitirDireccion = (accion: Direccion, pulsado: boolean, ahora: number) => {
      if (!pulsado) {
        repeticiones.delete(accion);
        return;
      }
      const repeticion = repeticiones.get(accion);
      if (!repeticion) {
        repeticiones.set(accion, { inicio: ahora, ultimoPulso: ahora });
        manejadorRef.current(accion);
        return;
      }
      if (ahora - repeticion.inicio >= 360 && ahora - repeticion.ultimoPulso >= 155) {
        repeticion.ultimoPulso = ahora;
        manejadorRef.current(accion);
      }
    };

    const sondear = () => {
      if (!vivo) return;
      try {
        const pads = Array.from(navigator.getGamepads?.() ?? []);
        const pad = pads.find((entrada): entrada is Gamepad => Boolean(entrada?.connected));
        const encontrado = Boolean(pad);
        if (encontrado !== estadoConectado) {
          estadoConectado = encontrado;
          setConectado(encontrado);
        }

        if (pad) {
          for (const { indice, accion } of BOTONES_MANDO) emitirBoton(pad, indice, accion);

          const ejeX = pad.axes[0] ?? 0;
          const ejeY = pad.axes[1] ?? 0;
          const zona = 0.38;
          const arriba = Boolean(pad.buttons[12]?.pressed) || ejeY < -zona;
          const abajo = Boolean(pad.buttons[13]?.pressed) || ejeY > zona;
          const izquierda = Boolean(pad.buttons[14]?.pressed) || ejeX < -zona;
          const derecha = Boolean(pad.buttons[15]?.pressed) || ejeX > zona;
          const ahora = performance.now();
          emitirDireccion("arriba", arriba, ahora);
          emitirDireccion("abajo", abajo, ahora);
          emitirDireccion("izquierda", izquierda, ahora);
          emitirDireccion("derecha", derecha, ahora);
        } else {
          anteriorBotones = new Map<number, boolean>();
          repeticiones.clear();
        }
      } catch {
        if (estadoConectado) {
          estadoConectado = false;
          setConectado(false);
        }
      }
      frame = window.requestAnimationFrame(sondear);
    };

    const alConectar = () => setConectado(true);
    const alDesconectar = () => {
      setConectado(false);
      anteriorBotones = new Map<number, boolean>();
      repeticiones.clear();
    };
    window.addEventListener("gamepadconnected", alConectar);
    window.addEventListener("gamepaddisconnected", alDesconectar);
    frame = window.requestAnimationFrame(sondear);

    return () => {
      vivo = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("gamepadconnected", alConectar);
      window.removeEventListener("gamepaddisconnected", alDesconectar);
    };
  }, []);

  return conectado;
}

export function vibrarMando(duracionMs = 90): void {
  try {
    const pads = Array.from(navigator.getGamepads?.() ?? []);
    const mando = pads.find((pad) => pad?.connected) as (Gamepad & {
      vibrationActuator?: { playEffect: (tipo: string, opciones: Record<string, number>) => Promise<unknown> };
    }) | undefined;
    const vibrador = mando?.vibrationActuator;
    if (vibrador) {
      void vibrador.playEffect("dual-rumble", {
        duration: duracionMs,
        strongMagnitude: 0.25,
        weakMagnitude: 0.42
      }).catch(() => undefined);
    }
  } catch {
    // La vibración es opcional y algunos navegadores la bloquean.
  }
}