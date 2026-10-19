/**
 * Capa de persistencia en IndexedDB (fuente de verdad) con espejo en
 * localStorage (arranque síncrono y prueba en navegadores antiguos).
 *
 * Todo es tolerante a fallos: si IndexedDB está bloqueado (modo incógnito,
 * Safari privado, cuota llena) se degrada a localStorage y, en el peor caso,
 * a memoria. El juego nunca se rompe por culpa del guardado.
 */

const NOMBRE_BD = "raton-tama";
const VERSION_BD = 1;
const ALMACEN = "guardado";
const CLAVE = "partida";
export const CLAVE_LOCALSTORAGE = "raton-tama.partida";

export type ModoAlmacen = "indexeddb" | "localstorage" | "memoria";

let base: IDBDatabase | null = null;
let modo: ModoAlmacen = "memoria";

function espejoLocal(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function abrirBase(): Promise<IDBDatabase | null> {
  return new Promise((resolver) => {
    try {
      if (typeof indexedDB === "undefined") {
        resolver(null);
        return;
      }
      const peticion = indexedDB.open(NOMBRE_BD, VERSION_BD);
      peticion.onupgradeneeded = () => {
        const db = peticion.result;
        if (!db.objectStoreNames.contains(ALMACEN)) db.createObjectStore(ALMACEN);
      };
      peticion.onsuccess = () => resolver(peticion.result);
      peticion.onerror = () => resolver(null);
      peticion.onblocked = () => resolver(null);
    } catch {
      resolver(null);
    }
  });
}

function transaccion<T>(escritura: boolean, accion: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return new Promise((resolver) => {
    try {
      if (!base) {
        resolver(null);
        return;
      }
      const tx = base.transaction(ALMACEN, escritura ? "readwrite" : "readonly");
      const peticion = accion(tx.objectStore(ALMACEN));
      peticion.onsuccess = () => resolver(peticion.result as T | null);
      peticion.onerror = () => resolver(null);
    } catch {
      resolver(null);
    }
  });
}

/** Abre la base y migra un guardado antiguo de localStorage. Se llama antes de montar React. */
export async function inicializarAlmacen(): Promise<ModoAlmacen> {
  const espejo = espejoLocal();
  try {
    const db = await Promise.race([
      abrirBase(),
      new Promise<null>((resolver) => window.setTimeout(() => resolver(null), 1800))
    ]);
    if (db) {
      base = db;
      modo = "indexeddb";
      const guardado = await transaccion<string | null>(false, (store) => store.get(CLAVE) as IDBRequest<string | null>);
      if (guardado === null || guardado === undefined) {
        const anterior = espejo?.getItem(CLAVE_LOCALSTORAGE) ?? null;
        if (anterior) await escribirEnBase(anterior);
      }
      return modo;
    }
  } catch {
    // Se ignora: el espejo de localStorage sigue siendo válido.
  }
  modo = espejo ? "localstorage" : "memoria";
  return modo;
}

async function escribirEnBase(cadena: string): Promise<void> {
  await transaccion(true, (store) => store.put(cadena, CLAVE));
}

/** Devuelve la cadena guardada priorizando IndexedDB sobre el espejo. */
export async function leerGuardado(): Promise<string | null> {
  if (modo === "indexeddb") {
    const dato = await transaccion<string | null>(false, (store) => store.get(CLAVE) as IDBRequest<string | null>);
    if (typeof dato === "string") return dato;
  }
  return espejoLocal()?.getItem(CLAVE_LOCALSTORAGE) ?? null;
}

/** Escribe en IndexedDB y mantiene el espejo de localStorage sincronizado. */
export async function escribirGuardado(cadena: string): Promise<ModoAlmacen> {
  espejoLocal()?.setItem(CLAVE_LOCALSTORAGE, cadena);
  if (modo === "indexeddb") await escribirEnBase(cadena);
  return modo;
}

export function modoAlmacen(): ModoAlmacen {
  return modo;
}
