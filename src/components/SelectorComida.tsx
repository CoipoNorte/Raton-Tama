import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { COMIDAS } from "../game/comidas";
import type { Alimento, ArrastreComida, Partida } from "../game/types";
import IconoComida from "./IconoComida";
import { sonar } from "../game/sound";

interface Props {
  partida: Partida;
  escenario: HTMLElement | null;
  alElegir: (id: string) => void;
  alCerrar: () => void;
  abrirTienda: () => void;
  alArrastrar: (arrastre: ArrastreComida | null) => void;
  mostrarFantasma2D: boolean;
}

interface Arrastre {
  id: number;
  inicioX: number;
  inicioY: number;
  arrastro: boolean;
  fin: () => void;
}

const UMBRAL_TAP = 8;
const ANCHO_BOCA = 0.36;
const ALTO_BOCA = 0.38;

/** Un solo camino del dedo/ratón: sostiene → mueve → suelta. El tap y el arrastre son mutuamente excluyentes. */
function useArrastreComida(
  comida: Alimento,
  onFeed: (id: string) => void,
  escenarioRef: React.MutableRefObject<HTMLElement | null>,
  alArrastrar: (arrastre: ArrastreComida | null) => void,
  mostrarFantasma2D: boolean
) {
  const [fantasma, setFantasma] = useState<{ x: number; y: number; seguimiento: boolean } | null>(null);
  const activoRef = useRef<Arrastre | null>(null);

  const soltar = (evento: PointerEvent, cancelado = false) => {
    const activo = activoRef.current;
    if (!activo || activo.id !== evento.pointerId) return;
    activo.fin();
    activoRef.current = null;
    setFantasma(null);
    alArrastrar(null);
    const dx = evento.clientX - activo.inicioX;
    const dy = evento.clientY - activo.inicioY;
    const arrastro = activo.arrastro || Math.hypot(dx, dy) > UMBRAL_TAP;
    if (cancelado) return;
    if (arrastro) {
      const caja = escenarioRef.current?.getBoundingClientRect();
      if (!caja) return;
      const bx = Math.abs(evento.clientX - (caja.left + caja.width * 0.5));
      const by = Math.abs(evento.clientY - (caja.top + caja.height * 0.61));
      const enBoca = bx < Math.max(90, caja.width * ANCHO_BOCA) && by < Math.max(76, caja.height * ALTO_BOCA);
      // Suelta generosa: coger una merienda y dejarla en la habitación basta.
      const sobreDiorama = evento.clientX >= caja.left - 32 && evento.clientX <= caja.right + 32 && evento.clientY >= caja.top - 32 && evento.clientY <= caja.bottom + 32;
       if (enBoca || sobreDiorama) onFeed(comida.id);
      return;
    }
    onFeed(comida.id); // El toque directo también conserva el gesto corto de Pou.
  };

  const down = (evento: ReactPointerEvent<HTMLButtonElement>) => {
    if (evento.pointerType === "mouse" && evento.button !== 0) return;
    evento.preventDefault();
    evento.stopPropagation();
    if (activoRef.current) return;
    const fin = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancelar);
    };
    activoRef.current = {
      id: evento.pointerId,
      inicioX: evento.clientX,
      inicioY: evento.clientY,
      arrastro: false,
      fin
    };
    sonar("agarre");
    // Desde pointerdown el objeto ya está "en la mano"; no esperamos al umbral.
    alArrastrar({ comidaId: comida.id, modelo: comida.modelo, x: evento.clientX, y: evento.clientY });
    if (mostrarFantasma2D) setFantasma({ x: evento.clientX, y: evento.clientY, seguimiento: false });
    function mover(ev: PointerEvent) {
      const activo = activoRef.current;
      if (!activo || activo.id !== ev.pointerId) return;
      if (!activo.arrastro && Math.hypot(ev.clientX - activo.inicioX, ev.clientY - activo.inicioY) >= UMBRAL_TAP) activo.arrastro = true;
      if (activo.arrastro) {
        ev.preventDefault();
        ev.stopPropagation();
        alArrastrar({ comidaId: comida.id, modelo: comida.modelo, x: ev.clientX, y: ev.clientY });
        if (mostrarFantasma2D) setFantasma({ x: ev.clientX, y: ev.clientY, seguimiento: true });
      }
    }
    const up = (ev: PointerEvent) => {
      mover(ev);
      soltar(ev);
    };
    const cancelar = (ev: PointerEvent) => soltar(ev, true);
    try { evento.currentTarget.setPointerCapture(evento.pointerId); } catch { /* Safari puede cancelar la captura */ }
    window.addEventListener("pointermove", mover, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancelar);
  };

  return { fantasma, down };
}

function OpcionComida({ comida, cantidad, bloqueada, onFeed, escenarioRef, focoInicial, alArrastrar, mostrarFantasma2D }: {
  comida: Alimento;
  cantidad: number;
  bloqueada: boolean;
  onFeed: (id: string) => void;
  escenarioRef: React.MutableRefObject<HTMLElement | null>;
  focoInicial: boolean;
  alArrastrar: (arrastre: ArrastreComida | null) => void;
  mostrarFantasma2D: boolean;
}) {
  const vacia = cantidad <= 0;
  const { fantasma, down } = useArrastreComida(comida, onFeed, escenarioRef, alArrastrar, mostrarFantasma2D);

  return (
    <>
      <button
        type="button"
        className={`food-choice ${vacia ? "food-choice-empty" : ""}`}
        aria-label={vacia ? `${comida.nombre}, sin existencias; abrir la tienda` : `${comida.nombre}, quedan ${cantidad}`}
        title={vacia ? `${comida.nombre}: sin existencias` : `${comida.nombre} · toca o arrastra`}
        onPointerDown={(evento) => {
          if (bloqueada) return;
          if (vacia) {
            // Sin existencias el botón va directo a la tienda: no finge ser comida.
            onFeed(comida.id);
            return;
          }
          down(evento);
        }}
        data-initial-focus={focoInicial ? "true" : undefined}
        data-game-focus="true"
      >
        <span className="food-choice-icon"><IconoComida modelo={comida.modelo} size={26} /></span>
        <span className="food-choice-count" data-testid={`food-count-${comida.id}`}>{cantidad}</span>
        {vacia && <span className="food-choice-plus">+</span>}
      </button>
      {fantasma && (
        <span className="food-drag-ghost" style={{ left: fantasma.x, top: fantasma.y }} aria-hidden="true" data-ignorar-gesto>
          <IconoComida modelo={comida.modelo} size={30} />
        </span>
      )}
    </>
  );
}

export default function SelectorComida({ partida, escenario, alElegir, alCerrar, abrirTienda, alArrastrar, mostrarFantasma2D }: Props) {
  const escenarioRef = useRef<HTMLElement | null>(null);
  escenarioRef.current = escenario;
  const hayComida = COMIDAS.some((comida) => (partida.comidas[comida.id] ?? 0) > 0);
  const primeraComida = COMIDAS.find((comida) => (partida.comidas[comida.id] ?? 0) > 0)?.id;
  const bloqueada = partida.pausada || !partida.iniciada;

  return (
    <motion.div
      className="food-tray"
      role="group"
      aria-label="Elige algo rico para comer"
      data-focus-scope="comida"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: "spring", damping: 24, stiffness: 240 }}
    >
      <div className="food-tray-heading">
        <div>
          <span className="section-kicker">{hayComida ? "MERIENDA" : "DESPENSA VACÍA"}</span>
          <strong>{hayComida ? "¿Qué le apetece?" : "A reponer provisiones"}</strong>
        </div>
        <button className="food-tray-close" type="button" aria-label="Cerrar menú de comida" onClick={alCerrar} data-initial-focus="true" data-game-focus="true">
          <X size={17} />
        </button>
      </div>
      <div className="food-choice-list">
        {COMIDAS.map((comida) => {
          const cantidad = partida.comidas[comida.id] ?? 0;
          return (
            <OpcionComida
              key={comida.id}
              comida={comida}
              cantidad={cantidad}
              bloqueada={bloqueada}
              onFeed={cantidad > 0 ? alElegir : abrirTienda}
              escenarioRef={escenarioRef}
              focoInicial={comida.id === primeraComida}
              alArrastrar={alArrastrar}
              mostrarFantasma2D={mostrarFantasma2D}
            />
          );
        })}
        <button
          className="food-choice food-shop-link"
          type="button"
          onClick={abrirTienda}
          disabled={bloqueada}
          aria-label="Abrir la tienda de comida"
          data-initial-focus={primeraComida ? undefined : "true"}
          data-game-focus="true"
        >
          <ShoppingBag size={18} />
        </button>
      </div>
      <span className="food-tray-help" data-boca-ancho="0.36" data-boca-alto="0.38">
        {hayComida ? "Toca o arrastra hasta su boquita" : "Toca un botón con + para reponer en la tienda"}
      </span>
    </motion.div>
  );
}
