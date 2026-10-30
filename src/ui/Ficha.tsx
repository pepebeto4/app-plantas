import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { EstadoPlanta } from "../calculo";
import { fechaLegible, haceDias, isoLocal, textoDias } from "../fechas";
import { ETIQUETA_ESTADO, ETIQUETA_LUZ, num, useTema, type Tema } from "./tema";

interface Props {
  e: EstadoPlanta;
  onVolver: () => void;
  onRegar: (fecha: string) => void;
  onDeshacer: () => void;
}

const OPCIONES_FECHA = [
  { etiqueta: "Hoy", dias: 0 },
  { etiqueta: "Ayer", dias: 1 },
  { etiqueta: "Hace 3 días", dias: 3 },
  { etiqueta: "Hace 1 semana", dias: 7 },
];

export function Ficha({ e, onVolver, onRegar, onDeshacer }: Props) {
  const t = useTema();
  const s = estilos(t);
  const { riego, luz, especie, valoracionLuz } = e;
  const color = t[riego.estado];
  const historial = [...e.planta.historialRiegos].reverse();
  const hoy = isoLocal();

  const estadoLuz =
    valoracionLuz.estado === "insuficiente"
      ? "Por debajo del mínimo de la especie"
      : valoracionLuz.estado === "justa"
        ? "Suficiente, por debajo del ideal"
        : "Adecuada";

  return (
    <ScrollView style={{ backgroundColor: t.fondo }} contentContainerStyle={s.contenido}>
      <Pressable onPress={onVolver} hitSlop={12} accessibilityRole="button">
        <Text style={s.volver}>‹ Plantas</Text>
      </Pressable>

      <View style={{ gap: 4 }}>
        <Text style={s.titulo}>{e.planta.nombre}</Text>
        <Text style={[s.estado, { color }]}>
          {ETIQUETA_ESTADO[riego.estado]}
          {riego.proximoRiego && riego.diasRestantes !== null
            ? ` · próximo riego ${fechaLegible(riego.proximoRiego)} (${textoDias(riego.diasRestantes)})`
            : ""}
        </Text>
      </View>

      <Seccion t={t} titulo="Registrar riego">
        <View style={s.opciones}>
          {OPCIONES_FECHA.map((o) => {
            const fecha = haceDias(o.dias);
            const hecho = e.planta.historialRiegos.includes(fecha);
            return (
              <Pressable
                key={o.dias}
                onPress={() => onRegar(fecha)}
                disabled={hecho}
                style={({ pressed }: { pressed: boolean }) => [
                  s.opcion,
                  o.dias === 0 && !hecho && { backgroundColor: t.acento, borderColor: t.acento },
                  hecho && { opacity: 0.45 },
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
              >
                <Text style={[s.opcionTexto, o.dias === 0 && !hecho && { color: t.acentoTexto }]}>{o.etiqueta}</Text>
              </Pressable>
            );
          })}
        </View>
        {historial.length > 0 && (
          <Pressable onPress={onDeshacer} hitSlop={8} accessibilityRole="button">
            <Text style={s.enlace}>Deshacer último riego ({fechaLegible(historial[0])})</Text>
          </Pressable>
        )}
      </Seccion>

      <Seccion t={t} titulo="Cómo se calcula el intervalo">
        <Fila t={t} etiqueta="Base de la especie en esta época" valor={`${num(riego.base)} días`} />
        <Fila t={t} etiqueta="Clima de los últimos días" valor={`× ${num(riego.fClima, 2)}`} />
        <Fila t={t} etiqueta="Luz que recibe" valor={`× ${num(riego.fLuz, 2)}`} />
        <Fila t={t} etiqueta="Tamaño de maceta" valor={`× ${num(riego.fMaceta, 2)}`} />
        <View style={s.separador} />
        <Fila t={t} etiqueta="Intervalo" valor={`${num(riego.intervaloDias)} días`} fuerte />
        <Text style={s.nota}>Señal de sed: {especie.señalSed}. Comprueba el sustrato antes de regar.</Text>
      </Seccion>

      <Seccion t={t} titulo="Luz hoy">
        <Fila t={t} etiqueta="Luz diaria (DLI)" valor={`${num(luz.dli)} mol/m²`} fuerte />
        <Fila t={t} etiqueta="Rango de la especie" valor={`${num(especie.dliMin)}–${num(especie.dliIdeal)}`} />
        <Fila t={t} etiqueta="Nivel" valor={ETIQUETA_LUZ[e.nivel]} />
        <Fila t={t} etiqueta="Máximo estimado" valor={`${Math.round(luz.luxMediodia).toLocaleString("es-ES")} lux`} />
        <Fila t={t} etiqueta="Sol directo sobre la planta" valor={`${num(luz.horasSolEnPunto)} h`} />
        <Text style={[s.nota, valoracionLuz.estado === "insuficiente" && { color: t.atrasada }]}>{estadoLuz}.</Text>
      </Seccion>

      <Seccion t={t} titulo="Historial">
        {historial.length === 0 ? (
          <Text style={s.nota}>Sin riegos registrados.</Text>
        ) : (
          historial.slice(0, 12).map((f, i) => {
            const anterior = historial[i + 1];
            const separacion = anterior
              ? Math.round((Date.parse(f) - Date.parse(anterior)) / 86400000)
              : null;
            return (
              <Fila
                key={f}
                t={t}
                etiqueta={f === hoy ? "Hoy" : fechaLegible(f)}
                valor={separacion !== null ? `${separacion} d después` : ""}
              />
            );
          })
        )}
      </Seccion>
    </ScrollView>
  );
}

function Seccion({ t, titulo, children }: { t: Tema; titulo: string; children: ReactNode }) {
  return (
    <View style={{ backgroundColor: t.superficie, borderRadius: 14, padding: 16, gap: 10 }}>
      <Text style={{ color: t.tenue, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase" }}>
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function Fila({ t, etiqueta, valor, fuerte }: { t: Tema; etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: fuerte ? t.texto : t.tenue, fontSize: 15, flex: 1 }}>{etiqueta}</Text>
      <Text
        style={{
          color: t.texto,
          fontSize: 15,
          fontWeight: fuerte ? "700" : "500",
          fontVariant: ["tabular-nums"],
        }}
      >
        {valor}
      </Text>
    </View>
  );
}

const estilos = (t: Tema) =>
  StyleSheet.create({
    contenido: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48, gap: 14 },
    volver: { color: t.acento, fontSize: 17, paddingVertical: 4 },
    titulo: { color: t.texto, fontSize: 30, fontWeight: "700", letterSpacing: -0.4 },
    estado: { fontSize: 15, fontWeight: "600" },
    opciones: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    opcion: {
      borderWidth: 1,
      borderColor: t.linea,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    opcionTexto: { color: t.texto, fontSize: 14, fontWeight: "600" },
    enlace: { color: t.tenue, fontSize: 14, textDecorationLine: "underline" },
    separador: { height: StyleSheet.hairlineWidth, backgroundColor: t.linea },
    nota: { color: t.tenue, fontSize: 13, lineHeight: 18 },
  });
