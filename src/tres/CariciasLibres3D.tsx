import { useCallback, useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { BALANCE } from "../game/balance";
import { sonar } from "../game/sound";
import { emitirEfecto } from "./emisorEfectos";
import type { EstadoCriatura } from "./estadoCriatura";

interface Props {
  estado: EstadoCriatura;
  activo: boolean;
  onAcariciar: () => void;
  onMirar: () => void;
}

const RX = 0.91;
const RY = 0.96;
const CY = 0.03;
const { caricias } = BALANCE.cuidados;

function sobreElCuerpo(u: number, v: number): boolean {
  return u * u + v * v <= 0.84;
}

/**
 * Caricias libres: sin panel ni progreso. Tocar el diorama llama la atención
 * de Mochi (mira al punto); arrastrar por su pelaje suelta 1–3 corazones por
 * roce y sube el vínculo, con una ráfaga de 5 cada 7 zonas nuevas.
 */
export default function CariciasLibres3D({ estado, activo, onAcariciar, onMirar }: Props) {
  const { camera, gl } = useThree();
  const grupoRef = useRef<THREE.Group>(null);
  const gestoRef = useRef<{ id: number; inicioX: number; inicioY: number; movido: boolean; fin: () => void } | null>(null);
  const zonasRef = useRef<Set<string>>(new Set());
  const ultimoMimoRef = useRef(0);
  const ultimoToqueRef = useRef(0);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plano = useMemo(() => new THREE.Plane(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const centro = useMemo(() => new THREE.Vector3(), []);
  const golpe = useMemo(() => new THREE.Vector3(), []);
  const local = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);

  const aLocal = useCallback(
    (clientX: number, clientY: number) => {
      const grupo = grupoRef.current;
      if (!grupo) return null;
      const caja = gl.domElement.getBoundingClientRect();
      if (caja.width <= 0 || caja.height <= 0) return null;
      ndc.set(((clientX - caja.left) / caja.width) * 2 - 1, -(((clientY - caja.top) / caja.height) * 2 - 1));
      raycaster.setFromCamera(ndc, camera);
      camera.getWorldDirection(normal);
      centro.copy(grupo.getWorldPosition(centro));
      plano.setFromNormalAndCoplanarPoint(normal, centro);
      if (!raycaster.ray.intersectPlane(plano, golpe)) return null;
      return grupo.worldToLocal(local.copy(golpe));
    },
    [camera, centro, golpe, gl, local, ndc, normal, plano, raycaster]
  );

  const marcarToqueMascota = useCallback(() => {
    // La vista usa esta marca para no girar la cámara cuando el gesto nació en Mochi.
    const stage = document.querySelector<HTMLElement>("[data-testid='game-stage']");
    if (stage) stage.dataset.toqueMascota = String(Date.now());
  }, []);

  const terminar = useCallback(() => {
    gestoRef.current?.fin();
    gestoRef.current = null;
  }, []);

  useEffect(() => {
    if (!activo) {
      terminar();
      zonasRef.current = new Set<string>();
    }
  }, [activo, terminar]);

  // Zonas del pelaje en pantalla: la misma fuente para jugar y para probar.
  useEffect(() => {
    if (!activo) return;
    const stage = document.querySelector<HTMLElement>("[data-testid='game-stage']");
    const grupo = grupoRef.current;
    if (!stage || !grupo) return;
    const caja = gl.domElement.getBoundingClientRect();
    if (caja.width <= 0) return;
    const zonas: Array<{ x: number; y: number }> = [];
    const rejilla = caricias.rejilla;
    for (let fila = 0; fila < rejilla; fila += 1) {
      for (let columna = 0; columna < rejilla; columna += 1) {
        const u = -0.82 + ((columna + 0.5) / rejilla) * 1.64;
        const v = -0.82 + ((fila + 0.5) / rejilla) * 1.64;
        if (!sobreElCuerpo(u, v)) continue;
        const interior = Math.max(0.04, 1 - u * u - v * v);
        const mundo = grupo.localToWorld(new THREE.Vector3(u * RX, CY + v * RY, 0.82 * Math.sqrt(interior) + 0.16)).project(camera);
        zonas.push({
          x: Math.round(caja.left + ((mundo.x + 1) / 2) * caja.width),
          y: Math.round(caja.top + ((1 - mundo.y) / 2) * caja.height)
        });
      }
    }
    stage.setAttribute("data-care-libre", JSON.stringify(zonas));
    return () => {
      stage.removeAttribute("data-care-libre");
    };
  }, [activo, camera, gl]);

  const aplicar = useCallback(
    (clientX: number, clientY: number) => {
      const punto = aLocal(clientX, clientY);
      if (!punto) return;
      const u = punto.x / RX;
      const v = (punto.y - CY) / RY;
      estado.mirar = { x: punto.x, y: punto.y, z: punto.z };
      if (!sobreElCuerpo(u, v)) return;
      marcarToqueMascota();
      const ahora = performance.now();
      const clave = `${Math.round(u * 2.4)}:${Math.round(v * 2.4)}`;
      if (zonasRef.current.has(clave) || ahora - ultimoMimoRef.current < caricias.intervaloSuaveMs) return;
      zonasRef.current.add(clave);
      ultimoMimoRef.current = ahora;
      sonar("mimo");
      emitirEfecto({
        tipo: "corazon",
        x: u * RX,
        y: CY + v * RY,
        z: 0.72,
        cantidad: 1 + Math.floor(Math.random() * 3),
        fuerza: 0.9 + Math.random() * 0.4
      });
      estado.feliz = 1;
      estado.saltar = Math.max(estado.saltar, 0.4);
      onAcariciar();
      if (zonasRef.current.size % caricias.rafagaCada === 0) {
        for (let indice = 0; indice < 5; indice += 1) {
          const angulo = (indice / 5) * Math.PI * 2 - Math.PI / 2;
          emitirEfecto({
            tipo: "corazon",
            x: Math.cos(angulo) * 0.85,
            y: CY + Math.sin(angulo) * 0.95,
            z: 0.75,
            cantidad: 1,
            fuerza: 1.25
          });
        }
        estado.saltar = 1;
      }
    },
    [aLocal, estado, marcarToqueMascota, onAcariciar]
  );

  const iniciar = useCallback(
    (evento: ThreeEvent<PointerEvent>, enCuerpo: boolean) => {
      if (!activo || gestoRef.current) return;
      // Sobre el cuerpo reservamos el gesto para la caricia. En el fondo dejamos
      // que también llegue a GameScreen: si se desliza, gira la cámara.
      if (enCuerpo) evento.stopPropagation();
      const id = evento.pointerId;
      const inicioX = evento.nativeEvent.clientX;
      const inicioY = evento.nativeEvent.clientY;
      if (enCuerpo) marcarToqueMascota();
      const mover = (ev: PointerEvent) => {
        const gesto = gestoRef.current;
        if (!gesto || ev.pointerId !== id) return;
        ev.preventDefault();
        if (Math.hypot(ev.clientX - gesto.inicioX, ev.clientY - gesto.inicioY) > 9) gesto.movido = true;
        aplicar(ev.clientX, ev.clientY);
      };
      const cerrar = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        const gesto = gestoRef.current;
        terminar();
        // Toque corto sin arrastre: solo llama su atención hacia el punto.
        if (gesto && !gesto.movido && performance.now() - ultimoToqueRef.current > 500) {
          ultimoToqueRef.current = performance.now();
          const punto = aLocal(ev.clientX, ev.clientY);
          if (punto) estado.mirar = { x: punto.x, y: punto.y, z: punto.z };
          estado.feliz = Math.max(estado.feliz, 0.5);
          sonar("toque");
          onMirar();
        }
      };
      window.addEventListener("pointermove", mover, { passive: false });
      window.addEventListener("pointerup", cerrar);
      window.addEventListener("pointercancel", cerrar);
      gestoRef.current = {
        id,
        inicioX,
        inicioY,
        movido: false,
        fin: () => {
          window.removeEventListener("pointermove", mover);
          window.removeEventListener("pointerup", cerrar);
          window.removeEventListener("pointercancel", cerrar);
        }
      };
      // No acariciamos en pointerdown: un toque corto solo llama su atención.
      if (!enCuerpo) {
        const punto = aLocal(inicioX, inicioY);
        if (punto) estado.mirar = { x: punto.x, y: punto.y, z: punto.z };
      }
    },
    [activo, aplicar, aLocal, estado, marcarToqueMascota, onMirar, terminar]
  );

  if (!activo) return null;

  return (
    <group ref={grupoRef}>
      {/* Fondo sensible: tocar el diorama llama la atención de Mochi. */}
      <mesh
        position={[0, 0.35, -0.95]}
        onPointerDown={(evento) => iniciar(evento, false)}
        onPointerOver={() => {
          gl.domElement.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = "";
        }}
      >
        <planeGeometry args={[5.2, 3.4]} />
        <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
      </mesh>
      {/* Pelaje sensible: arrastrar por aquí suelta corazones. */}
      <mesh
        position={[0, CY, 0.12]}
        scale={[RX * 1.08, RY * 1.08, 0.72]}
        onPointerDown={(evento) => iniciar(evento, true)}
        onPointerOver={() => {
          gl.domElement.style.cursor = "grab";
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = "";
        }}
      >
        <sphereGeometry args={[1, 20, 16]} />
        <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
