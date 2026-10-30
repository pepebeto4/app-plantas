import { UBICACION } from "../core/datos-iniciales";
import { obtenerClima } from "../core/weather";
import { cargarClimaGuardado, guardarClima, type ClimaGuardado } from "./almacen";

const MAX_EDAD_MS = 3 * 60 * 60 * 1000; // se refresca si tiene más de 3 horas

export interface EstadoClima extends ClimaGuardado {
  desactualizado: boolean; // true si no se pudo refrescar y se usa la copia guardada
}

export async function climaActual(forzar = false): Promise<EstadoClima | null> {
  const guardado = await cargarClimaGuardado();
  const fresco =
    guardado && Date.now() - Date.parse(guardado.obtenido) < MAX_EDAD_MS && !forzar;
  if (fresco) return { ...guardado, desactualizado: false };
  try {
    const dias = await obtenerClima(UBICACION);
    const nuevo = { dias, obtenido: new Date().toISOString() };
    await guardarClima(nuevo);
    return { ...nuevo, desactualizado: false };
  } catch {
    return guardado ? { ...guardado, desactualizado: true } : null;
  }
}
