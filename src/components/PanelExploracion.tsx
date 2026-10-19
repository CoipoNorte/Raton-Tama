import { motion } from "framer-motion";
import { Brush, Check, Clock, Coins, FastForward, Heart, Moon, Sparkles, Sun, Utensils, Wand2, X } from "lucide-react";
import { ESPECIES } from "../game/especies";
import { OBJETOS } from "../game/objetos";
import type { Partida } from "../game/types";

interface Props {
  partida: Partida;
  alCerrar: () => void;
  alCambiarEspecie: (especieId: string) => void;
  alAnimar: (tipo: string) => void;
  alAvanzarTiempo: (horas: number) => void;
  alAlternarDiaNoche: () => void;
  alDarMonedas: (cantidad: number) => void;
  alLlenarDespensa: () => void;
  alDesbloquearMuebles: () => void;
  esDeNoche: boolean;
}

export default function PanelExploracion(props: Props) {
  const {
    partida,
    alCerrar,
    alCambiarEspecie,
    alAnimar,
    alAvanzarTiempo,
    alAlternarDiaNoche,
    alDarMonedas,
    alLlenarDespensa,
    alDesbloquearMuebles,
    esDeNoche
  } = props;

  return (
    <div className="screen-overlay modal-overlay">
      <motion.section
        className="modal-panel explorer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="explorer-title"
        data-focus-scope="explorar"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ type: "spring", damping: 23 }}
      >
        <div className="modal-heading-row">
          <div>
            <span className="modal-kicker">VARITA MÁGICA · VER EL JUEGO COMPLETO</span>
            <h2 id="explorer-title">Paseo libre por Ratón Tama</h2>
          </div>
          <button
            className="icon-button close-button"
            type="button"
            aria-label="Cerrar panel de exploración"
            onClick={alCerrar}
            data-initial-focus="true"
            data-game-focus="true"
          >
            <X size={19} />
          </button>
        </div>

        <p className="explorer-lead">
          Cambia de criatura al instante para verla en 3D, prueba cómo bosteza, avanza las horas o llena la habitación de juguetes.
        </p>

        <div className="explorer-body" data-gesto-scroll>
          {/* 1. Selector de criaturas (17 especies) */}
          <div className="explorer-section">
            <span className="explorer-section-title">
              <Sparkles size={15} /> Ver cualquier criatura en 3D ({ESPECIES.length} especies)
            </span>
            <div className="explorer-species-grid">
              {ESPECIES.map((esp) => {
                const activa = partida.mascota.especieId === esp.id;
                return (
                  <button
                    key={esp.id}
                    type="button"
                    className={`explorer-species-chip ${activa ? "is-active" : ""}`}
                    style={{ "--chip-color": esp.color } as React.CSSProperties}
                    onClick={() => alCambiarEspecie(esp.id)}
                    data-game-focus="true"
                  >
                    <span className="chip-seal">{esp.nombre.slice(0, 1)}</span>
                    <span className="chip-name">{esp.nombre}</span>
                    <span className="chip-stage">{esp.etapa}</span>
                    {activa && <Check size={13} className="chip-check" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Emociones y animaciones */}
          <div className="explorer-section">
            <span className="explorer-section-title">
              <Heart size={15} /> Ternura y animaciones
            </span>
            <div className="explorer-buttons-row">
              <button
                type="button"
                className="explorer-tool-btn"
                onClick={() => alAnimar("bostezo")}
                data-game-focus="true"
              >
                🥱 Ver bostezo
              </button>
              <button
                type="button"
                className="explorer-tool-btn"
                onClick={() => alAnimar("jugar")}
                data-game-focus="true"
              >
                🎉 Saltar de alegría
              </button>
              <button
                type="button"
                className="explorer-tool-btn"
                onClick={() => alAnimar("comer")}
                data-game-focus="true"
              >
                🍙 Ver mordisquitos
              </button>
              <button
                type="button"
                className="explorer-tool-btn"
                onClick={() => alAnimar("evolucion")}
                data-game-focus="true"
              >
                ✨ Fanfarria y giro
              </button>
            </div>
          </div>

          {/* 3. Paseo en el tiempo y ambiente */}
          <div className="explorer-section">
            <span className="explorer-section-title">
              <Clock size={15} /> Simulación y tiempo
            </span>
            <div className="explorer-buttons-row">
              <button
                type="button"
                className="explorer-tool-btn"
                onClick={() => alAvanzarTiempo(2)}
                data-game-focus="true"
              >
                <FastForward size={14} /> +2 horas (hambre/ánimo)
              </button>
              <button
                type="button"
                className="explorer-tool-btn"
                onClick={() => alAvanzarTiempo(6)}
                data-game-focus="true"
              >
                <Brush size={14} /> +6 horas (aparece caca)
              </button>
              <button
                type="button"
                className="explorer-tool-btn"
                onClick={alAlternarDiaNoche}
                data-game-focus="true"
              >
                {esDeNoche ? <Sun size={14} /> : <Moon size={14} />}
                {esDeNoche ? "Pasar a Día" : "Pasar a Noche"}
              </button>
            </div>
          </div>

          {/* 4. Economía y habitación */}
          <div className="explorer-section">
            <span className="explorer-section-title">
              <Coins size={15} /> Habitación y despensa
            </span>
            <div className="explorer-buttons-row">
              <button
                type="button"
                className="explorer-tool-btn"
                onClick={() => alDarMonedas(50)}
                data-game-focus="true"
              >
                <Coins size={14} /> +50 monedas
              </button>
              <button
                type="button"
                className="explorer-tool-btn"
                onClick={alLlenarDespensa}
                data-game-focus="true"
              >
                <Utensils size={14} /> Llenar toda la despensa
              </button>
              <button
                type="button"
                className="explorer-tool-btn"
                onClick={alDesbloquearMuebles}
                data-game-focus="true"
              >
                🪴 Poner todos los muebles ({OBJETOS.length})
              </button>
            </div>
          </div>
        </div>

        <div className="shop-footer">
          <Wand2 size={15} />
          <span>Todo se actualiza en tiempo real en tu diorama 3D.</span>
        </div>
      </motion.section>
    </div>
  );
}
