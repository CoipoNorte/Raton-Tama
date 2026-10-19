import { motion } from "framer-motion";
import { ArrowRight, Compass, Sparkles, Star, X } from "lucide-react";
import { MINIJUEGOS, type MiniJuego } from "../game/minijuegos";
import type { Partida } from "../game/types";

interface Props {
  partida: Partida;
  alCerrar: () => void;
  alEmpezar: (juego: MiniJuego) => void;
}

const iconos = { brujula: Compass, chispa: Sparkles, estrella: Star } as const;

export default function MinijuegosMenu({ partida, alCerrar, alEmpezar }: Props) {
  return (
    <div className="screen-overlay modal-overlay">
      <motion.section className="modal-panel games-menu-panel" role="dialog" aria-modal="true" aria-labelledby="games-title" data-focus-scope="minijuegos"
        initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} transition={{ type: "spring", damping: 22 }}>
        <div className="modal-heading-row">
          <div><span className="modal-kicker">UN RATITO PARA REÍRSE</span><h2 id="games-title">¿A qué jugamos?</h2></div>
          <button className="icon-button close-button" type="button" aria-label="Cerrar juegos" onClick={alCerrar} data-game-focus="true"><X size={19} /></button>
        </div>
        <div className="games-list">
          {MINIJUEGOS.map((juego, indice) => {
            const Icono = iconos[juego.icono];
            const record = partida.recordsMinijuegos[juego.id] ?? 0;
            return (
              <button className="game-choice-row" type="button" key={juego.id} onClick={() => alEmpezar(juego)} data-initial-focus={indice === 0 ? "true" : undefined} data-game-focus="true">
                <span className={`game-choice-icon game-${juego.icono}`}><Icono size={20} /></span>
                <span className="game-choice-copy"><strong>{juego.nombre}</strong><small>{juego.instrucciones}</small><small className="game-choice-meta">{juego.duracion} s · Récord {record}</small></span>
                <span className="game-choice-go"><ArrowRight size={18} /></span>
              </button>
            );
          })}
        </div>
        <p className="games-footnote">Controles: flechas, toque o mando.</p>
      </motion.section>
    </div>
  );
}