import type { Location, WeatherDay } from "./types";

// Open-Meteo: gratuito, sin clave. Solo este archivo conoce la API.
export function urlOpenMeteo(loc: Location, diasPasados = 3, diasFuturos = 3) {
  const daily = [
    "temperature_2m_max",
    "temperature_2m_min",
    "relative_humidity_2m_mean",
    "cloud_cover_mean",
    "et0_fao_evapotranspiration",
    "precipitation_sum",
  ].join(",");
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&daily=${daily}&timezone=Europe%2FMadrid&past_days=${diasPasados}&forecast_days=${diasFuturos}`
  );
}

export function parsearOpenMeteo(json: any): WeatherDay[] {
  const d = json?.daily;
  if (!d?.time) throw new Error("Respuesta de Open-Meteo sin datos diarios");
  return d.time.map((fecha: string, i: number) => ({
    fecha,
    tempMax: d.temperature_2m_max?.[i] ?? NaN,
    tempMin: d.temperature_2m_min?.[i] ?? NaN,
    humedadMedia: d.relative_humidity_2m_mean?.[i] ?? 60,
    nubosidad: d.cloud_cover_mean?.[i] ?? 0,
    et0: d.et0_fao_evapotranspiration?.[i] ?? 3,
    precipitacion: d.precipitation_sum?.[i] ?? 0,
  }));
}

// fetchImpl se inyecta para poder probar sin red y usar el fetch de cada plataforma.
export async function obtenerClima(loc: Location, fetchImpl: typeof fetch = fetch) {
  const res = await fetchImpl(urlOpenMeteo(loc));
  if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);
  return parsearOpenMeteo(await res.json());
}
