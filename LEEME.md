# Plantas

App de riego con clima de Bormujos (Open-Meteo) y luz calculada por planta.

## Arrancar en el iPhone

1. Instala Node.js LTS (nodejs.org) en Windows.
2. Instala Expo Go en el iPhone (App Store).
3. Doble clic en `instalar.bat`. Tarda unos minutos.
4. Doble clic en `iniciar.bat` (regenera la maqueta 3D y arranca Expo).
5. Escanea el QR con la cámara del iPhone. Ordenador e iPhone en la misma wifi.
   Si no conecta: `npm start -- --tunnel`.

## App nativa (sin Expo Go)

Ver `COMPILAR-IPHONE.md`. Compilación gratuita con GitHub Actions (`.github/workflows/compilar-ios.yml`) e instalación con Sideloadly.

## Estructura

- `src/core/`: cálculo puro (sol, luz, riego, clima). No depende de la interfaz.
- `src/core/datos-iniciales.ts`: cuarto, ventana y posición de las plantas. Medidas estimadas: sustituir por las reales.
- `src/data/`: almacenamiento en el móvil, clima con caché y avisos.
- `src/ui/`: pantallas (Cuarto con la maqueta 3D, Riegos, ficha de planta).
- `escena-web/escena.js`: la maqueta 3D. Se incrusta en la app con three.js al ejecutar `npm start`.
- `src/escena/plantas3d.ts`: forma, color y altura de cada planta en la maqueta.

## Avisos

Cada vez que se abre la app se reprograman los avisos de riego a las 10:00 del día que toca.
Las plantas que se pasan de fecha se avisan al día siguiente a las 10:00.
