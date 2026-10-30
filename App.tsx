import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { calcularEstados } from "./src/calculo";
import type { Plant } from "./src/core/types";
import { cargarPlantas, deshacerUltimoRiego, guardarPlantas, registrarRiego } from "./src/data/almacen";
import { reprogramarAvisos } from "./src/data/avisos";
import { climaActual, type EstadoClima } from "./src/data/clima";
import { isoLocal } from "./src/fechas";
import { Cuarto } from "./src/ui/Cuarto";
import { Ficha } from "./src/ui/Ficha";
import { Lista } from "./src/ui/Lista";
import { useTema } from "./src/ui/tema";

export default function App() {
  const t = useTema();
  const [plantas, setPlantas] = useState<Plant[] | null>(null);
  const [clima, setClima] = useState<EstadoClima | null>(null);
  const [cargando, setCargando] = useState(true);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [pestana, setPestana] = useState<"cuarto" | "riegos">("cuarto");
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [dia, setDia] = useState(isoLocal());

  const refrescarClima = useCallback(async (forzar: boolean) => {
    setCargando(true);
    setClima(await climaActual(forzar));
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarPlantas().then(setPlantas);
    refrescarClima(false);
    // Al volver a la app: recalcular el día y refrescar el clima si está viejo
    const sub = AppState.addEventListener("change", (estado) => {
      if (estado === "active") {
        setDia(isoLocal());
        refrescarClima(false);
      }
    });
    return () => sub.remove();
  }, [refrescarClima]);

  const estados = useMemo(
    () => (plantas ? calcularEstados(plantas, clima?.dias ?? []) : []),
    // `dia` fuerza el recálculo al cambiar de fecha
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plantas, clima, dia],
  );

  useEffect(() => {
    if (plantas) reprogramarAvisos(estados);
  }, [estados, plantas]);

  const actualizar = useCallback((cambio: (p: Plant[]) => Plant[]) => {
    setPlantas((prev) => {
      if (!prev) return prev;
      const nuevas = cambio(prev);
      guardarPlantas(nuevas);
      return nuevas;
    });
  }, []);

  const actual = estados.find((e) => e.planta.id === abierta);

  const regarHoy = (id: string) => actualizar((p) => registrarRiego(p, id, isoLocal()));
  const pendientes = estados.filter((e) => e.riego.estado === "atrasada" || e.riego.estado === "hoy").length;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.fondo }} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="auto" />
        {actual ? (
          <Ficha
            e={actual}
            onVolver={() => setAbierta(null)}
            onRegar={(fecha) => actualizar((p) => registrarRiego(p, actual.planta.id, fecha))}
            onDeshacer={() => actualizar((p) => deshacerUltimoRiego(p, actual.planta.id))}
          />
        ) : (
          <>
            {/* El cuarto se mantiene montado para no recargar la escena 3D al cambiar de pestaña */}
            <View style={{ flex: 1, display: pestana === "cuarto" ? "flex" : "none" }}>
              <Cuarto
                estados={estados}
                seleccion={seleccion}
                onSeleccionar={setSeleccion}
                onRegar={regarHoy}
                onAbrirFicha={setAbierta}
              />
            </View>
            {pestana === "riegos" && (
              <Lista
                estados={estados}
                clima={clima}
                cargando={cargando || !plantas}
                onRefrescar={() => refrescarClima(true)}
                onAbrir={setAbierta}
                onRegar={regarHoy}
              />
            )}
            <View style={[barra.contenedor, { borderTopColor: t.linea, backgroundColor: t.fondo }]}>
              {([
                ["cuarto", "Cuarto"],
                ["riegos", pendientes ? `Riegos · ${pendientes}` : "Riegos"],
              ] as const).map(([id, texto]) => (
                <Pressable
                  key={id}
                  onPress={() => setPestana(id)}
                  style={barra.boton}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: pestana === id }}
                >
                  <Text style={[barra.texto, { color: pestana === id ? t.acento : t.tenue }]}>{texto}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const barra = StyleSheet.create({
  contenedor: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth },
  boton: { flex: 1, alignItems: "center", paddingVertical: 12 },
  texto: { fontSize: 15, fontWeight: "600" },
});
