import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { NecesidadId } from "../game/types";

interface Props {
  id: NecesidadId;
  nombre: string;
  icono: LucideIcon;
  valor: number;
  compacto?: boolean;
  delicado?: boolean;
}

export default function MedidorNecesidad({ id, nombre, icono: Icono, valor, compacto = false, delicado = false }: Props) {
  const color = delicado || valor < 25 ? "danger" : valor < 56 ? "warning" : "good";
  return (
    <div className={`need-meter ${compacto ? "need-meter-compact" : ""} tone-${color}`} aria-label={`${nombre}: ${Math.round(valor)} por ciento`} data-testid={`need-${id}`} data-value={Math.round(valor)}>
      <span className="need-icon"><Icono size={compacto ? 16 : 18} strokeWidth={2.1} /></span>
      <span className="need-detail">
        <span className="need-label">{nombre}</span>
        <span className="need-value">{Math.round(valor)}<small>%</small></span>
        <span className="need-track" aria-hidden="true">
          <motion.span
            className="need-fill"
            initial={false}
            animate={{ width: `${Math.max(0, Math.min(100, valor))}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 18, mass: 0.7 }}
          />
        </span>
      </span>
      <span className="sr-only">{id}</span>
    </div>
  );
}