/** Medidas compartidas por el escenario y las verificaciones responsive. */
export function calcularMarcoDiorama(ancho, alto) {
  const movil = ancho <= 760;
  const compacto = alto <= 470 && ancho > alto;
  const retratoDenso = movil && !compacto && alto <= 430;
  const contenedor = Math.min(ancho, 1740);
  const margen = compacto ? 13 : movil ? (ancho <= 370 ? 7 : 9) : Math.min(38, Math.max(12, ancho * 0.0225));
  const panel = compacto ? 144 : movil ? 0 : ancho <= 1050 ? 174 : Math.min(245, Math.max(185, ancho * 0.18));
  const separacion = compacto ? 15 : movil ? 0 : ancho <= 1050 ? 22 : Math.min(54, Math.max(20, ancho * 0.032));
  const cabecera = compacto || retratoDenso ? 50 : movil ? 62 : 76;
  const acciones = compacto ? 70 : retratoDenso ? 64 : movil ? 78 : 112;
  const necesidades = movil && !compacto ? (retratoDenso ? 48 : ancho <= 370 ? 72 : 76) : 0;
  const relleno = compacto ? 6 : retratoDenso ? 0 : movil ? 2 : 18;
  const anchoDisponible = Math.max(0, contenedor - 2 * margen - panel - separacion);
  const altoDisponible = Math.max(0, alto - cabecera - acciones - necesidades - relleno);

  return {
    movil,
    compacto,
    retratoDenso,
    ancho: anchoDisponible,
    alto: altoDisponible,
    altoDisponible,
    cabe: anchoDisponible > 0 && altoDisponible > 0 && altoDisponible <= alto - cabecera - acciones - necesidades
  };
}