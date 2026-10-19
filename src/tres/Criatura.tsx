import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Especie, Mascota } from "../game/types";
import type { ModeloComida } from "../components/IconoComida";
import { sonar } from "../game/sound";
import type { EstadoCriatura } from "./estadoCriatura";
import { emitirEfecto } from "./emisorEfectos";

interface Props {
  mascota: Mascota;
  especie: Especie;
  movimiento: string;
  movimientoReducido: boolean;
  colorGorro?: string;
  /** Canal compartido con los cuidados: mirar, saltar, masticar, mojado… */
  estado: EstadoCriatura;
  /** Comida que se está comiendo (aparece en la boca y se achica a mordiscos). */
  bocado: ModeloComida | null;
}

const CURVA_SUAVE = 18;

function CurvaSuave({ puntos, color, grosor }: { puntos: THREE.Vector3[]; color: string; grosor: number }) {
  const geometria = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos), CURVA_SUAVE, grosor, 6, false), [grosor, puntos]);
  return (
    <mesh geometry={geometria}>
      <meshToonMaterial color={color} />
    </mesh>
  );
}

/** Comida procedural diminuta que se sostiene con las patitas. */
function ComidaEnBoca({ modelo, escala }: { modelo: ModeloComida; escala: number }) {
  if (modelo === "fruta") {
    return (
      <group scale={escala}>
        <mesh>
          <sphereGeometry args={[0.16, 16, 14]} />
          <meshToonMaterial color="#e2607a" />
        </mesh>
        <mesh position={[0, 0.14, 0]} rotation={[0.4, 0, 0.3]}>
          <coneGeometry args={[0.05, 0.12, 8]} />
          <meshToonMaterial color="#6da87d" />
        </mesh>
      </group>
    );
  }
  if (modelo === "bebida") {
    return (
      <group scale={escala}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.12, 0.26, 16]} />
          <meshPhysicalMaterial color="#e7f3e8" roughness={0.25} clearcoat={0.8} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
          <meshToonMaterial color="#9dc3a9" />
        </mesh>
      </group>
    );
  }
  if (modelo === "pastel") {
    return (
      <group scale={escala}>
        <mesh>
          <sphereGeometry args={[0.15, 18, 14]} />
          <meshToonMaterial color="#f6c9d4" />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <sphereGeometry args={[0.05, 12, 10]} />
          <meshToonMaterial color="#e2607a" />
        </mesh>
      </group>
    );
  }
  if (modelo === "queso") {
    return (
      <group scale={escala}>
        <mesh rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.3, 0.16, 0.12]} />
          <meshToonMaterial color="#f4cf6b" />
        </mesh>
      </group>
    );
  }
  return (
    <group scale={escala}>
      <mesh>
        <coneGeometry args={[0.19, 0.26, 4, 1]} />
        <meshToonMaterial color="#fdfdf8" />
      </mesh>
      <mesh position={[0, -0.09, 0.09]}>
        <boxGeometry args={[0.13, 0.09, 0.02]} />
        <meshToonMaterial color="#4d7c5f" />
      </mesh>
    </group>
  );
}

export default function Criatura({ mascota, especie, movimiento, movimientoReducido, colorGorro, estado, bocado }: Props) {
  const cuerpoRef = useRef<THREE.Group>(null);
  const cabezaRef = useRef<THREE.Group>(null);
  const ojoIzquierdo = useRef<THREE.Group>(null);
  const ojoDerecho = useRef<THREE.Group>(null);
  const cierreOjos = useRef(0);
  const proximoParpadeo = useRef(2.4);
  const bocadoInicio = useRef<number | null>(null);
  const velocidadMordida = useRef(0);
  const vectorAux = useMemo(() => new THREE.Vector3(), []);
  const puntosBoca = useMemo(
    () => [
      new THREE.Vector3(-0.17, -0.2, 0.93),
      new THREE.Vector3(-0.09, -0.26, 0.96),
      new THREE.Vector3(0, -0.2, 0.97),
      new THREE.Vector3(0.09, -0.26, 0.96),
      new THREE.Vector3(0.17, -0.2, 0.93)
    ],
    []
  );
  const puntosCola = useMemo(
    () => [
      new THREE.Vector3(0.62, -0.35, -0.18),
      new THREE.Vector3(1.0, -0.25, -0.25),
      new THREE.Vector3(1.16, -0.02, -0.2),
      new THREE.Vector3(1.06, 0.11, -0.18)
    ],
    []
  );
  const color = mascota.tinteHerencia ?? especie.color;
  const esHuevo = especie.etapa === "huevo";
  const bostezando = movimiento === "bostezo";

  // Migajas al terminar el bocado: un detalle que remata la animación.
  useEffect(() => {
    if (!bocado) {
      bocadoInicio.current = null;
      return;
    }
    bocadoInicio.current = performance.now();
    velocidadMordida.current = -1;
  }, [bocado]);

  useFrame(({ clock }) => {
    const tiempo = clock.getElapsedTime();
    const cuerpo = cuerpoRef.current;
    if (!cuerpo) return;

    // Decaimiento de los impulsos que envían los cuidados.
    estado.saltar = Math.max(0, estado.saltar - 0.045);
    estado.feliz = Math.max(0, estado.feliz - 0.014);
    estado.temblar = Math.max(0, estado.temblar - 0.05);

    const evolucionando = movimiento === "evolucion";
    const salto = movimiento === "jugar" || evolucionando;
    const comer = movimiento === "comer" || Boolean(bocado);
    const excitacion = Math.max(salto ? 1 : 0, estado.saltar);
    const reposo = movimientoReducido ? 0 : Math.sin(tiempo * (excitacion > 0.2 ? 7 : 2.25)) * (excitacion > 0.2 ? 0.105 : 0.018);
    const impulso = Math.max(0, Math.sin(Math.min(1, estado.saltar) * Math.PI)) * 0.16;
    cuerpo.position.y = reposo + (excitacion > 0.2 ? Math.max(0, Math.sin(tiempo * 7)) * 0.09 : 0) + impulso;

    const estiramiento = bostezando ? 0.14 : 0;
    const mordisco = comer ? Math.abs(Math.sin(tiempo * 11)) * 0.075 : 0;
    const pulso = evolucionando ? 1 + Math.sin(tiempo * 9) * 0.075 : 1;
    const contentura = estado.feliz * 0.04;
    cuerpo.scale.set((1 - mordisco * 0.6 + contentura) * pulso, (1 + estiramiento + mordisco * 0.4 - contentura) * pulso, (1 + mordisco * 0.3) * pulso);

    // Reacción al secarse: un temblorcito de perrito mojado.
    const temblor = estado.temblar > 0.02 && !movimientoReducido ? Math.sin(tiempo * 46) * 0.05 * estado.temblar : 0;

    // Sigue con la cabeza lo que está pasando (pelota, jabón, mano).
    let objetivoY = 0;
    let objetivoX = 0;
    if (estado.mirar && !movimientoReducido) {
      vectorAux.set(estado.mirar.x, estado.mirar.y - 0.25, estado.mirar.z);
      const distancia = Math.max(0.4, vectorAux.length());
      objetivoY = THREE.MathUtils.clamp(Math.atan2(vectorAux.x, Math.max(0.4, distancia)), -0.42, 0.42);
      objetivoX = THREE.MathUtils.clamp(-Math.atan2(vectorAux.y, Math.max(0.5, Math.hypot(vectorAux.x, vectorAux.z))) * 0.55, -0.22, 0.26);
    }
    const cabeza = cabezaRef.current;
    if (cabeza) {
      cabeza.rotation.y += (objetivoY - cabeza.rotation.y) * 0.12;
      cabeza.rotation.x += (objetivoX + (bostezando ? -0.12 : 0) - cabeza.rotation.x) * 0.12;
      // Al frotarla o acariciarla inclina la cabeza hacia la mano.
      cabeza.rotation.z += (estado.feliz * 0.16 + temblor - cabeza.rotation.z) * 0.16;
    }
    cuerpo.rotation.z = movimientoReducido ? 0 : Math.sin(tiempo * 1.1) * 0.018 + temblor * 0.6;
    cuerpo.rotation.y = evolucionando && !movimientoReducido ? tiempo * 2.4 : 0;

    if (!mascota.durmiendo && !movimientoReducido) {
      if (bostezando) {
        cierreOjos.current = 0.95;
      } else if (tiempo > proximoParpadeo.current) {
        cierreOjos.current = 0.18;
        proximoParpadeo.current = tiempo + 2.6 + Math.random() * 2.2;
      } else {
        cierreOjos.current = Math.max(0, cierreOjos.current - 0.025);
      }
    } else if (mascota.durmiendo) {
      cierreOjos.current = 0.84;
    } else {
      cierreOjos.current = 0;
    }
    // Ojos entornados de placer cuando la acarician.
    const placidez = estado.feliz * 0.45;
    const apertura = Math.max(0.12, 1 - cierreOjos.current * 4.2 - placidez);
    if (ojoIzquierdo.current) ojoIzquierdo.current.scale.y = apertura;
    if (ojoDerecho.current) ojoDerecho.current.scale.y = apertura;
    if (ojoIzquierdo.current) ojoIzquierdo.current.position.z = 0.69 + placidez * 0.02;
    if (ojoDerecho.current) ojoDerecho.current.position.z = 0.69 + placidez * 0.02;

    // Animación del bocado: se achica a mordiscos y suelta migajas.
    if (bocado && bocadoInicio.current !== null) {
      const edad = (performance.now() - bocadoInicio.current) / 1000;
      const mordidas = Math.floor(edad / 0.34);
      if (mordidas > velocidadMordida.current) {
        velocidadMordida.current = mordidas;
        sonar("masticar");
        emitirEfecto({ tipo: "destello", x: 0, y: -0.22, z: 0.98, cantidad: 3, fuerza: 0.7 });
      }
      if (edad > 1.25) {
        bocadoInicio.current = null;
        velocidadMordida.current = 0;
      }
    }
  });

  // El huevo tiene su propia silueta: una ova con carita dormida y lunares.
  if (esHuevo) {
    return (
      <group ref={cuerpoRef}>
        <mesh position={[0, -0.02, 0]} scale={[0.79, 0.99, 0.76]} castShadow>
          <sphereGeometry args={[1, 34, 28]} />
          <meshToonMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.02, 0.61]} scale={[0.4, 0.58, 0.16]}>
          <sphereGeometry args={[1, 22, 18]} />
          <meshToonMaterial color="#fff6e9" transparent opacity={0.24} />
        </mesh>
        <mesh position={[-0.26, 0.28, 0.5]} scale={0.12}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshToonMaterial color={especie.acento} />
        </mesh>
        <mesh position={[0.3, -0.06, 0.55]} scale={0.09}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshToonMaterial color={especie.acento} />
        </mesh>
        <mesh position={[0.05, 0.52, 0.42]} scale={0.075}>
          <sphereGeometry args={[1, 14, 12]} />
          <meshToonMaterial color={especie.acento} />
        </mesh>
        <mesh position={[-0.24, 0.06, 0.62]} scale={[0.115, 0.05, 0.06]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshToonMaterial color="#4b3d43" />
        </mesh>
        <mesh position={[0.24, 0.06, 0.62]} scale={[0.115, 0.05, 0.06]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshToonMaterial color="#4b3d43" />
        </mesh>
        <mesh position={[-0.4, -0.12, 0.55]} scale={[0.16, 0.1, 0.06]}>
          <sphereGeometry args={[1, 18, 14]} />
          <meshToonMaterial color={especie.mejillas} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.4, -0.12, 0.55]} scale={[0.16, 0.1, 0.06]}>
          <sphereGeometry args={[1, 18, 14]} />
          <meshToonMaterial color={especie.mejillas} transparent opacity={0.7} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={cuerpoRef}>
      <group ref={cabezaRef}>
        <CurvaSuave puntos={puntosCola} color={color} grosor={0.075} />
        <mesh position={[-0.53, 0.7, -0.02]} rotation={[0, 0, -0.28]} scale={[0.43, 0.5, 0.2]}>
          <sphereGeometry args={[1, 24, 20]} />
          <meshToonMaterial color={especie.acento} />
        </mesh>
        <mesh position={[0.53, 0.7, -0.02]} rotation={[0, 0, 0.28]} scale={[0.43, 0.5, 0.2]}>
          <sphereGeometry args={[1, 24, 20]} />
          <meshToonMaterial color={especie.acento} />
        </mesh>
        <mesh position={[-0.53, 0.7, 0.16]} rotation={[0, 0, -0.28]} scale={[0.22, 0.3, 0.06]}>
          <sphereGeometry args={[1, 18, 16]} />
          <meshToonMaterial color="#f4b8bc" />
        </mesh>
        <mesh position={[0.53, 0.7, 0.16]} rotation={[0, 0, 0.28]} scale={[0.22, 0.3, 0.06]}>
          <sphereGeometry args={[1, 18, 16]} />
          <meshToonMaterial color="#f4b8bc" />
        </mesh>
        <mesh position={[0, 0.03, 0]} scale={[0.94, 0.97, 0.82]} castShadow>
          <sphereGeometry args={[1, 40, 32]} />
          <meshToonMaterial color={color} />
        </mesh>
        {estado.mojado > 0.02 && (
          <mesh position={[0, 0.03, 0]} scale={[0.96, 0.99, 0.84]}>
            <sphereGeometry args={[1, 26, 20]} />
            <meshPhysicalMaterial color="#cdeaf2" transparent opacity={0.26 * estado.mojado} roughness={0.05} clearcoat={1} depthWrite={false} />
          </mesh>
        )}
        <mesh position={[-0.08, 0.52, 0.12]} scale={[0.47, 0.19, 0.28]}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshToonMaterial color="#fff6e9" transparent opacity={0.22} />
        </mesh>
        <group ref={ojoIzquierdo} position={[-0.3, 0.22, 0.69]}>
          <mesh scale={[0.125, 0.17, 0.1]}>
            <sphereGeometry args={[1, 24, 20]} />
            <meshToonMaterial color="#42383e" />
          </mesh>
          <mesh position={[-0.034, 0.056, 0.078]} scale={0.039}>
            <sphereGeometry args={[1, 14, 12]} />
            <meshBasicMaterial color="#fffdf7" />
          </mesh>
          <mesh position={[0.04, -0.04, 0.076]} scale={0.017}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color="#fffdf7" />
          </mesh>
        </group>
        <group ref={ojoDerecho} position={[0.3, 0.22, 0.69]}>
          <mesh scale={[0.125, 0.17, 0.1]}>
            <sphereGeometry args={[1, 24, 20]} />
            <meshToonMaterial color="#42383e" />
          </mesh>
          <mesh position={[-0.034, 0.056, 0.078]} scale={0.039}>
            <sphereGeometry args={[1, 14, 12]} />
            <meshBasicMaterial color="#fffdf7" />
          </mesh>
          <mesh position={[0.04, -0.04, 0.076]} scale={0.017}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color="#fffdf7" />
          </mesh>
        </group>
        <mesh position={[-0.55, -0.12, 0.58]} scale={[0.18, 0.12, 0.07]}>
          <sphereGeometry args={[1, 20, 16]} />
          <meshToonMaterial color={especie.mejillas} transparent opacity={0.72} />
        </mesh>
        <mesh position={[0.55, -0.12, 0.58]} scale={[0.18, 0.12, 0.07]}>
          <sphereGeometry args={[1, 20, 16]} />
          <meshToonMaterial color={especie.mejillas} transparent opacity={0.72} />
        </mesh>
        <mesh position={[0, -0.11, 0.72]} scale={[0.29, 0.2, 0.14]}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshToonMaterial color="#fff0dc" />
        </mesh>
        <mesh position={[0, -0.045, 0.854]} scale={[0.065, 0.045, 0.03]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshToonMaterial color="#9b5f68" />
        </mesh>
        {bostezando || bocado ? (
          <mesh position={[0, -0.24, 0.9]} scale={[0.1, 0.13, 0.06]}>
            <sphereGeometry args={[1, 16, 14]} />
            <meshToonMaterial color="#6a3a46" />
          </mesh>
        ) : (
          <CurvaSuave puntos={puntosBoca} color="#805860" grosor={0.016} />
        )}
        {bocado && (
          <group position={[0.02, -0.32, 0.86]} rotation={[0.2, 0, 0.1]}>
            <ComidaEnBoca
              modelo={bocado}
              escala={
                bocadoInicio.current === null
                  ? 1
                  : Math.max(0.15, 1 - Math.min(1, (performance.now() - bocadoInicio.current) / 1000 / 1.2))
              }
            />
          </group>
        )}
        {especie.etapa === "anciano" && (
          <group position={[0, 0.22, 0.77]}>
            <mesh position={[-0.3, 0, 0]}>
              <torusGeometry args={[0.16, 0.018, 10, 24]} />
              <meshToonMaterial color="#c29b68" />
            </mesh>
            <mesh position={[0.3, 0, 0]}>
              <torusGeometry args={[0.16, 0.018, 10, 24]} />
              <meshToonMaterial color="#c29b68" />
            </mesh>
            <mesh position={[0, 0.04, 0]} scale={[0.15, 0.018, 0.018]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshToonMaterial color="#c29b68" />
            </mesh>
          </group>
        )}
        {especie.etapa === "adulto" && (
          <group position={[0, 0.88, 0.38]} scale={0.16}>
            <mesh>
              <sphereGeometry args={[1, 16, 14]} />
              <meshToonMaterial color="#fff4c2" />
            </mesh>
            <mesh position={[0, 0.45, 0]} scale={[0.4, 0.7, 0.4]}>
              <coneGeometry args={[1, 1, 12]} />
              <meshToonMaterial color={especie.acento} />
            </mesh>
          </group>
        )}
        {especie.etapa === "adolescente" && (
          <mesh position={[0.46, 0.86, 0.12]} rotation={[0, 0, 0.3]} scale={[0.12, 0.24, 0.08]}>
            <sphereGeometry args={[1, 14, 12]} />
            <meshToonMaterial color={especie.acento} />
          </mesh>
        )}
        {colorGorro && (
          <group position={[0, 0.93, 0.13]} rotation={[0.05, 0, -0.08]}>
            <mesh position={[0, 0.12, 0]} scale={[0.55, 0.29, 0.3]}>
              <sphereGeometry args={[1, 24, 18]} />
              <meshToonMaterial color={colorGorro} />
            </mesh>
            <mesh position={[0, -0.08, 0.06]} scale={[0.59, 0.08, 0.32]}>
              <sphereGeometry args={[1, 24, 16]} />
              <meshToonMaterial color="#fff0d7" />
            </mesh>
            <mesh position={[0.12, 0.23, 0.22]} scale={0.08}>
              <sphereGeometry args={[1, 12, 10]} />
              <meshToonMaterial color="#fff5d5" />
            </mesh>
          </group>
        )}
      </group>
      <mesh position={[-0.43, -0.78, 0.1]} scale={[0.25, 0.12, 0.24]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshToonMaterial color={especie.acento} />
      </mesh>
      <mesh position={[0.43, -0.78, 0.1]} scale={[0.25, 0.12, 0.24]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshToonMaterial color={especie.acento} />
      </mesh>
    </group>
  );
}


