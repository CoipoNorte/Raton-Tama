export interface MarcoDiorama {
  movil: boolean;
  compacto: boolean;
  retratoDenso: boolean;
  ancho: number;
  alto: number;
  altoDisponible: number;
  cabe: boolean;
}

export function calcularMarcoDiorama(ancho: number, alto: number): MarcoDiorama;