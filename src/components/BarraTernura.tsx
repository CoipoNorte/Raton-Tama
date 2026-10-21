import { motion } from "framer-motion";
import { Cookie, PartyPopper, RotateCw, Sparkles, X } from "lucide-react";

interface Props {
  alAnimar: (tipo: string) => void;
  alCerrar: () => void;
  mandoConectado: boolean;
}

const animaciones = [
  { id: "bostezo", texto: "Bostezo", icono: Sparkles, color: "ternura-yawn" },
  { id: "jugar", texto: "Salto feliz", icono: PartyPopper, color: "ternura-jump" },
  { id: "comer", texto: "Mordisquitos", icono: Cookie, color: "ternura-bite" },
  { id: "evolucion", texto: "Giro mágico", icono: RotateCw, color: "ternura-spin" }
] as const;

/** Sustituye la barra normal mientras se prueban animaciones viendo el diorama. */
export default function BarraTernura({ alAnimar, alCerrar, mandoConectado }: Props) {
  return (
    <nav className="action-bar tenderness-bar" aria-label="Ternura y animaciones" data-focus-scope="ternura">
      <div className="action-bar-inner tenderness-inner">
        <span className="action-heading tenderness-title"><Sparkles size={14} /> Ternura en directo</span>
        <div className="action-list tenderness-list">
          {animaciones.map((animacion, indice) => {
            const Icono = animacion.icono;
            return (
              <motion.button
                key={animacion.id}
                type="button"
                className={`action-button tenderness-button ${animacion.color}`}
                aria-label={`Ver ${animacion.texto}`}
                onClick={() => alAnimar(animacion.id)}
                data-initial-focus={indice === 0 ? "true" : undefined}
                data-game-focus="true"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
              >
                <span className="action-icon"><Icono size={20} /></span>
                <span className="action-label">{animacion.texto}</span>
                <span className="action-shortcut">{mandoConectado ? ["X", "Y", "LT", "RT"][indice] : indice + 1}</span>
              </motion.button>
            );
          })}
          <motion.button type="button" className="action-button tenderness-button tenderness-close" aria-label="Cerrar menú de ternura" onClick={alCerrar} data-game-focus="true" whileTap={{ scale: 0.94 }}>
            <span className="action-icon"><X size={20} /></span>
            <span className="action-label">Volver</span>
          </motion.button>
        </div>
        <span className="action-help">{mandoConectado ? "B volver · botones para probar" : "Pulsa varias veces: Mochi siempre queda visible"}</span>
      </div>
    </nav>
  );
}