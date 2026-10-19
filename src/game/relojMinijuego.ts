export interface RelojMinijuego {
  restanteMs: number;
  ultimaMarca: number;
  pausado: boolean;
}

export function crearRelojMinijuego(duracionSegundos: number, ahora: number): RelojMinijuego {
  return { restanteMs: Math.max(0, duracionSegundos * 1000), ultimaMarca: ahora, pausado: false };
}

export function avanzarRelojMinijuego(reloj: RelojMinijuego, ahora: number): RelojMinijuego {
  if (!Number.isFinite(ahora) || ahora < reloj.ultimaMarca) return reloj;
  return {
    ...reloj,
    restanteMs: Math.max(0, reloj.restanteMs - (reloj.pausado ? 0 : ahora - reloj.ultimaMarca)),
    ultimaMarca: ahora
  };
}

export function pausarRelojMinijuego(reloj: RelojMinijuego, ahora: number): RelojMinijuego {
  return { ...avanzarRelojMinijuego(reloj, ahora), pausado: true };
}

export function reanudarRelojMinijuego(reloj: RelojMinijuego, ahora: number): RelojMinijuego {
  return { ...avanzarRelojMinijuego(reloj, ahora), pausado: false };
}