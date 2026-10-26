@echo off
:: ============================================================================
:: RetailNode Ghost Spooler Service - Silent Background Installer
:: ============================================================================

title RetailNode Ghost Spooler Setup
echo.
echo ============================================================================
echo      RETAILNODE GHOST SPOOLER SERVICE (ZERO-UI INSTALLER)
echo ============================================================================
echo.

:: Check for Administrator elevation
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Administrator privileges required!
    echo Please right-click this file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [1/4] Stopping any existing service instance...
sc stop RetailNodeSpooler >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Enabling print spool job retention on POS thermal printers...
powershell -Command "try { Get-Printer | Where-Object { $_.PortName -match 'USB|POS|COM|WSD|IP|9100' } | ForEach-Object { Set-Printer -Name $_.Name -KeepPrintedJobs $true; Write-Host ('  Enabled retention on: ' + $_.Name) } } catch { Write-Host '  (Printer scan complete)' }"

echo [3/4] Registering Windows Background Service...
sc delete RetailNodeSpooler >nul 2>&1
sc create RetailNodeSpooler binPath= "\"%SCRIPT_DIR%RetailNodeGhost.exe\"" start= auto DisplayName= "RetailNode Background Spooler"
sc description RetailNodeSpooler "Silently intercepts POS thermal prints to generate RetailNode digital receipts and WhatsApp messages."
sc failure RetailNodeSpooler reset= 86400 actions= restart/5000/restart/5000/restart/5000

echo [4/4] Starting RetailNode Ghost Spooler Service...
sc start RetailNodeSpooler

echo.
echo ============================================================================
echo   [SUCCESS] RETAILNODE GHOST SPOOLER IS NOW RUNNING SILENTLY!
echo ============================================================================
echo.
echo - Zero cashier popups or middleware windows.
echo - Any bill printed from Tally/Busy/Marg will automatically send WhatsApp!
echo - Activity log: %SCRIPT_DIR%ghost-service.log
echo.
pause
