import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ObjetoJuego } from "../game/types";

const brillos = [
  [-2.05, 1.28, -1.54], [-1.42, 0.62, -1.54], [-0.74, 1.43, -1.54], [0.7, 1.34, -1.54],
  [1.72, 0.84, -1.54], [2.16, 1.48, -1.54], [-1.92, 0.06, -1.54], [1.36, 1.52, -1.54]
] as const;

function DestellosPared() {
  const referencia = useRef<THREE.InstancedMesh>(null);
  const geometria = useMemo(() => new THREE.SphereGeometry(0.035, 8, 8), []);
  const material = useMemo(() => new THREE.MeshToonMaterial({ color: "#fff5d6" }), []);

  useEffect(() => {
    if (!referencia.current) return;
    const objeto = new THREE.Object3D();
    brillos.forEach(([x, y, z], indice) => {
      objeto.position.set(x, y, z);
      objeto.scale.setScalar(indice % 3 === 0 ? 1.4 : 0.8);
      objeto.updateMatrix();
      referencia.current?.setMatrixAt(indice, objeto.matrix);
    });
    referencia.current.instanceMatrix.needsUpdate = true;
  }, []);

  return <instancedMesh ref={referencia} args={[geometria, material, brillos.length]} />;
}

// Posiciones fijas en el suelo: al ser siempre las mismas, se memorizan una vez.
const montones = [
  { base: [-1.02, -1.06, 0.74] as const, punta: [-1.02, -0.94, 0.74] as const, escala: 1 },
  { base: [1.14, -1.06, 0.52] as const, punta: [1.14, -0.95, 0.52] as const, escala: 0.85 },
  { base: [0.04, -1.06, 1.02] as const, punta: [0.04, -0.95, 1.02] as const, escala: 0.92 }
];

// Caca procedencial con instanciado: dos esferas por montón, una sola draw call.
function Suciedad({ cantidad }: { cantidad: number }) {
  const referencia = useRef<THREE.InstancedMesh>(null);
  const geometria = useMemo(() => new THREE.SphereGeometry(0.17, 14, 12), []);
  const material = useMemo(() => new THREE.MeshToonMaterial({ color: "#a97a5c" }), []);

  useEffect(() => {
    if (!referencia.current) return;
    const auxiliar = new THREE.Object3D();
    montones.forEach((monton, indice) => {
      const visible = indice < cantidad;
      auxiliar.position.set(monton.base[0], monton.base[1], monton.base[2]);
      // Algo invisible debe tener escala cero en los tres ejes: si solo Y es 0,
      // se renderiza un pancake plano (los tres óvalos marrones del huevo).
      auxiliar.scale.set(visible ? monton.escala * 1.15 : 0, visible ? monton.escala * 0.7 : 0, visible ? monton.escala * 1.15 : 0);
      auxiliar.updateMatrix();
      referencia.current?.setMatrixAt(indice * 2, auxiliar.matrix);
      auxiliar.position.set(monton.punta[0], monton.punta[1], monton.punta[2]);
      auxiliar.scale.setScalar(visible ? monton.escala * 0.62 : 0);
      auxiliar.updateMatrix();
      referencia.current?.setMatrixAt(indice * 2 + 1, auxiliar.matrix);
    });
    referencia.current.instanceMatrix.needsUpdate = true;
  }, [cantidad]);

  return <instancedMesh ref={referencia} args={[geometria, material, montones.length * 2]} />;
}

function Mueble({ objeto }: { objeto: ObjetoJuego }) {
  if (objeto.modelo === "planta") {
    return (
      <group position={[-1.9, -0.8, -0.05]}>
        <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.24, 0.29, 0.48, 18]} /><meshToonMaterial color="#e9aa91" /></mesh>
        <mesh position={[0, 0.26, 0]}><cylinderGeometry args={[0.29, 0.29, 0.08, 18]} /><meshToonMaterial color="#c98072" /></mesh>
        <mesh position={[0, 0.62, 0]} scale={[0.15, 0.41, 0.14]}><sphereGeometry args={[1, 14, 12]} /><meshToonMaterial color={objeto.color} /></mesh>
        <mesh position={[-0.24, 0.48, 0]} rotation={[0, 0, -0.65]} scale={[0.13, 0.28, 0.1]}><sphereGeometry args={[1, 14, 12]} /><meshToonMaterial color="#9bc99e" /></mesh>
        <mesh position={[0.25, 0.56, 0]} rotation={[0, 0, 0.6]} scale={[0.13, 0.29, 0.1]}><sphereGeometry args={[1, 14, 12]} /><meshToonMaterial color="#8fb991" /></mesh>
      </group>
    );
  }
  if (objeto.modelo === "pelota") {
    return <mesh position={[1.74, -0.86, 0.18]} rotation={[0.2, 0.2, 0.2]}><sphereGeometry args={[0.27, 22, 18]} /><meshToonMaterial color={objeto.color} /></mesh>;
  }
  if (objeto.modelo === "lampara") {
    return (
      <group position={[1.95, -0.5, -0.42]}>
        <mesh position={[0, -0.38, 0]}><cylinderGeometry args={[0.31, 0.34, 0.16, 20]} /><meshToonMaterial color="#d6a982" /></mesh>
        <mesh position={[0, -0.04, 0]}><cylinderGeometry args={[0.065, 0.075, 0.58, 12]} /><meshToonMaterial color="#d3a477" /></mesh>
        <mesh position={[0, 0.33, 0]} scale={[0.34, 0.24, 0.34]}><sphereGeometry args={[1, 18, 14]} /><meshToonMaterial color={objeto.color} /></mesh>
      </group>
    );
  }
  if (objeto.modelo === "cojin") {
    return <mesh position={[-1.45, -0.96, 0.2]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.58, 0.5, 0.13]}><sphereGeometry args={[1, 22, 16]} /><meshToonMaterial color={objeto.color} /></mesh>;
  }
  return null;
}

export default function Habitacion({ objetos, suciedad }: { objetos: ObjetoJuego[]; suciedad: number }) {
  return (
    <group>
      <mesh position={[0, -1.35, 0]} receiveShadow>
        <boxGeometry args={[5.62, 0.2, 3.75]} /><meshToonMaterial color="#bc8d70" />
      </mesh>
      <mesh position={[0, -1.22, 0]} receiveShadow>
        <boxGeometry args={[5.42, 0.16, 3.56]} /><meshToonMaterial color="#e1bd98" />
      </mesh>
      <mesh position={[0, 0.3, -1.78]}>
        <boxGeometry args={[5.42, 3.0, 0.18]} /><meshToonMaterial color="#d9eee3" />
      </mesh>
      <mesh position={[-2.7, 0.3, 0]} rotation={[0, 0.14, 0]}>
        <boxGeometry args={[0.18, 3.0, 3.6]} /><meshToonMaterial color="#c8e3d9" />
      </mesh>
      <mesh position={[0, -1.115, 0.15]}>
        <cylinderGeometry args={[1.64, 1.64, 0.035, 48]} /><meshToonMaterial color="#e7b6b5" />
      </mesh>
      <group position={[-1.28, 0.75, -1.64]}>
        <mesh><boxGeometry args={[1.28, 1.12, 0.12]} /><meshToonMaterial color="#f5ead8" /></mesh>
        <mesh position={[0, 0, 0.08]}><boxGeometry args={[1.08, 0.92, 0.035]} /><meshToonMaterial color="#b9e0e2" /></mesh>
        <mesh position={[0, 0, 0.11]}><boxGeometry args={[0.06, 0.92, 0.025]} /><meshToonMaterial color="#f5ead8" /></mesh>
        <mesh position={[0, 0, 0.11]}><boxGeometry args={[1.08, 0.06, 0.025]} /><meshToonMaterial color="#f5ead8" /></mesh>
        <mesh position={[-0.73, 0, -0.02]} rotation={[0, 0, -0.15]}><boxGeometry args={[0.12, 1.25, 0.13]} /><meshToonMaterial color="#e3b9b0" /></mesh>
        <mesh position={[0.73, 0, -0.02]} rotation={[0, 0, 0.15]}><boxGeometry args={[0.12, 1.25, 0.13]} /><meshToonMaterial color="#e3b9b0" /></mesh>
      </group>
      <mesh position={[0.92, 0.56, -1.59]}>
        <boxGeometry args={[1.55, 0.13, 0.28]} /><meshToonMaterial color="#c99e7a" />
      </mesh>
      <DestellosPared />
      <Suciedad cantidad={suciedad} />
      {objetos.filter((objeto) => objeto.modelo !== "gorrito").map((objeto) => <Mueble key={objeto.id} objeto={objeto} />)}
    </group>
  );
}