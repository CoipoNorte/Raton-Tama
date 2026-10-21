import { useEffect, useMemo, useRef, useState } from "react";
import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, BedDouble, BookHeart, Brush, ChevronDown, Coins, Droplets, Gamepad2, Heart, Menu, Moon, Music2, Pause, Pill, ShoppingBag, Smile, Sun, Utensils, Volume2, VolumeX, Wand2, X } from "lucide-react";
import { obtenerEspecie } from "../game/especies";
import { obtenerObjeto } from "../game/objetos";
import type { CSSProperties, FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import type { ArrastreComida, Etapa, Mascota, Partida } from "../game/types";
import { calcularMarcoDiorama } from "../game/geometria.js";
import { useGestoSeguro } from "../hooks/useGestoSeguro";
import { useViewport } from "../hooks/useViewport";
import BarraAcciones from "../components/BarraAcciones";
import type { AccionBarra } from "../components/BarraAcciones";
import BarraTernura from "../components/BarraTernura";
import HUD from "../components/HUD";
import SelectorComida from "../components/SelectorComida";
import InteraccionCuidado from "../components/InteraccionCuidado";
import SelectorJuguete from "../components/SelectorJuguete";
import type { TipoJuguete } from "../components/SelectorJuguete";
import type { ModeloComida } from "../components/IconoComida";
import type { AccionCuidado as AccionInteraccionCuidado } from "../game/cuidados";
import { soportaWebGL } from "../tres/capacidades";
import Fallback2D from "../tres/Fallback2D";

// El 3D se carga bajo demanda: three.js es la parte más pesada del juego.
const Escena = lazy(() => import("../tres/Escena"));

interface Props {
  partida: Partida;
  bloqueadoPorModal: boolean;
  ambienteNoche: boolean;
  menuMovilAbierto: boolean;
  comidaAbierta: boolean;
  comidaArrastrada: ArrastreComida | null;
  interaccionCuidado: AccionInteraccionCuidado | null;
  progresoCuidado: number;
  faseCuidado: number;
  bocado: ModeloComida | null;
  jugueteAbierto: boolean;
  juguete: TipoJuguete;
  menuTernuraAbierto: boolean;
  alElegirJuguete: (juguete: TipoJuguete) => void;
  alCerrarJuguete: () => void;
  alAnimarTernura: (tipo: string) => void;
  alCerrarTernura: () => void;
  movimiento: string;
  animando: boolean;
  angulo: number;
  mandoConectado: boolean;
  fuenteActiva: "teclado" | "mando";
  alCambiarAngulo: (angulo: number) => void;
  alAccion: (accion: AccionBarra) => void;
  alPanel: (panel: "tienda" | "album" | "minijuegos" | "explorar") => void;
  alAlternarSonido: () => void;
  alAlternarMusica: () => void;
  alAlternarPausa: () => void;
  alCambiarNombre: (nombre: string) => void;
  alCerrarComida: () => void;
  alArrastrarComida: (arrastre: ArrastreComida | null) => void;
  alCompletarInteraccion: (accion: AccionInteraccionCuidado) => void;
  alCancelarInteraccion: () => void;
  alCambiarProgresoCuidado: (progreso: number, fase: number) => void;
  alCambiarFaseCuidado: (fase: number) => void;
  alAlimentar: (id: string) => void;
  alAbrirTienda: () => void;
  alErrorWebgl: () => void;
  alEclosionarHuevo?: () => void;
  alAlternarMenuMovil: () => void;
  alCerrarMenuMovil: () => void;
  alAcariciarLibre: () => void;
  alLlamarAtencion: () => void;
}

const nombresEtapa: Record<Etapa, string> = {
  huevo: "Huevo",
  bebe: "Bebé",
  nino: "Niñez",
  adolescente: "Adolescencia",
  adulto: "Adultez",
  anciano: "Abuelito"
};

function marcaRatito() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="brand-creature-mark">
      <ellipse cx="13" cy="14" rx="8" ry="10" fill="#e995aa" transform="rotate(-19 13 14)" />
      <ellipse cx="35" cy="14" rx="8" ry="10" fill="#e995aa" transform="rotate(19 35 14)" />
      <ellipse cx="24" cy="27" rx="18" ry="17" fill="#efc0a7" />
      <circle cx="18" cy="24" r="2.2" fill="#46383d" /><circle cx="30" cy="24" r="2.2" fill="#46383d" />
      <circle cx="18.5" cy="23.2" r=".7" fill="#fff" /><circle cx="30.5" cy="23.2" r=".7" fill="#fff" />
      <path d="M21 31q3-3 6 0M24 31v2m0 0q-3 3-5 1m5-1q3 3 5 1" fill="none" stroke="#85575e" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="14" cy="30" r="3" fill="#e9879c" opacity=".65" /><circle cx="34" cy="30" r="3" fill="#e9879c" opacity=".65" />
    </svg>
  );
}

function iconoNecesidad(mascota: Mascota): { texto: string; clase: string; icono: LucideIcon } {
  if (mascota.enferma) return { texto: "Pachucha", clase: "callout-urgent", icono: Pill };
  if (mascota.suciedad > 0 || mascota.necesidades.higiene < 33) return { texto: "Un baño", clase: mascota.necesidades.higiene < 20 ? "callout-urgent" : "callout-warm", icono: Brush };
  if (mascota.necesidades.hambre < 33) return { texto: "Un bocadito", clase: mascota.necesidades.hambre < 18 ? "callout-urgent" : "callout-warm", icono: Utensils };
  if (mascota.necesidades.energia < 30) return { texto: "Un descansito", clase: "callout-warm", icono: BedDouble };
  if (mascota.necesidades.animo < 32) return { texto: "¿Jugamos?", clase: "callout-warm", icono: Smile };
  if (Math.min(mascota.necesidades.hambre, mascota.necesidades.animo, mascota.necesidades.energia, mascota.necesidades.higiene, mascota.necesidades.salud) > 60) return { texto: "Muy contenta", clase: "callout-happy", icono: Heart };
  return { texto: "Aquí contigo", clase: "callout-happy", icono: Activity };
}

export interface GloboAviso {
  id: string;
  icono: LucideIcon;
  urgente: boolean;
  titulo: string;
}

// La criatura pide sola con globos de icono sobre su cabeza: sin texto largo.
// Esta lista es la única fuente de verdad para el 3D y para el fallback 2D.
export function globosNecesidad(mascota: Mascota): GloboAviso[] {
  const globos: GloboAviso[] = [];
  if (mascota.enferma) globos.push({ id: "salud", icono: Pill, urgente: true, titulo: "Necesita medicina" });
  if (mascota.suciedad > 0) globos.push({ id: "suciedad", icono: Brush, urgente: mascota.suciedad >= 2, titulo: "Hay que limpiar" });
  if (mascota.necesidades.higiene < 30) globos.push({ id: "higiene", icono: Droplets, urgente: mascota.necesidades.higiene < 16, titulo: "Quiere una ducha" });
  if (mascota.necesidades.hambre < 32) globos.push({ id: "hambre", icono: Utensils, urgente: mascota.necesidades.hambre < 16, titulo: "Tiene hambre" });
  if (mascota.necesidades.energia < 28) globos.push({ id: "energia", icono: BedDouble, urgente: false, titulo: "Le falta sueño" });
  if (mascota.necesidades.animo < 30) globos.push({ id: "animo", icono: Smile, urgente: mascota.necesidades.animo < 15, titulo: "Quiere jugar" });
  return globos.slice(0, 3);
}

export default function GameScreen(props: Props) {
  const {
    partida, bloqueadoPorModal, ambienteNoche, menuMovilAbierto, comidaAbierta, comidaArrastrada, interaccionCuidado, progresoCuidado, faseCuidado, bocado,
    jugueteAbierto, juguete, menuTernuraAbierto, alElegirJuguete, alCerrarJuguete, alAnimarTernura, alCerrarTernura,
    movimiento, animando, angulo, mandoConectado, fuenteActiva, alCambiarAngulo, alAccion,
    alPanel, alAlternarSonido, alAlternarMusica, alAlternarPausa, alCambiarNombre, alCerrarComida, alAlimentar, alAbrirTienda, alErrorWebgl,
    alEclosionarHuevo, alAlternarMenuMovil, alCerrarMenuMovil, alCompletarInteraccion, alCancelarInteraccion, alCambiarProgresoCuidado, alCambiarFaseCuidado, alArrastrarComida,
    alAcariciarLibre, alLlamarAtencion
  } = props;
  const mascota = partida.mascota;
  const [webglDisponible] = useState(soportaWebGL);
  const stageRef = useRef<HTMLElement | null>(null);
  const especie = useMemo(() => obtenerEspecie(mascota.especieId), [mascota.especieId]);
  const viewport = useViewport();
  const marco = useMemo(() => calcularMarcoDiorama(viewport.ancho, viewport.alto), [viewport.ancho, viewport.alto]);
  const [editando, setEditando] = useState(false);
  const [nombreBorrador, setNombreBorrador] = useState(mascota.nombre);
  const [ahora, setAhora] = useState(() => new Date());
  const anguloGesto = useRef<{ x: number; angulo: number } | null>(null);
  // Si el gesto nació sobre Mochi, la capa 3D lo gestiona (mirar/acariciar) y aquí no rotamos.
  const gestoEnMascota = useRef(false);
  const noche = ambienteNoche;
  const aviso = iconoNecesidad(mascota);
  const IconoAviso = aviso.icono;
  const especieActual = especie;
  const globos = useMemo(() => globosNecesidad(mascota), [mascota]);
  const ensuciandose = mascota.suciedad > 0;
  const objetosEscena = useMemo(() => partida.objetos.flatMap((id) => {
    const objeto = obtenerObjeto(id);
    return objeto ? [objeto] : [];
  }), [partida.objetos]);

  useEffect(() => {
    if (!partida.iniciada) return;
    setAhora(new Date());
    const intervalo = window.setInterval(() => setAhora(new Date()), 60000);
    return () => window.clearInterval(intervalo);
  }, [partida.iniciada]);

  useEffect(() => setNombreBorrador(mascota.nombre), [mascota.nombre]);

  const esHuevo = mascota.especieId === "huevo-luna";

  // Tocar NO abre ningún modo: en 3D la capa libre decide (mirar o acariciar);
  // en 2D el toque da un mimo instantáneo con corazones.
  const gesto = useGestoSeguro({
    umbral: 11,
    onTap: () => {
      if (interaccionCuidado) return;
      if (esHuevo) {
        alEclosionarHuevo?.();
      } else if (!webglDisponible) {
        alAccion("mimar");
      }
    },
    onMover: (punto) => {
      if (interaccionCuidado) return;
      if (punto.tipo !== "arrastre") return;
      if (!anguloGesto.current && !gestoEnMascota.current) {
        // El gesto 3D marca la hora al nacer sobre Mochi: si es reciente, es caricia, no giro.
        const marca = Number(stageRef.current?.dataset.toqueMascota ?? 0);
        if (Date.now() - marca < 350) {
          gestoEnMascota.current = true;
          return;
        }
        anguloGesto.current = { x: punto.x, angulo };
      }
      if (gestoEnMascota.current) return;
      const base = anguloGesto.current;
      if (!base) return;
      alCambiarAngulo(Math.max(-0.42, Math.min(0.42, base.angulo + (punto.finalX - base.x) * 0.0024)));
    },
    onTerminar: (punto) => {
      if (gestoEnMascota.current) {
        gestoEnMascota.current = false;
        anguloGesto.current = null;
        return;
      }
      if (interaccionCuidado) return;
      if (punto.tipo === "arrastre") {
        const base = anguloGesto.current ?? { x: punto.x, angulo };
        alCambiarAngulo(Math.max(-0.42, Math.min(0.42, base.angulo + (punto.finalX - base.x) * 0.0024)));
      }
      anguloGesto.current = null;
    },
    onCancelar: () => {
      gestoEnMascota.current = false;
      anguloGesto.current = null;
    }
  });

  const guardarNombre = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const limpio = nombreBorrador.trim().slice(0, 16);
    if (limpio) alCambiarNombre(limpio);
    setEditando(false);
  };

  return (
    <div className={`app-shell ${viewport.alturaEscasa ? "compact-landscape" : ""} ${marco.retratoDenso ? "compact-portrait" : ""} ${viewport.retrato ? "portrait-layout" : "landscape-layout"}`} data-input-source={fuenteActiva} inert={bloqueadoPorModal}>
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark"><span>{marcaRatito()}</span></span>
          <span className="brand-copy"><strong>Ratón Tama</strong><small>un pequeño gran hogar</small></span>
        </div>
        <div className="header-pet-name"><span>{mascota.nombre}</span><i>·</i><span>Gen. {String(mascota.generacion).padStart(2, "0")}</span></div>
        <div className="header-tools">
          <span className="header-coins" title="Monedas"><Coins size={16} /><strong>{partida.monedas}</strong></span>
          <div className="desktop-tools">
            <button className="top-action magic-wand-btn" type="button" onClick={() => alPanel("explorar")} title="Varita mágica: ver el juego completo" data-game-focus="true"><Wand2 size={16} /><span>Ver todo</span></button>
            <button className="top-action" type="button" onClick={() => alPanel("tienda")} data-game-focus="true"><ShoppingBag size={17} /><span>Tienda</span></button>
            <button className="top-action" type="button" onClick={() => alPanel("album")} data-game-focus="true"><BookHeart size={17} /><span>Álbum</span></button>
            <button className="top-action" type="button" onClick={() => alPanel("minijuegos")} data-game-focus="true"><Gamepad2 size={17} /><span>Jugar</span></button>
            <span className="tool-divider" />
            <button className="icon-button header-icon" type="button" aria-label={partida.preferencias.silencio ? "Activar efectos" : "Silenciar efectos"} title="Efectos" onClick={alAlternarSonido} data-game-focus="true">{partida.preferencias.silencio ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <button className="icon-button header-icon music-toggle" type="button" aria-label={partida.preferencias.musica ? "Silenciar música" : "Activar música"} title="Música" onClick={alAlternarMusica} data-game-focus="true">{partida.preferencias.musica ? <Music2 size={18} /> : <Music2 size={18} className="muted-icon" />}</button>
            <button className={`icon-button header-icon ${partida.pausada ? "pause-selected" : ""}`} type="button" aria-label={partida.pausada ? "Continuar partida" : "Pausar partida"} title={partida.pausada ? "Continuar" : "Pausa"} onClick={alAlternarPausa} data-game-focus="true">{partida.pausada ? <Sun size={18} /> : <Pause size={18} />}</button>
          </div>
          <div className="mobile-tools">
            <button className="icon-button header-icon magic-wand-btn" type="button" aria-label="Varita mágica" title="Ver todo" onClick={() => alPanel("explorar")} data-game-focus="true"><Wand2 size={17} /></button>
            <button className="icon-button header-icon" type="button" aria-label={partida.preferencias.silencio ? "Activar efectos" : "Silenciar efectos"} onClick={alAlternarSonido} data-game-focus="true">{partida.preferencias.silencio ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <button className={`icon-button header-icon ${partida.pausada ? "pause-selected" : ""}`} type="button" aria-label={partida.pausada ? "Continuar partida" : "Pausar partida"} onClick={alAlternarPausa} data-game-focus="true">{partida.pausada ? <Sun size={18} /> : <Pause size={18} />}</button>
            <button className={`icon-button header-icon ${menuMovilAbierto ? "menu-active" : ""}`} type="button" aria-label={menuMovilAbierto ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuMovilAbierto} onClick={alAlternarMenuMovil} data-game-focus="true">{menuMovilAbierto ? <X size={19} /> : <Menu size={19} />}</button>
          </div>
          <AnimatePresence>
            {menuMovilAbierto && <motion.div className="mobile-menu-popover" data-focus-scope="menu-movil" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              <button type="button" onClick={() => { alPanel("explorar"); alCerrarMenuMovil(); }} data-initial-focus="true" data-game-focus="true"><Wand2 size={17} /> Varita mágica (Ver todo)</button>
              <button type="button" onClick={() => { alPanel("tienda"); alCerrarMenuMovil(); }} data-game-focus="true"><ShoppingBag size={17} /> Tiendita</button>
              <button type="button" onClick={() => { alPanel("album"); alCerrarMenuMovil(); }} data-game-focus="true"><BookHeart size={17} /> Álbum</button>
              <button type="button" onClick={() => { alPanel("minijuegos"); alCerrarMenuMovil(); }} data-game-focus="true"><Gamepad2 size={17} /> Minijuegos</button>
              <button type="button" onClick={alAlternarSonido} data-game-focus="true">{partida.preferencias.silencio ? <VolumeX size={17} /> : <Volume2 size={17} />} Efectos {partida.preferencias.silencio ? "silenciados" : "activos"}</button>
              <button type="button" onClick={alAlternarMusica} data-game-focus="true">{partida.preferencias.musica ? <VolumeX size={17} /> : <Music2 size={17} />} Música {partida.preferencias.musica ? "activada" : "silenciada"}</button>
            </motion.div>}
          </AnimatePresence>
        </div>
      </header>

      <main className="play-layout" style={{ "--diorama-min-height": `${Math.min(marco.altoDisponible, 190)}px` } as CSSProperties}>
        <HUD mascota={mascota} />
        <section
          ref={stageRef}
          className={`game-stage ${noche ? "stage-night" : "stage-day"} ${movimiento === "aviso" ? "stage-nudge" : ""}`}
          aria-label={`Habitación de ${mascota.nombre}`}
          data-testid="game-stage"
          data-species={mascota.especieId}
          data-night={noche ? "true" : "false"}
          data-dirt={mascota.suciedad}
          data-pet-motion={movimiento}
          data-drag-food={comidaArrastrada?.modelo ?? ""}
            {...(interaccionCuidado ? {} : gesto.eventosPuntero)}
        >
          <div className="stage-room-glow" aria-hidden="true" />
          <div className="stage-topline" data-ignorar-gesto>
            <div className="stage-name-wrap">
              {editando ? (
                <form className="rename-form" onSubmit={guardarNombre}>
                  <input aria-label="Nombre de tu mascota" maxLength={16} autoFocus value={nombreBorrador} onChange={(evento) => setNombreBorrador(evento.target.value)} />
                  <button type="submit" aria-label="Guardar nombre"><ChevronDown size={16} /></button>
                </form>
              ) : <button className="stage-name-button" type="button" onClick={() => setEditando(true)} aria-label={`Cambiar el nombre de ${mascota.nombre}`} data-game-focus="true">
                <span className="stage-name">{mascota.nombre}</span><span className="stage-stage-label">{nombresEtapa[especieActual.etapa]}</span>
              </button>}
              <span className="generation-label">Generación {mascota.generacion}</span>
              {esHuevo && (
                <button className="hatch-badge-btn" type="button" onClick={alEclosionarHuevo} data-game-focus="true">
                  ✨ ¡Toca para nacer!
                </button>
              )}
            </div>
            <div className="stage-status-group">
              <span className={`daylight-indicator ${noche ? "is-night" : ""}`}>{noche ? <Moon size={13} /> : <Sun size={13} />}{noche ? "Noche" : "Día"}</span>
              <span className="stage-clock">{ahora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          <div className={`mood-callout ${aviso.clase}`} aria-live="polite" data-ignorar-gesto>
            <IconoAviso size={13} strokeWidth={2.3} />{aviso.texto}
          </div>
          {/* Globos de aviso al lado de la cabeza: nunca tapan la carita. */}
          <div className={`pet-balloons ${mascota.durmiendo ? "balloons-sleep" : ""}`} data-balloon-side="true" aria-hidden="true">
            {mascota.durmiendo ? (
              <span className="balloon balloon-zzz">Z z z</span>
            ) : globos.length > 0 ? (
              globos.map((globo, indice) => (
                <motion.span
                  key={globo.id}
                  className={`balloon ${globo.urgente ? "balloon-urgent" : "balloon-warm"}`}
                  title={globo.titulo}
                  initial={{ opacity: 0, y: 8, scale: 0.6 }}
                  animate={{ opacity: 1, y: [0, -4, 0], scale: 1 }}
                  transition={{ delay: indice * 0.12, duration: 2.1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                ><globo.icono size={15} strokeWidth={2.3} /></motion.span>
              ))
            ) : (
              <motion.span className="balloon balloon-happy" animate={{ y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
                <Heart size={14} fill="currentColor" strokeWidth={0} />
              </motion.span>
            )}
          </div>
          <div className={`scene-canvas-wrap ${mascota.durmiendo ? "pet-sleeping" : ""}`}>
            {webglDisponible ? (
              <Suspense fallback={<div className="scene-loading"><span className="loading-orbit">🥚</span><span>Preparando su rinconcito</span></div>}>
                <Escena
                  mascota={mascota}
                  especie={especie}
                  objetos={objetosEscena}
                  movimiento={movimiento}
                  animando={animando}
                  angulo={angulo}
                  ancho={viewport.ancho}
                  alto={viewport.alto}
                  reducirMovimiento={viewport.reducirMovimiento}
                  comidaArrastrada={comidaArrastrada}
                  noche={noche}
                  pausada={partida.pausada}
                  accionCuidado={interaccionCuidado}
                  faseCuidado={faseCuidado}
                  bocado={bocado}
                  juguete={juguete}
                  onProgresoCuidado={alCambiarProgresoCuidado}
                  onFaseCuidado={alCambiarFaseCuidado}
                  onCompletarCuidado={() => interaccionCuidado && alCompletarInteraccion(interaccionCuidado)}
                  cariciasLibres={partida.iniciada && !partida.pausada && !mascota.seFue && !esHuevo && !interaccionCuidado}
                  onAcariciarLibre={alAcariciarLibre}
                  onMirarLibre={alLlamarAtencion}
                  onFalloWebgl={alErrorWebgl}
                />
              </Suspense>
            ) : (
              <div className="scene-fallback-wrap">
                <Fallback2D mascota={mascota} especie={especie} reducirMovimiento={viewport.reducirMovimiento} />
                <div className="webgl-notice"><span className="notice-dot" />Vista 2D activa: puedes seguir jugando</div>
              </div>
            )}
          </div>
          <div className="stage-lowerline" aria-hidden="true">
            <span className={`stage-hint-dot ${ensuciandose ? "dot-dirty" : ""}`} />
            {mascota.durmiendo ? "Zzz · que descanse" : ensuciandose ? "Hay que limpiar un poquito" : "Desliza para girar el diorama"}
          </div>
          {comidaAbierta && <span className="food-target-ring" aria-hidden="true"><em>suéltala aquí</em></span>}
          <AnimatePresence>
            {jugueteAbierto && <SelectorJuguete juguete={juguete} alElegir={alElegirJuguete} alCerrar={alCerrarJuguete} />}
          </AnimatePresence>
          <AnimatePresence>
            {interaccionCuidado && <InteraccionCuidado
              accion={interaccionCuidado}
              progreso={progresoCuidado}
              fase={faseCuidado}
              alCancelar={alCancelarInteraccion}
            />}
            {comidaAbierta && <SelectorComida
              partida={partida}
              escenario={stageRef.current}
              alElegir={alAlimentar}
              alArrastrar={alArrastrarComida}
              mostrarFantasma2D={!webglDisponible}
              alCerrar={alCerrarComida}
              abrirTienda={alAbrirTienda}
            />}
          </AnimatePresence>
          {/* En la vista 2D no hay partículas 3D: repetimos el gesto en DOM. */}
          <AnimatePresence>
            {!webglDisponible && movimiento === "mimar" && <motion.span className="floating-heart" initial={{ opacity: 0, y: 14, scale: 0.6 }} animate={{ opacity: [0, 1, 0], y: -54, scale: [0.65, 1.2, 0.9] }} exit={{ opacity: 0 }} transition={{ duration: 1.45 }} aria-hidden="true">♥</motion.span>}
            {!webglDisponible && movimiento === "limpiar" && <motion.span className="floating-bubble" initial={{ opacity: 0, y: 10 }} animate={{ opacity: [0, 0.9, 0], y: -50 }} transition={{ duration: 1.2 }} aria-hidden="true">○</motion.span>}
          </AnimatePresence>
          {partida.pausada && <div className="paused-ribbon"><Pause size={15} fill="currentColor" /> En pausa <span>· el tiempo espera</span></div>}
        </section>
      </main>

      <div className="mobile-needs"><HUD mascota={mascota} compacto /></div>

      <footer className="game-footer">
        {menuTernuraAbierto ? (
          <BarraTernura alAnimar={alAnimarTernura} alCerrar={alCerrarTernura} mandoConectado={mandoConectado} />
        ) : (
          <BarraAcciones
            alElegir={alAccion}
            deshabilitado={!partida.iniciada || partida.pausada || mascota.seFue || Boolean(interaccionCuidado)}
            durmiendo={mascota.durmiendo}
            enferma={mascota.enferma}
            medicinas={partida.medicinas}
            mandoConectado={mandoConectado}
          />
        )}
      </footer>
    </div>
  );
}