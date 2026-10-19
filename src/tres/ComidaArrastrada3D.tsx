import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ArrastreComida } from "../game/types";

function ModeloProcedural({ tipo }: { tipo: ArrastreComida["modelo"] }) {
  if (tipo === "fruta") {
    return (
      <group>
        <mesh castShadow>
          <sphereGeometry args={[0.19, 20, 16]} />
          <meshPhysicalMaterial color="#e05e77" roughness={0.22} clearcoat={0.95} />
        </mesh>
        <mesh position={[0, 0.19, 0]} rotation={[0.2, 0, -0.25]}>
          <coneGeometry args={[0.055, 0.16, 8]} />
          <meshToonMaterial color="#69a47b" />
        </mesh>
        <mesh position={[-0.05, 0.05, 0.155]}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshBasicMaterial color="#fff6dc" />
        </mesh>
      </group>
    );
  }
  if (tipo === "bebida") {
    return (
      <group>
        <mesh position={[0, -0.02, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.3, 18]} />
          <meshPhysicalMaterial color="#b9ddc0" roughness={0.19} clearcoat={0.95} transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.145, 0.145, 0.045, 18]} />
          <meshToonMaterial color="#f9f1d8" />
        </mesh>
        <mesh position={[0.03, 0.25, 0]} rotation={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.018, 0.018, 0.2, 8]} />
          <meshToonMaterial color="#e994a8" />
        </mesh>
        <mesh position={[-0.05, 0.04, 0.11]}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshBasicMaterial color="#fffdf0" />
        </mesh>
      </group>
    );
  }
  if (tipo === "pastel") {
    return (
      <group>
        <mesh castShadow>
          <sphereGeometry args={[0.17, 20, 16]} />
          <meshPhysicalMaterial color="#f2b9c9" roughness={0.28} clearcoat={0.75} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <sphereGeometry args={[0.065, 14, 10]} />
          <meshToonMaterial color="#fff4df" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshToonMaterial color="#e96f84" />
        </mesh>
      </group>
    );
  }
  if (tipo === "queso") {
    return (
      <group rotation={[0, 0, -0.08]}>
        <mesh castShadow>
          <coneGeometry args={[0.24, 0.28, 4, 1]} />
          <meshPhysicalMaterial color="#f2ca65" roughness={0.3} clearcoat={0.62} />
        </mesh>
        <mesh position={[-0.07, -0.06, 0.11]} scale={0.035}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshToonMaterial color="#d99c49" />
        </mesh>
        <mesh position={[0.08, 0.025, 0.13]} scale={0.026}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshToonMaterial color="#d99c49" />
        </mesh>
      </group>
    );
  }
  return (
    <group rotation={[0.05, 0, 0]}>
      <mesh castShadow>
        <coneGeometry args={[0.24, 0.3, 4]} />
        <meshPhysicalMaterial color="#fffdf5" roughness={0.28} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, -0.08, 0.105]}>
        <boxGeometry args={[0.17, 0.12, 0.024]} />
        <meshToonMaterial color="#457a60" />
      </mesh>
      <mesh position={[-0.04, 0.09, 0.1]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
    </group>
  );
}

/** La comida arrastrada es una malla con volumen que sigue el puntero en el espacio 3D. */
export default function ComidaArrastrada3D({ comida }: { comida: ArrastreComida }) {
  const { camera, gl } = useThree();
  const ref = useRef<THREE.Group>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const plano = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.4), []);
  const punto = useMemo(() => new THREE.Vector3(), []);
  const escalaObjetivo = useRef(1.18);
  const rotacion = useRef(0);

  useFrame((_, delta) => {
    const grupo = ref.current;
    if (!grupo) return;
    const caja = gl.domElement.getBoundingClientRect();
    if (caja.width <= 0 || caja.height <= 0) return;
    ndc.set(((comida.x - caja.left) / caja.width) * 2 - 1, -(((comida.y - caja.top) / caja.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(plano, punto)) {
      grupo.position.lerp(punto, Math.min(1, delta * 22));
    }
    rotacion.current += delta * 2.1;
    grupo.rotation.set(-0.1, rotacion.current, Math.sin(rotacion.current * 0.5) * 0.08);
    const escala = THREE.MathUtils.damp(grupo.scale.x, escalaObjetivo.current, 12, delta);
    grupo.scale.setScalar(escala);
  });

  useEffect(() => {
    escalaObjetivo.current = 1.18;
  }, [comida.modelo]);

  return (
    <group ref={ref} position={[0, 0, 1.4]} scale={1.18}>
      <ModeloProcedural tipo={comida.modelo} />
      <pointLight color="#fff3d5" intensity={0.32} distance={1.2} decay={2} />
    </group>
  );
}