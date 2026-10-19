export const BALANCE = {
  "intervaloMs": 12000,
  "limiteOfflineMs": 43200000,
  "umbralSalud": 28,
  "decaimientoPorHora": {
    "hambre": 50,
    "animo": 34,
    "energiaDia": 20,
    "energiaNoche": 11,
    "higiene": 7,
    "saludConDescuidos": 2.2,
    "vinculo": 0.45
  },
  "recuperacionPorHora": {
    "energiaDormida": 38,
    "energiaDescansando": 8,
    "saludDescansando": 1.5
  },
  "suciedadCadaMs": 10800000,
  // Ritmo de las micro-interacciones del diorama (nada de esto está hardcodeado en la UI).
  "cuidados": {
    "limpieza": { "fases": ["jabon", "agua", "toalla"], "manchas": 6, "total": 18, "frotadasJabon": 2, "intervaloFroteMs": 380 },
    "juegoPelota": { "pases": 5, "gravedad": 6.4, "rebote": 0.84, "radio": 0.25, "reboteSuelo": 3.1, "alturaMaxima": 1.62 },
    "caricias": { "zonas": 7, "rejilla": 4, "intervaloSuaveMs": 230 },
    "cura": { "radioAcople": 0.32 }
  },
  "etapasMs": {
    "huevo": 180000,
    "bebe": 5400000,
    "nino": 14400000,
    "adolescente": 28800000,
    "adulto": 86400000,
    "anciano": 43200000
  }
} as const;