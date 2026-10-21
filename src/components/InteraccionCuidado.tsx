import { motion } from "framer-motion";
import { CircleEllipsis, Droplets, Gamepad2, Pill, Shirt, Sparkles, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fasesCuidado, objetivoCuidado } from "../game/cuidados";
import type { AccionCuidado } from "../game/cuidados";

export type { AccionCuidado };

interface Props {
  accion: AccionCuidado;
  progreso: number;
  fase: number;
  alCancelar: () => void;
}

const iconos: Record<string, LucideIcon> = {
  pelota: Gamepad2,
  jabon: CircleEllipsis,
  agua: Droplets,
  toalla: Shirt,
  curita: Pill,
};

const titulos: Record<AccionCuidado, string> = {
  jugar: "A jugar con la pelota",
  limpiar: "Hora del baño",
  curar: "Una curita rápida"
};

/** Panel flotante del cuidado: pasos, progreso y salidas accesibles. */
export default function InteraccionCuidado({ accion, progreso, fase, alCancelar }: Props) {
  const fases = fasesCuidado(accion);
  const faseActiva = fases[Math.min(fase, fases.length - 1)] ?? fases[0];
  const total = objetivoCuidado(accion);
  const porcentaje = Math.min(100, Math.round((progreso / Math.max(1, total)) * 100));

  return (
    <motion.div
      className="care-overlay"
      data-focus-scope="cuidado"
      data-testid={`care-${accion}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: "spring", damping: 24, stiffness: 240 }}
    >
      <section className="care-card" aria-live="polite">
        <div className="care-card-head">
          <span className="care-kicker"><Sparkles size={11} /> EN TU MANO</span>
          <strong>{titulos[accion]}</strong>
          <button className="care-cancel" type="button" aria-label="Cancelar este cuidado" onClick={alCancelar} data-initial-focus="true" data-game-focus="true">
            <X size={15} />
          </button>
        </div>
        {fases.length > 1 && (
          <ol className="care-steps" role="list">
            {fases.map((paso, indice) => {
              const Icono = iconos[paso.icono] ?? Sparkles;
              const estado = indice < fase ? "hecha" : indice === fase ? "activa" : "pendiente";
              return (
                <li key={paso.id} className={`care-step care-step-${estado}`} data-testid={`care-step-${paso.id}`}>
                  <span className="care-step-icon"><Icono size={14} /></span>
                  <span>{paso.etiqueta}</span>
                </li>
              );
            })}
          </ol>
        )}
        <p className="care-detail">{faseActiva?.detalle}</p>
        <div className="care-progress" data-testid="care-progress" data-progress={progreso} data-target={total}>
          <i style={{ width: `${porcentaje}%` }} />
          <b>{porcentaje}%</b>
        </div>
      </section>
      <span className="care-help" aria-hidden="true">Enter / A avanza un paso</span>
    </motion.div>
  );
}
