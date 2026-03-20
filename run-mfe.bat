@echo off
echo Starting all Micro Frontend (MFE) services from Root...
cd %~dp0
npm run dev -w frontend
