import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Compass, Pause, Play, Sparkles, Star, X } from "lucide-react";
import { avanzarRelojMinijuego, crearRelojMinijuego, pausarRelojMinijuego, reanudarRelojMinijuego } from "../game/relojMinijuego";
import type { AccionEntrada } from "../game/types";
import type { MiniJuego } from "../game/minijuegos";

interface Props {
  juego: MiniJuego;
  mandoConectado: boolean;
  alCerrar: () => void;
  alCobrar: (puntuacion: number, monedas: number) => void;
  alRegistrarEntrada: (manejador: ((accion: AccionEntrada) => void) | null) => void;
  alControlActivo: (activo: boolean) => void;
}

const iconosJuego = { brujula: Compass, chispa: Sparkles, estrella: Star } as const;

export default function MiniJuegoScreen({ juego, mandoConectado, alCerrar, alCobrar, alRegistrarEntrada, alControlActivo }: Props) {
  const [reloj, setReloj] = useState(() => crearRelojMinijuego(juego.duracion, performance.now()));
  const [puntuacion, setPuntuacion] = useState(0);
  const [cobrado, setCobrado] = useState(false);
  const pausado = reloj.pausado;
  const terminado = reloj.restanteMs <= 0;
  const restante = Math.ceil(reloj.restanteMs / 1000);
  const relojActual = useRef(reloj);
  const premioCobrado = useRef(false);
  const botonPausa = useRef<HTMLButtonElement>(null);
  const botonPremio = useRef<HTMLButtonElement>(null);
  const cierreAutomatico = useRef<number | null>(null);
  const manejadorJuego = useRef<((accion: AccionEntrada) => void) | null>(null);
  const Icono = iconosJuego[juego.icono];
  relojActual.current = reloj;

  const registrarJuego = useCallback((manejador: ((accion: AccionEntrada) => void) | null) => {
    manejadorJuego.current = manejador;
  }, []);
  const puntuar = useCallback((puntos: number) => {
    if (relojActual.current.pausado || relojActual.current.restanteMs <= 0 || premioCobrado.current) return;
    setPuntuacion((actual) => Math.max(0, actual + puntos));
  }, []);
  const alternarPausa = useCallback(() => {
    const ahora = performance.now();
    if (!relojActual.current.pausado) botonPausa.current?.focus();
    setReloj((actual) => actual.pausado
      ? reanudarRelojMinijuego(actual, ahora)
      : pausarRelojMinijuego(actual, ahora));
  }, []);
  const recibirEntrada = useCallback((accion: AccionEntrada) => {
    if (accion === "pausa" && !terminado) {
      alternarPausa();
      return;
    }
    if (accion === "cancelar") {
      alCerrar();
      return;
    }
    if (!pausado && !terminado) manejadorJuego.current?.(accion);
  }, [alCerrar, alternarPausa, pausado, terminado]);

  useEffect(() => {
    alRegistrarEntrada(recibirEntrada);
    return () => alRegistrarEntrada(null);
  }, [alRegistrarEntrada, recibirEntrada]);

  useEffect(() => {
    if (pausado || terminado) return;
    const temporizador = window.setInterval(() => {
      const ahora = performance.now();
      setReloj((actual) => avanzarRelojMinijuego(actual, ahora));
    }, 120);
    return () => window.clearInterval(temporizador);
  }, [pausado, terminado]);

  useEffect(() => {
    alControlActivo(!pausado && !terminado);
    return () => alControlActivo(false);
  }, [alControlActivo, pausado, terminado]);

  useEffect(() => {
    const pausarEnSegundoPlano = () => {
      if (document.visibilityState !== "hidden") return;
      const ahora = performance.now();
      setReloj((actual) => pausarRelojMinijuego(actual, ahora));
    };
    document.addEventListener("visibilitychange", pausarEnSegundoPlano);
    return () => document.removeEventListener("visibilitychange", pausarEnSegundoPlano);
  }, []);

  useEffect(() => {
    if (!terminado) return;
    const frame = window.requestAnimationFrame(() => botonPremio.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [terminado]);

  useEffect(() => {
    if (!pausado || terminado) return;
    const frame = window.requestAnimationFrame(() => botonPausa.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [pausado, terminado]);

  useEffect(() => () => {
    if (cierreAutomatico.current !== null) window.clearTimeout(cierreAutomatico.current);
  }, []);

  const monedas = Math.min(juego.recompensa.maximo, Math.max(juego.recompensa.minimo, puntuacion * juego.recompensa.monedasPorPunto));
  const progreso = ((juego.duracion * 1000 - reloj.restanteMs) / (juego.duracion * 1000)) * 100;
  const Juego = juego.componente;
  const cobrar = () => {
    if (premioCobrado.current || !terminado) return;
    premioCobrado.current = true;
    setCobrado(true);
    alCobrar(puntuacion, monedas);
    cierreAutomatico.current = window.setTimeout(alCerrar, 600);
  };

  return (
    <div className="screen-overlay modal-overlay minigame-overlay">
      <motion.section className="modal-panel minigame-panel" role="dialog" aria-modal="true" aria-labelledby="minigame-title" data-focus-scope="minijuego"
        initial={{ opacity: 0, scale: 0.97, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ type: "spring", damping: 22 }}>
        <div className="minigame-topline">
          <button className="icon-button close-button" type="button" aria-label="Salir del minijuego" onClick={alCerrar} data-game-focus="true"><X size={19} /></button>
          <div className="minigame-title"><span className="minigame-icon"><Icono size={19} /></span><div><span className="modal-kicker">UN RATITO DE DIVERSIÓN</span><h2 id="minigame-title">{juego.nombre}</h2></div></div>
          {!terminado && <button ref={botonPausa} className="icon-button pause-game-button" type="button" aria-label={pausado ? "Continuar" : "Pausar"} onClick={alternarPausa} data-initial-focus={pausado ? "true" : undefined} data-game-focus="true">{pausado ? <Play size={18} /> : <Pause size={18} />}</button>}
        </div>
        <div className="minigame-scoreline"><span>Tiempo <strong>{restante}s</strong></span><span className="score-mark"><Star size={15} fill="currentColor" />{puntuacion}</span></div>
        <div className="minigame-time-track"><i style={{ width: `${progreso}%` }} /></div>
        <div className="minigame-stage" tabIndex={-1} data-initial-focus={!terminado && !pausado ? "true" : undefined}>
          {terminado ? (
            <div className="minigame-result"><span className="result-star"><Sparkles size={25} /></span><span className="mini-eyebrow">¡QUÉ BIEN LO HICISTE!</span><strong>{puntuacion} puntitos</strong><span>Un regalito de {monedas} monedas para los dos.</span></div>
          ) : (
            <>
              <div className={`minigame-play-area ${pausado ? "is-paused" : ""}`} aria-hidden={pausado} inert={pausado}>
                <Juego pausado={pausado} onPuntuar={puntuar} registrarAccion={registrarJuego} />
              </div>
              {pausado && <div className="minigame-paused"><Pause size={25} /><strong>Un respiro</strong><span>Pulsa continuar cuando quieras.</span></div>}
            </>
          )}
        </div>
        <div className="minigame-controls">
          {terminado ? (
            <button ref={botonPremio} className="primary-button" type="button" disabled={cobrado} onClick={cobrar} data-initial-focus="true" data-game-focus="true">{cobrado ? "Regalo guardado" : `Guardar ${monedas} monedas`} <span aria-hidden="true">→</span></button>
          ) : (
            <span className="minigame-help">{mandoConectado ? "Stick o cruceta para jugar · Start pausa" : <><ArrowLeft size={14} /> <ArrowRight size={14} /> Teclas o botones en pantalla</>}</span>
          )}
        </div>
      </motion.section>
    </div>
  );
}