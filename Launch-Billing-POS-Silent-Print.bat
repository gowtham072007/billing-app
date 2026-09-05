@echo off
echo =======================================================
echo Starting QuickBill POS in Silent Direct Printing Mode...
echo =======================================================
echo (This disables the Chrome Print preview dialog popup)
echo.

REM Try starting Google Chrome with kiosk printing flag
start "" "chrome.exe" --kiosk-printing "http://localhost:5173"

if %ERRORLEVEL% NEQ 0 (
  start "" "msedge.exe" --kiosk-printing "http://localhost:5173"
)
