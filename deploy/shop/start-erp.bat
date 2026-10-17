@echo off
rem Runs the ERP (UI + API) from backend\dist and restarts it if it stops. Log: deploy\shop\logs\erp.log
set "HERE=%~dp0"
if not exist "%HERE%logs" mkdir "%HERE%logs"
cd /d "%HERE%..\..\backend"

:loop
echo [%date% %time%] starting ERP >> "%HERE%logs\erp.log"
node dist\server.js >> "%HERE%logs\erp.log" 2>&1
echo [%date% %time%] ERP stopped, restarting in 5s >> "%HERE%logs\erp.log"
ping -n 6 127.0.0.1 >nul
goto loop
