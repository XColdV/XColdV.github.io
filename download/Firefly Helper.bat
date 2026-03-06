@echo off
setlocal EnableDelayedExpansion

title Firefly Private Server Connector
color 0F

:: Check for administrative privileges and request them if missing
>nul 2>&1 "%SystemRoot%\system32\cacls.exe" "%SystemRoot%\system32\config\system"
if %errorlevel% NEQ 0 (
    echo Requesting administrative privileges / Meminta hak akses administrator...
    powershell -Command "Start-Process '%~f0' -Verb runAs"
    exit /b
)

:lang_select
cls
echo =====================================================
echo           FIREFLY PRIVATE SERVER CONNECTOR
echo =====================================================
echo Select your language / Pilih bahasa Anda:
echo.
echo [1] English
echo [2] Bahasa Indonesia
echo =====================================================
echo.
set /p LANG_CHOICE="Choice / Pilihan (1/2): "

if "%LANG_CHOICE%"=="1" goto en_menu
if "%LANG_CHOICE%"=="2" goto id_menu
goto lang_select

:en_menu
echo 103.150.227.49 www.growtopia1.com> "%TEMP%\ff_clip.txt"
echo 103.150.227.49 www.growtopia2.com>> "%TEMP%\ff_clip.txt"
clip < "%TEMP%\ff_clip.txt"
del "%TEMP%\ff_clip.txt"

cls
echo =====================================================
echo           FIREFLY PRIVATE SERVER CONNECTOR
echo =====================================================
echo.
echo [SUCCESS] The connection IPs have been COPIED to your clipboard!
echo.
echo STEP 1: Press any key to open the network configuration.
echo STEP 2: Scroll to the VERY BOTTOM of the document.
echo STEP 3: Press Ctrl + V to paste the copied lines.
echo STEP 4: Save the file (Ctrl + S) and close Notepad.
echo =====================================================
echo.
pause
goto open_hosts

:id_menu
echo 103.150.227.49 www.growtopia1.com> "%TEMP%\ff_clip.txt"
echo 103.150.227.49 www.growtopia2.com>> "%TEMP%\ff_clip.txt"
clip < "%TEMP%\ff_clip.txt"
del "%TEMP%\ff_clip.txt"

cls
echo =====================================================
echo           FIREFLY PRIVATE SERVER CONNECTOR
echo =====================================================
echo.
echo [BERHASIL] IP Koneksi telah DISALIN ke clipboard Anda!
echo.
echo LANGKAH 1: Tekan tombol apa saja untuk membuka konfigurasi jaringan.
echo LANGKAH 2: Scroll ke bagian PALING BAWAH pada dokumen tersebut.
echo LANGKAH 3: Tekan Ctrl + V untuk menempelkan baris yang sudah disalin.
echo LANGKAH 4: Simpan file (Ctrl + S) dan tutup Notepad.
echo =====================================================
echo.
pause
goto open_hosts

:open_hosts
start /wait notepad C:\Windows\System32\drivers\etc\hosts

cls
echo =====================================================
if "%LANG_CHOICE%"=="1" echo Applying changes and flushing DNS cache...
if "%LANG_CHOICE%"=="2" echo Menerapkan perubahan dan membersihkan cache DNS...
echo =====================================================
ipconfig /flushdns >nul
echo.
if "%LANG_CHOICE%"=="1" echo Configuration complete. You may now launch the game.
if "%LANG_CHOICE%"=="2" echo Konfigurasi selesai. Anda sekarang dapat menjalankan game.
echo =====================================================
pause
exit