import { useCallback, useEffect, useRef, useState } from "react";
import { TECLAS_ENTRADA } from "../game/entrada";
import type { AccionEntrada, FuenteEntrada } from "../game/types";
import { useGamepad } from "./useGamepad";

type ManejadorEntrada = (accion: AccionEntrada, fuente: FuenteEntrada) => void;

const selectorInteractivos = "button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";
const esDireccion = (accion: AccionEntrada) =>
  accion === "arriba" || accion === "abajo" || accion === "izquierda" || accion === "derecha";

function ambitoActivo(): HTMLElement | Document {
  const ambitos = Array.from(document.querySelectorAll<HTMLElement>("[data-focus-scope]"))
    .filter((elemento) => elemento.getClientRects().length > 0 && !elemento.closest("[inert]"));
  return ambitos.at(-1) ?? document;
}

function elementosFoco(ambito = ambitoActivo()): HTMLElement[] {
  return Array.from(ambito.querySelectorAll<HTMLElement>(selectorInteractivos)).filter((elemento) =>
    elemento.getClientRects().length > 0 &&
    getComputedStyle(elemento).visibility !== "hidden" &&
    !elemento.closest("[inert], [aria-hidden='true']")
  );
}

function navegarFoco(direccion: AccionEntrada): void {
  const candidatos = elementosFoco();
  if (candidatos.length === 0) return;
  const actual = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const rectActual = actual?.getBoundingClientRect();
  if (!rectActual || !candidatos.includes(actual as HTMLElement)) {
    candidatos[0].focus();
    return;
  }

  const centroX = rectActual.left + rectActual.width / 2;
  const centroY = rectActual.top + rectActual.height / 2;
  const vertical = direccion === "arriba" || direccion === "abajo";
  const signo = direccion === "arriba" || direccion === "izquierda" ? -1 : 1;
  let mejor: HTMLElement | null = null;
  let mejorPuntaje = Number.POSITIVE_INFINITY;

  for (const candidato of candidatos) {
    if (candidato === actual) continue;
    const rect = candidato.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - centroX;
    const y = rect.top + rect.height / 2 - centroY;
    const principal = (vertical ? y : x) * signo;
    if (principal <= 1) continue;
    const lateral = Math.abs(vertical ? x : y);
    const puntaje = principal + lateral * 1.7;
    if (puntaje < mejorPuntaje) {
      mejor = candidato;
      mejorPuntaje = puntaje;
    }
  }
  mejor?.focus();
}

function confirmarFoco(): void {
  const ambito = ambitoActivo();
  const enfocado = document.activeElement;
  if (!(enfocado instanceof HTMLElement) || enfocado.closest("[inert]") || (ambito !== document && !ambito.contains(enfocado))) {
    (ambito.querySelector<HTMLElement>("[data-initial-focus]:not([disabled])") ?? elementosFoco(ambito)[0])?.focus();
    return;
  }
  if (enfocado instanceof HTMLInputElement) {
    enfocado.form?.requestSubmit();
  } else if (enfocado.matches("button, a[href], [role='button']")) {
    enfocado.click();
  }
}

export function useEntrada(
  manejador: ManejadorEntrada,
  { modoJuego = false }: { modoJuego?: boolean } = {}
): { mandoConectado: boolean; fuenteActiva: FuenteEntrada } {
  const manejadorRef = useRef(manejador);
  const modoJuegoRef = useRef(modoJuego);
  const [fuenteActiva, setFuenteActiva] = useState<FuenteEntrada>("teclado");
  manejadorRef.current = manejador;
  modoJuegoRef.current = modoJuego;

  const recibirMando = useCallback((accion: AccionEntrada) => {
    setFuenteActiva("mando");
    // En un minijuego las flechas son jugadas, nunca movimiento del foco.
    if (esDireccion(accion) && !modoJuegoRef.current) navegarFoco(accion);
    if (accion === "confirmar") confirmarFoco();
    manejadorRef.current(accion, "mando");
  }, []);
  const mandoConectado = useGamepad(recibirMando);

  useEffect(() => {
    const alPulsar = (evento: KeyboardEvent) => {
      const ambito = ambitoActivo();
      if (evento.code === "Tab" && ambito !== document) {
        const candidatos = elementosFoco(ambito);
        if (candidatos.length === 0) return;
        evento.preventDefault();
        const indice = candidatos.indexOf(document.activeElement as HTMLElement);
        const siguiente = indice < 0 ? 0 : (indice + (evento.shiftKey ? -1 : 1) + candidatos.length) % candidatos.length;
        candidatos[siguiente].focus();
        return;
      }

      const elemento = evento.target;
      const estaEscribiendo = elemento instanceof HTMLElement && (
        elemento.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(elemento.tagName)
      );
      if (estaEscribiendo && evento.code !== "Escape") return;
      const accion = TECLAS_ENTRADA[evento.code];
      if (!accion || evento.repeat) return;
      evento.preventDefault();
      setFuenteActiva("teclado");
      if (esDireccion(accion) && !modoJuegoRef.current) navegarFoco(accion);
      if (accion === "confirmar") confirmarFoco();
      manejadorRef.current(accion, "teclado");
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  return { mandoConectado, fuenteActiva };
}