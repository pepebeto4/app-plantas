import { useColorScheme } from "react-native";
import type { EstadoRiego } from "../core/watering";

// Tonos verde-gris de hoja; los estados usan colores de suelo y sol, separados del acento.
const claro = {
  fondo: "#F2F4EF",
  superficie: "#FFFFFF",
  texto: "#16201A",
  tenue: "#5B6A60",
  linea: "#DCE3D9",
  acento: "#2E6A44",
  acentoTexto: "#FFFFFF",
  pista: "#E4EAE2",
  atrasada: "#B9432C",
  hoy: "#B87A0E",
  pronto: "#4F7F86",
  ok: "#2E6A44",
  sin_datos: "#7C8A80",
};

const oscuro: typeof claro = {
  fondo: "#0E1310",
  superficie: "#172019",
  texto: "#E5ECE6",
  tenue: "#93A298",
  linea: "#253029",
  acento: "#7EC394",
  acentoTexto: "#0E1310",
  pista: "#222C25",
  atrasada: "#EE7A61",
  hoy: "#EDB441",
  pronto: "#82B8BF",
  ok: "#7EC394",
  sin_datos: "#7F8D83",
};

export type Tema = typeof claro;

export function useTema(): Tema {
  return useColorScheme() === "dark" ? oscuro : claro;
}

export const ETIQUETA_ESTADO: Record<EstadoRiego["estado"], string> = {
  atrasada: "Atrasada",
  hoy: "Hoy",
  pronto: "Mañana",
  ok: "Al día",
  sin_datos: "Sin registrar",
};

export const ETIQUETA_LUZ = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  muy_alta: "Muy alta",
} as const;

export const num = (n: number, dec = 1) => n.toFixed(dec).replace(".", ",");
