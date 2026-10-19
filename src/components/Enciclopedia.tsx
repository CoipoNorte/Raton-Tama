import { motion } from "framer-motion";
import { ArrowRight, Award, BookHeart, Brush, Coins, Heart, Sparkles, Utensils } from "lucide-react";
import { ESPECIES } from "../game/especies";
import { LOGROS } from "../game/logros";
import type { Partida } from "../game/types";

interface Props {
  partida: Partida;
  alCerrar: () => void;
}

const iconosLogro = { heart: Heart, utensils: Utensils, sparkles: Sparkles, coins: Coins, brush: Brush, award: Award } as const;

export default function Enciclopedia({ partida, alCerrar }: Props) {
  const descubiertas = new Set(partida.descubrimientos);
  return (
    <div className="screen-overlay modal-overlay">
      <motion.section className="modal-panel album-panel" role="dialog" aria-modal="true" aria-labelledby="album-title" data-focus-scope="album"
        initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} transition={{ type: "spring", damping: 23 }}>
        <div className="modal-heading-row">
          <div><span className="modal-kicker">PEQUEÑAS HISTORIAS, PARA SIEMPRE</span><h2 id="album-title">Álbum de familia</h2></div>
          <button className="icon-button close-button" type="button" aria-label="Cerrar álbum" onClick={alCerrar} data-initial-focus="true" data-game-focus="true"><ArrowRight size={19} /></button>
        </div>
        <div className="album-progress"><BookHeart size={16} /><span>{descubiertas.size} de {ESPECIES.length} especies descubiertas</span><div className="album-progress-track"><i style={{ width: `${(descubiertas.size / ESPECIES.length) * 100}%` }} /></div></div>
        <div className="species-grid" data-gesto-scroll>
          {ESPECIES.map((especie) => {
            const encontrada = descubiertas.has(especie.id);
            return (
              <article className={encontrada ? "species-entry found" : "species-entry locked"} key={especie.id}>
                <span className={`species-portrait ${especie.etapa === "huevo" ? "species-portrait-egg" : ""}`} style={{ "--species-color": encontrada ? especie.color : "#d8d6d0", "--species-accent": encontrada ? especie.acento : "#bbb9b2" } as React.CSSProperties}>
                  {encontrada ? (especie.etapa === "huevo"
                    ? <><i className="species-spot spot-a" /><i className="species-spot spot-b" /><i className="species-eye eye-asleep eye-left" /><i className="species-eye eye-asleep eye-right" /><i className="species-cheek cheek-left" /><i className="species-cheek cheek-right" /></>
                    : <><i className="species-ear ear-left" /><i className="species-ear ear-right" /><i className="species-eye eye-left" /><i className="species-eye eye-right" /><i className="species-cheek cheek-left" /><i className="species-cheek cheek-right" /></>)
                    : <span>?</span>}
                </span>
                <span className="species-entry-name">{encontrada ? especie.nombre : "Por descubrir"}</span>
                <span className="species-entry-stage">{especie.etapa}</span>
              </article>
            );
          })}
        </div>
        <div className="album-achievements">
          <div className="achievement-title"><Award size={17} /><strong>Pequeños logros</strong><span>{partida.logros.length}/{LOGROS.length}</span></div>
          <div className="achievement-list">
            {LOGROS.map((logro) => {
              const Icono = iconosLogro[logro.icono];
              const conseguido = partida.logros.includes(logro.id);
              return <span className={conseguido ? "achievement-chip earned" : "achievement-chip"} key={logro.id} title={logro.descripcion}><Icono size={14} />{logro.nombre}</span>;
            })}
          </div>
        </div>
      </motion.section>
    </div>
  );
}