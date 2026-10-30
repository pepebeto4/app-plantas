// Avisos locales de riego. Se reprograman enteros cada vez que cambian los datos.
import * as Notifications from "expo-notifications";
import type { EstadoPlanta } from "../calculo";
import { isoLocal } from "../fechas";

const HORA_AVISO = 10; // 10:00

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permisoPedido: boolean | null = null;

async function tienePermiso(): Promise<boolean> {
  if (permisoPedido !== null) return permisoPedido;
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return (permisoPedido = true);
  const pedido = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return (permisoPedido = pedido.granted);
}

function fechaAviso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, HORA_AVISO, 0, 0);
}

export async function reprogramarAvisos(estados: EstadoPlanta[]): Promise<number> {
  try {
    if (!(await tienePermiso())) return 0;
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Agrupar por día: un solo aviso con todas las plantas que tocan ese día
    const porDia = new Map<string, string[]>();
    const ahora = new Date();
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);

    for (const e of estados) {
      if (!e.riego.proximoRiego) continue;
      let dia = e.riego.proximoRiego;
      // Si ya pasó la hora del aviso (atrasada u hoy tarde), se avisa mañana
      if (fechaAviso(dia) <= ahora) dia = isoLocal(manana);
      porDia.set(dia, [...(porDia.get(dia) ?? []), e.planta.nombre]);
    }

    let n = 0;
    for (const [dia, nombres] of porDia) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: nombres.length === 1 ? `Toca regar: ${nombres[0]}` : `Toca regar ${nombres.length} plantas`,
          body: nombres.join(", "),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fechaAviso(dia) },
      });
      n++;
    }
    return n;
  } catch {
    return 0;
  }
}
