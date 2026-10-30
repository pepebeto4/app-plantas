import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { EstadoPlanta } from "../calculo";
import type { EstadoClima } from "../data/clima";
import { isoLocal, textoDias } from "../fechas";
import { ETIQUETA_ESTADO, num, useTema, type Tema } from "./tema";

interface Props {
  estados: EstadoPlanta[];
  clima: EstadoClima | null;
  cargando: boolean;
  onRefrescar: () => void;
  onAbrir: (id: string) => void;
  onRegar: (id: string) => void;
}

export function Lista({ estados, clima, cargando, onRefrescar, onAbrir, onRegar }: Props) {
  const t = useTema();
  const s = estilos(t);
  const hoy = clima?.dias.find((d) => d.fecha === isoLocal());
  const pendientes = estados.filter((e) => e.riego.estado === "atrasada" || e.riego.estado === "hoy").length;

  return (
    <FlatList
      style={{ backgroundColor: t.fondo }}
      contentContainerStyle={s.contenido}
      data={estados}
      keyExtractor={(e: EstadoPlanta) => e.planta.id}
      refreshControl={<RefreshControl refreshing={cargando} onRefresh={onRefrescar} tintColor={t.tenue} />}
      ListHeaderComponent={
        <View style={s.cabecera}>
          <Text style={s.titulo}>Plantas</Text>
          <Text style={s.resumen}>
            {pendientes === 0 ? "Nada que regar hoy" : `${pendientes} por regar hoy`}
          </Text>
          <View style={s.clima}>
            {hoy ? (
              <>
                <Dato t={t} etiqueta="Bormujos" valor={`${Math.round(hoy.tempMin)}–${Math.round(hoy.tempMax)}°`} />
                <Dato t={t} etiqueta="Humedad" valor={`${Math.round(hoy.humedadMedia)} %`} />
                <Dato t={t} etiqueta="ET₀" valor={`${num(hoy.et0)} mm`} />
                <Dato t={t} etiqueta="Nubes" valor={`${Math.round(hoy.nubosidad)} %`} />
              </>
            ) : (
              <Text style={s.tenue}>{cargando ? "Cargando clima…" : "Sin datos de clima. Desliza hacia abajo para reintentar."}</Text>
            )}
          </View>
          {clima?.desactualizado && (
            <Text style={s.aviso}>Sin conexión: clima de la última consulta.</Text>
          )}
        </View>
      }
      renderItem={({ item }: { item: EstadoPlanta }) => <Tarjeta e={item} t={t} onAbrir={onAbrir} onRegar={onRegar} />}
    />
  );
}

function Dato({ t, etiqueta, valor }: { t: Tema; etiqueta: string; valor: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: t.tenue, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" }}>{etiqueta}</Text>
      <Text style={{ color: t.texto, fontSize: 16, fontWeight: "600", fontVariant: ["tabular-nums"] }}>{valor}</Text>
    </View>
  );
}

function Tarjeta({
  e,
  t,
  onAbrir,
  onRegar,
}: {
  e: EstadoPlanta;
  t: Tema;
  onAbrir: (id: string) => void;
  onRegar: (id: string) => void;
}) {
  const s = estilos(t);
  const { riego } = e;
  const color = t[riego.estado];
  const regadaHoy = e.planta.ultimoRiego === isoLocal();

  // Fracción del intervalo consumida: aproximación del agua que queda en la maceta
  let consumido = 0;
  if (riego.diasRestantes !== null) {
    consumido = Math.min(1, Math.max(0, 1 - riego.diasRestantes / riego.intervaloDias));
  }
  const detalle =
    riego.diasRestantes === null
      ? "Toca para indicar el último riego"
      : riego.diasRestantes < 0
        ? `Tocaba ${textoDias(riego.diasRestantes)}`
        : `Regar ${textoDias(riego.diasRestantes)}`;

  return (
    <Pressable
      onPress={() => onAbrir(e.planta.id)}
      style={({ pressed }: { pressed: boolean }) => [s.tarjeta, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`${e.planta.nombre}, ${ETIQUETA_ESTADO[riego.estado]}`}
    >
      <View style={s.fila}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.nombre}>{e.planta.nombre}</Text>
          <Text style={s.tenue}>
            {detalle} · cada {num(riego.intervaloDias)} d
          </Text>
        </View>
        <View style={[s.pastilla, { borderColor: color }]}>
          <Text style={[s.pastillaTexto, { color }]}>{ETIQUETA_ESTADO[riego.estado]}</Text>
        </View>
      </View>

      {riego.diasRestantes !== null && (
        <View style={s.pista}>
          <View style={[s.barra, { width: `${(1 - consumido) * 100}%`, backgroundColor: color }]} />
        </View>
      )}

      {riego.estado !== "sin_datos" && (
        <Pressable
          onPress={() => onRegar(e.planta.id)}
          disabled={regadaHoy}
          style={({ pressed }: { pressed: boolean }) => [
            s.boton,
            regadaHoy ? { backgroundColor: t.pista } : { backgroundColor: t.acento },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
        >
          <Text style={[s.botonTexto, { color: regadaHoy ? t.tenue : t.acentoTexto }]}>
            {regadaHoy ? "Regada hoy" : "Marcar como regada"}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const estilos = (t: Tema) =>
  StyleSheet.create({
    contenido: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
    cabecera: { paddingTop: 12, paddingBottom: 8, gap: 6 },
    titulo: { color: t.texto, fontSize: 34, fontWeight: "700", letterSpacing: -0.5 },
    resumen: { color: t.tenue, fontSize: 16 },
    clima: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 20,
      marginTop: 10,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: t.linea,
    },
    aviso: { color: t.hoy, fontSize: 13 },
    tenue: { color: t.tenue, fontSize: 14 },
    tarjeta: { backgroundColor: t.superficie, borderRadius: 14, padding: 16, gap: 12 },
    fila: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    nombre: { color: t.texto, fontSize: 18, fontWeight: "600" },
    pastilla: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    pastillaTexto: { fontSize: 12, fontWeight: "600" },
    pista: { height: 6, borderRadius: 3, backgroundColor: t.pista, overflow: "hidden" },
    barra: { height: 6, borderRadius: 3 },
    boton: { borderRadius: 10, paddingVertical: 11, alignItems: "center" },
    botonTexto: { fontSize: 15, fontWeight: "600" },
  });
