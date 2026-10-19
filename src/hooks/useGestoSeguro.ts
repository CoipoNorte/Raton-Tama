import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type TipoGesto = "tap" | "arrastre" | "scroll";

interface PuntoGesto {
  x: number;
  y: number;
  finalX: number;
  finalY: number;
  tipo: TipoGesto;
}

interface OpcionesGesto {
  umbral?: number;
  forzarArrastre?: boolean;
  ignorarSelector?: string;
  onTap?: (evento: ReactPointerEvent<HTMLElement>) => void;
  onMover?: (punto: PuntoGesto, evento: ReactPointerEvent<HTMLElement>) => void;
  onTerminar?: (punto: PuntoGesto, evento: ReactPointerEvent<HTMLElement>) => void;
  onCancelar?: () => void;
}

interface GestoActivo extends PuntoGesto {
  id: number;
  anteriorX: number;
  anteriorY: number;
}

function capturarPuntero(elemento: HTMLElement, id: number): void {
  try {
    elemento.setPointerCapture(id);
  } catch {
    // El puntero puede haberse cancelado antes de capturarlo.
  }
}

export function useGestoSeguro(opciones: OpcionesGesto = {}): {
  eventosPuntero: {
    onPointerDown: (evento: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (evento: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (evento: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: (evento: ReactPointerEvent<HTMLElement>) => void;
    onLostPointerCapture: (evento: ReactPointerEvent<HTMLElement>) => void;
  };
  arrastrando: boolean;
} {
  const opcionesRef = useRef(opciones);
  const activoRef = useRef<GestoActivo | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  opcionesRef.current = opciones;

  const limpiar = useCallback(() => {
    activoRef.current = null;
    setArrastrando(false);
  }, []);

  const onPointerDown = useCallback((evento: ReactPointerEvent<HTMLElement>) => {
    if (evento.pointerType === "mouse" && evento.button !== 0) return;
    // Ignoramos solo controles interactivos ANIDADOS: si el gesto empieza en el
    // propio elemento, el tap debe funcionar (evita el bug del gesto doble).
    const selector = opcionesRef.current.ignorarSelector ?? "button, [data-ignorar-gesto]";
    const anidado = (evento.target as HTMLElement).closest(selector);
    if (anidado && anidado !== evento.currentTarget) return;

    // Un pointerdown nuevo limpia un gesto huérfano que no recibió pointerup.
    if (activoRef.current) opcionesRef.current.onCancelar?.();
    activoRef.current = {
      id: evento.pointerId,
      x: evento.clientX,
      y: evento.clientY,
      finalX: evento.clientX,
      finalY: evento.clientY,
      anteriorX: evento.clientX,
      anteriorY: evento.clientY,
      tipo: "tap"
    };
    setArrastrando(false);
    capturarPuntero(evento.currentTarget, evento.pointerId);
  }, []);

  const onPointerMove = useCallback((evento: ReactPointerEvent<HTMLElement>) => {
    const activo = activoRef.current;
    if (!activo || activo.id !== evento.pointerId) return;
    const dx = evento.clientX - activo.x;
    const dy = evento.clientY - activo.y;
    const umbral = opcionesRef.current.umbral ?? 10;
    if (activo.tipo === "tap" && Math.hypot(dx, dy) >= umbral) {
      activo.tipo = opcionesRef.current.forzarArrastre || Math.abs(dx) > Math.abs(dy) * 1.2 ? "arrastre" : "scroll";
      setArrastrando(activo.tipo === "arrastre");
    }

    const diferenciaX = evento.clientX - activo.anteriorX;
    const diferenciaY = evento.clientY - activo.anteriorY;
    activo.finalX = evento.clientX;
    activo.finalY = evento.clientY;
    activo.anteriorX = evento.clientX;
    activo.anteriorY = evento.clientY;

    if (activo.tipo === "scroll") {
      const contenedor = (evento.target as HTMLElement).closest<HTMLElement>("[data-gesto-scroll]");
      if (contenedor) {
        if (contenedor.scrollHeight > contenedor.clientHeight) contenedor.scrollTop -= diferenciaY;
        if (contenedor.scrollWidth > contenedor.clientWidth) contenedor.scrollLeft -= diferenciaX;
      }
    }
    if (activo.tipo !== "tap") opcionesRef.current.onMover?.(activo, evento);
  }, []);

  const finalizar = useCallback((evento: ReactPointerEvent<HTMLElement>, cancelado: boolean) => {
    const activo = activoRef.current;
    if (!activo || activo.id !== evento.pointerId) return;
    const umbral = opcionesRef.current.umbral ?? 10;
    const recorrido = Math.hypot(evento.clientX - activo.x, evento.clientY - activo.y);
    const punto: PuntoGesto = {
      x: activo.x,
      y: activo.y,
      finalX: evento.clientX,
      finalY: evento.clientY,
      tipo: activo.tipo === "tap" && recorrido >= umbral ? "scroll" : activo.tipo
    };

    if (!cancelado && punto.tipo === "tap") opcionesRef.current.onTap?.(evento);
    if (!cancelado && punto.tipo !== "tap") opcionesRef.current.onTerminar?.(punto, evento);
    if (cancelado) opcionesRef.current.onCancelar?.();
    limpiar();
  }, [limpiar]);

  const onPointerUp = useCallback((evento: ReactPointerEvent<HTMLElement>) => finalizar(evento, false), [finalizar]);
  const onPointerCancel = useCallback((evento: ReactPointerEvent<HTMLElement>) => finalizar(evento, true), [finalizar]);
  const onLostPointerCapture = useCallback((evento: ReactPointerEvent<HTMLElement>) => {
    if (activoRef.current?.id === evento.pointerId) {
      opcionesRef.current.onCancelar?.();
      limpiar();
    }
  }, [limpiar]);

  return {
    eventosPuntero: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture },
    arrastrando
  };
}