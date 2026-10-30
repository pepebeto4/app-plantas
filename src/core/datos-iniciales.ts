import type { Location, Plant, Room } from "./types";

export const UBICACION: Location = { nombre: "Bormujos", lat: 37.372, lon: -6.072 };

// MEDIDAS ESTIMADAS A PARTIR DE LAS FOTOS DE LAS 4 PAREDES. Sustituir por las medidas reales.
export const CUARTO: Room = {
  ancho: 3.1,
  fondo: 2.9, // esquina a menos de 3 m de la ventana
  alto: 2.6,
  reflectancia: 0.45, // paredes claras, suelo de barro y muebles oscuros
  ventanas: [
    {
      id: "ventana",
      centroX: 1.6,
      ancho: 1.1,
      alfeizar: 0.95,
      alto: 1.2,
      azimut: 157.5, // sur-sureste
      transmision: 0.5, // cristal + visillo translúcido + reja
      difusor: true,
      transmisionDirecta: 0.15, // visillo translúcido: deja pasar parte del sol sin difundir
    },
  ],
};

// Posiciones estimadas (m). z = altura aproximada de la copa.
export const PLANTAS: Plant[] = [
  { id: "espatifilo", nombre: "Espatifilo", especie: "spathiphyllum", x: 1.36, y: 0.3, z: 1.0, historialRiegos: [] },
  { id: "monstera", nombre: "Monstera adansonii", especie: "monstera_adansonii", x: 1.8, y: 0.3, z: 1.2, historialRiegos: [] },
  { id: "poto", nombre: "Poto", especie: "epipremnum", x: 0.36, y: 0.32, z: 1.9, historialRiegos: [] },
  { id: "lengua", nombre: "Lengua de suegra", especie: "sansevieria", x: 2.93, y: 2.2, z: 0.35, historialRiegos: [] },
  { id: "areca", nombre: "Areca", especie: "dypsis_lutescens", x: 2.84, y: 2.62, z: 1.0, historialRiegos: [] },
  { id: "poto-balda", nombre: "Poto pequeño", especie: "epipremnum", x: 2.97, y: 1.7, z: 1.75, maceta: "pequeña", historialRiegos: [] },
];
