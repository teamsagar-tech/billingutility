@echo off
:: ============================================================================
:: RetailNode Ghost Spooler Service - Uninstaller
:: ============================================================================

title RetailNode Ghost Spooler Removal
echo.
echo ============================================================================
echo      RETAILNODE GHOST SPOOLER SERVICE (UNINSTALLER)
echo ============================================================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Administrator privileges required!
    echo Please right-click this file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo [1/2] Stopping RetailNodeSpooler service...
sc stop RetailNodeSpooler >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/2] Removing service registration...
sc delete RetailNodeSpooler >nul 2>&1

echo.
echo [SUCCESS] RetailNode Ghost Spooler Service has been removed cleanly.
echo.
pause
