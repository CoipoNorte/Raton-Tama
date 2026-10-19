import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";

interface Props {
  nombre: string;
  esHuevo?: boolean;
  alEmpezar: () => void;
}

// El tutorial congela la simulación: el reloj solo arranca con "¡Empezar!".
export default function StartScreen({ nombre, esHuevo = false, alEmpezar }: Props) {
  return (
    <div className="screen-overlay welcome-overlay">
      <motion.section className="welcome-panel" role="dialog" aria-modal="true" aria-labelledby="welcome-title" data-focus-scope="inicio"
        initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", damping: 22, stiffness: 210 }}>
        <div className="welcome-mark"><Heart size={21} fill="currentColor" /><Sparkles className="welcome-star" size={16} /></div>
        <span className="section-kicker">UN HOGAR PARA DOS</span>
        <h2 id="welcome-title">{esHuevo ? "Alguien está a punto de nacer." : "Tu peque ya te espera."}</h2>
        <p>
          {esHuevo
            ? "Este es el huevo de Mochi. Cuídalo, tenle paciencia y muy pronto conocerás a tu nueva compañera."
            : `${nombre} está aquí. Dale un primer cariño y empieza vuestra historia.`}
        </p>
        <button type="button" className="primary-button" onClick={alEmpezar} data-initial-focus="true" data-game-focus="true">
          ¡Empezar! <span aria-hidden="true">→</span>
        </button>
        <span className="welcome-footnote">El tiempo comienza cuando tú quieras.</span>
      </motion.section>
    </div>
  );
}
