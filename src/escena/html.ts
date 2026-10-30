import { ESCENA_JS, THREE_JS } from "./generado";

const seguro = (js: string) => js.replace(/<\/script/gi, "<\\/script");

export const ESCENA_DISPONIBLE = THREE_JS.length > 0;

// Página completa de la vista web: lienzo a pantalla completa, three.js y la escena incrustados.
export function htmlEscena(fondo: string): string {
  return (
    "<!doctype html><html><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">" +
    "<style>html,body{margin:0;height:100%;overflow:hidden;background:" + fondo + ";" +
    "-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}" +
    "#escena{display:block;width:100%;height:100%;touch-action:none}</style></head><body>" +
    "<canvas id=\"escena\"></canvas>" +
    "<script>" + seguro(THREE_JS) + "</script>" +
    "<script>" + seguro(ESCENA_JS) + "</script>" +
    "</body></html>"
  );
}
