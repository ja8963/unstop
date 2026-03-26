@echo off
title RxIntelligence — AI Pharmacy Assistant

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║    RxIntelligence — AI Pharmacy Assistant    ║
echo  ║          Unstop Hackathon Demo               ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  [1/3] Installing Python dependencies...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt --quiet

echo.
echo  [2/3] Installing Node.js dependencies...
cd /d "%~dp0frontend"
call npm install --silent

echo.
echo  [3/3] Starting backend (port 8000)...
start "RxIntelligence Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo       Starting frontend (port 5173)...
start "RxIntelligence Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo  ✓ Backend:   http://localhost:8000
echo  ✓ API Docs:  http://localhost:8000/docs
echo  ✓ Frontend:  http://localhost:5173
echo.
echo  Opening dashboard in browser...
start http://localhost:5173

echo.
echo  Press any key to exit this launcher (servers keep running in their windows).
pause >nul
