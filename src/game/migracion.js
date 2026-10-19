/**
 * Normaliza el formato antiguo y el guardado versionado sin acoplarlo al navegador.
 * @param {unknown} valor
 * @param {any} base
 * @param {number} ahora
 */
export function normalizarGuardado(valor, base, ahora) {
  if (!esObjeto(valor)) return base;

  const mascotaAntigua = esObjeto(valor.mascota)
    ? valor.mascota
    : esObjeto(valor.pet)
      ? valor.pet
      : {};
  const estadisticas = mascotaAntigua.necesidades ?? mascotaAntigua.stats ?? valor.stats;
  const perfilAntiguo = mascotaAntigua.perfil ?? mascotaAntigua.careProfile;
  const legacyComidas = esObjeto(valor.comidas) ? valor.comidas : esObjeto(valor.foodInventory) ? valor.foodInventory : {};
  const legacyRecords = esObjeto(valor.recordsMinijuegos) ? valor.recordsMinijuegos : esObjeto(valor.gameRecords) ? valor.gameRecords : {};
  const legacyContadores = esObjeto(valor.contadores) ? valor.contadores : {};
  const legacyPreferencias = esObjeto(valor.preferencias) ? valor.preferencias : esObjeto(valor.settings) ? valor.settings : {};
  const descubiertas = listaDeCadenas(valor.descubrimientos ?? valor.discoveries, base.descubrimientos);
  const especieId = cadena(mascotaAntigua.especieId ?? mascotaAntigua.speciesId, "mimi");
  const mascota = {
    ...base.mascota,
    especieId,
    nombre: cadena(mascotaAntigua.nombre ?? mascotaAntigua.name ?? valor.petName, base.mascota.nombre),
    generacion: numero(mascotaAntigua.generacion ?? mascotaAntigua.generation, 1),
    edadTotalMs: numero(mascotaAntigua.edadTotalMs ?? mascotaAntigua.ageMs, 0),
    edadEtapaMs: numero(mascotaAntigua.edadEtapaMs ?? mascotaAntigua.stageAgeMs, 0),
    necesidades: normalizarNecesidades(estadisticas, base.mascota.necesidades),
    perfil: normalizarPerfil(perfilAntiguo, base.mascota.perfil),
    suciedad: numero(mascotaAntigua.suciedad ?? mascotaAntigua.dirt, 0),
    durmiendo: Boolean(mascotaAntigua.durmiendo ?? mascotaAntigua.sleeping),
    enferma: Boolean(mascotaAntigua.enferma ?? mascotaAntigua.sick),
    seFue: Boolean(mascotaAntigua.seFue ?? mascotaAntigua.departed),
    tinteHerencia: typeof mascotaAntigua.tinteHerencia === "string" ? mascotaAntigua.tinteHerencia : undefined
  };
  const contadores = {
    cuidados: numero(legacyContadores.cuidados, 0),
    juegos: numero(legacyContadores.juegos, 0),
    comidas: numero(legacyContadores.comidas, 0),
    caricias: numero(legacyContadores.caricias, 0),
    limpiezas: numero(legacyContadores.limpiezas, 0),
    monedasGanadas: numero(legacyContadores.monedasGanadas, 0)
  };
  const descubrimientosFinales = descubiertas.includes(especieId) ? descubiertas : [...descubiertas, especieId];
  return {
    ...base,
    version: 1,
    mascota,
    monedas: Math.max(0, numero(valor.monedas ?? valor.coins, base.monedas)),
    medicinas: Math.max(0, numero(valor.medicinas ?? valor.medicine, base.medicinas)),
    descubrimientos: descubrimientosFinales,
    comidas: Object.fromEntries(Object.entries(legacyComidas).map(([id, cantidad]) => [id, Math.max(0, numero(cantidad, 0))])),
    objetos: listaDeCadenas(valor.objetos ?? valor.objects, base.objetos),
    logros: listaDeCadenas(valor.logros ?? valor.achievements),
    recordsMinijuegos: Object.fromEntries(Object.entries(legacyRecords).map(([id, record]) => [id, Math.max(0, numero(record, 0))])),
    contadores,
    preferencias: {
      silencio: Boolean(legacyPreferencias.silencio ?? legacyPreferencias.muted),
      musica: typeof (legacyPreferencias.musica ?? legacyPreferencias.music) === "boolean"
        ? Boolean(legacyPreferencias.musica ?? legacyPreferencias.music)
        : base.preferencias.musica,
      vibracion: typeof legacyPreferencias.vibracion === "boolean" ? legacyPreferencias.vibracion : base.preferencias.vibracion
    },
    iniciada: Boolean(valor.iniciada ?? valor.started ?? mascotaAntigua.iniciada),
    pausada: Boolean(valor.pausada ?? valor.paused),
    ultimaMarcaValidada: numero(valor.ultimaMarcaValidada ?? valor.lastValidatedAt ?? valor.lastSeenAt, ahora),
    progresoSuciedadMs: Math.max(0, numero(valor.progresoSuciedadMs, 0)),
    evolucionPendiente: esObjeto(valor.evolucionPendiente) && typeof valor.evolucionPendiente.desde === "string" && typeof valor.evolucionPendiente.hasta === "string"
      ? { desde: valor.evolucionPendiente.desde, hasta: valor.evolucionPendiente.hasta }
      : null,
    despedidaPendiente: Boolean(valor.despedidaPendiente)
  };
}

function esObjeto(valor) {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function numero(valor, alternativo) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : alternativo;
}

function cadena(valor, alternativo) {
  return typeof valor === "string" && valor.length > 0 ? valor : alternativo;
}

function listaDeCadenas(valor, alternativo = []) {
  return Array.isArray(valor) ? valor.filter((entrada) => typeof entrada === "string") : alternativo;
}

function normalizarNecesidades(valor, base) {
  if (!esObjeto(valor)) return base;
  return {
    hambre: numero(valor.hambre ?? valor.hunger, base.hambre),
    animo: numero(valor.animo ?? valor.alegria ?? valor.happiness, base.animo),
    energia: numero(valor.energia ?? valor.energy, base.energia),
    higiene: numero(valor.higiene ?? valor.cleanliness, base.higiene),
    salud: numero(valor.salud ?? valor.health, base.salud),
    vinculo: numero(valor.vinculo ?? valor.bond, base.vinculo)
  };
}

function normalizarPerfil(valor, base) {
  if (!esObjeto(valor)) return base;
  const acciones = esObjeto(valor.acciones) ? valor.acciones : {};
  const favoritas = ["hambre", "animo", "energia", "higiene", "salud", "vinculo"];
  const favorita = favoritas.includes(valor.estadisticaFavorita) ? valor.estadisticaFavorita : base.estadisticaFavorita;
  return {
    calidad: numero(valor.calidad, base.calidad),
    descuidos: numero(valor.descuidos, base.descuidos),
    disciplina: numero(valor.disciplina, base.disciplina),
    estadisticaFavorita: favorita,
    acciones: {
      caricias: numero(acciones.caricias, base.acciones.caricias),
      comidas: numero(acciones.comidas, base.acciones.comidas),
      juegos: numero(acciones.juegos, base.acciones.juegos),
      limpiezas: numero(acciones.limpiezas, base.acciones.limpiezas),
      curas: numero(acciones.curas, base.acciones.curas)
    }
  };
}