@echo off
rem Bấm đúp file này để mở cửa sổ đổi WiFi cho ESP32 (tạo firmware\...\secrets.h)
powershell -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0change-wifi.ps1"
if errorlevel 1 pause
