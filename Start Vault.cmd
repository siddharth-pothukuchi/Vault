@echo off
cd /d "%~dp0"
set "NODE=node"
where node >nul 2>nul || set "NODE=C:\Users\Siva\tools\node\node.exe"
start "" http://localhost:4321
"%NODE%" server.js
