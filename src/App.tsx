import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart } from "lucide-react";
import { comprarComida, comprarMedicina, comprarObjeto } from "./game/economia";
import { LOGROS } from "./game/logros";
import { obtenerEspecie } from "./game/especies";
import { acariciarLibre as acariciarLibrePartida, alimentar, alternarPausa as cambiarEstadoPausa, aplicarCuidado, comenzarPartida, confirmarDespedida, confirmarEvolucion, cobrarMinijuego, eclosionarHuevo, prepararNuevaGeneracion, simularHoras } from "./game/simulacion";
import { configurarAudio, despertarAudio, sonar, voz } from "./game/sound";
import { cargarPartida, flushGuardado, guardarPartida } from "./game/storage";
import type { ArrastreComida } from "./game/types";
import { fasesCuidado, objetivoCuidado } from "./game/cuidados";
import { BALANCE } from "./game/balance";
import type { AccionCuidado } from "./game/cuidados";
import { obtenerComida } from "./game/comidas";
import type { ModeloComida } from "./components/IconoComida";
import type { TipoJuguete } from "./components/SelectorJuguete";
import type { AccionEntrada, FuenteEntrada, Partida, ResumenAusencia as ResumenTipo } from "./game/types";
import type { MiniJuego } from "./game/minijuegos";
import { OBJETOS } from "./game/objetos";
import { COMIDAS } from "./game/comidas";
import { useEntrada } from "./hooks/useEntrada";
import { vibrarMando } from "./hooks/useGamepad";
import { useTiempoReal } from "./hooks/useTiempoReal";
import AvisoMando from "./components/AvisoMando";
import Enciclopedia from "./components/Enciclopedia";
import Fondo from "./components/Fondo";
import MinijuegosMenu from "./components/MinijuegosMenu";
import PanelExploracion from "./components/PanelExploracion";
import Tienda from "./components/Tienda";
import type { SeccionTienda } from "./components/Tienda";
import EvolucionScreen from "./screens/EvolucionScreen";
import GameScreen from "./screens/GameScreen";
import GeneracionScreen from "./screens/GeneracionScreen";
import MiniJuegoScreen from "./screens/MiniJuegoScreen";
import StartScreen from "./screens/StartScreen";
import ResumenAusencia from "./components/ResumenAusencia";
import type { AccionBarra } from "./components/BarraAcciones";
import { useViewport } from "./hooks/useViewport";

type Panel = "tienda" | "album" | "minijuegos" | "explorar" | null;

export default function App() {
  const [cargaInicial] = useState(() => cargarPartida());
  const [partida, setPartida] = useState<Partida>(cargaInicial.partida);
  const [resumen, setResumen] = useState<ResumenTipo | null>(cargaInicial.resumen);
  const [panel, setPanel] = useState<Panel>(null);
  const [seccionTienda, setSeccionTienda] = useState<SeccionTienda>("despensa");
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [comidaAbierta, setComidaAbierta] = useState(false);
  const [comidaArrastrada, setComidaArrastrada] = useState<ArrastreComida | null>(null);
  const [jugueteAbierto, setJugueteAbierto] = useState(false);
  const [juguete, setJuguete] = useState<TipoJuguete>("pelota");
  const [menuTernuraAbierto, setMenuTernuraAbierto] = useState(false);
  const [interaccionCuidado, setInteraccionCuidado] = useState<AccionCuidado | null>(null);
  const [progresoCuidado, setProgresoCuidado] = useState(0);
  const [faseCuidado, setFaseCuidado] = useState(0);
  const [bocado, setBocado] = useState<ModeloComida | null>(null);
  const temporizadorBocado = useRef<number | null>(null);
  const [juegoActivo, setJuegoActivo] = useState<MiniJuego | null>(null);
  const [controlMinijuegoActivo, setControlMinijuegoActivo] = useState(false);
  const [forzarNoche, setForzarNoche] = useState<boolean | null>(null);
  const [angulo, setAngulo] = useState(0);
  const [movimiento, setMovimiento] = useState("idle");
  const [animando, setAnimando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [avisoMando, setAvisoMando] = useState(false);
  const [webglAvisado, setWebglAvisado] = useState(false);
  const partidaRef = useRef(partida);
  const entradaMiniJuego = useRef<((accion: AccionEntrada) => void) | null>(null);
  const temporizadorAviso = useRef<number | null>(null);
  const temporizadorAnimacion = useRef<number | null>(null);
  const temporizadorSacudida = useRef<number | null>(null);
  const progresoCuidadoRef = useRef(0);
  const logrosPrevios = useRef<Set<string>>(new Set(partida.logros));
  const mandoAnterior = useRef(false);
  const ultimaEvolucion = useRef<string | null>(null);
  const focoMenuMovil = useRef<HTMLElement | null>(null);
  const focoAntesDeModal = useRef<HTMLElement | null>(null);
  const viewport = useViewport();
  partidaRef.current = partida;

  const ambitoModal = !partida.iniciada ? "inicio"
    : juegoActivo ? "minijuego"
      : panel ? panel
        : partida.evolucionPendiente ? "evolucion"
          : partida.despedidaPendiente ? "generacion"
            : resumen ? "ausencia"
               : jugueteAbierto ? "juguete"
                 : comidaAbierta ? "comida"
                   : interaccionCuidado ? "cuidado" : null;

  useEffect(() => {
    if (!ambitoModal) {
      const anterior = focoAntesDeModal.current;
      focoAntesDeModal.current = null;
      if (anterior?.isConnected) anterior.focus();
      return;
    }
    if (!focoAntesDeModal.current && document.activeElement instanceof HTMLElement) {
      focoAntesDeModal.current = document.activeElement;
    }
    const frame = window.requestAnimationFrame(() => {
      const dialogo = document.querySelector<HTMLElement>(`[data-focus-scope="${ambitoModal}"]`);
      const destino = dialogo?.querySelector<HTMLElement>("[data-initial-focus]:not([disabled])")
        ?? dialogo?.querySelector<HTMLElement>("button:not([disabled])");
      destino?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [ambitoModal]);

  useEffect(() => {
    if (menuMovilAbierto) {
      const frame = window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>("[data-focus-scope='menu-movil'] [data-initial-focus]")?.focus();
      });
      return () => window.cancelAnimationFrame(frame);
    }
    const menu = focoMenuMovil.current;
    focoMenuMovil.current = null;
    if (menu?.isConnected) menu.focus();
  }, [menuMovilAbierto]);

  const actualizarPartida = useCallback((actualizador: (actual: Partida) => Partida) => {
    setPartida(actualizador);
  }, []);
  // Al volver de otra pestaña o app, se cuenta con iconos qué pasó mientras no estabas.
  useTiempoReal({ obtenerPartida: () => partidaRef.current, actualizar: actualizarPartida, alAusencia: setResumen });

  useEffect(() => {
    guardarPartida(partida);
  }, [partida]);

  const horaActual = new Date().getHours();
  const esNocheCalculada = forzarNoche !== null ? forzarNoche : (horaActual >= 20 || horaActual < 7);

  useEffect(() => {
    configurarAudio({
      silencio: partida.preferencias.silencio,
      musica: partida.preferencias.musica,
      noche: esNocheCalculada,
      animo: partida.mascota.necesidades.animo
    });
  }, [partida.preferencias.musica, partida.preferencias.silencio, partida.mascota.necesidades.animo, esNocheCalculada]);

  useEffect(() => {
    if (partida.evolucionPendiente) {
      const id = `${partida.evolucionPendiente.desde}:${partida.evolucionPendiente.hasta}`;
      if (ultimaEvolucion.current !== id) {
        ultimaEvolucion.current = id;
        sonar("evolucion");
        if (partida.preferencias.vibracion) vibrarMando(180);
        activarAnimacion("evolucion");
      }
    } else {
      ultimaEvolucion.current = null;
    }
  }, [partida.evolucionPendiente, partida.preferencias.vibracion]);

  // Los homenajes y evoluciones tienen prioridad sobre cualquier panel abierto.
  useEffect(() => {
    if (!partida.evolucionPendiente && !partida.despedidaPendiente && !resumen) return;
    setPanel(null);
    setComidaAbierta(false);
    setComidaArrastrada(null);
    setInteraccionCuidado(null);
    setMenuMovilAbierto(false);
    setMenuTernuraAbierto(false);
    setJuegoActivo(null);
    setControlMinijuegoActivo(false);
    entradaMiniJuego.current = null;
  }, [partida.evolucionPendiente, partida.despedidaPendiente, resumen]);

  useEffect(() => {
    if (!menuTernuraAbierto) return;
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[data-focus-scope='ternura'] [data-initial-focus]")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [menuTernuraAbierto]);

  useEffect(() => () => {
    if (temporizadorAviso.current !== null) window.clearTimeout(temporizadorAviso.current);
    if (temporizadorAnimacion.current !== null) window.clearTimeout(temporizadorAnimacion.current);
    if (temporizadorSacudida.current !== null) window.clearTimeout(temporizadorSacudida.current);
    if (temporizadorBocado.current !== null) window.clearTimeout(temporizadorBocado.current);
  }, []);

  // Al ocultar la pestaña se vuelca el guardado de inmediato (IndexedDB + espejo).
  useEffect(() => {
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "hidden") flushGuardado();
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("pagehide", alCambiarVisibilidad);
    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("pagehide", alCambiarVisibilidad);
    };
  }, []);

  // Aviso amable + sacudida suave del diorama: nunca un castigo duro.
  const mostrarAviso = useCallback((texto: string) => {
    setAviso(texto);
    if (temporizadorAviso.current !== null) window.clearTimeout(temporizadorAviso.current);
    temporizadorAviso.current = window.setTimeout(() => setAviso(null), 2600);
    if (temporizadorSacudida.current !== null) window.clearTimeout(temporizadorSacudida.current);
    setMovimiento("aviso");
    temporizadorSacudida.current = window.setTimeout(() => setMovimiento("idle"), 520);
  }, []);

  const activarAnimacion = useCallback((tipo: string) => {
    // Una sacudida de aviso que siga pendiente no debe cortar el bostezo/salto.
    if (temporizadorSacudida.current !== null) {
      window.clearTimeout(temporizadorSacudida.current);
      temporizadorSacudida.current = null;
    }
    if (temporizadorAnimacion.current !== null) window.clearTimeout(temporizadorAnimacion.current);
    setMovimiento(tipo);
    setAnimando(!viewport.reducirMovimiento);
    temporizadorAnimacion.current = window.setTimeout(() => {
      setMovimiento("idle");
      setAnimando(false);
    }, viewport.reducirMovimiento ? 320 : 1650);
  }, [viewport.reducirMovimiento]);

  const iniciarJuego = useCallback(() => {
    despertarAudio();
    setPartida((actual) => comenzarPartida(actual));
    sonar("mimo");
  }, []);

  const aplicarAccionDirecta = useCallback((accion: Exclude<AccionBarra, "comer">): boolean => {
    const actual = partidaRef.current;
    if (!actual.iniciada || actual.pausada || actual.mascota.seFue) return false;
    despertarAudio();
    if (accion === "curar" && !actual.mascota.enferma && actual.mascota.necesidades.salud >= 92) {
      mostrarAviso("Su salud está muy bien.");
      return false;
    }
    setPartida((partidaActual) => aplicarCuidado(partidaActual, accion));
    if (accion === "jugar") {
      sonar("jugar");
      activarAnimacion("jugar");
    } else if (accion === "limpiar") {
      sonar("limpiar");
      activarAnimacion("limpiar");
    } else if (accion === "dormir") {
      sonar("dormir");
      activarAnimacion("dormir");
    } else if (accion === "curar") {
      sonar("curar");
      activarAnimacion("curar");
    } else {
      sonar("mimo");
      activarAnimacion("mimar");
    }
    const especie = obtenerEspecie(actual.mascota.especieId);
    voz(especie.etapa, actual.mascota.necesidades.animo);
    if (actual.preferencias.vibracion && (accion === "curar" || accion === "mimar")) vibrarMando(55);
    return true;
  }, [activarAnimacion, mostrarAviso]);

  const ejecutarAccion = useCallback((accion: AccionBarra) => {
    const actual = partidaRef.current;
    if (!actual.iniciada || actual.pausada || actual.mascota.seFue) return;
    if (accion === "comer") {
      setInteraccionCuidado(null);
      setJugueteAbierto(false);
      setComidaAbierta(true);
      despertarAudio();
      return;
    }
    if (accion === "jugar") {
      // Primero el juguetero: tú eliges pelota, palo o estrella.
      setInteraccionCuidado(null);
      setComidaAbierta(false);
      setPanel(null);
      setJugueteAbierto(true);
      despertarAudio();
      return;
    }
    if (accion === "dormir" || accion === "mimar") {
      // Dormir y mimar son instantáneos: las caricias además viven libres en el diorama.
      aplicarAccionDirecta(accion);
      return;
    }
    if (accion === "curar" && !actual.mascota.enferma && actual.mascota.necesidades.salud >= 92) {
      mostrarAviso("Su salud está muy bien.");
      return;
    }
    // Jugar, limpiar y curar se resuelven con un gesto físico sobre el diorama.
    setComidaAbierta(false);
    setPanel(null);
    setInteraccionCuidado(accion);
    setFaseCuidado(0);
    progresoCuidadoRef.current = 0;
    setProgresoCuidado(0);
    despertarAudio();
  }, [aplicarAccionDirecta, mostrarAviso]);

  /** Cierra el cuidado sin aplicar nada: Escape, botón ✕ o B en el mando. */
  const cerrarCuidado = useCallback(() => {
    setInteraccionCuidado(null);
    setFaseCuidado(0);
    progresoCuidadoRef.current = 0;
    setProgresoCuidado(0);
  }, []);

  /** Elección del juguetero: al elegir sale el juguete al diorama y empieza el juego. */
  const elegirJuguete = useCallback((tipo: TipoJuguete) => {
    despertarAudio();
    setJuguete(tipo);
    setJugueteAbierto(false);
    setComidaAbierta(false);
    setPanel(null);
    setInteraccionCuidado("jugar");
    setFaseCuidado(0);
    progresoCuidadoRef.current = 0;
    setProgresoCuidado(0);
    sonar(tipo === "pelota" ? "bote" : tipo === "palo" ? "palo" : "estrella");
  }, []);

  const completarInteraccionCuidado = useCallback((accion: AccionCuidado) => {
    const total = objetivoCuidado(accion);
    progresoCuidadoRef.current = total;
    setProgresoCuidado(total);
    setFaseCuidado(Math.max(0, fasesCuidado(accion).length - 1));
    window.setTimeout(cerrarCuidado, 240);
    aplicarAccionDirecta(accion);
  }, [aplicarAccionDirecta, cerrarCuidado]);

  // El progreso y la fase las dicta el 3D; aquí solo se reflejan en el HUD.
  const cambiarProgresoCuidado = useCallback((progreso: number, fase: number) => {
    if (progreso > progresoCuidadoRef.current && partidaRef.current.preferencias.vibracion) vibrarMando(20);
    progresoCuidadoRef.current = progreso;
    setProgresoCuidado(progreso);
    setFaseCuidado(fase);
  }, []);

  // Caricia libre desde el diorama: corazones y vínculo sin abrir ningún modo.
  const acariciarLibre = useCallback(() => {
    despertarAudio();
    const actualizado = acariciarLibrePartida(partidaRef.current);
    if (!actualizado) return;
    setPartida(actualizado);
    activarAnimacion("mimar");
    if (actualizado.preferencias.vibracion) vibrarMando(25);
  }, [activarAnimacion]);

  // Toque que llama la atención: Mochi mira al punto un instante.
  const llamarAtencion = useCallback(() => {
    despertarAudio();
    activarAnimacion("atencion");
  }, [activarAnimacion]);

  const alimentarMascota = useCallback((id: string) => {
    despertarAudio();
    const actualizado = alimentar(partidaRef.current, id);
    if (!actualizado) {
      mostrarAviso("No queda de eso. La tiendita está cerquita.");
      return;
    }
    setPartida(actualizado);
    setComidaAbierta(false);
    sonar("comer");
    activarAnimacion("comer");
    // El bocado aparece en sus patitas y se achica a mordiscos dentro del Canvas.
    setBocado(obtenerComida(id)?.modelo ?? "onigiri");
    if (temporizadorBocado.current !== null) window.clearTimeout(temporizadorBocado.current);
    temporizadorBocado.current = window.setTimeout(() => {
      setBocado(null);
      temporizadorBocado.current = null;
    }, 1500);
    const especie = obtenerEspecie(actualizado.mascota.especieId);
    voz(especie.etapa, actualizado.mascota.necesidades.animo);
    if (actualizado.preferencias.vibracion) vibrarMando(45);
  }, [activarAnimacion, mostrarAviso]);

  const abrirPanel = useCallback((nuevoPanel: Exclude<Panel, null>) => {
    if (!partidaRef.current.iniciada || partidaRef.current.mascota.seFue) return;
    despertarAudio();
    setMenuMovilAbierto(false);
    setMenuTernuraAbierto(false);
    setComidaAbierta(false);
    cerrarCuidado();
    if (nuevoPanel === "tienda") setSeccionTienda("despensa");
    setPanel(nuevoPanel);
  }, [cerrarCuidado]);

  const alternarMenuMovil = useCallback(() => {
    if (!menuMovilAbierto && document.activeElement instanceof HTMLElement) focoMenuMovil.current = document.activeElement;
    setMenuMovilAbierto((abierto) => !abierto);
  }, [menuMovilAbierto]);

  const cerrarMenuMovil = useCallback(() => setMenuMovilAbierto(false), []);

  const alternarPausa = useCallback(() => {
    const actual = partidaRef.current;
    if (!actual.iniciada || actual.mascota.seFue) return;
    despertarAudio();
    // Pausar también cierra el cuidado en marcha: nada queda a medias.
    cerrarCuidado();
    setPartida((anterior) => cambiarEstadoPausa(anterior));
  }, [cerrarCuidado]);

  const alternarSonido = useCallback(() => {
    despertarAudio();
    setPartida((actual) => ({
      ...actual,
      preferencias: { ...actual.preferencias, silencio: !actual.preferencias.silencio }
    }));
    mostrarAviso(partidaRef.current.preferencias.silencio ? "Efectos activados" : "Efectos silenciados");
  }, [mostrarAviso]);

  const alternarMusica = useCallback(() => {
    despertarAudio();
    setPartida((actual) => ({
      ...actual,
      preferencias: { ...actual.preferencias, musica: !actual.preferencias.musica }
    }));
    mostrarAviso(partidaRef.current.preferencias.musica ? "Música silenciada" : "Música activada");
  }, [mostrarAviso]);

  const comprarItemComida = useCallback((id: string) => {
    const compra = comprarComida(partidaRef.current, id);
    if (!compra) {
      sonar("error");
      mostrarAviso("Aún faltan algunas moneditas.");
      return;
    }
    setPartida(compra);
    sonar("compra");
    mostrarAviso("Guardado en la despensa.");
  }, [mostrarAviso]);

  const comprarItemObjeto = useCallback((id: string) => {
    const compra = comprarObjeto(partidaRef.current, id);
    if (!compra) {
      sonar("error");
      mostrarAviso("Aún faltan algunas moneditas.");
      return;
    }
    setPartida(compra);
    sonar("compra");
    mostrarAviso("Su habitación tiene algo nuevo.");
    if (compra.preferencias.vibracion) vibrarMando(60);
  }, [mostrarAviso]);

  const comprarUnaMedicina = useCallback(() => {
    const compra = comprarMedicina(partidaRef.current);
    if (!compra) {
      sonar("error");
      mostrarAviso("Aún faltan algunas moneditas.");
      return;
    }
    setPartida(compra);
    sonar("compra");
    mostrarAviso("Una medicina más en el botiquín.");
  }, [mostrarAviso]);

  const animarCriaturaDirecta = useCallback((tipo: string) => {
    despertarAudio();
    if (tipo === "bostezo") sonar("bostezo");
    else if (tipo === "jugar") sonar("jugar");
    else if (tipo === "comer") sonar("comer");
    else if (tipo === "evolucion") sonar("evolucion");
    activarAnimacion(tipo);
    if (partidaRef.current.preferencias.vibracion) vibrarMando(50);
  }, [activarAnimacion]);

  const registrarEntradaMinijuego = useCallback((manejador: ((accion: AccionEntrada) => void) | null) => {
    entradaMiniJuego.current = manejador;
  }, []);

  const manejarEntrada = useCallback((accion: AccionEntrada, _fuente: FuenteEntrada) => {
    if (juegoActivo) {
      entradaMiniJuego.current?.(accion);
      return;
    }
    if (jugueteAbierto) {
      if (accion === "cancelar") setJugueteAbierto(false);
      return;
    }
    if (menuTernuraAbierto) {
      if (accion === "cancelar") setMenuTernuraAbierto(false);
      if (accion === "accionRapida1") animarCriaturaDirecta("bostezo");
      if (accion === "accionRapida2") animarCriaturaDirecta("jugar");
      if (accion === "accionRapida3") animarCriaturaDirecta("comer");
      if (accion === "accionRapida4") animarCriaturaDirecta("evolucion");
      return;
    }
    if (interaccionCuidado) {
      if (accion === "cancelar") cerrarCuidado();
      const avanza = accion === "confirmar" || accion === "accionRapida2" || accion === "accionRapida3";
      if (avanza) {
        // Accesibilidad: Enter/A equivale a UNA pasada, nunca salta el ritual.
        const siguiente = Math.min(objetivoCuidado(interaccionCuidado), progresoCuidadoRef.current + 1);
        cambiarProgresoCuidado(siguiente, faseCuidado);
        if (interaccionCuidado === "limpiar") {
          const objetivoFase = (faseCuidado + 1) * BALANCE.cuidados.limpieza.manchas;
          if (siguiente >= objetivoFase) {
            if (faseCuidado < fasesCuidado("limpiar").length - 1) {
              setFaseCuidado(faseCuidado + 1);
              sonar("logro");
            } else {
              completarInteraccionCuidado(interaccionCuidado);
            }
          }
        } else if (siguiente >= objetivoCuidado(interaccionCuidado)) {
          completarInteraccionCuidado(interaccionCuidado);
        }
      }
      return;
    }
    if (accion === "pestanaAnterior" || accion === "pestanaSiguiente") {
      if (panel === "tienda") {
        const seccion = accion === "pestanaAnterior" ? "despensa" : "rincon";
        setSeccionTienda(seccion);
        window.requestAnimationFrame(() => {
          document.querySelector<HTMLElement>(`[data-focus-scope="tienda"] [role="tab"][aria-selected="true"]`)?.focus();
        });
      }
      return;
    }
    if (accion === "cancelar") {
      if (panel) setPanel(null);
      else if (comidaAbierta) setComidaAbierta(false);
      else if (menuMovilAbierto) cerrarMenuMovil();
      else if (resumen) setResumen(null);
      else if (partidaRef.current.evolucionPendiente) setPartida((actual) => confirmarEvolucion(actual));
      return;
    }
    if (panel || comidaAbierta || resumen || partidaRef.current.evolucionPendiente || partidaRef.current.despedidaPendiente) return;
    if (!partidaRef.current.iniciada) return;
    if (accion === "pausa") {
      alternarPausa();
      return;
    }
    if (accion === "menu") {
      abrirPanel("album");
      return;
    }
    if (accion === "accionRapida1") ejecutarAccion("comer");
    if (accion === "accionRapida2") ejecutarAccion("jugar");
    if (accion === "accionRapida3") ejecutarAccion("limpiar");
    if (accion === "accionRapida4") ejecutarAccion("mimar");
  }, [abrirPanel, alternarPausa, animarCriaturaDirecta, cambiarProgresoCuidado, cerrarCuidado, cerrarMenuMovil, completarInteraccionCuidado, comidaAbierta, ejecutarAccion, faseCuidado, interaccionCuidado, juegoActivo, jugueteAbierto, menuMovilAbierto, menuTernuraAbierto, panel, resumen]);
  const { mandoConectado, fuenteActiva } = useEntrada(manejarEntrada, { modoJuego: controlMinijuegoActivo });

  useEffect(() => {
    if (mandoConectado && !mandoAnterior.current) {
      setAvisoMando(true);
      window.setTimeout(() => setAvisoMando(false), 3200);
    }
    mandoAnterior.current = mandoConectado;
  }, [mandoConectado]);

  // Detecta logros recién conseguidos y lo celebra con campanita y aviso visual.
  useEffect(() => {
    const nuevos = partida.logros.filter((id) => !logrosPrevios.current.has(id));
    if (nuevos.length === 0) return;
    logrosPrevios.current = new Set(partida.logros);
    const conseguido = LOGROS.find((logro) => logro.id === nuevos[0]);
    if (!conseguido) return;
    sonar("logro");
    mostrarAviso(`Logro: ${conseguido.nombre}`);
    if (partida.preferencias.vibracion) vibrarMando(70);
  }, [partida.logros, partida.preferencias.vibracion, mostrarAviso]);

  const cobrarJuego = useCallback((juego: MiniJuego, puntuacion: number, monedas: number) => {
    setPartida((actual) => cobrarMinijuego(actual, juego.id, puntuacion, monedas));
    sonar("jugar");
    mostrarAviso(`¡${partidaRef.current.mascota.nombre} ganó ${monedas} moneditas!`);
    activarAnimacion("jugar");
    if (partidaRef.current.preferencias.vibracion) vibrarMando(80);
  }, [activarAnimacion, mostrarAviso]);

  const comenzarMinijuego = useCallback((juego: MiniJuego) => {
    if (partidaRef.current.pausada || !partidaRef.current.iniciada || partidaRef.current.mascota.seFue) {
      mostrarAviso("Reanuda la partida antes de jugar.");
      return;
    }
    setPanel(null);
    setMenuTernuraAbierto(false);
    setJuegoActivo(juego);
    setControlMinijuegoActivo(true);
    despertarAudio();
  }, [mostrarAviso]);

  const cerrarMinijuego = useCallback(() => {
    setJuegoActivo(null);
    setControlMinijuegoActivo(false);
    entradaMiniJuego.current = null;
  }, []);

  const cerrarResumen = useCallback(() => setResumen(null), []);
  const cerrarEvolucion = useCallback(() => setPartida((actual) => confirmarEvolucion(actual)), []);
  const nuevaGeneracion = useCallback(() => {
    despertarAudio();
    setPartida((actual) => prepararNuevaGeneracion(confirmarDespedida(actual)));
    sonar("evolucion");
    activarAnimacion("evolucion");
  }, [activarAnimacion]);
  const renombrarMascota = useCallback((nombre: string) => {
    setPartida((actual) => ({ ...actual, mascota: { ...actual.mascota, nombre } }));
  }, []);
  const falloWebgl = useCallback(() => {
    if (webglAvisado) return;
    setWebglAvisado(true);
    mostrarAviso("Vista 2D activada. Puedes seguir cuidando a tu peque.");
  }, [mostrarAviso, webglAvisado]);

  const eclosionarHuevoDirecto = useCallback(() => {
    despertarAudio();
    setPartida((actual) => eclosionarHuevo(actual));
    sonar("evolucion");
    activarAnimacion("evolucion");
    mostrarAviso("¡Mochi ha roto el cascarón!");
  }, [activarAnimacion, mostrarAviso]);

  const cambiarEspecieDirecta = useCallback((especieId: string) => {
    despertarAudio();
    setPartida((actual) => ({
      ...actual,
      mascota: { ...actual.mascota, especieId, edadEtapaMs: 0, seFue: false },
      evolucionPendiente: null,
      despedidaPendiente: false,
      descubrimientos: actual.descubrimientos.includes(especieId) ? actual.descubrimientos : [...actual.descubrimientos, especieId]
    }));
    const esp = obtenerEspecie(especieId);
    sonar("mimo");
    voz(esp.etapa, partidaRef.current.mascota.necesidades.animo);
    mostrarAviso(`Ahora es ${esp.nombre}`);
  }, [mostrarAviso]);

  /** Cierra el modal para que el diorama quede visible y reemplaza la barra inferior. */
  const abrirMenuTernura = useCallback(() => {
    setPanel(null);
    setMenuMovilAbierto(false);
    setComidaAbierta(false);
    setComidaArrastrada(null);
    setJugueteAbierto(false);
    cerrarCuidado();
    setMenuTernuraAbierto(true);
  }, [cerrarCuidado]);

  const avanzarHorasDirecto = useCallback((horas: number) => {
    const actual = partidaRef.current;
    if (!actual.iniciada || actual.pausada) {
      mostrarAviso(actual.pausada ? "Reanuda la partida para avanzar el tiempo." : "Pulsa ¡Empezar! antes de avanzar el reloj.");
      return;
    }
    const simulada = simularHoras(actual, horas);
    if (simulada === actual) {
      mostrarAviso("No se pudo avanzar el reloj.");
      return;
    }
    setPartida(simulada);
    sonar("jugar");
    mostrarAviso(`Tiempo avanzado ${horas} horas`);
    if (simulada.evolucionPendiente && !actual.evolucionPendiente) sonar("evolucion");
    if (simulada.mascota.suciedad > actual.mascota.suciedad) sonar("limpiar");
  }, [mostrarAviso]);

  const alternarDiaNocheDirecto = useCallback(() => {
    const proximo = !esNocheCalculada;
    setForzarNoche(proximo);
    mostrarAviso(proximo ? "Modo Noche activado" : "Modo Día activado");
  }, [esNocheCalculada, mostrarAviso]);

  const darMonedasDirecto = useCallback((cantidad: number) => {
    setPartida((actual) => ({ ...actual, monedas: actual.monedas + cantidad }));
    sonar("compra");
    mostrarAviso(`+${cantidad} monedas agregadas`);
  }, [mostrarAviso]);

  const llenarDespensaDirecto = useCallback(() => {
    setPartida((actual) => {
      const nuevo: Record<string, number> = { ...actual.comidas };
      for (const comida of COMIDAS) nuevo[comida.id] = (nuevo[comida.id] ?? 0) + 5;
      return { ...actual, comidas: nuevo };
    });
    sonar("compra");
    mostrarAviso("Despensa llena con todos los bocaditos");
  }, [mostrarAviso]);

  const desbloquearMueblesDirecto = useCallback(() => {
    setPartida((actual) => ({
      ...actual,
      objetos: [...new Set([...actual.objetos, ...OBJETOS.map((o) => o.id)])]
    }));
    sonar("compra");
    mostrarAviso("Todos los muebles y accesorios desbloqueados");
  }, [mostrarAviso]);

  const origenEvolucion = partida.evolucionPendiente
    ? obtenerEspecie(partida.evolucionPendiente.desde)
    : null;
  const destinoEvolucion = partida.evolucionPendiente
    ? obtenerEspecie(partida.evolucionPendiente.hasta)
    : null;

  return (
    <div className="app-root">
      <Fondo />
      <GameScreen
        partida={partida}
        bloqueadoPorModal={
          ambitoModal !== null &&
          ambitoModal !== "comida" &&
          ambitoModal !== "cuidado" &&
          ambitoModal !== "juguete"
        }
        ambienteNoche={esNocheCalculada}
        menuMovilAbierto={menuMovilAbierto}
        comidaAbierta={comidaAbierta}
        comidaArrastrada={comidaArrastrada}
        interaccionCuidado={interaccionCuidado}
        progresoCuidado={progresoCuidado}
        faseCuidado={faseCuidado}
        bocado={bocado}
        jugueteAbierto={jugueteAbierto}
        juguete={juguete}
        menuTernuraAbierto={menuTernuraAbierto}
        alElegirJuguete={elegirJuguete}
        alCerrarJuguete={() => setJugueteAbierto(false)}
        alAnimarTernura={animarCriaturaDirecta}
        alCerrarTernura={() => setMenuTernuraAbierto(false)}
        alAcariciarLibre={acariciarLibre}
        alLlamarAtencion={llamarAtencion}
        movimiento={movimiento}
        animando={animando}
        angulo={angulo}
        mandoConectado={mandoConectado}
        fuenteActiva={fuenteActiva}
        alCambiarAngulo={setAngulo}
        alAccion={ejecutarAccion}
        alPanel={abrirPanel}
        alAlternarSonido={alternarSonido}
        alAlternarMusica={alternarMusica}
        alAlternarPausa={alternarPausa}
        alCambiarNombre={renombrarMascota}
        alCerrarComida={() => setComidaAbierta(false)}
        alArrastrarComida={setComidaArrastrada}
        alCompletarInteraccion={completarInteraccionCuidado}
        alCancelarInteraccion={cerrarCuidado}
        alCambiarProgresoCuidado={cambiarProgresoCuidado}
        alCambiarFaseCuidado={setFaseCuidado}
        alAlimentar={alimentarMascota}
        alAbrirTienda={() => abrirPanel("tienda")}
        alErrorWebgl={falloWebgl}
        alEclosionarHuevo={eclosionarHuevoDirecto}
        alAlternarMenuMovil={alternarMenuMovil}
        alCerrarMenuMovil={cerrarMenuMovil}
      />

      {!partida.iniciada && <StartScreen nombre={partida.mascota.nombre} esHuevo={partida.mascota.especieId === "huevo-luna"} alEmpezar={iniciarJuego} />}
      {resumen && partida.iniciada && <ResumenAusencia resumen={resumen} alCerrar={cerrarResumen} />}
      {partida.despedidaPendiente && <GeneracionScreen nombre={partida.mascota.nombre} generacion={partida.mascota.generacion} alContinuar={nuevaGeneracion} />}
      {!partida.despedidaPendiente && origenEvolucion && destinoEvolucion && <EvolucionScreen desde={origenEvolucion} hasta={destinoEvolucion} nombre={partida.mascota.nombre} alContinuar={cerrarEvolucion} />}

      <AnimatePresence>
        {panel === "tienda" && <Tienda partida={partida} seccion={seccionTienda} alCambiarSeccion={setSeccionTienda} alCerrar={() => setPanel(null)} alComprarComida={comprarItemComida} alComprarObjeto={comprarItemObjeto} alComprarMedicina={comprarUnaMedicina} />}
        {panel === "album" && <Enciclopedia partida={partida} alCerrar={() => setPanel(null)} />}
        {panel === "minijuegos" && <MinijuegosMenu partida={partida} alCerrar={() => setPanel(null)} alEmpezar={comenzarMinijuego} />}
        {panel === "explorar" && (
          <PanelExploracion
            partida={partida}
            alCerrar={() => setPanel(null)}
            alCambiarEspecie={cambiarEspecieDirecta}
            alAbrirTernura={abrirMenuTernura}
            alAvanzarTiempo={avanzarHorasDirecto}
            alAlternarDiaNoche={alternarDiaNocheDirecto}
            alDarMonedas={darMonedasDirecto}
            alLlenarDespensa={llenarDespensaDirecto}
            alDesbloquearMuebles={desbloquearMueblesDirecto}
            esDeNoche={esNocheCalculada}
          />
        )}
        {juegoActivo && <MiniJuegoScreen key={juegoActivo.id} juego={juegoActivo} mandoConectado={mandoConectado} alCerrar={cerrarMinijuego} alCobrar={(puntuacion, monedas) => cobrarJuego(juegoActivo, puntuacion, monedas)} alRegistrarEntrada={registrarEntradaMinijuego} alControlActivo={setControlMinijuegoActivo} />}
      </AnimatePresence>

      <AvisoMando visible={avisoMando} />
      <AnimatePresence>
        {aviso && <motion.div className="status-toast" role="status" aria-live="polite" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 7 }}>
          <span className="toast-icon"><Check size={15} /></span><span>{aviso}</span>
        </motion.div>}
      </AnimatePresence>
      <span className="sr-only"><Heart />{partida.mascota.nombre} está en la generación {partida.mascota.generacion}.</span>
    </div>
  );
}