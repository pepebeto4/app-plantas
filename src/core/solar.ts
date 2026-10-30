// Posición solar (algoritmo NOAA simplificado, error < 0.5º para este uso).
const rad = Math.PI / 180;

export interface SunPosition {
  altitud: number; // grados sobre el horizonte
  azimut: number; // grados, 0 = N, 90 = E, 180 = S
}

// fecha en UTC
export function sunPosition(fecha: Date, lat: number, lon: number): SunPosition {
  const ms = fecha.getTime();
  const jd = ms / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * n) % 360; // anomalía media
  const q = (280.459 + 0.98564736 * n) % 360; // longitud media
  const L = q + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad); // longitud eclíptica
  const e = 23.439 - 0.00000036 * n; // oblicuidad
  const ra = Math.atan2(Math.cos(e * rad) * Math.sin(L * rad), Math.cos(L * rad)) / rad;
  const dec = Math.asin(Math.sin(e * rad) * Math.sin(L * rad)) / rad;
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const lst = gmst + lon / 15;
  let ha = lst * 15 - ra; // ángulo horario
  ha = ((ha + 540) % 360) - 180;

  const sinAlt =
    Math.sin(lat * rad) * Math.sin(dec * rad) +
    Math.cos(lat * rad) * Math.cos(dec * rad) * Math.cos(ha * rad);
  const alt = Math.asin(sinAlt);
  const cosAz =
    (Math.sin(dec * rad) - Math.sin(alt) * Math.sin(lat * rad)) /
    (Math.cos(alt) * Math.cos(lat * rad));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) / rad;
  if (ha > 0) az = 360 - az;
  return { altitud: alt / rad, azimut: az };
}
