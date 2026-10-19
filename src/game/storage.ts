import { ECONOMIA } from "./economia";
import { normalizarGuardado } from "./migracion.js";
import { simularProgreso } from "./simulacion";
import { CLAVE_LOCALSTORAGE, escribirGuardado, inicializarAlmacen, leerGuardado, modoAlmacen } from "./baseDatos";
import type { ModoAlmacen } from "./baseDatos";
import type { Partida, ResumenAusencia } from "./types";

// Espejo en memoria: permite arranque síncrono y que el juego siga vivo si el
// navegador bloquea todo el almacenamiento persistente.
let cadenaEnMemoria: string | null = null;
let colaEscritura: number | null = null;

export function crearPartidaInicial(ahora = Date.now()): Partida {
  return {
    version: 1,
    mascota: {
      // La primera partida arranca en bebé para jugar de inmediato; las
      // generaciones siguientes sí nacen de un huevo (ver prepararNuevaGeneracion).
      especieId: "mimi",
      nombre: "Mochi",
      generacion: 1,
      edadTotalMs: 0,
      edadEtapaMs: 0,
      necesidades: { hambre: 88, animo: 84, energia: 96, higiene: 94, salud: 100, vinculo: 34 },
      perfil: {
        calidad: 72,
        descuidos: 0,
        disciplina: 52,
        estadisticaFavorita: "animo",
        acciones: { caricias: 0, comidas: 0, juegos: 0, limpiezas: 0, curas: 0 }
      },
      suciedad: 0,
      durmiendo: false,
      enferma: false,
      seFue: false
    },
    monedas: ECONOMIA.monedasIniciales,
    medicinas: 1,
    descubrimientos: ["mimi", "huevo-luna"],
    comidas: { ...ECONOMIA.inventarioInicial },
    objetos: ["cojin-nube"],
    logros: [],
    recordsMinijuegos: {},
    contadores: { cuidados: 0, juegos: 0, comidas: 0, caricias: 0, limpiezas: 0, monedasGanadas: 0 },
    preferencias: { silencio: false, musica: true, vibracion: true },
    iniciada: false,
    pausada: false,
    ultimaMarcaValidada: ahora,
    progresoSuciedadMs: 0,
    evolucionPendiente: null,
    despedidaPendiente: false
  };
}

// Acepta guardados v1 y partidas antiguas con nombres de campos previos.
export function migrarGuardado(valor: unknown, ahora = Date.now()): Partida {
  return normalizarGuardado(valor, crearPartidaInicial(ahora), ahora);
}

function leerEspejo(): unknown {
  if (cadenaEnMemoria === null) return null;
  try {
    return JSON.parse(cadenaEnMemoria) as unknown;
  } catch {
    return null;
  }
}

/**
 * Prepara el almacenamiento (IndexedDB con espejo en localStorage) y deja el
 * contenido en memoria para que el arranque de React sea síncrono.
 */
export async function prepararGuardado(): Promise<ModoAlmacen> {
  const modo = await inicializarAlmacen();
  try {
    const dato = await leerGuardado();
    const espejo = typeof window === "undefined" ? null : window.localStorage.getItem(CLAVE_LOCALSTORAGE);
    cadenaEnMemoria = prioridadReciente(dato, espejo);
  } catch {
    // Sin almacenamiento: se juega en memoria durante esta pestaña.
  }
  return modo;
}

/** Si ambas copias existen, gana la que tenga la marca de tiempo más reciente. */
function prioridadReciente(deBase: string | null, delEspejo: string | null): string | null {
  if (!deBase) return delEspejo;
  if (!delEspejo) return deBase;
  const marca = (cadena: string): number => {
    try {
      const dato = JSON.parse(cadena) as { ultimaMarcaValidada?: number };
      return typeof dato.ultimaMarcaValidada === "number" ? dato.ultimaMarcaValidada : 0;
    } catch {
      return 0;
    }
  };
  return marca(deBase) >= marca(delEspejo) ? deBase : delEspejo;
}

export function cargarPartida(ahora = Date.now()): { partida: Partida; resumen: ResumenAusencia | null; esNueva: boolean } {
  const dato = leerEspejo();
  const esNueva = dato === null;
  const partida = migrarGuardado(dato, ahora);
  const resultado = simularProgreso(partida, ahora);
  return { partida: resultado.partida, resumen: resultado.resumen, esNueva };
}

/** Escritura agrupada: muchos cambios en el mismo tick producen un solo commit. */
export function guardarPartida(partida: Partida): void {
  try {
    const cadena = JSON.stringify(partida);
    cadenaEnMemoria = cadena;
    if (colaEscritura !== null) window.clearTimeout(colaEscritura);
    colaEscritura = window.setTimeout(() => {
      colaEscritura = null;
      void escribirGuardado(cadena);
    }, 220);
  } catch {
    // Si no se puede serializar, la partida sigue viva en memoria.
  }
}

/** Fuerza el vuelco inmediato (al ocultar la pestaña o cerrar la partida). */
export function flushGuardado(): void {
  if (colaEscritura !== null) {
    window.clearTimeout(colaEscritura);
    colaEscritura = null;
  }
  if (cadenaEnMemoria) void escribirGuardado(cadenaEnMemoria);
}

export function estadoAlmacen(): { modo: ModoAlmacen; degradado: boolean } {
  const modo = modoAlmacen();
  return { modo, degradado: modo !== "indexeddb" };
}
