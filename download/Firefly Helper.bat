@echo off
setlocal EnableDelayedExpansion

title Firefly Private Server Connector
color 0F

:: Elevate if not admin
>nul 2>&1 "%SystemRoot%\system32\cacls.exe" "%SystemRoot%\system32\config\system"
if %errorlevel% NEQ 0 (
    echo Requesting admin access...
    powershell -Command "Start-Process '%~f0' -Verb runAs"
    exit /b
)

:lang_select
cls
echo =====================================================
echo         FIREFLY PRIVATE SERVER CONNECTOR
echo =====================================================
echo  [1] English
echo  [2] Bahasa Indonesia
echo =====================================================
set /p LANG_CHOICE="Choice (1/2): "
if "%LANG_CHOICE%"=="1" goto en_main
if "%LANG_CHOICE%"=="2" goto id_main
goto lang_select

:: ============ ENGLISH ============
:en_main
cls
echo =====================================================
echo         FIREFLY PRIVATE SERVER CONNECTOR
echo =====================================================
echo.
echo  This will add Firefly to your hosts file and
echo  flush DNS automatically. Nothing to edit manually.
echo.
echo  Press any key to apply...
pause >nul

:: Check if already applied
findstr /i "103.150.227.49" "C:\Windows\System32\drivers\etc\hosts" | findstr /i "growtopia1.com" >nul 2>&1
if %errorlevel% EQU 0 (
    cls
    echo =====================================================
    echo  [OK] Firefly is already in your hosts file.
    echo  Nothing to do. Launch Growtopia and play!
    echo =====================================================
    ipconfig /flushdns >nul
    pause
    exit
)

:: Add lines via PowerShell
powershell -NoProfile -Command "Add-Content -Path 'C:\Windows\System32\drivers\etc\hosts' -Value ([System.Environment]::NewLine + '103.150.227.49 www.growtopia1.com' + [System.Environment]::NewLine + '103.150.227.49 www.growtopia2.com') -Encoding ASCII"

if %errorlevel% EQU 0 (
    cls
    echo =====================================================
    echo  [DONE] Firefly applied successfully!
    echo.
    ipconfig /flushdns >nul
    echo  DNS refreshed. You can open Growtopia now.
    echo =====================================================
) else (
    cls
    echo =====================================================
    echo  [ERROR] Something went wrong.
    echo  Make sure you ran this as Administrator.
    echo =====================================================
)
pause
exit

:: ============ BAHASA INDONESIA ============
:id_main
cls
echo =====================================================
echo         FIREFLY PRIVATE SERVER CONNECTOR
echo =====================================================
echo.
echo  Ini akan menambahkan Firefly ke hosts file
echo  dan flush DNS secara otomatis. Tidak perlu edit manual.
echo.
echo  Tekan tombol apa saja untuk melanjutkan...
pause >nul

:: Cek apakah sudah ada
findstr /i "103.150.227.49" "C:\Windows\System32\drivers\etc\hosts" | findstr /i "growtopia1.com" >nul 2>&1
if %errorlevel% EQU 0 (
    cls
    echo =====================================================
    echo  [OK] Firefly sudah ada di hosts file kamu.
    echo  Tidak perlu melakukan apa-apa. Buka Growtopia!
    echo =====================================================
    ipconfig /flushdns >nul
    pause
    exit
)

:: Tambah baris via PowerShell
powershell -NoProfile -Command "Add-Content -Path 'C:\Windows\System32\drivers\etc\hosts' -Value ([System.Environment]::NewLine + '103.150.227.49 www.growtopia1.com' + [System.Environment]::NewLine + '103.150.227.49 www.growtopia2.com') -Encoding ASCII"

if %errorlevel% EQU 0 (
    cls
    echo =====================================================
    echo  [SELESAI] Firefly berhasil diterapkan!
    echo.
    ipconfig /flushdns >nul
    echo  DNS sudah diperbarui. Buka Growtopia sekarang.
    echo =====================================================
) else (
    cls
    echo =====================================================
    echo  [ERROR] Ada yang salah.
    echo  Pastikan kamu menjalankan file ini sebagai Administrator.
    echo =====================================================
)
pause
exit
