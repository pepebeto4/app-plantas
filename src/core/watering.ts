import type { Plant, Species, WeatherDay } from "./types";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// Intervalo base según el mes: interpolación coseno entre invierno (enero) y verano (julio).
export function intervaloEstacional(sp: Species, fecha: Date): number {
  const mes = fecha.getUTCMonth() + fecha.getUTCDate() / 31; // 0..12
  const t = (1 - Math.cos(((mes - 0.5) / 12) * 2 * Math.PI)) / 2; // 0 en enero, 1 en julio
  return sp.intervaloInvierno + (sp.intervaloVerano - sp.intervaloInvierno) * t;
}

// Ajuste por clima exterior (afecta al interior de forma amortiguada).
// Referencia: ET0 de 3 mm/día y humedad del 60 %.
export function factorClima(dias: WeatherDay[]): number {
  if (!dias.length) return 1;
  const et0 = dias.reduce((s, d) => s + d.et0, 0) / dias.length;
  const hum = dias.reduce((s, d) => s + d.humedadMedia, 0) / dias.length;
  const porEt0 = Math.pow(3 / Math.max(et0, 0.3), 0.35); // amortiguado: el interior varía menos
  const porHumedad = 1 + ((hum - 60) / 100) * 0.4;
  return clamp(porEt0 * porHumedad, 0.7, 1.35);
}

// Más luz = más consumo de agua. ratio = luz recibida / luz ideal de la especie.
export function factorLuz(ratio: number): number {
  return clamp(Math.pow(1 / Math.max(ratio, 0.1), 0.25), 0.8, 1.3);
}

const FACTOR_MACETA = { pequeña: 0.7, mediana: 1, grande: 1.25 } as const;

export interface EstadoRiego {
  base: number; // días según la estación
  fClima: number;
  fLuz: number;
  fMaceta: number;
  intervaloDias: number;
  proximoRiego: string | null; // yyyy-mm-dd
  diasRestantes: number | null; // negativo = atrasada
  estado: "sin_datos" | "ok" | "pronto" | "hoy" | "atrasada";
}

export function estadoRiego(
  p: Plant,
  sp: Species,
  hoy: Date,
  clima: WeatherDay[],
  ratioLuz: number,
): EstadoRiego {
  const base = intervaloEstacional(sp, hoy);
  const fClima = factorClima(clima);
  const fLuz = factorLuz(ratioLuz);
  const fMaceta = FACTOR_MACETA[p.maceta ?? "mediana"];
  const intervalo = base * fClima * fLuz * fMaceta;
  const intervaloDias = Math.round(intervalo * 10) / 10;
  const comun = { base, fClima, fLuz, fMaceta, intervaloDias };
  if (!p.ultimoRiego) return { ...comun, proximoRiego: null, diasRestantes: null, estado: "sin_datos" };

  const ultimo = Date.parse(p.ultimoRiego + "T00:00:00Z");
  const hoyUTC = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  const proximo = ultimo + Math.round(intervalo) * 86400000;
  const diasRestantes = Math.round((proximo - hoyUTC) / 86400000);
  const estado =
    diasRestantes < 0 ? "atrasada" : diasRestantes === 0 ? "hoy" : diasRestantes <= 1 ? "pronto" : "ok";
  return {
    ...comun,
    proximoRiego: new Date(proximo).toISOString().slice(0, 10),
    diasRestantes,
    estado,
  };
}
