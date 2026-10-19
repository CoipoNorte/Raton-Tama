import { Activity, Droplets, Heart, Moon, Smile, Utensils } from "lucide-react";
import type { Mascota } from "../game/types";
import MedidorNecesidad from "./MedidorNecesidad";

interface Props {
  mascota: Mascota;
  compacto?: boolean;
}

const medidores = [
  { id: "hambre", nombre: "Hambre", icono: Utensils },
  { id: "animo", nombre: "Ánimo", icono: Smile },
  { id: "energia", nombre: "Energía", icono: Moon },
  { id: "higiene", nombre: "Higiene", icono: Droplets },
  { id: "salud", nombre: "Salud", icono: Activity },
  { id: "vinculo", nombre: "Vínculo", icono: Heart }
] as const;

export default function HUD({ mascota, compacto = false }: Props) {
  return (
    <aside className={`needs-panel ${compacto ? "needs-panel-compact" : ""}`} aria-label="Necesidades de tu mascota">
      {!compacto && (
        <div className="needs-heading">
          <span className="section-kicker">SU PEQUEÑO UNIVERSO</span>
          <h2>Todo va bien</h2>
          <p>Un poquito de cuidado hace mucho.</p>
        </div>
      )}
      <div className="needs-list">
        {medidores.map((medidor) => (
          <MedidorNecesidad
            key={medidor.id}
            id={medidor.id}
            nombre={medidor.nombre}
            icono={medidor.icono}
            valor={mascota.necesidades[medidor.id]}
            compacto={compacto}
            delicado={medidor.id === "salud" && mascota.enferma}
          />
        ))}
      </div>
      {!compacto && (
        <div className="care-note">
          <span className="note-sun">✦</span>
          <span>Tu presencia es su lugar favorito.</span>
        </div>
      )}
    </aside>
  );
}