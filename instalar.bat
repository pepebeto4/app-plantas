@echo off
rem Instala Expo y las dependencias en versiones compatibles con la Expo Go actual.
cd /d "%~dp0"
echo Instalando Expo...
call npm install expo@latest || goto error
echo Instalando dependencias de la app...
call npx expo install react react-native expo-status-bar expo-notifications @react-native-async-storage/async-storage react-native-safe-area-context react-native-webview || goto error
call npx expo install typescript @types/react -- --save-dev || goto error
echo Instalando three.js para la maqueta 3D...
call npm install three@0.128.0 || goto error
call node scripts\generar-escena.js || goto error
echo.
echo Listo. Para abrir la app: npm start
echo y escanea el QR con la camara del iPhone (con Expo Go instalado).
pause
exit /b 0
:error
echo.
echo La instalacion fallo. Copia el texto de arriba y pasaselo a Claude.
pause
exit /b 1
