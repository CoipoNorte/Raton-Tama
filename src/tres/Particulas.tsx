import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { suscribirEfectos } from "./emisorEfectos";
import type { SolicitudEfecto, TipoEfecto } from "./emisorEfectos";

interface Props {
  /** Polvo de luz ambiental del diorama. */
  polvo: boolean;
  /** Se congela con prefers-reduced-motion: los brotes duran poco y no orbitan. */
  movimientoReducido: boolean;
}

interface Particula {
  viva: boolean;
  edad: number;
  vida: number;
  posicion: THREE.Vector3;
  velocidad: THREE.Vector3;
  escala: number;
  giro: number;
  canal: 0 | 1 | 2;
}

const TOTAL = 78;
const GRUPOS = { corazon: 0, burbuja: 1, destello: 2 } as const;

function canalDe(tipo: TipoEfecto): 0 | 1 | 2 {
  if (tipo === "corazon") return GRUPOS.corazon;
  if (tipo === "burbuja" || tipo === "gota") return GRUPOS.burbuja;
  return GRUPOS.destello;
}

/** Corazón dibujado con una Shape: sin texturas ni modelos externos. */
function crearGeometriaCorazon(): THREE.BufferGeometry {
  const forma = new THREE.Shape();
  forma.moveTo(0, -0.42);
  forma.bezierCurveTo(-0.72, 0.12, -0.42, 0.62, 0, 0.3);
  forma.bezierCurveTo(0.42, 0.62, 0.72, 0.12, 0, -0.42);
  const geometria = new THREE.ShapeGeometry(forma, 8);
  geometria.center();
  return geometria;
}

export default function Particulas({ polvo, movimientoReducido }: Props) {
  const corazones = useRef<THREE.InstancedMesh>(null);
  const burbujas = useRef<THREE.InstancedMesh>(null);
  const destellos = useRef<THREE.InstancedMesh>(null);
  const polvoRef = useRef<THREE.Points>(null);

  const particulas = useMemo<Particula[]>(
    () =>
      Array.from({ length: TOTAL }, () => ({
        viva: false,
        edad: 0,
        vida: 1,
        posicion: new THREE.Vector3(),
        velocidad: new THREE.Vector3(),
        escala: 1,
        giro: 0,
        canal: 1 as 0 | 1 | 2
      })),
    []
  );
  const cursor = useRef(0);
  const geometrias = useMemo(
    () => ({
      corazon: crearGeometriaCorazon(),
      burbuja: new THREE.SphereGeometry(0.075, 10, 8),
      destello: new THREE.OctahedronGeometry(0.075, 0),
      polvo: new THREE.SphereGeometry(0.03, 6, 5)
    }),
    []
  );
  const materiales = useMemo(
    () => ({
      corazon: new THREE.MeshBasicMaterial({ color: "#ef8fa4", side: THREE.DoubleSide, transparent: true, opacity: 0.92, depthWrite: false }),
      burbuja: new THREE.MeshBasicMaterial({ color: "#dff6f2", transparent: true, opacity: 0.72, depthWrite: false }),
      destello: new THREE.MeshBasicMaterial({ color: "#f6d78d", transparent: true, opacity: 0.95, depthWrite: false })
    }),
    []
  );
  const auxiliar = useMemo(() => new THREE.Object3D(), []);
  const colorAgua = useMemo(() => new THREE.Color("#a8d8e8"), []);
  const colorJabon = useMemo(() => new THREE.Color("#f2fffb"), []);
  const colorMigaja = useMemo(() => new THREE.Color("#e7c79a"), []);
  const colorDestello = useMemo(() => new THREE.Color("#fff2c0"), []);

  const posicionesPolvo = useMemo(() => {
    const valores = new Float32Array(16 * 3);
    for (let indice = 0; indice < 16; indice += 1) {
      valores[indice * 3] = Math.sin(indice * 2.7) * 2.2;
      valores[indice * 3 + 1] = -0.9 + (indice % 6) * 0.46;
      valores[indice * 3 + 2] = -0.9 + Math.cos(indice * 1.9) * 1.1;
    }
    return valores;
  }, []);
  const geometriaPolvo = useMemo(() => {
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicionesPolvo.slice(), 3));
    return geometria;
  }, [posicionesPolvo]);

  // Suscripción al bus de efectos: reutiliza partículas libres (anillo circular).
  useEffect(() => {
    const lanzar = (solicitud: SolicitudEfecto) => {
      const cantidad = Math.min(12, Math.max(1, solicitud.cantidad ?? 4));
      const fuerza = solicitud.fuerza ?? 1;
      for (let indice = 0; indice < cantidad; indice += 1) {
        const particula = particulas[cursor.current % TOTAL];
        cursor.current = (cursor.current + 1) % TOTAL;
        particula.viva = true;
        particula.edad = 0;
        particula.canal = canalDe(solicitud.tipo);
        particula.vida = solicitud.tipo === "corazon" ? 1.5 : solicitud.tipo === "gota" ? 0.9 : 1.15;
        particula.escala = 0.75 + Math.random() * 0.6;
        particula.giro = Math.random() * Math.PI;
        particula.posicion.set(
          solicitud.x + (Math.random() - 0.5) * 0.22,
          solicitud.y + (Math.random() - 0.5) * 0.16,
          solicitud.z + (Math.random() - 0.5) * 0.12
        );
        const angulo = Math.random() * Math.PI * 2;
        const empuje = (0.28 + Math.random() * 0.42) * fuerza;
        particula.velocidad.set(
          Math.cos(angulo) * empuje * 0.7,
          solicitud.tipo === "gota" ? -0.5 - Math.random() * 0.5 : 0.6 + Math.random() * 0.8,
          Math.sin(angulo) * empuje * 0.35 + 0.25
        );
        if (movimientoReducido) particula.vida *= 0.6;
      }
    };
    return suscribirEfectos(lanzar);
  }, [movimientoReducido, particulas]);

  useEffect(
    () => () => {
      geometrias.corazon.dispose();
      geometrias.burbuja.dispose();
      geometrias.destello.dispose();
      geometrias.polvo.dispose();
      geometriaPolvo.dispose();
      Object.values(materiales).forEach((material) => material.dispose());
    },
    [geometrias, geometriaPolvo, materiales]
  );

  useFrame((state, delta) => {
    const paso = Math.min(0.05, delta);
    const mallas = [corazones.current, burbujas.current, destellos.current];
    if (mallas.every((malla) => !malla)) return;

    for (let indice = 0; indice < TOTAL; indice += 1) {
      const particula = particulas[indice];
      const malla = mallas[particula.canal];
      if (!particula.viva) {
        if (malla) {
          auxiliar.position.set(0, -99, 0);
          auxiliar.scale.setScalar(0);
          auxiliar.updateMatrix();
          malla.setMatrixAt(indice, auxiliar.matrix);
        }
        continue;
      }
      particula.edad += paso;
      const t = particula.edad / particula.vida;
      if (t >= 1) {
        particula.viva = false;
        if (malla) {
          auxiliar.scale.setScalar(0);
          auxiliar.position.set(0, -99, 0);
          auxiliar.updateMatrix();
          malla.setMatrixAt(indice, auxiliar.matrix);
        }
        continue;
      }
      // Flotación + gravedad suave: los corazones suben, las gotas caen.
      particula.velocidad.y += (particula.canal === 1 ? 0.9 : 0.55) * paso;
      particula.velocidad.multiplyScalar(0.985);
      particula.posicion.addScaledVector(particula.velocidad, paso);
      particula.giro += paso * (particula.canal === 2 ? 3.4 : 1.1);

      const encogido = 1 - t * t * 0.85;
      if (malla) {
        auxiliar.position.copy(particula.posicion);
        auxiliar.rotation.set(particula.giro * 0.6, particula.giro, 0);
        auxiliar.scale.setScalar(Math.max(0.001, particula.escala * encogido));
        auxiliar.updateMatrix();
        malla.setMatrixAt(indice, auxiliar.matrix);
        if (particula.canal === 1) malla.setColorAt(indice, particula.escala > 1.05 ? colorAgua : colorJabon);
        if (particula.canal === 2) malla.setColorAt(indice, t > 0.72 ? colorMigaja : colorDestello);
      }
    }

    for (const malla of mallas) {
      if (!malla) continue;
      malla.instanceMatrix.needsUpdate = true;
      if (malla.instanceColor) malla.instanceColor.needsUpdate = true;
    }

    if (polvo && polvoRef.current && !movimientoReducido) {
      const atributo = polvoRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let indice = 0; indice < atributo.count; indice += 1) {
        const baseY = posicionesPolvo[indice * 3 + 1];
        atributo.setY(indice, baseY + Math.sin(state.clock.elapsedTime * 0.45 + indice) * 0.09);
      }
      atributo.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={corazones} args={[geometrias.corazon, materiales.corazon, TOTAL]} frustumCulled={false} />
      <instancedMesh ref={burbujas} args={[geometrias.burbuja, materiales.burbuja, TOTAL]} frustumCulled={false} />
      <instancedMesh ref={destellos} args={[geometrias.destello, materiales.destello, TOTAL]} frustumCulled={false} />
      {polvo && (
        <points ref={polvoRef} geometry={geometriaPolvo}>
          <pointsMaterial color="#fff6d8" size={0.05} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
        </points>
      )}
    </group>
  );
}
