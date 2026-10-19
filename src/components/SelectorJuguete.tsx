import { motion } from "framer-motion";
import { Circle, MousePointer2, Move, Star, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TipoJuguete = "pelota" | "palo" | "estrella";

interface Props {
  juguete: TipoJuguete;
  alElegir: (juguete: TipoJuguete) => void;
  alCerrar: () => void;
}

interface Opcion {
  id: TipoJuguete;
  nombre: string;
  detalle: string;
  icono: LucideIcon;
}

const OPCIONES: Opcion[] = [
  { id: "pelota", nombre: "Pelota", detalle: "Rueda y rebota sola; Mochi la devuelve.", icono: Circle },
  { id: "palo", nombre: "Palo y pelota", detalle: "Tú llevas el palo y ella patea.", icono: Move },
  { id: "estrella", nombre: "Estrella", detalle: "La guías con el dedo o el ratón.", icono: Star }
];

/** Elige qué juguete sale al diorama antes de empezar a jugar. */
export default function SelectorJuguete({ juguete, alElegir, alCerrar }: Props) {
  return (
    <motion.div
      className="food-tray toy-tray"
      role="group"
      aria-label="Elige un juguete"
      data-focus-scope="juguete"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ type: "spring", damping: 24, stiffness: 240 }}
    >
      <div className="food-tray-heading">
        <div>
          <span className="section-kicker">JUGUETERO</span>
          <strong>¿Con qué juega hoy?</strong>
        </div>
        <button className="food-tray-close" type="button" aria-label="Cerrar juguetero" onClick={alCerrar} data-initial-focus="true" data-game-focus="true">
          <X size={17} />
        </button>
      </div>
      <div className="toy-list">
        {OPCIONES.map((opcion) => {
          const Icono = opcion.icono;
          const activo = juguete === opcion.id;
          return (
            <button
              key={opcion.id}
              type="button"
              className={`toy-choice ${activo ? "toy-active" : ""}`}
              aria-pressed={activo}
              onClick={() => alElegir(opcion.id)}
              data-testid={`toy-${opcion.id}`}
              data-game-focus="true"
            >
              <span className="toy-choice-icon"><Icono size={20} strokeWidth={2.2} /></span>
              <span className="toy-choice-copy">
                <strong>{opcion.nombre}</strong>
                <small>{opcion.detalle}</small>
              </span>
              <MousePointer2 size={13} className="toy-choice-pointer" />
            </button>
          );
        })}
      </div>
      <span className="food-tray-help">Toca un juguete y sal a jugar con él en el diorama</span>
    </motion.div>
  );
}
