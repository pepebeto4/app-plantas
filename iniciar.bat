@echo off
rem Arranca la app: regenera la maqueta 3D y abre Expo con el QR.
cd /d "%~dp0"
if not exist node_modules (
  echo Falta instalar. Ejecuta primero instalar.bat
  pause
  exit /b 1
)
call npm start
pause
