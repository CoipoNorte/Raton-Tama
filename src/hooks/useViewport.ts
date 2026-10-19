import { useEffect, useState } from "react";

interface EstadoViewport {
  ancho: number;
  alto: number;
  retrato: boolean;
  alturaEscasa: boolean;
  movil: boolean;
  reducirMovimiento: boolean;
}

function medirViewport(): EstadoViewport {
  const ancho = window.innerWidth;
  const alto = window.innerHeight;
  return {
    ancho,
    alto,
    retrato: alto >= ancho,
    alturaEscasa: alto < 470 && ancho > alto,
    movil: ancho < 760,
    reducirMovimiento: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  };
}

export function useViewport(): EstadoViewport {
  const [viewport, setViewport] = useState<EstadoViewport>(() => (
    typeof window === "undefined"
      ? { ancho: 1280, alto: 800, retrato: false, alturaEscasa: false, movil: false, reducirMovimiento: false }
      : medirViewport()
  ));

  useEffect(() => {
    const actualizar = () => setViewport(medirViewport());
    const preferencias = window.matchMedia("(prefers-reduced-motion: reduce)");
    window.addEventListener("resize", actualizar, { passive: true });
    window.addEventListener("orientationchange", actualizar, { passive: true });
    preferencias.addEventListener("change", actualizar);
    return () => {
      window.removeEventListener("resize", actualizar);
      window.removeEventListener("orientationchange", actualizar);
      preferencias.removeEventListener("change", actualizar);
    };
  }, []);

  return viewport;
}