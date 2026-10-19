import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Sparkles, Star, Waves } from "lucide-react";
import type { ComponentType } from "react";
import type { AccionEntrada } from "./types";

export interface MiniJuegoProps {
  pausado: boolean;
  onPuntuar: (puntos: number) => void;
  registrarAccion: (manejador: ((accion: AccionEntrada) => void) | null) => void;
}

export interface MiniJuego {
  id: string;
  nombre: string;
  icono: "brujula" | "chispa" | "estrella";
  componente: ComponentType<MiniJuegoProps>;
  duracion: number;
  recompensa: { monedasPorPunto: number; minimo: number; maximo: number };
  controlesSoportados: readonly ("teclado" | "tactil" | "mando")[];
  instrucciones: string;
}

type Direccion = "arriba" | "abajo" | "izquierda" | "derecha";

const accionesDireccion: readonly Direccion[] = ["arriba", "abajo", "izquierda", "derecha"];
const iconosDireccion = {
  arriba: ArrowUp,
  abajo: ArrowDown,
  izquierda: ArrowLeft,
  derecha: ArrowRight
} as const;

function esDireccion(accion: AccionEntrada): accion is Direccion {
  return accionesDireccion.includes(accion as Direccion);
}

function nuevaDireccion(): Direccion {
  return accionesDireccion[Math.floor(Math.random() * accionesDireccion.length)];
}

function AdivinaDireccion({ pausado, onPuntuar, registrarAccion }: MiniJuegoProps) {
  const [objetivo, setObjetivo] = useState<Direccion>(nuevaDireccion);
  const objetivoRef = useRef(objetivo);
  const ultimoToque = useRef(0);
  objetivoRef.current = objetivo;

  const resolver = useCallback((accion: AccionEntrada) => {
    const ahora = performance.now();
    if (pausado || !esDireccion(accion) || ahora - ultimoToque.current < 160) return;
    ultimoToque.current = ahora;
    onPuntuar(accion === objetivoRef.current ? 3 : -1);
    objetivoRef.current = nuevaDireccion();
    setObjetivo(objetivoRef.current);
  }, [onPuntuar, pausado]);

  useEffect(() => {
    if (pausado) return;
    registrarAccion(resolver);
    return () => registrarAccion(null);
  }, [pausado, registrarAccion, resolver]);

  const Icono = iconosDireccion[objetivo];
  return (
    <div className="mini-play direction-play">
      <div className="mini-sparkle"><Sparkles size={17} /></div>
      <span className="mini-eyebrow">¿Hacia dónde?</span>
      <div className="direction-target" data-direccion={objetivo} aria-label={`Pulsa ${objetivo}`}><Icono size={52} strokeWidth={2.5} /></div>
      <span className="mini-caption">Sigue la flechita antes de que cambie</span>
      <div className="direction-pad" aria-label="Direcciones para jugar">
        {accionesDireccion.map((accion) => {
          const Boton = iconosDireccion[accion];
          return (
            <button key={accion} className="direction-key" type="button" aria-label={accion} disabled={pausado} onClick={() => resolver(accion)}>
              <Boton size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EcoDeColores({ pausado, onPuntuar, registrarAccion }: MiniJuegoProps) {
  const [secuencia, setSecuencia] = useState<Direccion[]>(["arriba", "izquierda", "derecha"]);
  const [indice, setIndice] = useState(0);
  const [pasoVista, setPasoVista] = useState(0);
  const [mostrando, setMostrando] = useState(true);
  const secuenciaRef = useRef(secuencia);
  const indiceRef = useRef(0);
  const mostrandoRef = useRef(true);
  const ultimoToque = useRef(0);
  secuenciaRef.current = secuencia;

  useEffect(() => {
    if (pausado || !mostrando) return;
    const temporizador = window.setTimeout(() => {
      if (pasoVista >= secuencia.length * 2 - 1) {
        mostrandoRef.current = false;
        setMostrando(false);
      } else {
        setPasoVista(pasoVista + 1);
      }
    }, 420);
    return () => window.clearTimeout(temporizador);
  }, [pausado, mostrando, pasoVista, secuencia.length]);

  const resolver = useCallback((accion: AccionEntrada) => {
    const ahora = performance.now();
    if (pausado || mostrandoRef.current || !esDireccion(accion) || ahora - ultimoToque.current < 160) return;
    ultimoToque.current = ahora;
    if (accion === secuenciaRef.current[indiceRef.current]) {
      onPuntuar(4);
      if (indiceRef.current + 1 >= secuenciaRef.current.length) {
        const siguiente = Array.from({ length: 3 }, nuevaDireccion);
        secuenciaRef.current = siguiente;
        indiceRef.current = 0;
        mostrandoRef.current = true;
        setSecuencia(siguiente);
        setIndice(0);
        setPasoVista(0);
        setMostrando(true);
      } else {
        indiceRef.current += 1;
        setIndice(indiceRef.current);
      }
    } else {
      onPuntuar(-2);
      indiceRef.current = 0;
      mostrandoRef.current = true;
      setIndice(0);
      setPasoVista(0);
      setMostrando(true);
    }
  }, [onPuntuar, pausado]);

  useEffect(() => {
    if (pausado) return;
    registrarAccion(resolver);
    return () => registrarAccion(null);
  }, [pausado, registrarAccion, resolver]);

  return (
    <div className="mini-play memory-play">
      <div className="mini-sparkle"><Star size={17} /></div>
      <span className="mini-eyebrow">Eco de patitas</span>
      <div
        className="memory-sequence"
        aria-label={mostrando ? `Observa la secuencia: ${secuencia.join(", ")}` : `Paso ${indice + 1} de ${secuencia.length}`}
        data-secuencia={secuencia.join(",")}
        data-mostrando={mostrando ? "true" : "false"}
      >
        {secuencia.map((direccion, posicion) => {
          const Icono = iconosDireccion[direccion];
          const iluminada = mostrando && Math.floor(pasoVista / 2) === posicion && pasoVista % 2 === 0;
          return <span key={posicion} className={iluminada || (!mostrando && posicion === indice) ? "sequence-dot current" : "sequence-dot"}>
            {iluminada ? <Icono size={19} /> : <span aria-hidden="true">{!mostrando && posicion < indice ? "✓" : "·"}</span>}
          </span>;
        })}
      </div>
      <span className="mini-caption">{mostrando ? "Mira bien el camino..." : "Ahora repítelo de memoria"}</span>
      <div className="direction-pad" aria-label="Flechas de memoria">
        {accionesDireccion.map((accion) => {
          const Boton = iconosDireccion[accion];
          return (
            <button key={accion} className="direction-key" type="button" aria-label={accion} disabled={pausado || mostrando} onClick={() => resolver(accion)}>
              <Boton size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AtrapaEstrellas({ pausado, onPuntuar, registrarAccion }: MiniJuegoProps) {
  const [carril, setCarril] = useState(1);
  const [estrella, setEstrella] = useState(() => Math.floor(Math.random() * 3));
  const [ronda, setRonda] = useState(0);
  const carrilRef = useRef(carril);
  const estrellaRef = useRef(estrella);
  carrilRef.current = carril;

  useEffect(() => {
    if (pausado) return;
    const temporizador = window.setTimeout(() => {
      // Se recoge la estrella visible, no una nueva posición aleatoria.
      if (estrellaRef.current === carrilRef.current) onPuntuar(3);
      const siguiente = Math.floor(Math.random() * 3);
      estrellaRef.current = siguiente;
      setEstrella(siguiente);
      setRonda((actual) => actual + 1);
    }, 1350);
    return () => window.clearTimeout(temporizador);
  }, [onPuntuar, pausado, ronda]);

  const resolver = useCallback((accion: AccionEntrada) => {
    if (pausado) return;
    if (accion === "izquierda") {
      carrilRef.current = Math.max(0, carrilRef.current - 1);
      setCarril(carrilRef.current);
    }
    if (accion === "derecha") {
      carrilRef.current = Math.min(2, carrilRef.current + 1);
      setCarril(carrilRef.current);
    }
  }, [pausado]);

  useEffect(() => {
    if (pausado) return;
    registrarAccion(resolver);
    return () => registrarAccion(null);
  }, [pausado, registrarAccion, resolver]);


  return (
    <div className="mini-play star-play">
      <div className="mini-sparkle"><Waves size={17} /></div>
      <span className="mini-eyebrow">Caza de luciérnagas</span>
      <div className="star-field" aria-label="Atrapa las estrellas que caen" data-carril={carril} data-estrella={estrella}>
        <span key={ronda} className="falling-star" style={{ left: `${17 + estrella * 33}%` }}><Star size={27} fill="currentColor" /></span>
        <span className="basket" style={{ left: `${17 + carril * 33}%` }}>⌒</span>
      </div>
      <span className="mini-caption">Muévete a izquierda o derecha para atraparlas</span>
      <div className="catch-controls">
        <button className="direction-key" type="button" aria-label="Mover a la izquierda" disabled={pausado} onClick={() => resolver("izquierda")}><ArrowLeft size={20} /></button>
        <button className="direction-key" type="button" aria-label="Mover a la derecha" disabled={pausado} onClick={() => resolver("derecha")}><ArrowRight size={20} /></button>
      </div>
    </div>
  );
}

const controles = ["teclado", "tactil", "mando"] as const;

export const MINIJUEGOS = [
  {
    id: "adivina-direccion",
    nombre: "Sigue la flecha",
    icono: "brujula",
    componente: AdivinaDireccion,
    duracion: 25,
    recompensa: { monedasPorPunto: 2, minimo: 4, maximo: 48 },
    controlesSoportados: controles,
    instrucciones: "Pulsa la dirección que aparece."
  },
  {
    id: "eco-patitas",
    nombre: "Eco de patitas",
    icono: "chispa",
    componente: EcoDeColores,
    duracion: 30,
    recompensa: { monedasPorPunto: 2, minimo: 4, maximo: 48 },
    controlesSoportados: controles,
    instrucciones: "Repite la pequeña secuencia de flechas."
  },
  {
    id: "atrapa-estrellas",
    nombre: "Atrapa estrellas",
    icono: "estrella",
    componente: AtrapaEstrellas,
    duracion: 30,
    recompensa: { monedasPorPunto: 2, minimo: 4, maximo: 48 },
    controlesSoportados: controles,
    instrucciones: "Muévete de lado a lado para recoger luciérnagas."
  }
] as const satisfies readonly MiniJuego[];

const cacheMinijuegos = new Map<string, MiniJuego>();

export function obtenerMinijuego(id: string): MiniJuego | undefined {
  const cacheado = cacheMinijuegos.get(id);
  if (cacheado) return cacheado;
  const juego = MINIJUEGOS.find((entrada) => entrada.id === id);
  if (juego) cacheMinijuegos.set(id, juego);
  return juego;
}