// Une el núcleo con los datos: estado de luz y riego de cada planta para hoy.
import { CUARTO, UBICACION } from "./core/datos-iniciales";
import { luzDiariaEnPunto, nivelLuz, valoracionParaEspecie, type LuzDiaria } from "./core/light";
import { SPECIES } from "./core/species";
import type { LightLevel, Plant, Species, WeatherDay } from "./core/types";
import { estadoRiego, type EstadoRiego } from "./core/watering";
import { aFechaNucleo, isoLocal } from "./fechas";

export interface EstadoPlanta {
  planta: Plant;
  especie: Species;
  luz: LuzDiaria;
  nivel: LightLevel;
  valoracionLuz: ReturnType<typeof valoracionParaEspecie>;
  riego: EstadoRiego;
}

const ORDEN: Record<EstadoRiego["estado"], number> = {
  atrasada: 0,
  hoy: 1,
  sin_datos: 2,
  pronto: 3,
  ok: 4,
};

export function calcularEstados(plantas: Plant[], clima: WeatherDay[]): EstadoPlanta[] {
  const hoy = isoLocal();
  const diaHoy = clima.find((d) => d.fecha === hoy);
  const recientes = clima.filter((d) => d.fecha <= hoy).slice(-4);
  const nubosidad = diaHoy?.nubosidad ?? 30;

  const estados = plantas.map((p) => {
    const especie = SPECIES[p.especie];
    const luz = luzDiariaEnPunto(CUARTO, UBICACION, hoy, p, nubosidad);
    const valoracionLuz = valoracionParaEspecie(luz.dli, especie);
    const riego = estadoRiego(p, especie, aFechaNucleo(hoy), recientes, valoracionLuz.ratio);
    return { planta: p, especie, luz, nivel: nivelLuz(luz.dli), valoracionLuz, riego };
  });

  return estados.sort(
    (a, b) =>
      ORDEN[a.riego.estado] - ORDEN[b.riego.estado] ||
      (a.riego.diasRestantes ?? 0) - (b.riego.diasRestantes ?? 0),
  );
}
