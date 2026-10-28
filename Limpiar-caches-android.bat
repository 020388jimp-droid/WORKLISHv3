@echo off
title Limpiar caches de Android (OneDrive)
echo.
echo  Borra las caches de compilacion de Android que OneDrive no puede guardar.
echo  No afecta a Worklish (Firebase) ni a CIENCIA COOL (Cloud Run).
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Limpiar-caches-android.ps1"
echo.
pause
