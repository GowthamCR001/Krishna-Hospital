@echo off
title Krishna Hospital Server
cd /d "%~dp0"
echo Starting Krishna Hospital Local Server on port 8000...
echo Opening browser at http://localhost:8000/medical/index.html
start "" "http://localhost:8000/medical/index.html"
python -m http.server 8000
pause
