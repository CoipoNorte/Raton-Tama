import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { BALANCE } from "../game/balance";
import { sonar } from "../game/sound";
import { emitirEfecto } from "./emisorEfectos";
import type { AccionCuidado } from "../game/cuidados";
import type { TipoJuguete } from "../components/SelectorJuguete";
import type { EstadoCriatura } from "./estadoCriatura";

interface Props {
  accion: AccionCuidado;
  fase: number;
  juguete: TipoJuguete;
  estado: EstadoCriatura;
  onProgreso: (progreso: number, fase: number) => void;
  onFase: (fase: number) => void;
  onCompletar: () => void;
}

interface Mancha {
  u: number;
  v: number;
  suciedad: number;
  espuma: number;
  mojado: number;
  frotadasJabon: number;
  pasadasAgua: number;
  pasadasToalla: number;
  ultimoFroteMs: number;
}

// Aro guía que marca exactamente dónde está la herramienta a usar.
interface AroGuiaProps {
  centro: [number, number, number];
  color: string;
  pulsando: boolean;
}
const AroGuia = forwardRef<THREE.Mesh, AroGuiaProps>(function AroGuia(props, referencia) {
  const { centro, color, pulsando } = props;
  return (
    <mesh ref={referencia} position={centro}>
      <torusGeometry args={[0.44, 0.024, 7, 30]} />
      <meshBasicMaterial color={color} transparent opacity={pulsando ? 0.95 : 0.75} depthWrite={false} />
      {pulsando && (
        // Flechita vertical que cae sobre la herramienta: localízala al instante.
        <mesh position={[0, 0.72, 0]} rotation={[Math.PI, 0, Math.PI / 4]}>
          <coneGeometry args={[0.13, 0.3, 4]} />
          <meshBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} />
        </mesh>
      )}
    </mesh>
  );
});

const { limpieza, juegoPelota, juegoPalo, cura } = BALANCE.cuidados;
const RX = 0.91;
const RY = 0.96;
const CY = 0.03;
const RZ = 0.82;
const SUELO = -1.09;
const LIMITE_Z = 1.18;
const OBJETIVO_CURA = { u: 0.42, v: -0.18 };

function crearEstrellaExtrudida(): THREE.BufferGeometry {
  const forma = new THREE.Shape();
  for (let indice = 0; indice < 10; indice += 1) {
    const angulo = -Math.PI / 2 + (indice / 10) * Math.PI * 2;
    const radio = indice % 2 === 0 ? 0.36 : 0.16;
    const x = Math.cos(angulo) * radio;
    const y = Math.sin(angulo) * radio;
    if (indice === 0) forma.moveTo(x, y);
    else forma.lineTo(x, y);
  }
  forma.closePath();
  const geometria = new THREE.ExtrudeGeometry(forma, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    curveSegments: 3
  });
  geometria.center();
  return geometria;
}

function superficie(u: number, v: number, separacion = 0.05): THREE.Vector3 {
  const interior = Math.max(0.04, 1 - u * u - v * v);
  return new THREE.Vector3(u * RX, CY + v * RY, RZ * Math.sqrt(interior) + separacion);
}

function sobreElCuerpo(u: number, v: number): boolean {
  return u * u + v * v <= 0.84;
}

function celdasValidas(rejilla: number): Array<{ u: number; v: number }> {
  const salida: Array<{ u: number; v: number }> = [];
  for (let fila = 0; fila < rejilla; fila += 1) {
    for (let columna = 0; columna < rejilla; columna += 1) {
      const u = -0.82 + ((columna + 0.5) / rejilla) * 1.64;
      const v = -0.82 + ((fila + 0.5) / rejilla) * 1.64;
      if (sobreElCuerpo(u, v)) salida.push({ u, v });
    }
  }
  return salida;
}

/**
 * Dónde espera cada herramienta. Flotan a la altura de la mano (no en el suelo),
 * delante del diorama y con el aro guía justo debajo para localizarlas de un vistazo.
 */
function reposoHerramienta(accion: AccionCuidado, fase: number): THREE.Vector3 {
  if (fase < 0) return new THREE.Vector3();
  if (accion === "curar") return new THREE.Vector3(-1.42, SUELO + 0.62, 1.25);
  if (accion === "limpiar") {
    if (fase === 1) return new THREE.Vector3(1.46, SUELO + 0.66, 1.22);
    if (fase === 2) return new THREE.Vector3(1.4, SUELO + 0.56, 1.34);
    return new THREE.Vector3(-1.44, SUELO + 0.6, 1.28);
  }
  return new THREE.Vector3(1.5, SUELO + 0.62, 1.2);
}

let ultimoSonido = 0;
function sonidoJabon(efecto: "limpiar" | "agua" | "toalla"): void {
  const ahora = performance.now();
  if (ahora - ultimoSonido < 320) return;
  ultimoSonido = ahora;
  sonar(efecto);
}

/**
 * Cuidados jugables dentro del Canvas: la pelota rueda sola y Mochi la devuelve,
 * el baño es un ritual de tres pasos (jabón → agua → toalla) y la curita se
 * coloca sobre la marca. Las caricias viven fuera de los modos guiados.
 * valida sobre los mismos puntos 3D, así nunca hay divergencia entre vista y acción.
 */
export default function Interacciones3D({ accion, fase, juguete, estado, onProgreso, onFase, onCompletar }: Props) {
  const { camera, gl, size } = useThree();
  const grupoRef = useRef<THREE.Group>(null);
  const pelotaRef = useRef<THREE.Group>(null);
  const paloRef = useRef<THREE.Group>(null);
  const estrellaRef = useRef<THREE.Group>(null);
  const herramientaRef = useRef<THREE.Group>(null);
  const aroHerramientaRef = useRef<THREE.Mesh>(null);
  
  const arrastreRef = useRef<{ fin: () => void } | null>(null);
  const completadoRef = useRef(false);
  const contadoresRef = useRef({ pases: 0 });
  const pelotaFisica = useRef({
    pos: new THREE.Vector3(-1.4, SUELO + 0.6, 0.5),
    vel: new THREE.Vector3(1.15, 1.8, 0.2),
    ultimoBote: -9,
    ultimoPase: -9,
    ultimoGolpe: -9,
    cuadros: 0
  });

  const [manchas, setManchas] = useState<Mancha[]>([]);
  const manchasRef = useRef<Mancha[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [curitaLista, setCuritaLista] = useState(false);
  // Juguetes que controla el jugador: el palo lleva su pelota colgando de una
  // cuerda con masa y gravedad; la estrella se guía directa con el dedo.
  const manualRef = useRef({
    pos: new THREE.Vector3(-1.35, SUELO + 0.55, 0.55),
    objetivo: new THREE.Vector3(-1.35, SUELO + 0.55, 0.55),
    previa: new THREE.Vector3(-1.35, SUELO + 0.55, 0.55),
    bola: new THREE.Vector3(-1.1, SUELO + 0.1, 0.55),
    bolaVel: new THREE.Vector3(),
    manteniendo: false,
    ultimoContacto: -9,
    ultimoSuelo: -9,
    girando: 0
  });
  const paloVaraRef = useRef<THREE.Mesh>(null);
  const paloHiloRef = useRef<THREE.Mesh>(null);
  const paloBolaRef = useRef<THREE.Group>(null);
  const paloDirAux = useMemo(() => new THREE.Vector3(), []);
  const paloHiloAux = useMemo(() => new THREE.Vector3(), []);
  const paloPuntaAux = useMemo(() => new THREE.Vector3(), []);
  const paloArriba = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const punteroManualRef = useRef<number | null>(null);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plano = useMemo(() => new THREE.Plane(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const centro = useMemo(() => new THREE.Vector3(), []);
  const golpe = useMemo(() => new THREE.Vector3(), []);
  const local = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const geometriaEstrella = useMemo(crearEstrellaExtrudida, []);

  // Medio ancho visible en la profundidad de la herramienta: sin este cálculo,
  // en móviles verticales el reposo de las herramientas queda fuera del lienzo.
  const limiteVisibleX = useMemo(() => {
    const perspectiva = camera as THREE.PerspectiveCamera;
    const profundidad = Math.max(1, perspectiva.position.z - 1.4);
    const mediaAlto = Math.tan(THREE.MathUtils.degToRad(perspectiva.fov / 2)) * profundidad;
    const mediaAncho = mediaAlto * (size.width / Math.max(1, size.height));
    return Math.max(0.7, Math.min(1.62, mediaAncho * 0.56));
  }, [camera, size.width, size.height]);

  /** Reposo en coordenadas locales, siempre dentro del encuadre visible. */
  const reposoVisible = useCallback(
    (accionActual: AccionCuidado, faseActual: number) => {
      const base = reposoHerramienta(accionActual, faseActual);
      base.x = THREE.MathUtils.clamp(base.x, -limiteVisibleX, limiteVisibleX);
      base.y = Math.max(base.y, SUELO + 0.42);
      base.z = Math.min(base.z, 1.12);
      return base;
    },
    [limiteVisibleX]
  );
  const limitePelota = useMemo(() => Math.max(0.64, limiteVisibleX - juegoPelota.radio * 1.15), [limiteVisibleX]);

  /** Proyecta un punto local del grupo a coordenadas de pantalla. */
  const aPantalla = useCallback(
    (punto: { x: number; y: number; z: number }) => {
      const grupo = grupoRef.current;
      const caja = gl.domElement.getBoundingClientRect();
      if (!grupo || caja.width <= 0 || caja.height <= 0) return null;
      const mundo = grupo.localToWorld(new THREE.Vector3(punto.x, punto.y, punto.z)).project(camera);
      return {
        x: Math.round(caja.left + ((mundo.x + 1) / 2) * caja.width),
        y: Math.round(caja.top + ((1 - mundo.y) / 2) * caja.height)
      };
    },
    [camera, gl]
  );

  /** Inverso: pantalla → punto local sobre el plano que mira a cámara y pasa por Mochi. */
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

  // Se "usa y se suelta sola": la herramienta regresa y deja de seguir la mano.
  const soltarHerramienta = useCallback(() => {
    arrastreRef.current?.fin();
    arrastreRef.current = null;
    setArrastrando(false);
    const referencia = herramientaRef.current;
    if (referencia) {
      const reposo = reposoVisible(accion, fase);
      referencia.position.copy(reposo);
    }
  }, [accion, fase]);

  const completar = useCallback(() => {
    if (completadoRef.current) return;
    completadoRef.current = true;
    soltarHerramienta();
    onCompletar();
  }, [onCompletar, soltarHerramienta]);

  // Reinicio limpio al cambiar de acción: sin gestos ni contadores colgados.
  useEffect(() => {
    completadoRef.current = false;
    contadoresRef.current = { pases: 0 };
    setCuritaLista(false);
    setArrastrando(false);
    estado.mirar = null;
    estado.mojado = 0;
    if (accion === "limpiar") {
      const elegidas = [...celdasValidas(4)].sort(() => Math.random() - 0.5).slice(0, limpieza.manchas);
      const nuevas = elegidas.map((celda) => ({ u: celda.u, v: celda.v, suciedad: 1, espuma: 0, mojado: 0, frotadasJabon: 0, pasadasAgua: 0, pasadasToalla: 0, ultimoFroteMs: 0 }));
      manchasRef.current = nuevas;
      setManchas(nuevas);
    } else {
      manchasRef.current = [];
      setManchas([]);
    }
    if (accion === "jugar") {
      pelotaFisica.current.pos.set(-limitePelota * 0.82, SUELO + 0.6, 0.5);
      pelotaFisica.current.vel.set(1.15, 1.8, 0.2);
      const xInicial = -Math.min(1.35, limiteVisibleX * 0.72);
      manualRef.current.pos.set(xInicial, SUELO + 0.55, 0.72);
      manualRef.current.objetivo.copy(manualRef.current.pos);
      manualRef.current.previa.copy(manualRef.current.pos);
      manualRef.current.bola.set(-1.1, SUELO + 0.12, 0.72);
      manualRef.current.bolaVel.set(0, 0, 0);
      manualRef.current.manteniendo = false;
      manualRef.current.ultimoContacto = -9;
      manualRef.current.ultimoSuelo = -9;
    }
    onProgreso(0, 0);
    return () => {
      arrastreRef.current?.fin();
      arrastreRef.current = null;
    };
  }, [accion, estado, limitePelota, limiteVisibleX, onProgreso]);

  useEffect(() => () => geometriaEstrella.dispose(), [geometriaEstrella]);

  const aplicarGesto = useCallback(
    (clientX: number, clientY: number) => {
      if (completadoRef.current) return;
      const grupo = grupoRef.current;
      const punto = aLocal(clientX, clientY);
      if (!grupo || !punto) return;
      const u = punto.x / RX;
      const v = (punto.y - CY) / RY;
      estado.mirar = { x: punto.x, y: punto.y, z: punto.z };
      const referencia = herramientaRef.current;
      if (referencia) {
        // La herramienta se mueve sobre el cuerpo, nunca por debajo del suelo.
        referencia.position.set(
          THREE.MathUtils.clamp(punto.x, -1.9, 1.9),
          THREE.MathUtils.clamp(punto.y, SUELO + 0.24, 1.15),
          Math.max(0.55, punto.z) + 0.28
        );
      }
      if (!sobreElCuerpo(u, v)) return;

      if (accion === "curar") {
        if (Math.hypot(u - OBJETIVO_CURA.u, v - OBJETIVO_CURA.v) > cura.radioAcople) return;
        setCuritaLista(true);
        sonar("curar");
        emitirEfecto({ tipo: "destello", x: OBJETIVO_CURA.u * RX, y: CY + OBJETIVO_CURA.v * RY, z: 0.8, cantidad: 8 });
        estado.feliz = 1;
        onProgreso(1, 0);
        completar();
        return;
      }

      // Ritual de baño. La lista vive también en un ref (fuente de verdad) para
      // que el progreso se calcule en el mismo gesto y no dependa del render.
      const actuales = manchasRef.current;
      let tocada = false;
      const ahora = performance.now();
      const siguientes = actuales.map((mancha) => {
        if (Math.hypot(mancha.u - u, mancha.v - v) > 0.42) return mancha;
        tocada = true;
        if (fase === 0) {
          // La barra de jabón exige dos pasadas separadas por mancha.
          if (mancha.frotadasJabon >= limpieza.frotadasJabon || ahora - mancha.ultimoFroteMs < limpieza.intervaloFroteMs) return mancha;
          sonidoJabon("limpiar");
          const frotadasJabon = mancha.frotadasJabon + 1;
          const espuma = frotadasJabon / limpieza.frotadasJabon;
          emitirEfecto({ tipo: "burbuja", x: mancha.u * RX, y: CY + mancha.v * RY, z: 0.8, cantidad: 2, fuerza: 0.65 });
          return { ...mancha, frotadasJabon, ultimoFroteMs: ahora, espuma, suciedad: Math.max(0.15, 1 - espuma * 0.8) };
        }
        if (fase === 1) {
          // Enjuague en dos pasadas: primero se lleva media espuma, luego queda mojado.
          if (mancha.pasadasAgua >= limpieza.pasadasAgua) return mancha;
          if (ahora - mancha.ultimoFroteMs < limpieza.intervaloFroteMs) return mancha;
          sonidoJabon("agua");
          emitirEfecto({ tipo: "gota", x: mancha.u * RX, y: CY + mancha.v * RY, z: 0.8, cantidad: 2, fuerza: 0.85 });
          const pasadasAgua = mancha.pasadasAgua + 1;
          const lista = pasadasAgua >= limpieza.pasadasAgua;
          return { ...mancha, pasadasAgua, ultimoFroteMs: ahora, espuma: lista ? 0 : 0.45, mojado: lista ? 1 : 0.55, suciedad: 0 };
        }
        // Secado en dos pasadas: la toalla va absorbiendo el agua poco a poco.
        if (mancha.pasadasToalla >= limpieza.pasadasToalla) return mancha;
        if (ahora - mancha.ultimoFroteMs < limpieza.intervaloFroteMs) return mancha;
        sonidoJabon("toalla");
        emitirEfecto({ tipo: "destello", x: mancha.u * RX, y: CY + mancha.v * RY, z: 0.8, cantidad: 2 });
        estado.temblar = 1;
        const pasadasToalla = mancha.pasadasToalla + 1;
        return { ...mancha, pasadasToalla, ultimoFroteMs: ahora, mojado: pasadasToalla >= limpieza.pasadasToalla ? 0 : 0.5 };
      });
      if (!tocada) return;
      manchasRef.current = siguientes;
      setManchas(siguientes);
      const hechas = siguientes.filter((mancha) =>
        fase === 0
          ? mancha.frotadasJabon >= limpieza.frotadasJabon
          : fase === 1
            ? mancha.pasadasAgua >= limpieza.pasadasAgua
            : mancha.pasadasToalla >= limpieza.pasadasToalla
      ).length;
      // Progreso parcial visible en cada roce; al terminar la fase, avanza.
      onProgreso(fase * limpieza.manchas + hechas, fase);
      if (hechas < limpieza.manchas) return;
      if (fase < limpieza.fases.length - 1) {
        soltarHerramienta();
        sonar("logro");
        emitirEfecto({ tipo: "destello", x: 0, y: CY + 1.15, z: 0.55, cantidad: 7 });
        onFase(fase + 1);
      } else {
        completar();
      }
    },
    [accion, aLocal, completar, estado, fase, onFase, onProgreso]
  );

  // La herramienta no se "levanta" hasta tocarla: parece que Mochi la toma y suelta.
  const iniciarArrastre = useCallback(
    (evento: ThreeEvent<PointerEvent>) => {
      if (completadoRef.current) return;
      evento.stopPropagation();
      const id = evento.pointerId;
      setArrastrando(true);
      const mover = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        ev.preventDefault();
        aplicarGesto(ev.clientX, ev.clientY);
      };
      const cerrar = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        soltarHerramienta();
      };
      window.addEventListener("pointermove", mover, { passive: false });
      window.addEventListener("pointerup", cerrar);
      window.addEventListener("pointercancel", cerrar);
      arrastreRef.current = {
        fin: () => {
          window.removeEventListener("pointermove", mover);
          window.removeEventListener("pointerup", cerrar);
          window.removeEventListener("pointercancel", cerrar);
        }
      };
      aplicarGesto(evento.nativeEvent.clientX, evento.nativeEvent.clientY);
    },
    [aplicarGesto, soltarHerramienta]
  );

  const golpearPelota = useCallback(
    (evento: ThreeEvent<PointerEvent>) => {
      if (accion !== "jugar" || completadoRef.current) return;
      evento.stopPropagation();
      const b = pelotaFisica.current;
      // Tiro calculado para atravesar a Mochi: balística inversa en 0.55 s, así
      // cada golpe es un pase limpio en lugar de una parábola impredecible.
      const vuelo = 0.55;
      const objetivoX = 0;
      const objetivoY = CY + 0.1;
      const objetivoZ = 0.35;
      b.vel.set(
        (objetivoX - b.pos.x) / vuelo,
        (objetivoY - b.pos.y) / vuelo + 0.5 * juegoPelota.gravedad * vuelo,
        (objetivoZ - b.pos.z) / vuelo
      );
      b.pos.y += 0.06;
      b.ultimoGolpe = performance.now() / 1000;
      sonar("bote");
      emitirEfecto({ tipo: "destello", x: b.pos.x, y: b.pos.y, z: b.pos.z, cantidad: 4 });
      estado.saltar = Math.max(estado.saltar, 0.7);
    },
    [accion, estado]
  );

  // Arrastre de los juguetes que maneja el jugador (palo / estrella).
  const iniciarManual = useCallback(
    (evento: ThreeEvent<PointerEvent>) => {
      if (completadoRef.current) return;
      evento.stopPropagation();
      const id = evento.pointerId;
      punteroManualRef.current = id;
      const activo = manualRef.current;
      activo.manteniendo = true;
      const mover = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        ev.preventDefault();
        const punto = aLocal(ev.clientX, ev.clientY);
        if (punto) {
          activo.objetivo.set(
            THREE.MathUtils.clamp(punto.x, -1.85, 1.85),
            THREE.MathUtils.clamp(punto.y, SUELO + 0.4, 1.45),
            0.72
          );
          estado.mirar = { x: punto.x, y: punto.y, z: 0.7 };
        }
      };
      const fin = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        activo.manteniendo = false;
        punteroManualRef.current = null;
        window.removeEventListener("pointermove", mover);
        window.removeEventListener("pointerup", fin);
        window.removeEventListener("pointercancel", fin);
      };
      window.addEventListener("pointermove", mover, { passive: false });
      window.addEventListener("pointerup", fin);
      window.addEventListener("pointercancel", fin);
      mover(evento.nativeEvent);
    },
    [aLocal, estado]
  );

  useFrame((state, delta) => {
    const paso = Math.min(0.045, Math.max(0.001, delta));
    const tiempo = state.clock.elapsedTime;
    const b = pelotaFisica.current;
    if (accion === "limpiar" || accion === "curar") {
      if (herramientaRef.current) herramientaRef.current.rotation.y += arrastrando ? paso * 7 : paso * 1.8;
    }

    // Estrella: la guías con el dedo y Mochi la persigue y anota al tocarla.
    if (accion === "jugar" && juguete === "estrella") {
      const m = manualRef.current;
      if (m.manteniendo) {
        m.pos.lerp(m.objetivo, Math.min(1, paso * 13));
      } else {
        // Flotan con suavidad cuando nadie los sostiene.
        m.pos.x += (Math.sin(tiempo * 1.1) * 0.8 - m.pos.x * 0.12) * paso * 0.5;
        m.pos.y += ((SUELO + 0.62 + Math.sin(tiempo * 2.1) * 0.12) - m.pos.y) * paso * 2;
        m.pos.z += (0.72 - m.pos.z) * paso * 2;
      }
      m.girando += paso * (m.manteniendo ? 5 : 1.4);
      const malla = estrellaRef.current;
      if (malla) {
        malla.position.copy(m.pos);
        malla.rotation.z = m.girando;
      }
      estado.mirar = { x: m.pos.x, y: THREE.MathUtils.clamp(m.pos.y, CY - 0.3, CY + 0.75), z: 0.55 };

      const cercania = Math.hypot(m.pos.x, m.pos.y - CY, (m.pos.z - 0.35) * 0.6);
      if (cercania < 1.12 && tiempo - m.ultimoContacto > 1.05 && !completadoRef.current) {
        m.ultimoContacto = tiempo;
        estado.saltar = 1;
        estado.feliz = 1;
        sonar("estrella");
        emitirEfecto({ tipo: "destello", x: m.pos.x, y: m.pos.y, z: 0.8, cantidad: 6 });
        emitirEfecto({ tipo: "corazon", x: m.pos.x, y: m.pos.y + 0.2, z: 0.8, cantidad: 2, fuerza: 0.8 });
        // Empujoncito para que el juguete salga volando y vuelva a buscarse.
        m.objetivo.set(THREE.MathUtils.clamp(-m.pos.x * 0.9, -1.7, 1.7), 1.15, 0.72);
        contadoresRef.current.pases += 1;
        const progreso = Math.min(contadoresRef.current.pases, juegoPelota.pases);
        onProgreso(progreso, 0);
        if (progreso >= juegoPelota.pases) completar();
      }
      b.cuadros += 1;
      if (b.cuadros % 8 === 0) {
        const pantalla = aPantalla(m.pos);
        const mascota = aPantalla({ x: 0, y: CY, z: 0.45 });
        if (pantalla) publicar({ fase: 0, pelota: pantalla, mascota });
      }
      return;
    }

    // Palo con pelota atada: tú mueves el mango y la pelota cuelga de la cuerda
    // como una masa con gravedad, así que se balancea, rebota y responde al tirón.
    if (accion === "jugar" && juguete === "palo") {
      const m = manualRef.current;
      if (m.manteniendo) {
        m.pos.lerp(m.objetivo, Math.min(1, paso * 14));
      } else {
        m.pos.x += (Math.sin(tiempo * 1.1) * 0.8 - m.pos.x * 0.12) * paso * 0.5;
        m.pos.y += ((SUELO + 0.62 + Math.sin(tiempo * 2.1) * 0.12) - m.pos.y) * paso * 2;
        m.pos.z += (0.72 - m.pos.z) * paso * 2;
      }
      // La vara se inclina contra el movimiento de la mano, como una caña de verdad.
      const velManoX = (m.pos.x - m.previa.x) / Math.max(0.001, paso);
      const velManoY = (m.pos.y - m.previa.y) / Math.max(0.001, paso);
      m.previa.copy(m.pos);
      paloDirAux.set(0.34 - velManoX * 0.16, 0.86 - Math.max(0, velManoY) * 0.05, 0.1).normalize();
      if (paloDirAux.y < 0.3) {
        paloDirAux.y = 0.3;
        paloDirAux.normalize();
      }
      const puntaX = m.pos.x + paloDirAux.x * juegoPalo.largoVara;
      const puntaY = m.pos.y + paloDirAux.y * juegoPalo.largoVara;
      const puntaZ = m.pos.z + paloDirAux.z * juegoPalo.largoVara;
      // La pelota: gravedad + rozamiento del aire + cuerda inextensible.
      const bola = m.bola;
      m.bolaVel = m.bolaVel ?? new THREE.Vector3();
      const vel = m.bolaVel as THREE.Vector3;
      vel.y -= juegoPalo.gravedad * paso;
      vel.multiplyScalar(Math.exp(-juegoPalo.amortiguacion * paso));
      bola.addScaledVector(vel, paso);
      paloHiloAux.set(bola.x - puntaX, bola.y - puntaY, bola.z - puntaZ);
      const largo = Math.max(0.001, paloHiloAux.length());
      if (largo > juegoPalo.largoCuerda) {
        paloHiloAux.multiplyScalar(1 / largo);
        bola.set(puntaX + paloHiloAux.x * juegoPalo.largoCuerda, puntaY + paloHiloAux.y * juegoPalo.largoCuerda, puntaZ + paloHiloAux.z * juegoPalo.largoCuerda);
        const radial = vel.dot(paloHiloAux);
        if (radial > 0) vel.addScaledVector(paloHiloAux, -radial);
      }
      if (bola.y < SUELO + 0.12) {
        bola.y = SUELO + 0.12;
        if (vel.y < -0.9 && tiempo - m.ultimoSuelo > 0.3) {
          m.ultimoSuelo = tiempo;
          sonar("bote");
          emitirEfecto({ tipo: "destello", x: bola.x, y: SUELO + 0.05, z: bola.z, cantidad: 2, fuerza: 0.5 });
        }
        vel.y = Math.abs(vel.y) * 0.42;
        vel.x *= 0.94;
        vel.z *= 0.94;
      }
      const mango = paloRef.current;
      if (mango) {
        mango.position.copy(m.pos);
        mango.rotation.set(0, 0, 0);
      }
      const vara = paloVaraRef.current;
      if (vara) {
        vara.quaternion.setFromUnitVectors(paloArriba, paloDirAux);
        vara.position.copy(paloDirAux).multiplyScalar(juegoPalo.largoVara / 2);
      }
      const hilo = paloHiloRef.current;
      const bolaMalla = paloBolaRef.current;
      if (hilo && bolaMalla) {
        paloPuntaAux.set(puntaX, puntaY, puntaZ);
        paloHiloAux.copy(bola).sub(paloPuntaAux);
        const largoHilo = Math.max(0.05, paloHiloAux.length());
        paloHiloAux.normalize();
        hilo.position.copy(paloPuntaAux).sub(m.pos).addScaledVector(paloHiloAux, largoHilo / 2);
        hilo.quaternion.setFromUnitVectors(paloArriba, paloHiloAux);
        hilo.scale.set(1, largoHilo, 1);
        bolaMalla.position.copy(bola).sub(m.pos);
        bolaMalla.rotation.x += paso * (2 + vel.length() * 0.8);
      }
      estado.mirar = { x: bola.x, y: THREE.MathUtils.clamp(bola.y, CY - 0.3, CY + 0.75), z: 0.55 };

      const cercania = Math.hypot(bola.x, bola.y - CY, (bola.z - 0.35) * 0.7);
      if (cercania < 1.05 && tiempo - m.ultimoContacto > 1.0 && !completadoRef.current) {
        m.ultimoContacto = tiempo;
        estado.saltar = 1;
        estado.feliz = 1;
        sonar("palo");
        emitirEfecto({ tipo: "destello", x: bola.x, y: bola.y, z: 0.8, cantidad: 6 });
        // Mochi patea la pelota: sale despedida y la cuerda la recoge.
        const empuje = new THREE.Vector3(bola.x, bola.y - CY + 0.4, bola.z * 0.5).normalize();
        vel.addScaledVector(empuje, 2.6);
        vel.y = Math.max(vel.y, 1.6);
        contadoresRef.current.pases += 1;
        const progreso = Math.min(contadoresRef.current.pases, juegoPelota.pases);
        onProgreso(progreso, 0);
        if (progreso >= juegoPelota.pases) completar();
      }
      b.cuadros += 1;
      if (b.cuadros % 8 === 0) {
        const pantalla = aPantalla(bola);
        const mangoPantalla = aPantalla(m.pos);
        const mascota = aPantalla({ x: 0, y: CY, z: 0.45 });
        if (pantalla) publicar({ fase: 0, pelota: pantalla, mango: mangoPantalla, mascota });
      }
      return;
    }

    if (accion === "jugar") {
      b.vel.y -= juegoPelota.gravedad * paso;
      b.pos.addScaledVector(b.vel, paso);
      const radio = juegoPelota.radio;
      if (b.pos.y < SUELO + radio) {
        b.pos.y = SUELO + radio;
        if (b.vel.y < -0.7 && tiempo - b.ultimoBote > 0.2) {
          b.ultimoBote = tiempo;
          sonar("bote");
          emitirEfecto({ tipo: "destello", x: b.pos.x, y: SUELO + 0.05, z: b.pos.z, cantidad: 2, fuerza: 0.55 });
        }
        b.vel.y = Math.abs(b.vel.y) * juegoPelota.rebote;
        b.vel.x *= 0.985;
        b.vel.z *= 0.985;
      }
      if (Math.abs(b.pos.x) > limitePelota) {
        b.pos.x = Math.sign(b.pos.x) * limitePelota;
        b.vel.x = -b.vel.x * 0.82;
      }
      if (b.pos.z > LIMITE_Z) {
        b.pos.z = LIMITE_Z;
        b.vel.z = -Math.abs(b.vel.z) * 0.75;
      }
      if (b.pos.z < -LIMITE_Z) {
        b.pos.z = -LIMITE_Z;
        b.vel.z = Math.abs(b.vel.z) * 0.75;
      }
      // La pelota nunca chilla en vertical: su altura vive entre el suelo y un
      // techo bajo, y cualquier desvío se corrige en el siguiente cuadro.
      if (b.pos.y - SUELO > 1.62 && b.vel.y > 0.15) {
        b.pos.y = Math.min(b.pos.y, SUELO + 1.62);
        b.vel.y = -Math.abs(b.vel.y) * 0.22;
      }
      if (b.vel.lengthSq() < 0.62 || Math.abs(b.vel.y) > 4.6) {
        b.vel.y = Math.abs(b.vel.y) < 0.9 ? 2.8 : THREE.MathUtils.clamp(b.vel.y, -3.4, 3.4);
        b.vel.x += (Math.random() - 0.5) * 0.7;
        b.vel.z += (Math.random() - 0.5) * 0.34;
      }

      const malla = pelotaRef.current;
      if (malla) {
        malla.position.copy(b.pos);
        malla.rotation.x -= b.vel.y * paso * 1.5;
        malla.rotation.z += b.vel.x * paso * 1.9;
      }
      estado.mirar = { x: b.pos.x, y: b.pos.y, z: b.pos.z };

      // El atrape está acotado en altura y con refrigeración: la pelota nunca
      // se dispara a vertical infinito y cada devolución cae de vuelta al suelo.
      const cerca = Math.hypot(b.pos.x, b.pos.y - CY, b.pos.z * 0.7);
      const enfriado = tiempo - b.ultimoPase > 0.85;
      const alturaAtrape = b.pos.y - (SUELO + juegoPelota.radio);
      if (!completadoRef.current && cerca < 1.15 && alturaAtrape < 1.35 && enfriado) {
        b.ultimoPase = tiempo;
        const angulo = Math.atan2(b.pos.z, b.pos.x || 0.001) + (Math.random() - 0.5) * 0.7;
        const espingo = (contadoresRef.current.pases % 2 === 0 ? -1 : 1) * (0.9 + Math.random() * 0.7);
        const subida = Math.min(Math.max(0.85, 1.25 - alturaAtrape) * 1.45, 1.95 + Math.random() * 0.3);
        const vy = Math.sqrt(2 * juegoPelota.gravedad * subida);
        b.vel.set(espingo + Math.cos(angulo) * 0.4, vy, Math.sin(angulo) * 0.55 + 0.3);
        estado.saltar = 1;
        estado.feliz = 1;
        sonar("jugar");
        emitirEfecto({ tipo: "destello", x: 0, y: CY + 1, z: 0.55, cantidad: 5 });
        contadoresRef.current.pases += 1;
        const progreso = Math.min(contadoresRef.current.pases, juegoPelota.pases);
        onProgreso(progreso, 0);
        if (progreso >= juegoPelota.pases) completar();
      }

      b.cuadros += 1;
      if (b.cuadros % 8 === 0) {
        const pantalla = aPantalla(b.pos);
        if (pantalla) publicar({ fase: 0, pelota: pantalla });
      }
      return;
    }

    if (arrastrando) return;
    const reposo = reposoVisible(accion, fase);
    const malla = herramientaRef.current;
    if (malla && arrastreRef.current === null) {
      malla.position.lerp(reposo, Math.min(1, paso * 6));
    }
  });

  /** Una sola fuente de verdad: lo que se pinta es lo que el test arrastra. */
  const publicar = useCallback(
    (datos: Record<string, unknown>) => {
      const stage = document.querySelector<HTMLElement>("[data-testid='game-stage']");
      if (!stage) return;
      for (const [clave, valor] of Object.entries(datos)) {
        if (valor === undefined) stage.removeAttribute(`data-care-${clave}`);
        else stage.setAttribute(`data-care-${clave}`, JSON.stringify(valor));
      }
    },
    []
  );

  useEffect(() => {
    const marco = window.requestAnimationFrame(() => {
      const objetivos =
        accion === "limpiar"
          ? manchas.map((mancha) => aPantalla(superficie(mancha.u, mancha.v, 0.12))).filter(Boolean)
          : accion === "curar"
            ? [aPantalla(superficie(OBJETIVO_CURA.u, OBJETIVO_CURA.v, 0.12))].filter(Boolean)
            : [];
      publicar({
        fase,
        accion,
        herramienta: aPantalla(reposoVisible(accion, fase)),
        objetivos,
        ...(accion === "jugar" && juguete !== "pelota"
          ? { pelota: aPantalla(manualRef.current.pos), mango: aPantalla(manualRef.current.pos), mascota: aPantalla({ x: 0, y: CY, z: 0.45 }) }
          : {}),
      });
    });
    return () => window.cancelAnimationFrame(marco);
  }, [accion, fase, manchas, publicar, aPantalla, size.width, size.height]);

  const mostrarHerramienta = accion === "limpiar" || accion === "curar";
  const reposo = reposoVisible(accion, fase);

  return (
    <group ref={grupoRef}>
      {/* Pelota clásica: física real, rebotes y devolución de Mochi. */}
      {accion === "jugar" && juguete === "pelota" && (
        <group
          ref={pelotaRef}
          onPointerDown={golpearPelota}
          onPointerOver={() => {
            gl.domElement.style.cursor = "grab";
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = "";
          }}
        >
          <mesh castShadow>
            <sphereGeometry args={[juegoPelota.radio, 26, 20]} />
            <meshPhysicalMaterial color="#f2a26f" roughness={0.24} clearcoat={0.85} clearcoatRoughness={0.18} />
          </mesh>
          <mesh rotation={[0.65, 0.3, 0]}>
            <torusGeometry args={[juegoPelota.radio * 0.8, 0.028, 8, 26]} />
            <meshToonMaterial color="#f7df9a" />
          </mesh>
          <mesh rotation={[-0.5, 0.95, 0.6]}>
            <torusGeometry args={[juegoPelota.radio * 0.66, 0.024, 8, 26]} />
            <meshToonMaterial color="#8fc2aa" />
          </mesh>
          <mesh position={[-0.08, 0.1, 0.19]}>
            <sphereGeometry args={[0.038, 10, 8]} />
            <meshBasicMaterial color="#fffdf4" />
          </mesh>
        </group>
      )}

      {/* Vara con pelota atada: el mango sigue tu dedo y la pelota cuelga de la
          cuerda con física real (gravedad, balanceo y rebotes en el suelo). */}
      {accion === "jugar" && juguete === "palo" && (
        <group ref={paloRef} onPointerDown={iniciarManual} onPointerOver={() => (gl.domElement.style.cursor = "grab")} onPointerOut={() => (gl.domElement.style.cursor = "")}>
          <mesh castShadow>
            <sphereGeometry args={[0.11, 16, 12]} />
            <meshToonMaterial color="#8d6a43" />
          </mesh>
          <mesh ref={paloVaraRef} castShadow>
            <cylinderGeometry args={[0.032, 0.042, juegoPalo.largoVara, 10]} />
            <meshToonMaterial color="#b98a56" />
          </mesh>
          <mesh ref={paloHiloRef}>
            <cylinderGeometry args={[0.011, 0.011, 1, 6]} />
            <meshBasicMaterial color="#e8d9b8" />
          </mesh>
          <group ref={paloBolaRef}>
            <mesh castShadow>
              <sphereGeometry args={[0.16, 24, 18]} />
              <meshPhysicalMaterial color="#8fc2e8" roughness={0.25} clearcoat={0.8} />
            </mesh>
            <mesh position={[-0.05, 0.06, 0.12]}>
              <sphereGeometry args={[0.028, 10, 8]} />
              <meshBasicMaterial color="#fffdf4" />
            </mesh>
          </group>
          {/* Zona de agarre invisible: en móvil el mango se coge sin puntería. */}
          <mesh>
            <sphereGeometry args={[0.42, 10, 8]} />
            <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
          </mesh>
        </group>
      )}

      {/* Fondo sensible en modo juguete manual: tocar en cualquier punto del
          diorama lleva el juguete hasta ahí (clave en móvil). */}
      {accion === "jugar" && juguete !== "pelota" && (
        <mesh position={[0, 0.2, -0.95]} onPointerDown={iniciarManual} onPointerOver={() => (gl.domElement.style.cursor = "pointer")} onPointerOut={() => (gl.domElement.style.cursor = "")}>
          <planeGeometry args={[5.2, 3.4]} />
          <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
        </mesh>
      )}

      {/* Estrella de luciérnaga: la guías por la pantalla y ella revolotea. */}
      {accion === "jugar" && juguete === "estrella" && (
        <group ref={estrellaRef} onPointerDown={iniciarManual} onPointerOver={() => (gl.domElement.style.cursor = "grab")} onPointerOut={() => (gl.domElement.style.cursor = "")}>
          <mesh castShadow geometry={geometriaEstrella}>
            <meshPhysicalMaterial color="#ffd66e" roughness={0.18} metalness={0.08} clearcoat={0.95} clearcoatRoughness={0.12} emissive="#f5b53d" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.11]} scale={0.12}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial color="#fff6d0" />
          </mesh>
          <pointLight color="#ffd98a" intensity={1.6} distance={2.6} decay={2} />
        </group>
      )}

      {manchas.map((mancha, indice) => (
        <group key={`mancha-${indice}`} position={[mancha.u * RX, CY + mancha.v * RY, RZ * Math.sqrt(Math.max(0.04, 1 - mancha.u * mancha.u - mancha.v * mancha.v))]}>
          {mancha.suciedad > 0.02 && (
            <mesh scale={[0.15 * mancha.suciedad, 0.12 * mancha.suciedad, 0.05]}>
              <sphereGeometry args={[1, 12, 10]} />
              <meshToonMaterial color="#a97a5c" />
            </mesh>
          )}
          {mancha.espuma > 0.02 && (
            <group scale={mancha.espuma} position={[0, 0.02, 0.05]}>
              <mesh scale={0.14}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshToonMaterial color="#fdfefe" />
              </mesh>
              <mesh position={[-0.11, -0.03, 0]} scale={0.1}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshToonMaterial color="#f2fbfa" />
              </mesh>
              <mesh position={[0.1, 0.06, -0.01]} scale={0.085}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshToonMaterial color="#eafaf7" />
              </mesh>
            </group>
          )}
          {mancha.mojado > 0.05 && (
            <mesh scale={[0.19, 0.15, 0.03]}>
              <sphereGeometry args={[1, 12, 10]} />
              <meshPhysicalMaterial color="#bfe6ee" transparent opacity={0.5 * mancha.mojado} roughness={0.05} clearcoat={1} />
            </mesh>
          )}
        </group>
      ))}

      {accion === "curar" && !curitaLista && (
        <group position={[OBJETIVO_CURA.u * RX, CY + OBJETIVO_CURA.v * RY, 0.68]}>
          <mesh>
            <sphereGeometry args={[0.1, 16, 12]} />
            <meshBasicMaterial color="#e98491" transparent opacity={0.72} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <torusGeometry args={[0.2, 0.019, 7, 24]} />
            <meshBasicMaterial color="#ee9d9d" transparent opacity={0.92} />
          </mesh>
        </group>
      )}

      {accion === "curar" && curitaLista && (
        <group position={[OBJETIVO_CURA.u * RX, CY + OBJETIVO_CURA.v * RY, 0.72]} rotation={[0, 0, -0.25]}>
          <mesh>
            <boxGeometry args={[0.36, 0.17, 0.05]} />
            <meshToonMaterial color="#f0b7ac" />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.13, 0.13, 0.02]} />
            <meshToonMaterial color="#fff3dd" />
          </mesh>
        </group>
      )}

      {/* Aro guía: marca en el suelo dónde espera la herramienta de la fase. */}
      {mostrarHerramienta && (
        <AroGuia
          ref={aroHerramientaRef}
          centro={[reposo.x, reposo.y - 0.13, reposo.z]}
          color={fase === 0 ? "#7fc9c5" : fase === 1 ? "#8fbfe0" : "#eab6a0"}
          pulsando={!arrastrando}
        />
      )}
      {/* La herramienta vive en coordenadas del grupo raíz: el gesto la coloca sin doble desplazamiento. */}
      {mostrarHerramienta && (
        <group
          ref={herramientaRef}
          position={[reposo.x, reposo.y, reposo.z]}
          onPointerDown={iniciarArrastre}
          onPointerOver={(evento) => {
            evento.stopPropagation();
            gl.domElement.style.cursor = "grab";
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = "";
          }}
        >
          {accion === "curar" && !curitaLista && <CuritaMesh />}
          {accion === "limpiar" && fase === 0 && <JabonMesh arrastrando={arrastrando} />}
          {accion === "limpiar" && fase === 1 && <RegaderaMesh arrastrando={arrastrando} />}
          {accion === "limpiar" && fase === 2 && <ToallaMesh arrastrando={arrastrando} />}
        </group>
      )}

    </group>
  );
}

function JabonMesh({ arrastrando }: { arrastrando: boolean }) {
  return (
    <group rotation={[arrastrando ? -0.3 : 0, 0, -0.18]}>
      <mesh castShadow>
        <boxGeometry args={[0.34, 0.2, 0.2]} />
        <meshPhysicalMaterial color="#a9ded8" roughness={0.3} clearcoat={0.7} />
      </mesh>
      <mesh position={[0, 0.06, 0.06]}>
        <boxGeometry args={[0.3, 0.05, 0.14]} />
        <meshToonMaterial color="#f4fdfb" />
      </mesh>
    </group>
  );
}

function RegaderaMesh({ arrastrando }: { arrastrando: boolean }) {
  return (
    <group rotation={[0, arrastrando ? 0.55 : 0.2, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.23, 0.3, 18]} />
        <meshPhysicalMaterial color="#9fc7e2" roughness={0.28} clearcoat={0.7} />
      </mesh>
      <mesh position={[0.24, 0.1, 0]} rotation={[0, 0, -0.78]}>
        <cylinderGeometry args={[0.05, 0.075, 0.34, 12]} />
        <meshToonMaterial color="#8db9d8" />
      </mesh>
      {arrastrando && (
        <mesh position={[0.44, -0.2, 0]} rotation={[0, 0, 0.22]}>
          <coneGeometry args={[0.15, 0.44, 12, 1, true]} />
          <meshBasicMaterial color="#bfe4f2" transparent opacity={0.45} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function ToallaMesh({ arrastrando }: { arrastrando: boolean }) {
  return (
    <group rotation={[arrastrando ? -0.35 : 0, 0, 0.12]}>
      <mesh castShadow>
        <boxGeometry args={[0.44, 0.3, 0.09]} />
        <meshToonMaterial color="#f5cdb6" />
      </mesh>
      <mesh position={[0, 0.09, 0.05]}>
        <boxGeometry args={[0.44, 0.05, 0.02]} />
        <meshToonMaterial color="#fff4ea" />
      </mesh>
      <mesh position={[0, -0.06, 0.05]}>
        <boxGeometry args={[0.44, 0.05, 0.02]} />
        <meshToonMaterial color="#fff4ea" />
      </mesh>
    </group>
  );
}

function CuritaMesh() {
  return (
    <group rotation={[0, 0, -0.25]}>
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.19, 0.06]} />
        <meshPhysicalMaterial color="#f0b7ac" roughness={0.45} clearcoat={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.036]}>
        <boxGeometry args={[0.14, 0.15, 0.02]} />
        <meshToonMaterial color="#fff3dd" />
      </mesh>
    </group>
  );
}
