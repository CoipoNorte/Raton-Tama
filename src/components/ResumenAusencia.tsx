import { motion } from "framer-motion";
import { Brush, Moon, Smile, Utensils } from "lucide-react";
import type { ResumenAusencia as Resumen } from "../game/types";

export default function ResumenAusencia({ resumen, alCerrar }: { resumen: Resumen; alCerrar: () => void }) {
  const entradas = [
    { icono: Utensils, texto: "Hambre", valor: resumen.hambre },
    { icono: Smile, texto: "Ánimo", valor: resumen.animo },
    { icono: Moon, texto: "Energía", valor: resumen.energia },
    { icono: Brush, texto: "Higiene", valor: resumen.suciedadNueva ? resumen.suciedadNueva : resumen.higiene }
  ];
  return (
    <div className="screen-overlay modal-overlay">
      <motion.section className="modal-panel away-panel" role="dialog" aria-modal="true" aria-labelledby="away-title" data-focus-scope="ausencia"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 23 }}>
        <span className="modal-kicker">QUÉ ALEGRÍA VERTE</span>
        <h2 id="away-title">Mientras no estabas...</h2>
        <p className="away-intro">Pasaron unas {resumen.minutos < 60 ? `${resumen.minutos} min` : `${Math.floor(resumen.minutos / 60)} h`} y {resumen.suciedadNueva ? "apareció una pequeña sorpresa." : "tu peque te echó de menos."}</p>
        <div className="away-summary-list">
          {entradas.map(({ icono: Icono, texto, valor }) => (
            <div key={texto} className="away-summary-row"><span className="away-summary-icon"><Icono size={17} /></span><span>{texto}</span><strong>{texto === "Higiene" && resumen.suciedadNueva ? `+${resumen.suciedadNueva}` : `-${valor}%`}</strong></div>
          ))}
        </div>
        <button className="primary-button" type="button" onClick={alCerrar} data-initial-focus="true" data-game-focus="true">Ya estoy aquí <span aria-hidden="true">♡</span></button>
      </motion.section>
    </div>
  );
}