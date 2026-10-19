import { BALANCE } from "./balance";
import { etapaSiguiente, obtenerEspecie } from "./especies";
import type { CondicionEvolucion, Mascota, Partida, RutaEvolucion } from "./types";

function cumpleCondicion(condicion: CondicionEvolucion | undefined, mascota: Mascota): boolean {
  if (!condicion) return true;
  const necesidades = mascota.necesidades;
  return (
    (condicion.vinculoMinimo === undefined || necesidades.vinculo >= condicion.vinculoMinimo) &&
    (condicion.animoMinimo === undefined || necesidades.animo >= condicion.animoMinimo) &&
    (condicion.higieneMinima === undefined || necesidades.higiene >= condicion.higieneMinima) &&
    (condicion.saludMinima === undefined || necesidades.salud >= condicion.saludMinima) &&
    (condicion.calidadMinima === undefined || mascota.perfil.calidad >= condicion.calidadMinima) &&
    (condicion.descuidosMaximos === undefined || mascota.perfil.descuidos <= condicion.descuidosMaximos)
  );
}

function elegirRuta(rutas: readonly RutaEvolucion[], mascota: Mascota): RutaEvolucion | undefined {
  return [...rutas]
    .filter((ruta) => cumpleCondicion(ruta.condicion, mascota))
    .sort((a, b) => b.prioridad - a.prioridad)[0];
}

// La vida avanza por etapas definidas en balance.ts; las ramas vienen del catálogo.
export function avanzarEdad(partida: Partida, deltaMs: number): Partida {
  let actual = partida;
  let restante = deltaMs;
  let pasos = 0;

  while (restante > 0 && pasos < 8 && !actual.mascota.seFue) {
    pasos += 1;
    const especie = obtenerEspecie(actual.mascota.especieId);
    const duracion = BALANCE.etapasMs[especie.etapa];
    const hastaCambio = Math.max(0, duracion - actual.mascota.edadEtapaMs);
    const transcurrido = Math.min(restante, hastaCambio);

    actual = {
      ...actual,
      mascota: {
        ...actual.mascota,
        edadTotalMs: actual.mascota.edadTotalMs + transcurrido,
        edadEtapaMs: actual.mascota.edadEtapaMs + transcurrido
      }
    };
    restante -= transcurrido;

    if (transcurrido < hastaCambio) break;

    const siguienteEtapa = etapaSiguiente(especie.etapa);
    if (!siguienteEtapa) {
      actual = {
        ...actual,
        mascota: { ...actual.mascota, seFue: true, durmiendo: false },
        despedidaPendiente: true,
        descubrimientos: actual.descubrimientos.includes(especie.id)
          ? actual.descubrimientos
          : [...actual.descubrimientos, especie.id]
      };
      break;
    }

    const ruta = elegirRuta(especie.evoluciones, actual.mascota);
    const destino = ruta ? obtenerEspecie(ruta.destino) : undefined;
    if (!destino || destino.etapa !== siguienteEtapa) break;

    const siguienteMascota: Mascota = {
      ...actual.mascota,
      especieId: destino.id,
      edadEtapaMs: 0
    };
    actual = {
      ...actual,
      mascota: siguienteMascota,
      descubrimientos: actual.descubrimientos.includes(destino.id)
        ? actual.descubrimientos
        : [...actual.descubrimientos, destino.id],
      evolucionPendiente: actual.evolucionPendiente ?? { desde: especie.id, hasta: destino.id }
    };
  }

  return actual;
}