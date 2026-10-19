import { Component, Suspense, useMemo, useRef, useState } from "react";
import type { CSSProperties, ErrorInfo, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Sparkles } from "lucide-react";
import { calcularMarcoDiorama } from "../game/geometria.js";
import type { ArrastreComida, Especie, Mascota, ObjetoJuego } from "../game/types";
import type { AccionCuidado } from "../game/cuidados";
import type { ModeloComida } from "../components/IconoComida";
import type { TipoJuguete } from "../components/SelectorJuguete";
import Habitacion from "./Habitacion";
import Criatura from "./Criatura";
import Fallback2D from "./Fallback2D";
import Particulas from "./Particulas";
import Interacciones3D from "./Interacciones3D";
import { crearEstadoCriatura } from "./estadoCriatura";
import ComidaArrastrada3D from "./ComidaArrastrada3D";

interface Props {
  mascota: Mascota;
  especie: Especie;
  objetos: ObjetoJuego[];
  movimiento: string;
  animando: boolean;
  angulo: number;
  ancho: number;
  alto: number;
  reducirMovimiento: boolean;
  noche: boolean;
  pausada: boolean;
  accionCuidado: AccionCuidado | null;
  faseCuidado: number;
  bocado: ModeloComida | null;
  comidaArrastrada: ArrastreComida | null;
  juguete: TipoJuguete;
  onProgresoCuidado: (progreso: number, fase: number) => void;
  onFaseCuidado: (fase: number) => void;
  onCompletarCuidado: () => void;
  onFalloWebgl: () => void;
}

interface LimiteProps {
  children: ReactNode;
  respaldo: ReactNode;
  onError: () => void;
}

interface LimiteState {
  fallido: boolean;
}

/** Si el Canvas falla (WebGL roto, driver antigo) caemos al diorama 2D. */
class LimiteEscena extends Component<LimiteProps, LimiteState> {
  state: LimiteState = { fallido: false };

  static getDerivedStateFromError(): LimiteState {
    return { fallido: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    this.props.onError();
  }

  render(): ReactNode {
    return this.state.fallido ? this.props.respaldo : this.props.children;
  }
}

export default function Escena(props: Props) {
  const {
    mascota, especie, objetos, movimiento, animando, angulo, ancho, alto, reducirMovimiento, noche, pausada,
    accionCuidado, faseCuidado, bocado, comidaArrastrada, juguete, onProgresoCuidado, onFaseCuidado, onCompletarCuidado, onFalloWebgl
  } = props;
  const dormida = mascota.durmiendo;
  // La criatura nunca está del todo quieta (respira y parpadea), así que solo
  // renderizamos bajo demanda en pausa o con movimiento reducido.
  const enReposo = (pausada || reducirMovimiento) && !animando && !accionCuidado && !comidaArrastrada;
  const [webgl, setWebgl] = useState(true);
  const [lista, setLista] = useState(false);
  const marco = useMemo(() => calcularMarcoDiorama(ancho, alto), [ancho, alto]);
  // Estado vivo compartido: los cuidados escriben, la criatura reacciona.
  const estadoRef = useRef(crearEstadoCriatura());
  const dispositivo = typeof navigator === "undefined" ? null : navigator as Navigator & { deviceMemory?: number };
  const bajaPotencia = Boolean(dispositivo && (
    (dispositivo.hardwareConcurrency ?? 8) <= 4 ||
    (dispositivo.deviceMemory ?? 8) <= 4 ||
    ancho < 390
  ));
  const respaldo = <Fallback2D mascota={mascota} especie={especie} reducirMovimiento={reducirMovimiento} />;

  const fallar = () => {
    setWebgl(false);
    onFalloWebgl();
  };

  return (
    <div className="scene-renderer" style={{ "--diorama-min-height": `${Math.min(marco.altoDisponible, 190)}px` } as CSSProperties}>
      {webgl ? (
        <LimiteEscena respaldo={respaldo} onError={fallar}>
          <Canvas
            dpr={[1, bajaPotencia ? 1.25 : 1.8]}
            performance={{ min: 0.5 }}
            frameloop={enReposo ? "demand" : "always"}
            shadows={!bajaPotencia}
            gl={{ alpha: true, antialias: !bajaPotencia, powerPreference: "low-power" }}
            camera={{ position: [0, 1.1, 7.15], fov: 38, near: 0.1, far: 40 }}
            onCreated={({ gl }) => {
              setLista(true);
              gl.domElement.addEventListener("webglcontextlost", (evento) => {
                evento.preventDefault();
                fallar();
              });
            }}
          >
            <color attach="background" args={[dormida ? "#c9d2e0" : noche ? "#d9e0ed" : "#e8f2e9"]} />
            {/* Luz contenida: three r155+ usa luces físicas y los toon se lavan si se pasa de ~2 en total. */}
            <ambientLight intensity={dormida ? 0.5 : noche ? 0.55 : 0.75} />
            <directionalLight
              position={[-3.8, 6, 4.5]}
              intensity={dormida ? 0.7 : noche ? 0.85 : 1.15}
              castShadow={!bajaPotencia}
              shadow-mapSize-width={512}
              shadow-mapSize-height={512}
              shadow-camera-left={-4}
              shadow-camera-right={4}
              shadow-camera-top={4}
              shadow-camera-bottom={-3}
              shadow-bias={-0.0007}
            />
            <Suspense fallback={null}>
              <group rotation={[0, angulo, 0]}>
                <Habitacion objetos={objetos} suciedad={mascota.suciedad} />
                <group position={[0, -0.05, 0.32]}>
                  <Criatura
                    mascota={mascota}
                    especie={especie}
                    movimiento={movimiento}
                    movimientoReducido={reducirMovimiento}
                    colorGorro={objetos.find((objeto) => objeto.modelo === "gorrito")?.color}
                    estado={estadoRef.current}
                    bocado={bocado}
                  />
                  {accionCuidado && !dormida && (
                    <Interacciones3D
                      accion={accionCuidado}
                      fase={faseCuidado}
                      juguete={juguete}
                      estado={estadoRef.current}
                      onProgreso={onProgresoCuidado}
                      onFase={onFaseCuidado}
                      onCompletar={onCompletarCuidado}
                    />
                  )}
                  <Particulas polvo={animando && !reducirMovimiento && !bajaPotencia} movimientoReducido={reducirMovimiento} />
                </group>
              </group>
              {comidaArrastrada && <ComidaArrastrada3D key={comidaArrastrada.comidaId} comida={comidaArrastrada} />}
            </Suspense>
          </Canvas>
          {!lista && <div className="scene-loading"><span className="loading-orbit"><Sparkles size={19} /></span><span>Preparando su rinconcito</span></div>}
        </LimiteEscena>
      ) : (
        <div className="scene-fallback-wrap">
          {respaldo}
          <div className="webgl-notice"><span className="notice-dot" />Vista 2D activa para que puedas seguir jugando</div>
        </div>
      )}
    </div>
  );
}
