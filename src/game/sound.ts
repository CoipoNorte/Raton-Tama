import type { Etapa } from "./types";

/**
 * Motor de audio 100 % sintetizado (sin archivos). Dos buses independientes
 * (efectos / música) sobre un compresor suave, y música generativa con
 * scheduler tipo *lookahead* para que el tempo no dependa del framerate.
 * Nunca lanza excepciones: si el navegador bloquea WebAudio, el juego sigue.
 */

export type EfectoSonido =
  | "comer"
  | "masticar"
  | "jugar"
  | "bote"
  | "palo"
  | "estrella"
  | "agarre"
  | "limpiar"
  | "agua"
  | "toalla"
  | "dormir"
  | "curar"
  | "enfermar"
  | "evolucion"
  | "compra"
  | "error"
  | "mimo"
  | "toque"
  | "logro"
  | "bostezo";

type Destino = "sfx" | "musica";

let contexto: AudioContext | null = null;
let master: GainNode | null = null;
let busEfectos: GainNode | null = null;
let busMusica: GainNode | null = null;
let bufferRuido: AudioBuffer | null = null;

let sonidoActivado = true;
let musicaActivada = true;
let esDeNoche = false;
let animoActual = 70;
let despierto = false;

let temporizador: number | null = null;
let pasoRed = 0;
let proximoTiempo = 0;

// Progresión amable en pentatónica: I - vi - IV - V (grados seguros).
const CAMPOS = [
  { base: 0, notas: [0, 4, 7] },
  { base: 5, notas: [0, 3, 7] },
  { base: 7, notas: [0, 4, 7] },
  { base: 2, notas: [0, 4, 6] }
];
const PENTATONICA = [0, 2, 4, 7, 9];
/** Raíz musical: más grave y envuelta de noche. */
function raizBase(): number {
  return esDeNoche ? 174.61 : 196.0;
}

function semiTONO(raiz: number, semitonos: number): number {
  return raiz * Math.pow(2, semitonos / 12);
}

function obtenerContexto(): AudioContext | null {
  if (contexto) return contexto;
  try {
    const ventana = window as Window & { webkitAudioContext?: typeof AudioContext };
    const Constructor = window.AudioContext ?? ventana.webkitAudioContext;
    if (!Constructor) return null;
    const creado = new Constructor();
    master = creado.createGain();
    master.gain.value = 0.9;
    // Compresor ligero para que la música y los efectos nunca saturen.
    const compresor = creado.createDynamicsCompressor();
    compresor.threshold.value = -18;
    compresor.knee.value = 22;
    compresor.ratio.value = 3.2;
    compresor.attack.value = 0.008;
    compresor.release.value = 0.22;
    master.connect(compresor);
    compresor.connect(creado.destination);
    busEfectos = creado.createGain();
    busEfectos.gain.value = 1;
    busEfectos.connect(master);
    busMusica = creado.createGain();
    busMusica.gain.value = 0.85;
    busMusica.connect(master);
    contexto = creado;
    return contexto;
  } catch {
    return null;
  }
}

function nodoDestino(destino: Destino): AudioNode | null {
  if (!contexto) return null;
  return destino === "musica" ? busMusica : busEfectos;
}

interface OpcionesTono {
  forma?: OscillatorType;
  volumen?: number;
  ataque?: number;
  decaimiento?: number;
  retraso?: number;
  destino?: Destino;
  barrido?: number;
}

function tono(frecuencia: number, duracion: number, opciones: OpcionesTono = {}): void {
  try {
    const audio = obtenerContexto();
    const salida = nodoDestino(opciones.destino ?? "sfx");
    if (!audio || !salida) return;
    const { forma = "sine", volumen = 0.05, ataque = 0.02, decaimiento = duracion, retraso = 0, barrido } = opciones;
    const inicio = audio.currentTime + retraso;
    const oscilador = audio.createOscillator();
    const envolvente = audio.createGain();
    oscilador.type = forma;
    oscilador.frequency.setValueAtTime(frecuencia, inicio);
    if (barrido !== undefined) oscilador.frequency.exponentialRampToValueAtTime(Math.max(40, barrido), inicio + decaimiento);
    envolvente.gain.setValueAtTime(0.0001, inicio);
    envolvente.gain.exponentialRampToValueAtTime(Math.max(0.0002, volumen), inicio + ataque);
    envolvente.gain.exponentialRampToValueAtTime(0.0001, inicio + decaimiento);
    oscilador.connect(envolvente);
    envolvente.connect(salida);
    oscilador.start(inicio);
    oscilador.stop(inicio + decaimiento + 0.04);
  } catch {
    // El audio es decorativo: nunca interrumpe una acción.
  }
}

function obtenerRuido(audio: AudioContext): AudioBuffer | null {
  try {
    if (bufferRuido) return bufferRuido;
    const longitud = Math.floor(audio.sampleRate * 0.9);
    const creado = audio.createBuffer(1, longitud, audio.sampleRate);
    const datos = creado.getChannelData(0);
    for (let i = 0; i < longitud; i += 1) datos[i] = (Math.random() * 2 - 1) * (1 - i / longitud) ** 0.6;
    bufferRuido = creado;
    return creado;
  } catch {
    return null;
  }
}

interface OpcionesRuido {
  tipo?: BiquadFilterType;
  desde?: number;
  hasta?: number;
  duracion?: number;
  volumen?: number;
  retraso?: number;
  destino?: Destino;
  q?: number;
}

function ruido(opciones: OpcionesRuido = {}): void {
  try {
    const audio = obtenerContexto();
    const salida = nodoDestino(opciones.destino ?? "sfx");
    const fuente = audio && obtenerRuido(audio);
    if (!audio || !salida || !fuente) return;
    const { tipo = "bandpass", desde = 700, hasta, duracion = 0.26, volumen = 0.05, retraso = 0, q = 0.8 } = opciones;
    const inicio = audio.currentTime + retraso;
    const reproductor = audio.createBufferSource();
    const filtro = audio.createBiquadFilter();
    const envolvente = audio.createGain();
    reproductor.buffer = fuente;
    reproductor.playbackRate.value = 0.9 + Math.random() * 0.3;
    filtro.type = tipo;
    filtro.Q.value = q;
    filtro.frequency.setValueAtTime(desde, inicio);
    if (hasta !== undefined) filtro.frequency.linearRampToValueAtTime(hasta, inicio + duracion);
    envolvente.gain.setValueAtTime(0.0001, inicio);
    envolvente.gain.linearRampToValueAtTime(volumen, inicio + duracion * 0.22);
    envolvente.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
    reproductor.connect(filtro);
    filtro.connect(envolvente);
    envolvente.connect(salida);
    reproductor.start(inicio);
    reproductor.stop(inicio + duracion + 0.05);
  } catch {
    // Silencio elegante si WebAudio falla.
  }
}

function pararMusica(): void {
  if (temporizador !== null) {
    window.clearInterval(temporizador);
    temporizador = null;
  }
}

/**
 * Programa un paso de la rejilla de corcheas. Las notas se envían con su
 * retardo exacto al reloj del AudioContext, así el tempo es estable aunque
 * el navegador vaya justo de cuadros.
 */
function programarPaso(): void {
  const audio = contexto;
  if (!audio) return;
  const retardo = Math.max(0, proximoTiempo - audio.currentTime);
  const campo = CAMPOS[Math.floor(pasoRed / 16) % CAMPOS.length];
  const dentroCompas = pasoRed % 16;
  const raiz = semiTONO(raizBase(), campo.base);
  const brillantez = Math.max(0.45, Math.min(1.35, animoActual / 70));

  // Pad: acorde sostenido al empezar cada campo.
  if (dentroCompas === 0) {
    campo.notas.forEach((grado, indice) => {
      tono(semiTONO(raiz, 12 + grado), 3.1, {
        forma: "sine",
        volumen: 0.03 - indice * 0.006,
        ataque: 0.5,
        decaimiento: 3.05,
        retraso: retardo,
        destino: "musica"
      });
    });
  }
  // Arpegio pentatónico en corcheas: la melodía que da vida a la sala.
  if (dentroCompas % 2 === 0) {
    const grado = PENTATONICA[(pasoRed / 2 + campo.base) % PENTATONICA.length] ?? 0;
    const octava = dentroCompas % 8 === 6 ? 24 : 12;
    tono(semiTONO(raiz, grado + octava), 0.34, {
      forma: esDeNoche ? "sine" : "triangle",
      volumen: 0.028 * brillantez,
      ataque: 0.01,
      decaimiento: 0.3,
      retraso: retardo,
      destino: "musica"
    });
  }
  // Bombo suave en el tiempo fuerte y charles de ruido en los contratiempos.
  if (dentroCompas % 8 === 4) {
    tono(semiTONO(raiz, -24), 0.24, { forma: "sine", volumen: 0.032, retraso: retardo, destino: "musica", barrido: semiTONO(raiz, -36) });
  }
  if (dentroCompas % 4 === 2 && !esDeNoche) {
    ruido({ tipo: "highpass", desde: 4200, duracion: 0.05, volumen: 0.014, retraso: retardo, destino: "musica" });
  }
  // Frase de tres notas cuando está contentito.
  if (animoActual > 74 && dentroCompas === 10) {
    [0, 4, 7].forEach((grado, indice) => {
      tono(semiTONO(raiz, 24 + grado), 0.22, {
        forma: "sine",
        volumen: 0.024,
        retraso: retardo + indice * 0.11,
        decaimiento: 0.2,
        destino: "musica"
      });
    });
  }
  pasoRed += 1;
}

function sincronizarMusica(): void {
  if (!despierto || !musicaActivada) {
    pararMusica();
    return;
  }
  if (temporizador !== null) return;
  const tempo = esDeNoche ? 0.19 : animoActual < 34 ? 0.17 : 0.135;
  proximoTiempo = contexto ? contexto.currentTime + 0.08 : 0;
  temporizador = window.setInterval(() => {
    try {
      const audio = contexto;
      if (!audio) return;
      while (proximoTiempo < audio.currentTime + 0.4) {
        programarPaso();
        proximoTiempo += tempo;
      }
    } catch {
      pararMusica();
    }
  }, 60);
}

export function configurarAudio(opciones: { silencio: boolean; musica: boolean; noche?: boolean; animo?: number }): void {
  try {
    sonidoActivado = !opciones.silencio;
    musicaActivada = opciones.musica;
    if (opciones.noche !== undefined) esDeNoche = opciones.noche;
    if (opciones.animo !== undefined) animoActual = opciones.animo;
    if (master && contexto) master.gain.setTargetAtTime(0.78, contexto.currentTime, 0.12);
    if (busEfectos && contexto) busEfectos.gain.setTargetAtTime(sonidoActivado ? 0.78 : 0.0001, contexto.currentTime, 0.08);
    if (busMusica && contexto) busMusica.gain.setTargetAtTime(musicaActivada ? 0.85 : 0.0001, contexto.currentTime, 0.2);
    sincronizarMusica();
  } catch {
    pararMusica();
  }
}

/** Debe llamarse en el primer gesto del usuario: los navegadores lo exigen. */
export function despertarAudio(): void {
  try {
    const audio = obtenerContexto();
    if (!audio) return;
    despierto = true;
    if (audio.state === "suspended") void audio.resume().catch(() => undefined);
    sincronizarMusica();
  } catch {
    despierto = false;
  }
}

export function sonar(efecto: EfectoSonido): void {
  if (!sonidoActivado) return;
  try {
    switch (efecto) {
      case "comer":
        tono(430, 0.08, { forma: "triangle", volumen: 0.05 });
        tono(320, 0.09, { forma: "triangle", volumen: 0.042, retraso: 0.11 });
        break;
      case "masticar":
        [0, 0.09, 0.18].forEach((retraso, indice) => tono(300 + indice * 40, 0.07, { forma: "triangle", volumen: 0.036, retraso }));
        ruido({ tipo: "bandpass", desde: 1500, hasta: 700, duracion: 0.14, volumen: 0.02, retraso: 0.03 });
        break;
      case "jugar":
        [587, 740, 880, 1175].forEach((frecuencia, indice) => tono(frecuencia, 0.14, { forma: "sine", volumen: 0.045, retraso: indice * 0.062 }));
        break;
      case "bote":
        // Rebote de goma: sube y cae rápido, con un punteo de madera.
        tono(240, 0.16, { forma: "sine", volumen: 0.055, barrido: 620 });
        tono(1200, 0.05, { forma: "triangle", volumen: 0.022, retraso: 0.01 });
        break;
      case "palo":
        // Golpe de madera + tintineo corto de la pelota atada.
        ruido({ tipo: "bandpass", desde: 520, hasta: 760, duracion: 0.11, volumen: 0.025, q: 1.8 });
        tono(330, 0.1, { forma: "triangle", volumen: 0.025, barrido: 460 });
        tono(880, 0.13, { forma: "sine", volumen: 0.016, retraso: 0.06, barrido: 1175 });
        break;
      case "estrella":
        // Brillo pentatónico, más aire que la pelota.
        [988, 1318, 1568].forEach((frecuencia, indice) => tono(frecuencia, 0.2, { forma: "sine", volumen: 0.022, retraso: indice * 0.065, decaimiento: 0.26 }));
        ruido({ tipo: "highpass", desde: 5400, duracion: 0.18, volumen: 0.009, retraso: 0.08 });
        break;
      case "agarre":
        tono(480, 0.055, { forma: "sine", volumen: 0.022, barrido: 720 });
        break;
      case "limpiar":
        ruido({ tipo: "bandpass", desde: 520, hasta: 1450, duracion: 0.34, volumen: 0.033, q: 1.2 });
        [880, 1180].forEach((frecuencia, indice) => tono(frecuencia, 0.16, { volumen: 0.018, retraso: 0.06 + indice * 0.09 }));
        break;
      case "agua":
        ruido({ tipo: "highpass", desde: 800, hasta: 2600, duracion: 0.52, volumen: 0.038, q: 0.45 });
        [0, 0.17, 0.34].forEach((retraso) => tono(610 + Math.random() * 180, 0.1, { forma: "sine", volumen: 0.018, retraso, barrido: 1350 }));
        break;
      case "toalla":
        ruido({ tipo: "bandpass", desde: 2300, hasta: 1000, duracion: 0.4, volumen: 0.032, q: 0.55 });
        break;
      case "dormir":
        tono(330, 0.5, { forma: "sine", volumen: 0.03, decaimiento: 0.62 });
        tono(247, 0.75, { forma: "sine", volumen: 0.024, retraso: 0.34, decaimiento: 0.8 });
        break;
      case "curar":
        [523, 659, 784, 1046].forEach((frecuencia, indice) => tono(frecuencia, 0.28, { volumen: 0.042, retraso: indice * 0.1 }));
        break;
      case "enfermar":
        tono(392, 0.3, { forma: "triangle", volumen: 0.03, barrido: 250 });
        tono(277, 0.42, { forma: "triangle", volumen: 0.022, retraso: 0.2, barrido: 190 });
        break;
      case "evolucion":
        // Fanfarria pentatónica con arpegio y destello final.
        [392, 440, 523, 587, 659, 784, 880, 1046].forEach((frecuencia, indice) =>
          tono(frecuencia, 0.34, { forma: "sine", volumen: 0.05, retraso: indice * 0.085 })
        );
        tono(1568, 0.9, { forma: "sine", volumen: 0.028, retraso: 0.7, decaimiento: 1 });
        ruido({ tipo: "highpass", desde: 5200, duracion: 0.5, volumen: 0.018, retraso: 0.66 });
        break;
      case "compra":
        tono(988, 0.1, { forma: "sine", volumen: 0.045 });
        tono(1318, 0.2, { forma: "sine", volumen: 0.038, retraso: 0.09 });
        break;
      case "error":
        tono(150, 0.16, { forma: "sine", volumen: 0.03, barrido: 110 });
        break;
      case "mimo":
        tono(659, 0.24, { forma: "sine", volumen: 0.034, decaimiento: 0.3 });
        tono(988, 0.28, { forma: "sine", volumen: 0.022, retraso: 0.07, decaimiento: 0.34 });
        break;
      case "toque":
        // Toquecito para llamar la atención: pop suave ascendente, sin estridencias.
        tono(520, 0.07, { forma: "sine", volumen: 0.028, barrido: 780 });
        tono(780, 0.09, { forma: "sine", volumen: 0.02, retraso: 0.06, barrido: 990 });
        break;
      case "logro":
        [784, 1175, 1568].forEach((frecuencia, indice) => tono(frecuencia, 0.3, { forma: "sine", volumen: 0.042 - indice * 0.006, retraso: indice * 0.1 }));
        ruido({ tipo: "highpass", desde: 6200, duracion: 0.3, volumen: 0.012, retraso: 0.2 });
        break;
      case "bostezo":
        tono(520, 0.24, { forma: "sine", volumen: 0.03, barrido: 690 });
        tono(690, 0.4, { forma: "sine", volumen: 0.032, retraso: 0.16, barrido: 430 });
        tono(430, 0.36, { forma: "triangle", volumen: 0.018, retraso: 0.46, barrido: 330 });
        break;
      default:
        break;
    }
  } catch {
    // Ningún problema de audio debe interrumpir el juego.
  }
}

/** Balbuceo de la criatura: el tono cambia por etapa y ánimo. */
export function voz(etapa: Etapa, animo: number): void {
  if (!sonidoActivado) return;
  try {
    const base = etapa === "huevo" ? 720 : etapa === "bebe" ? 640 : etapa === "nino" ? 540 : etapa === "anciano" ? 340 : 450;
    const ajuste = animo < 30 ? -50 : animo > 80 ? 70 : 0;
    const repeticiones = etapa === "huevo" ? 2 : 3;
    for (let indice = 0; indice < repeticiones; indice += 1) {
      const frecuencia = base + ajuste + (indice % 2 === 0 ? 0 : 90) + Math.random() * 30;
      tono(frecuencia, 0.12, { forma: "sine", volumen: 0.026, retraso: indice * 0.11, barrido: frecuencia * 1.16 });
    }
    if (animo > 80) tono(base * 2 + ajuste, 0.16, { forma: "triangle", volumen: 0.014, retraso: repeticiones * 0.11 });
  } catch {
    // La voz es un detalle: se omite si el dispositivo no admite audio.
  }
}
