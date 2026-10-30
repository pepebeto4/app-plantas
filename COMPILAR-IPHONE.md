# Compilar la app para el iPhone (gratis, desde Windows)

Resultado: app nativa "Plantas" en la pantalla de inicio, sin Expo Go, con avisos de riego. El widget es la Fase 2.

Coste: 0 €. Sin Mac, sin cuenta de pago de Apple.

## Limitaciones

- La firma gratuita caduca a los 7 días. Hay que volver a firmar con Sideloadly (1 minuto, con el iPhone conectado). Sideloadly puede renovar solo si el PC está encendido y en la misma wifi que el iPhone.
- Máximo 3 apps sideloaded a la vez y 10 App IDs nuevos por semana por Apple ID.
- Los datos de la app nativa empiezan vacíos. No comparte datos con Expo Go.
- La compilación no se ha podido probar fuera de GitHub. La primera ejecución puede fallar. Si falla, pega las últimas 40 líneas del registro.

## 1. GitHub

1. Crea una cuenta gratuita en github.com.
2. Instala GitHub Desktop (desktop.github.com) e inicia sesión.
3. Descomprime `app-plantas.zip` en una carpeta nueva. Debe contener `App.tsx`, `app.json` y `.github`. No debe existir `node_modules`.
   `.github` es una carpeta oculta: verifica que está en la carpeta extraída (Explorador > Ver > Elementos ocultos).
4. GitHub Desktop > File > Add local repository > elige la carpeta. Si dice que no es un repositorio, pulsa "create a repository" y créalo.
5. Commit de todo (botón azul "Commit to main").
6. Publish repository. Desmarca "Keep this code private". Repositorio público = minutos de compilación gratis. Privado consume el crédito mensual y alcanza para unas 7 compilaciones al mes.
   El repositorio público expone el código. No contiene claves ni datos personales.

## 2. Compilar

1. En el repositorio en github.com: pestaña Actions. Si pide habilitar workflows, acepta.
2. Selecciona "Compilar iOS" > Run workflow > Run workflow.
3. Tarda entre 20 y 40 minutos. Estado verde = terminado.
4. Entra en la ejecución, baja a "Artifacts" y descarga `Plantas-ipa`. Descomprime el zip: dentro está `Plantas.ipa`.
5. Si falla: abre el paso en rojo, copia las últimas líneas. También se sube el artefacto `registro-compilacion` con el registro completo.

## 3. Instalar en el iPhone

Una sola vez en el PC:

1. Desinstala iTunes e iCloud si los tienes de la Microsoft Store.
2. Instala iTunes e iCloud desde apple.com (versión web, no Store). Sideloadly lo exige.
3. Instala Sideloadly (sideloadly.io).

Cada instalación:

1. Conecta el iPhone por USB. Desbloquéalo y pulsa "Confiar en este ordenador".
2. Abre Sideloadly. Arrastra `Plantas.ipa`. Escribe tu Apple ID.
3. Start. Pide la contraseña del Apple ID. Si da error de bundle ID, activa la opción de ID automático en Advanced Options.
4. En el iPhone: Ajustes > General > VPN y gestión de dispositivos > tu Apple ID > Confiar.
5. En el iPhone: Ajustes > Privacidad y seguridad > Modo desarrollador > activar. Reinicia el iPhone cuando lo pida.
6. Abre "Plantas". Acepta los avisos.

## 4. Renovar cada 7 días

Repite la sección 3, pasos 1 a 3, con el mismo IPA. No hace falta recompilar. Los datos se conservan.

## Widget (Fase 2)

No se incluye todavía. La cuenta gratuita no concede App Groups a través de Sideloadly, así que el widget no puede leer los datos de la app. Diseño previsto: widget SwiftUI nativo que descarga la agenda de riegos desde un Gist de GitHub que la app actualiza. Se construye cuando la Fase 1 funcione en tu iPhone.
