import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { EstadoPlanta } from "../calculo";
import { CUARTO } from "../core/datos-iniciales";
import { ESCENA_DISPONIBLE, htmlEscena } from "../escena/html";
import { PLANTA_3D_DEFECTO, PLANTAS_3D } from "../escena/plantas3d";
import { fechaLegible, isoLocal, textoDias } from "../fechas";
import { ETIQUETA_ESTADO, useTema, type Tema } from "./tema";

interface Props {
  estados: EstadoPlanta[];
  seleccion: string | null;
  onSeleccionar: (id: string | null) => void;
  onRegar: (id: string) => void;
  onAbrirFicha: (id: string) => void;
}

// Tonos planos del cuarto en la maqueta; las plantas llevan su color propio.
const TONO_CUARTO = {
  claro: { cuarto: "#CDD3DC", remate: "#F4F6F9", escenario: "#DDE2E9" },
  oscuro: { cuarto: "#3A4558", remate: "#8D99AC", escenario: "#141B26" },
};

export function Cuarto({ estados, seleccion, onSeleccionar, onRegar, onAbrirFicha }: Props) {
  const t = useTema();
  const oscuro = useColorScheme() === "dark";
  const tono = oscuro ? TONO_CUARTO.oscuro : TONO_CUARTO.claro;
  const web = useRef<WebView>(null);
  const [lista, setLista] = useState(false);
  const s = estilos(t);

  // El HTML solo se construye una vez: los cambios de datos se envían sin recargar la escena
  const html = useMemo(() => htmlEscena(tono.escenario), []); // eslint-disable-line react-hooks/exhaustive-deps

  const datos = useMemo(() => {
    const v = CUARTO.ventanas[0];
    return {
      cuarto: {
        w: CUARTO.ancho,
        d: CUARTO.fondo,
        h: CUARTO.alto,
        ventana: { x0: v.centroX - v.ancho / 2, x1: v.centroX + v.ancho / 2, y0: v.alfeizar, y1: v.alfeizar + v.alto },
      },
      tema: {
        oscuro,
        fondo: tono.escenario,
        cuarto: tono.cuarto,
        remate: tono.remate,
        acento: t.acento,
        atrasada: t.atrasada,
        hoy: t.hoy,
      },
      plantas: estados.map((e) => {
        const v3 = PLANTAS_3D[e.planta.id] ?? PLANTA_3D_DEFECTO;
        return {
          id: e.planta.id,
          forma: v3.forma,
          color: v3.color,
          x: e.planta.x,
          z: e.planta.y, // profundidad desde la pared de la ventana
          base: v3.base,
          alto: v3.alto,
          pared: v3.pared ?? null,
          estado: e.riego.estado,
        };
      }),
      seleccion,
    };
  }, [estados, seleccion, oscuro, t, tono]);

  useEffect(() => {
    if (lista) web.current?.injectJavaScript("window.recibir(" + JSON.stringify(datos) + ");true;");
  }, [datos, lista]);

  const alMensaje = (ev: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(ev.nativeEvent.data) as { tipo: string; id?: string | null };
      if (msg.tipo === "listo") setLista(true);
      if (msg.tipo === "tocar") onSeleccionar(msg.id ?? null);
    } catch {
      // mensaje no reconocido
    }
  };

  const actual = estados.find((e) => e.planta.id === seleccion);

  return (
    <View style={{ flex: 1, backgroundColor: tono.escenario }}>
      {ESCENA_DISPONIBLE ? (
        <WebView
          ref={web}
          source={{ html, baseUrl: "" }}
          originWhitelist={["*"]}
          onMessage={alMensaje}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
          style={{ flex: 1, backgroundColor: tono.escenario }}
          containerStyle={{ backgroundColor: tono.escenario }}
        />
      ) : (
        <View style={s.vacio}>
          <Text style={s.vacioTitulo}>Falta la maqueta 3D</Text>
          <Text style={s.vacioTexto}>
            Ejecuta instalar.bat o, en la carpeta del proyecto, npm install three@0.128.0 y después npm start.
          </Text>
        </View>
      )}

      {!actual && ESCENA_DISPONIBLE && (
        <Text style={s.pista} pointerEvents="none">Arrastra para girar · toca una planta</Text>
      )}

      {actual && <Tarjeta e={actual} t={t} onCerrar={() => onSeleccionar(null)} onRegar={onRegar} onAbrirFicha={onAbrirFicha} />}
    </View>
  );
}

function Tarjeta({
  e,
  t,
  onCerrar,
  onRegar,
  onAbrirFicha,
}: {
  e: EstadoPlanta;
  t: Tema;
  onCerrar: () => void;
  onRegar: (id: string) => void;
  onAbrirFicha: (id: string) => void;
}) {
  const s = estilos(t);
  const { riego, planta } = e;
  const color = t[riego.estado];
  const hoy = isoLocal();
  const regadaHoy = planta.ultimoRiego === hoy;
  const desde = planta.ultimoRiego
    ? Math.round((Date.parse(hoy) - Date.parse(planta.ultimoRiego)) / 86400000)
    : null;

  return (
    <View style={s.tarjeta}>
      <View style={s.fila}>
        <Text style={s.nombre} numberOfLines={1}>{planta.nombre}</Text>
        <View style={[s.pastilla, { borderColor: color }]}>
          <Text style={[s.pastillaTexto, { color }]}>{ETIQUETA_ESTADO[riego.estado]}</Text>
        </View>
        <Pressable onPress={onCerrar} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar">
          <Text style={s.cerrar}>×</Text>
        </Pressable>
      </View>

      <View style={s.datos}>
        <View style={s.dato}>
          <Text style={s.etiqueta}>Último riego</Text>
          <Text style={s.valor}>{planta.ultimoRiego ? fechaLegible(planta.ultimoRiego) : "Sin registrar"}</Text>
          {desde !== null && <Text style={s.tenue}>{textoDias(-desde)}</Text>}
        </View>
        <View style={s.dato}>
          <Text style={s.etiqueta}>Próximo riego</Text>
          <Text style={s.valor}>{riego.proximoRiego ? fechaLegible(riego.proximoRiego) : "—"}</Text>
          <Text style={s.tenue}>
            {riego.diasRestantes !== null ? `${textoDias(riego.diasRestantes)} · ` : ""}cada {String(riego.intervaloDias).replace(".", ",")} d
          </Text>
        </View>
      </View>

      <View style={s.botones}>
        <Pressable
          onPress={() => onRegar(planta.id)}
          disabled={regadaHoy}
          style={({ pressed }: { pressed: boolean }) => [
            s.boton,
            { backgroundColor: regadaHoy ? t.pista : t.acento, flex: 1 },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
        >
          <Text style={[s.botonTexto, { color: regadaHoy ? t.tenue : t.acentoTexto }]}>
            {regadaHoy ? "Regada hoy" : "Marcar como regada"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onAbrirFicha(planta.id)}
          style={({ pressed }: { pressed: boolean }) => [s.boton, s.secundario, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <Text style={[s.botonTexto, { color: t.texto }]}>Ficha</Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = (t: Tema) =>
  StyleSheet.create({
    pista: { position: "absolute", top: 12, left: 16, right: 16, color: t.tenue, fontSize: 13 },
    vacio: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
    vacioTitulo: { color: t.texto, fontSize: 18, fontWeight: "600" },
    vacioTexto: { color: t.tenue, fontSize: 14, textAlign: "center", lineHeight: 20 },
    tarjeta: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 12,
      backgroundColor: t.superficie,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    fila: { flexDirection: "row", alignItems: "center", gap: 10 },
    nombre: { color: t.texto, fontSize: 20, fontWeight: "700", flex: 1 },
    pastilla: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    pastillaTexto: { fontSize: 12, fontWeight: "600" },
    cerrar: { color: t.tenue, fontSize: 24, lineHeight: 24 },
    datos: { flexDirection: "row", gap: 16 },
    dato: { flex: 1, gap: 2 },
    etiqueta: { color: t.tenue, fontSize: 11, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase" },
    valor: { color: t.texto, fontSize: 15, fontWeight: "600" },
    tenue: { color: t.tenue, fontSize: 13 },
    botones: { flexDirection: "row", gap: 8 },
    boton: { borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16, alignItems: "center" },
    secundario: { borderWidth: 1, borderColor: t.linea },
    botonTexto: { fontSize: 15, fontWeight: "600" },
  });
