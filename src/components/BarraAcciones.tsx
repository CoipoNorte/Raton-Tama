import { motion } from "framer-motion";
import { BedDouble, Brush, Gamepad2, Heart, Pill, Utensils } from "lucide-react";

export type AccionBarra = "comer" | "jugar" | "limpiar" | "dormir" | "curar" | "mimar";

interface Props {
  alElegir: (accion: AccionBarra) => void;
  deshabilitado: boolean;
  durmiendo: boolean;
  enferma: boolean;
  medicinas: number;
  mandoConectado: boolean;
}

const acciones: { id: AccionBarra; texto: string; atajo?: string; icono: typeof Utensils }[] = [
  { id: "comer", texto: "Comer", atajo: "1", icono: Utensils },
  { id: "jugar", texto: "Jugar", atajo: "2", icono: Gamepad2 },
  { id: "limpiar", texto: "Limpiar", atajo: "3", icono: Brush },
  { id: "dormir", texto: "Dormir", icono: BedDouble },
  { id: "curar", texto: "Curar", icono: Pill },
  { id: "mimar", texto: "Mimar", atajo: "4", icono: Heart }
];

export default function BarraAcciones({ alElegir, deshabilitado, durmiendo, enferma, medicinas, mandoConectado }: Props) {
  return (
    <nav className="action-bar" aria-label="Acciones de cuidado">
      <div className="action-bar-inner">
        <span className="action-heading">Un gesto de cariño</span>
        <div className="action-list">
          {acciones.map((accion, indice) => {
            const Icono = accion.icono;
            const activo = accion.id === "dormir" && durmiendo;
            const sinMedicina = accion.id === "curar" && medicinas <= 0;
            return (
              <motion.button
                key={accion.id}
                type="button"
                className={`action-button ${activo ? "action-active" : ""} action-${accion.id}`}
                aria-label={`${activo ? "Despertar" : accion.texto}${accion.id === "curar" ? `, ${medicinas} medicinas` : ""}`}
                title={accion.id === "curar" && enferma ? "Tu peque necesita medicina" : accion.texto}
                disabled={deshabilitado || sinMedicina}
                onClick={() => alElegir(accion.id)}
                whileHover={deshabilitado ? undefined : { y: -3 }}
                whileTap={deshabilitado ? undefined : { scale: 0.94 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                data-game-focus="true"
              >
                <span className="action-icon"><Icono size={20} strokeWidth={2.1} /></span>
                <span className="action-label">{activo ? "Despertar" : accion.texto}</span>
                {accion.atajo && <span className="action-shortcut">{mandoConectado ? ["X", "Y", "LT", "RT"][indice === 0 ? 0 : indice === 1 ? 1 : indice === 2 ? 2 : 3] : accion.atajo}</span>}
                {accion.id === "curar" && medicinas > 0 && <span className="action-count">{medicinas}</span>}
              </motion.button>
            );
          })}
        </div>
        <span className="action-help">{mandoConectado ? "A elegir · B volver · Start pausa" : "Flechas para moverte · Enter para elegir"}</span>
      </div>
    </nav>
  );
}