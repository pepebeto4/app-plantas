import { sunPosition } from "./solar";
import type { Location, Plant, Room, Window, LightLevel, Species } from "./types";

const rad = Math.PI / 180;
const LUX_POR_WATT = 115; // eficacia luminosa aproximada de la luz natural
const SOLAR = 1353; // W/m² fuera de la atmósfera

// Irradiancia exterior (W/m²) con modelo de cielo despejado + corrección por nubes.
function irradianciaExterior(altitud: number, nubosidad: number) {
  if (altitud <= 0) return { dni: 0, dhi: 0, ghi: 0 };
  const sinA = Math.sin(Math.max(altitud, 2) * rad);
  const masaAire = 1 / sinA;
  const dniDespejado = SOLAR * Math.pow(0.7, Math.pow(masaAire, 0.678));
  const ghiDespejado = 1.1 * dniDespejado * sinA;
  const c = Math.min(1, Math.max(0, nubosidad / 100));
  const ghi = ghiDespejado * (1 - 0.75 * Math.pow(c, 3.4));
  const dni = dniDespejado * Math.pow(1 - c, 1.5);
  const dhi = Math.max(ghi - dni * sinA, 0.1 * dniDespejado * sinA);
  return { dni, dhi, ghi };
}

// Irradiancia que llega al plano exterior de la ventana (W/m²)
function irradianciaEnVentana(v: Window, altitud: number, azimut: number, nubosidad: number) {
  const { dni, dhi, ghi } = irradianciaExterior(altitud, nubosidad);
  const cosInc = Math.cos(altitud * rad) * Math.cos((azimut - v.azimut) * rad);
  const directa = dni * Math.max(0, cosInc);
  const cielo = dhi * 0.5; // cielo isótropo sobre plano vertical
  const suelo = ghi * 0.2 * 0.5; // reflexión del suelo exterior, albedo 0.2
  return directa + cielo + suelo;
}

// Factor geométrico: iluminancia en un punto por unidad de exitancia de la ventana.
// La ventana con visillo se trata como superficie lambertiana.
// El receptor (la planta) se orienta hacia el centro de la ventana.
function factorGeometrico(v: Window, px: number, py: number, pz: number, celdas = 12) {
  const cx = v.centroX;
  const cz = v.alfeizar + v.alto / 2;
  // normal del receptor: hacia el centro de la ventana
  let nx = cx - px, ny = 0 - py, nz = cz - pz;
  const nl = Math.hypot(nx, ny, nz) || 1;
  nx /= nl; ny /= nl; nz /= nl;

  const dA = (v.ancho / celdas) * (v.alto / celdas);
  let suma = 0;
  for (let i = 0; i < celdas; i++) {
    for (let j = 0; j < celdas; j++) {
      const wx = cx - v.ancho / 2 + (i + 0.5) * (v.ancho / celdas);
      const wz = v.alfeizar + (j + 0.5) * (v.alto / celdas);
      const dx = wx - px, dy = 0 - py, dz = wz - pz;
      const r2 = dx * dx + dy * dy + dz * dz;
      const r = Math.sqrt(r2);
      if (py <= 0.01) continue;
      const cosVentana = py / r; // normal de la ventana apunta hacia +y
      const cosReceptor = Math.max(0, (dx * nx + dy * ny + dz * nz) / r);
      suma += (cosVentana * cosReceptor * dA) / r2;
    }
  }
  return suma / Math.PI;
}

// Conversión de luz natural: 1 lux ≈ 0,0185 µmol/m²/s de PAR
export const luxHoraADli = (luxHora: number) => (luxHora * 0.0185 * 3600) / 1e6;

export interface LuzDiaria {
  dli: number; // mol/m²/día
  luxHora: number; // lux·hora acumulados en el día
  luxMediodia: number; // lux aproximados en el máximo del día
  horasSolDirectoEnVentana: number;
  horasSolEnPunto: number; // horas en que el haz del sol cae sobre el punto
}

// Integra la luz de un día en un punto del cuarto.
export function luzDiariaEnPunto(
  room: Room,
  loc: Location,
  fechaISO: string,
  punto: { x: number; y: number; z: number },
  nubosidad = 0,
  pasoMin = 10,
): LuzDiaria {
  const base = Date.parse(fechaISO + "T00:00:00Z");
  const superficieTotal =
    2 * (room.ancho * room.fondo + room.ancho * room.alto + room.fondo * room.alto);
  const geo = room.ventanas.map((v) => factorGeometrico(v, punto.x, punto.y, punto.z));

  let luxHora = 0, maxLux = 0, minutosSol = 0, minutosSolEnPunto = 0;
  for (let m = 0; m < 1440; m += pasoMin) {
    const { altitud, azimut } = sunPosition(new Date(base + m * 60000), loc.lat, loc.lon);
    if (altitud <= 0) continue;
    const { dni } = irradianciaExterior(altitud, nubosidad);
    let directaPunto = 0, flujoTotal = 0, solEnAlguna = false, solEnPunto = false;
    room.ventanas.forEach((v, k) => {
      const e = irradianciaEnVentana(v, altitud, azimut, nubosidad) * v.transmision;
      const cosInc = Math.cos(altitud * rad) * Math.cos((azimut - v.azimut) * rad);
      // Parte del haz directo que atraviesa el visillo sin difundirse
      const haz = dni * Math.max(0, cosInc) * v.transmisionDirecta;
      const difusa = Math.max(0, e - haz);
      directaPunto += difusa * geo[k];
      flujoTotal += e * v.ancho * v.alto;
      if (cosInc > 0.05) solEnAlguna = true;
      if (haz > 0 && rayoPasaPorVentana(v, punto, altitud, azimut)) {
        directaPunto += dni * v.transmisionDirecta; // receptor orientado al sol
        solEnPunto = true;
      }
    });
    if (solEnPunto) minutosSolEnPunto += pasoMin;
    // Componente reflejada por paredes, techo y suelo (método de flujo dividido)
    const reflejada = (flujoTotal * room.reflectancia) / (superficieTotal * (1 - room.reflectancia));
    const lux = (directaPunto + reflejada) * LUX_POR_WATT;
    luxHora += lux * (pasoMin / 60);
    if (lux > maxLux) maxLux = lux;
    if (solEnAlguna && nubosidad < 50) minutosSol += pasoMin;
  }
  return {
    dli: luxHoraADli(luxHora),
    luxHora,
    luxMediodia: maxLux,
    horasSolDirectoEnVentana: minutosSol / 60,
    horasSolEnPunto: minutosSolEnPunto / 60,
  };
}

// ¿Llega el rayo de sol al punto a través del hueco de la ventana?
// La ventana está en y = 0 y mira hacia fuera en v.azimut; +x queda a la derecha mirando a la ventana.
function rayoPasaPorVentana(
  v: Window,
  p: { x: number; y: number; z: number },
  altitud: number,
  azimut: number,
) {
  const d = (azimut - v.azimut) * rad;
  const haciaFuera = Math.cos(altitud * rad) * Math.cos(d);
  if (haciaFuera <= 0 || p.y <= 0) return false;
  const t = p.y / haciaFuera;
  const hx = p.x + t * Math.cos(altitud * rad) * Math.sin(d);
  const hz = p.z + t * Math.sin(altitud * rad);
  return (
    Math.abs(hx - v.centroX) <= v.ancho / 2 && hz >= v.alfeizar && hz <= v.alfeizar + v.alto
  );
}

export function nivelLuz(dli: number): LightLevel {
  if (dli < 1) return "baja";
  if (dli < 3) return "media";
  if (dli < 7) return "alta";
  return "muy_alta";
}

export function valoracionParaEspecie(dli: number, sp: Species) {
  const ratio = dli / sp.dliIdeal;
  if (dli < sp.dliMin) return { estado: "insuficiente" as const, ratio };
  if (dli < sp.dliIdeal * 0.7) return { estado: "justa" as const, ratio };
  return { estado: "adecuada" as const, ratio };
}

export function luzDePlanta(room: Room, loc: Location, fechaISO: string, p: Plant, nubosidad = 0) {
  return luzDiariaEnPunto(room, loc, fechaISO, p, nubosidad);
}
