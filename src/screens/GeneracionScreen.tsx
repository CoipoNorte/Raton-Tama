import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";

export default function GeneracionScreen({ nombre, generacion, alContinuar }: { nombre: string; generacion: number; alContinuar: () => void }) {
  return (
    <div className="screen-overlay modal-overlay generation-overlay">
      <motion.section className="modal-panel generation-panel" role="dialog" aria-modal="true" aria-labelledby="generation-title" data-focus-scope="generacion"
        initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", damping: 22 }}>
        <span className="generation-heart"><Heart size={25} fill="currentColor" /></span>
        <span className="modal-kicker">GRACIAS POR ESTE HOGAR</span>
        <h2 id="generation-title">{nombre} se va de viaje.</h2>
        <p>Su historia queda guardada en vuestro álbum. Dejó un poquito de su luz para quien llegue después.</p>
        <div className="generation-legacy"><Sparkles size={16} /><span>Generación {generacion} recibe un pequeño regalo</span></div>
        <button className="primary-button" type="button" onClick={alContinuar} data-initial-focus="true" data-game-focus="true">Conocer a la nueva generación <span aria-hidden="true">→</span></button>
      </motion.section>
    </div>
  );
}