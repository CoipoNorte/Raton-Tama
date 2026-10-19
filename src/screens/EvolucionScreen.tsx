import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Especie } from "../game/types";

export default function EvolucionScreen({ desde, hasta, nombre, alContinuar }: { desde: Especie; hasta: Especie; nombre: string; alContinuar: () => void }) {
  return (
    <div className="screen-overlay modal-overlay evolution-overlay">
      <motion.section className="modal-panel evolution-panel" role="dialog" aria-modal="true" aria-labelledby="evolution-title" data-focus-scope="evolucion"
        initial={{ opacity: 0, scale: 0.84, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", damping: 18, stiffness: 180 }}>
        <div className="evolution-sparkle"><Sparkles size={24} /></div>
        <span className="modal-kicker">UN CAMBIO LLENO DE MAGIA</span>
        <h2 id="evolution-title">¡{nombre} ha florecido!</h2>
        <p>Todo el cariño que compartisteis ha hecho algo nuevo.</p>
        <div className="evolution-route">
          <span className="species-seal" style={{ "--species-color": desde.color } as React.CSSProperties}>{desde.nombre.slice(0, 1)}</span>
          <ArrowRight size={20} />
          <span className="species-seal species-seal-large" style={{ "--species-color": hasta.color } as React.CSSProperties}>{hasta.nombre.slice(0, 1)}</span>
        </div>
        <strong className="evolution-species">Ahora es {hasta.nombre}</strong>
        <button className="primary-button" type="button" onClick={alContinuar} data-initial-focus="true" data-game-focus="true">Seguir juntos <span aria-hidden="true">→</span></button>
      </motion.section>
    </div>
  );
}