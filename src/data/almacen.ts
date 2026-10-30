// Capa de almacenamiento. La interfaz no sabe dónde se guardan los datos:
// para cambiar a SQLite u otro sistema solo se sustituye este archivo.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PLANTAS } from "../core/datos-iniciales";
import type { Plant, WeatherDay } from "../core/types";

const CLAVE_PLANTAS = "plantas.v1";
const CLAVE_CLIMA = "clima.v1";

export async function cargarPlantas(): Promise<Plant[]> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_PLANTAS);
    if (raw) {
      const guardadas = JSON.parse(raw) as Plant[];
      // Añade las plantas nuevas del inventario que aún no estén guardadas
      const nuevas = PLANTAS.filter((p) => !guardadas.some((g) => g.id === p.id));
      return [...guardadas, ...nuevas.map((p) => ({ ...p, historialRiegos: [] }))];
    }
  } catch {
    // datos corruptos o almacenamiento no disponible: se parte de los iniciales
  }
  return PLANTAS.map((p) => ({ ...p, historialRiegos: [...p.historialRiegos] }));
}

export async function guardarPlantas(plantas: Plant[]): Promise<void> {
  await AsyncStorage.setItem(CLAVE_PLANTAS, JSON.stringify(plantas));
}

export interface ClimaGuardado {
  dias: WeatherDay[];
  obtenido: string; // ISO con hora
}

export async function cargarClimaGuardado(): Promise<ClimaGuardado | null> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_CLIMA);
    return raw ? (JSON.parse(raw) as ClimaGuardado) : null;
  } catch {
    return null;
  }
}

export async function guardarClima(c: ClimaGuardado): Promise<void> {
  await AsyncStorage.setItem(CLAVE_CLIMA, JSON.stringify(c));
}

// Operaciones sobre el historial: devuelven una lista nueva, no mutan.
export function registrarRiego(plantas: Plant[], id: string, fecha: string): Plant[] {
  return plantas.map((p) => {
    if (p.id !== id) return p;
    const historial = Array.from(new Set([...p.historialRiegos, fecha])).sort();
    return { ...p, historialRiegos: historial, ultimoRiego: historial[historial.length - 1] };
  });
}

export function deshacerUltimoRiego(plantas: Plant[], id: string): Plant[] {
  return plantas.map((p) => {
    if (p.id !== id || p.historialRiegos.length === 0) return p;
    const historial = p.historialRiegos.slice(0, -1);
    return { ...p, historialRiegos: historial, ultimoRiego: historial[historial.length - 1] };
  });
}
