@echo off
rem Starts the MiredGains desktop app + sync server.
rem The window shows the LAN address to enter on the phone's Sync tab.
cd /d "%~dp0"
node server.mjs
pause
