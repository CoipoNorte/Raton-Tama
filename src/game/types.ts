export type Etapa = "huevo" | "bebe" | "nino" | "adolescente" | "adulto" | "anciano";

export type NecesidadId = "hambre" | "animo" | "energia" | "higiene" | "salud" | "vinculo";

export type Necesidades = Record<NecesidadId, number>;

export type AccionEntrada =
  | "confirmar"
  | "cancelar"
  | "arriba"
  | "abajo"
  | "izquierda"
  | "derecha"
  | "menu"
  | "pestanaAnterior"
  | "pestanaSiguiente"
  | "accionRapida1"
  | "accionRapida2"
  | "accionRapida3"
  | "accionRapida4"
  | "pausa";

export type FuenteEntrada = "teclado" | "mando";

export interface CondicionEvolucion {
  vinculoMinimo?: number;
  animoMinimo?: number;
  higieneMinima?: number;
  saludMinima?: number;
  calidadMinima?: number;
  descuidosMaximos?: number;
}

export interface RutaEvolucion {
  destino: string;
  prioridad: number;
  condicion?: CondicionEvolucion;
}

export interface Especie {
  id: string;
  nombre: string;
  etapa: Etapa;
  descripcion: string;
  color: string;
  acento: string;
  mejillas: string;
  evoluciones: RutaEvolucion[];
}

export interface Alimento {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  modelo: "onigiri" | "fruta" | "bebida" | "pastel" | "queso";
  precio: number;
  efecto: Partial<Necesidades>;
}

export interface ArrastreComida {
  comidaId: string;
  modelo: Alimento["modelo"];
  x: number;
  y: number;
}

export interface ObjetoJuego {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: "mueble" | "juguete" | "decoracion" | "ropa";
  modelo: "planta" | "pelota" | "lampara" | "cojin" | "gorrito";
  color: string;
  precio: number;
}

export interface PerfilCuidados {
  calidad: number;
  descuidos: number;
  disciplina: number;
  estadisticaFavorita: NecesidadId;
  acciones: {
    caricias: number;
    comidas: number;
    juegos: number;
    limpiezas: number;
    curas: number;
  };
}

export interface Mascota {
  especieId: string;
  nombre: string;
  generacion: number;
  edadTotalMs: number;
  edadEtapaMs: number;
  necesidades: Necesidades;
  perfil: PerfilCuidados;
  suciedad: number;
  durmiendo: boolean;
  enferma: boolean;
  seFue: boolean;
  tinteHerencia?: string;
}

export interface Preferencias {
  silencio: boolean;
  musica: boolean;
  vibracion: boolean;
}

export interface ContadoresPartida {
  cuidados: number;
  juegos: number;
  comidas: number;
  caricias: number;
  limpiezas: number;
  monedasGanadas: number;
}

export interface Partida {
  version: 1;
  mascota: Mascota;
  monedas: number;
  medicinas: number;
  descubrimientos: string[];
  comidas: Record<string, number>;
  objetos: string[];
  logros: string[];
  recordsMinijuegos: Record<string, number>;
  contadores: ContadoresPartida;
  preferencias: Preferencias;
  iniciada: boolean;
  pausada: boolean;
  ultimaMarcaValidada: number;
  progresoSuciedadMs: number;
  evolucionPendiente: { desde: string; hasta: string } | null;
  despedidaPendiente: boolean;
}

export interface ResumenAusencia {
  minutos: number;
  hambre: number;
  animo: number;
  energia: number;
  higiene: number;
  suciedadNueva: number;
}

export interface ResultadoSimulacion {
  partida: Partida;
  resumen: ResumenAusencia | null;
}

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  contador: keyof ContadoresPartida;
  objetivo: number;
}