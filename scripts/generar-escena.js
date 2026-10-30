// Incrusta three.js y la escena como texto en src/escena/generado.ts,
// para que la vista web funcione sin conexión y sin servidor.
// Se ejecuta en instalar.bat y antes de `npm start`.
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const threePath = path.join(raiz, "node_modules", "three", "build", "three.min.js");
const escenaPath = path.join(raiz, "escena-web", "escena.js");
const salida = path.join(raiz, "src", "escena", "generado.ts");

if (!fs.existsSync(threePath)) {
  console.error("No se encuentra three.js. Ejecuta: npm install three@0.128.0");
  process.exit(1);
}

const three = fs.readFileSync(threePath, "utf8");
const escena = fs.readFileSync(escenaPath, "utf8");
const contenido =
  "// Archivo generado por scripts/generar-escena.js. No editar a mano.\n" +
  "export const THREE_JS = " + JSON.stringify(three) + ";\n" +
  "export const ESCENA_JS = " + JSON.stringify(escena) + ";\n";

fs.writeFileSync(salida, contenido);
console.log("Escena 3D generada (" + Math.round(contenido.length / 1024) + " KB)");
