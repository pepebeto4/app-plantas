// Datos solo visuales de cada planta en la maqueta 3D.
// La posición en planta (x, y) sale de datos-iniciales.ts; aquí va cómo se dibuja.
export type Forma = "espatifilo" | "monstera" | "poto-colgante" | "poto-balda" | "lengua" | "areca";

export interface Planta3D {
  forma: Forma;
  color: string; // color propio de la planta
  base: number; // altura donde apoya la maceta (m)
  alto: number; // altura de la planta sobre su base, para colocar el aviso de riego
  pared?: "ventana" | "fondo" | "izquierda" | "derecha"; // si está sobre una balda
}

export const PLANTAS_3D: Record<string, Planta3D> = {
  espatifilo: { forma: "espatifilo", color: "#3E9150", base: 0.75, alto: 0.6 },
  monstera: { forma: "monstera", color: "#2F8A4C", base: 0.75, alto: 1.15 },
  poto: { forma: "poto-colgante", color: "#79B341", base: 1.95, alto: 0.25 },
  lengua: { forma: "lengua", color: "#4E7D3A", base: 0, alto: 0.8 },
  areca: { forma: "areca", color: "#9CC24E", base: 0, alto: 1.5 },
  "poto-balda": { forma: "poto-balda", color: "#8DC63F", base: 1.65, alto: 0.15, pared: "derecha" },
};

export const PLANTA_3D_DEFECTO: Planta3D = { forma: "espatifilo", color: "#3E9150", base: 0, alto: 0.6 };
