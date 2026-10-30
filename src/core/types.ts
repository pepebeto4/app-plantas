// Tipos del núcleo. Sin dependencias de interfaz ni de plataforma.
// Sistema de coordenadas del cuarto (metros):
//   x: a lo largo de la pared de la ventana, de izquierda a derecha mirando hacia la ventana
//   y: profundidad, 0 en la pared de la ventana, crece hacia el interior
//   z: altura desde el suelo

export type SpeciesId =
  | "spathiphyllum"
  | "monstera_adansonii"
  | "epipremnum"
  | "sansevieria"
  | "dypsis_lutescens";

export type LightLevel = "baja" | "media" | "alta" | "muy_alta";

export interface Species {
  id: SpeciesId;
  nombre: string;
  // Intervalo base de riego en días, interior, en las condiciones de referencia
  intervaloVerano: number; // jun-ago
  intervaloInvierno: number; // dic-feb
  // Luz diaria integrada recomendada (DLI, mol/m²/día). Rangos orientativos de horticultura.
  dliMin: number;
  dliIdeal: number;
  // 0 = necesita sustrato húmedo, 1 = tolera sequía prolongada
  toleranciaSequia: number;
  señalSed: string;
}

export interface Location {
  nombre: string;
  lat: number;
  lon: number;
}

export interface Window {
  id: string;
  centroX: number; // m
  ancho: number; // m
  alfeizar: number; // altura del borde inferior desde el suelo, m
  alto: number; // m
  // Azimut hacia el que mira la ventana desde dentro hacia fuera (0 = N, 90 = E, 180 = S)
  azimut: number;
  // Fracción de luz que deja pasar cristal + visillo/cortina (0-1)
  transmision: number;
  // true si el visillo convierte el sol directo en luz difusa
  difusor: boolean;
  // Fracción del haz solar que atraviesa el visillo sin difundirse (0 = difusor perfecto)
  transmisionDirecta: number;
}

export interface Room {
  ancho: number; // eje x, m
  fondo: number; // eje y, m
  alto: number; // m
  ventanas: Window[];
  // Reflectancia media de paredes, techo y suelo (0-1). Paredes claras ~0.6
  reflectancia: number;
}

export interface Plant {
  id: string;
  nombre: string;
  especie: SpeciesId;
  x: number;
  y: number;
  z: number; // altura de la copa
  maceta?: "pequeña" | "mediana" | "grande"; // las macetas pequeñas se secan antes
  ultimoRiego?: string; // ISO yyyy-mm-dd
  historialRiegos: string[];
}

export interface WeatherDay {
  fecha: string; // yyyy-mm-dd
  tempMax: number; // ºC
  tempMin: number; // ºC
  humedadMedia: number; // %
  nubosidad: number; // % 0-100
  et0: number; // mm/día, evapotranspiración de referencia FAO
  precipitacion: number; // mm
}
