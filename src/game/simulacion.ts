import { BALANCE } from "./balance";
import { obtenerComida } from "./comidas";
import { obtenerEspecie } from "./especies";
import { ECONOMIA } from "./economia";
import { avanzarEdad } from "./evolucion";
import { actualizarLogros } from "./logros";
import type { NecesidadId, Necesidades, Partida, ResultadoSimulacion, ResumenAusencia } from "./types";

const necesidadesVitales: NecesidadId[] = ["hambre", "animo", "energia", "higiene"];

function limitar(valor: number): number {
  return Math.max(0, Math.min(100, valor));
}

function sumarNecesidades(necesidades: Necesidades, efecto: Partial<Necesidades>): Necesidades {
  const resultado = { ...necesidades };
  for (const [clave, cantidad] of Object.entries(efecto) as [NecesidadId, number][]) {
    resultado[clave] = limitar(resultado[clave] + cantidad);
  }
  return resultado;
}

function media(necesidades: Necesidades): number {
  const valores = Object.values(necesidades);
  return valores.reduce((total, valor) => total + valor, 0) / valores.length;
}

function aplicarNecesidadesEnTramo(partida: Partida, inicio: number, tramoMs: number): Partida {
  // Solo se permite una evolución pendiente a la vez; el jugador debe verla
  // y confirmarla antes de que un offline largo salte otra etapa encima.
  if (partida.evolucionPendiente || partida.despedidaPendiente) return partida;
  const horas = tramoMs / 3600000;
  const antes = partida.mascota.necesidades;
  const horaLocal = new Date(inicio).getHours();
  const noche = horaLocal >= 21 || horaLocal < 7;
  const energiaPorHora = partida.mascota.durmiendo
    ? BALANCE.recuperacionPorHora.energiaDormida
    : noche
      ? BALANCE.decaimientoPorHora.energiaNoche
      : BALANCE.decaimientoPorHora.energiaDia;
  const energia = partida.mascota.durmiendo
    ? energiaPorHora * horas
    : -energiaPorHora * horas;
  const higiene = -BALANCE.decaimientoPorHora.higiene * horas;
  const hambre = -BALANCE.decaimientoPorHora.hambre * horas;
  const animo = -BALANCE.decaimientoPorHora.animo * horas;
  const tieneDescuidos = partida.mascota.suciedad > 0 || antes.higiene < 28 || antes.hambre < 12;
  const salud = partida.mascota.durmiendo
    ? BALANCE.recuperacionPorHora.saludDescansando * horas
    : tieneDescuidos
      ? -BALANCE.decaimientoPorHora.saludConDescuidos * horas
      : 0;
  const vinculo = -BALANCE.decaimientoPorHora.vinculo * horas;
  const nuevasNecesidades = sumarNecesidades(antes, { hambre, animo, energia, higiene, salud, vinculo });
  const nuevosDescuidos = necesidadesVitales.reduce((total, necesidad) => (
    total + (antes[necesidad] >= 15 && nuevasNecesidades[necesidad] < 15 ? 1 : 0)
  ), 0);

  let progresoSuciedadMs = partida.progresoSuciedadMs + tramoMs;
  let suciedad = partida.mascota.suciedad;
  while (progresoSuciedadMs >= BALANCE.suciedadCadaMs && suciedad < 3) {
    progresoSuciedadMs -= BALANCE.suciedadCadaMs;
    suciedad += 1;
  }
  if (suciedad >= 3) progresoSuciedadMs = Math.min(progresoSuciedadMs, BALANCE.suciedadCadaMs);

  const enferma = partida.mascota.enferma || (
    nuevasNecesidades.salud <= BALANCE.umbralSalud ||
    (suciedad >= 2 && nuevasNecesidades.higiene < 34)
  );
  const mascota = {
    ...partida.mascota,
    necesidades: nuevasNecesidades,
    suciedad,
    enferma,
    perfil: {
      ...partida.mascota.perfil,
      descuidos: partida.mascota.perfil.descuidos + nuevosDescuidos,
      disciplina: limitar(partida.mascota.perfil.disciplina - nuevosDescuidos * 1.5)
    }
  };

  return avanzarEdad({ ...partida, mascota, progresoSuciedadMs }, tramoMs);
}

// El reloj se valida siempre contra la última marca aceptada y limita la ausencia a 12 horas.
export function simularProgreso(partida: Partida, ahora: number): ResultadoSimulacion {
  const ultima = partida.ultimaMarcaValidada;
  if (!Number.isFinite(ahora) || ahora < ultima) return { partida, resumen: null };
  const transcurrido = Math.min(ahora - ultima, BALANCE.limiteOfflineMs);

  if (!partida.iniciada || partida.pausada || partida.mascota.seFue || partida.evolucionPendiente || partida.despedidaPendiente || transcurrido <= 0) {
    return {
      partida: { ...partida, ultimaMarcaValidada: ahora },
      resumen: null
    };
  }

  const antes = partida.mascota.necesidades;
  const intervalos = Math.max(1, Math.ceil(transcurrido / 900000));
  const tramoMs = transcurrido / intervalos;
  let actual = partida;

  for (let indice = 0; indice < intervalos; indice += 1) {
    actual = aplicarNecesidadesEnTramo(actual, ultima + indice * tramoMs, tramoMs);
  }
  actual = actualizarLogros({ ...actual, ultimaMarcaValidada: ahora });

  const minutos = Math.floor(transcurrido / 60000);
  const resumen: ResumenAusencia | null = minutos >= 1
    ? {
        minutos,
        hambre: Math.max(0, Math.round(antes.hambre - actual.mascota.necesidades.hambre)),
        animo: Math.max(0, Math.round(antes.animo - actual.mascota.necesidades.animo)),
        energia: Math.max(0, Math.round(antes.energia - actual.mascota.necesidades.energia)),
        higiene: Math.max(0, Math.round(antes.higiene - actual.mascota.necesidades.higiene)),
        suciedadNueva: Math.max(0, actual.mascota.suciedad - partida.mascota.suciedad)
      }
    : null;

  return { partida: actual, resumen };
}

// Avance controlado para el modo exploración: simula horas reales sin dejar
// la marca de guardado en el futuro, lo que bloquearía el reloj al volver.
export function simularHoras(partida: Partida, horas: number, ahora = Date.now()): Partida {
  if (!partida.iniciada || partida.pausada || partida.mascota.seFue || partida.evolucionPendiente || partida.despedidaPendiente || !Number.isFinite(horas) || horas <= 0) return partida;
  const base = simularProgreso(partida, ahora).partida;
  const deltaMs = Math.min(horas * 3600000, BALANCE.limiteOfflineMs);
  const avanzada = simularProgreso({ ...base, ultimaMarcaValidada: ahora }, ahora + deltaMs).partida;
  return { ...avanzada, ultimaMarcaValidada: ahora };
}

export function comenzarPartida(partida: Partida, ahora = Date.now()): Partida {
  return { ...partida, iniciada: true, pausada: false, ultimaMarcaValidada: ahora };
}

export function alternarPausa(partida: Partida, ahora = Date.now()): Partida {
  const actualizada = simularProgreso(partida, ahora).partida;
  return { ...actualizada, pausada: !partida.pausada, ultimaMarcaValidada: ahora };
}

export type AccionCuidado = "jugar" | "limpiar" | "dormir" | "curar" | "mimar";

export function aplicarCuidado(partida: Partida, accion: AccionCuidado, ahora = Date.now()): Partida {
  const base = simularProgreso(partida, ahora).partida;
  if (!base.iniciada || base.pausada || base.mascota.seFue) return base;

  const mascota = { ...base.mascota, necesidades: { ...base.mascota.necesidades } };
  const perfil = { ...mascota.perfil, acciones: { ...mascota.perfil.acciones } };
  let medicinas = base.medicinas;

  if (accion === "jugar") {
    mascota.necesidades = sumarNecesidades(mascota.necesidades, { animo: 24, energia: -5, vinculo: 5 });
    perfil.acciones.juegos += 1;
  } else if (accion === "limpiar") {
    mascota.necesidades = sumarNecesidades(mascota.necesidades, { higiene: 36, salud: 2 });
    mascota.suciedad = 0;
    mascota.enferma = mascota.necesidades.salud <= BALANCE.umbralSalud;
    perfil.acciones.limpiezas += 1;
  } else if (accion === "dormir") {
    mascota.durmiendo = !mascota.durmiendo;
    if (mascota.durmiendo) mascota.necesidades = sumarNecesidades(mascota.necesidades, { energia: 4, animo: 2 });
  } else if (accion === "curar") {
    if (medicinas <= 0 || (!mascota.enferma && mascota.necesidades.salud >= 92)) return base;
    medicinas -= 1;
    mascota.necesidades = sumarNecesidades(mascota.necesidades, { salud: 38, animo: 5 });
    mascota.enferma = false;
    perfil.acciones.curas += 1;
  } else if (accion === "mimar") {
    mascota.necesidades = sumarNecesidades(mascota.necesidades, { animo: 14, vinculo: 8 });
    perfil.acciones.caricias += 1;
  }

  const mediaActual = media(mascota.necesidades);
  mascota.perfil = {
    ...perfil,
    calidad: limitar(perfil.calidad * 0.92 + mediaActual * 0.08 + 1.2),
    disciplina: limitar(perfil.disciplina + 0.7)
  };
  const contadores = {
    ...base.contadores,
    cuidados: base.contadores.cuidados + 1,
    juegos: base.contadores.juegos + (accion === "jugar" ? 1 : 0),
    caricias: base.contadores.caricias + (accion === "mimar" ? 1 : 0),
    limpiezas: base.contadores.limpiezas + (accion === "limpiar" ? 1 : 0)
  };
  return actualizarLogros({
    ...base,
    mascota,
    medicinas,
    contadores,
    ultimaMarcaValidada: ahora
  });
}

/**
 * Caricia libre sobre el diorama (sin modo ni panel): cada roce suma un
 * poquito de ánimo y vínculo. Devuelve null si el juego no acepta mimos.
 */
export function acariciarLibre(partida: Partida, ahora = Date.now()): Partida | null {
  const base = simularProgreso(partida, ahora).partida;
  if (!base.iniciada || base.pausada || base.mascota.seFue || base.mascota.durmiendo) return null;
  const mascota = {
    ...base.mascota,
    necesidades: sumarNecesidades(base.mascota.necesidades, { animo: 2, vinculo: 3 }),
    perfil: {
      ...base.mascota.perfil,
      calidad: limitar(base.mascota.perfil.calidad + 0.4),
      disciplina: limitar(base.mascota.perfil.disciplina + 0.1),
      acciones: { ...base.mascota.perfil.acciones, caricias: base.mascota.perfil.acciones.caricias + 1 }
    }
  };
  return actualizarLogros({
    ...base,
    mascota,
    contadores: { ...base.contadores, caricias: base.contadores.caricias + 1 },
    ultimaMarcaValidada: ahora
  });
}

export function alimentar(partida: Partida, comidaId: string, ahora = Date.now()): Partida | null {
  const base = simularProgreso(partida, ahora).partida;
  const alimento = obtenerComida(comidaId);
  if (!alimento || !base.iniciada || base.pausada || base.mascota.seFue || (base.comidas[comidaId] ?? 0) < 1) return null;

  const mascota = { ...base.mascota, necesidades: sumarNecesidades(base.mascota.necesidades, alimento.efecto) };
  const promedio = media(mascota.necesidades);
  mascota.perfil = {
    ...mascota.perfil,
    calidad: limitar(mascota.perfil.calidad * 0.94 + promedio * 0.06 + 1.4),
    disciplina: limitar(mascota.perfil.disciplina + 0.5),
    acciones: { ...mascota.perfil.acciones, comidas: mascota.perfil.acciones.comidas + 1 }
  };
  const comidas = { ...base.comidas, [comidaId]: base.comidas[comidaId] - 1 };
  return actualizarLogros({
    ...base,
    mascota,
    comidas,
    contadores: { ...base.contadores, cuidados: base.contadores.cuidados + 1, comidas: base.contadores.comidas + 1 },
    ultimaMarcaValidada: ahora
  });
}

export function cobrarMinijuego(partida: Partida, juegoId: string, puntuacion: number, monedas: number, ahora = Date.now()): Partida {
  const base = simularProgreso(partida, ahora).partida;
  const premio = Math.max(0, Math.floor(monedas));
  const records = { ...base.recordsMinijuegos, [juegoId]: Math.max(base.recordsMinijuegos[juegoId] ?? 0, puntuacion) };
  const mascota = {
    ...base.mascota,
    necesidades: sumarNecesidades(base.mascota.necesidades, { animo: Math.min(20, 8 + puntuacion), vinculo: 3 }),
    perfil: {
      ...base.mascota.perfil,
      calidad: limitar(base.mascota.perfil.calidad + 1),
      acciones: { ...base.mascota.perfil.acciones, juegos: base.mascota.perfil.acciones.juegos + 1 }
    }
  };
  return actualizarLogros({
    ...base,
    mascota,
    monedas: base.monedas + premio,
    contadores: {
      ...base.contadores,
      cuidados: base.contadores.cuidados + 1,
      juegos: base.contadores.juegos + 1,
      monedasGanadas: base.contadores.monedasGanadas + premio
    },
    recordsMinijuegos: records
  });
}

export function prepararNuevaGeneracion(partida: Partida, ahora = Date.now()): Partida {
  const generacion = partida.mascota.generacion + 1;
  // La cría hereda el tinte de su familia y arranca de nuevo desde el huevo.
  const colorHerencia = partida.mascota.tinteHerencia ?? obtenerEspecie(partida.mascota.especieId).color;
  const especieHeredada = obtenerEspecie("huevo-luna");
  const necesidadesHeredadas: Necesidades = {
    hambre: 88,
    animo: 84,
    energia: 96,
    higiene: 94,
    salud: 100,
    vinculo: 38
  };
  necesidadesHeredadas[partida.mascota.perfil.estadisticaFavorita] = 91;
  return {
    ...partida,
    mascota: {
      especieId: especieHeredada.id,
      nombre: "Mochi",
      generacion,
      edadTotalMs: 0,
      edadEtapaMs: 0,
      necesidades: necesidadesHeredadas,
      perfil: {
        calidad: 72,
        descuidos: 0,
        disciplina: 54,
        estadisticaFavorita: partida.mascota.perfil.estadisticaFavorita,
        acciones: { caricias: 0, comidas: 0, juegos: 0, limpiezas: 0, curas: 0 }
      },
      suciedad: 0,
      durmiendo: false,
      enferma: false,
      seFue: false,
      tinteHerencia: colorHerencia
    },
    monedas: partida.monedas + ECONOMIA.bonusGeneracion,
    descubrimientos: partida.descubrimientos.includes(especieHeredada.id)
      ? partida.descubrimientos
      : [...partida.descubrimientos, especieHeredada.id],
    iniciada: true,
    pausada: false,
    ultimaMarcaValidada: ahora,
    progresoSuciedadMs: 0,
    evolucionPendiente: null,
    despedidaPendiente: false
  };
}

export function eclosionarHuevo(partida: Partida, ahora = Date.now()): Partida {
  if (partida.mascota.especieId !== "huevo-luna") return partida;
  return {
    ...partida,
    mascota: {
      ...partida.mascota,
      especieId: "mimi",
      edadEtapaMs: 0
    },
    descubrimientos: partida.descubrimientos.includes("mimi")
      ? partida.descubrimientos
      : [...partida.descubrimientos, "mimi"],
    evolucionPendiente: { desde: "huevo-luna", hasta: "mimi" },
    ultimaMarcaValidada: ahora
  };
}

export function confirmarEvolucion(partida: Partida): Partida {
  return { ...partida, evolucionPendiente: null };
}

export function confirmarDespedida(partida: Partida): Partida {
  return { ...partida, despedidaPendiente: false };
}