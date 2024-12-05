@echo off
chcp 65001 > nul
cd /d "%~dp0"
setlocal EnableDelayedExpansion

:menu
cls
echo.
echo   ╔══════════════════════════════════════╗
echo   ║           JL STUDIO ЗАПУСК           ║
echo   ╚══════════════════════════════════════╝
echo.
echo    [1] Локальный запуск
echo        ^> Доступ только с этого компьютера
echo        ^> http://127.0.0.1:7860
echo.
echo    [2] Публичный доступ
echo        ^> Доступ из интернета через ngrok
echo        ^> Требуется авторизация ngrok
echo.
echo    [X] Выход
echo.
set /p choice="Выберите режим запуска (1, 2 или X): "

if /i "%choice%"=="1" goto local
if /i "%choice%"=="2" goto check_ngrok
if /i "%choice%"=="X" goto end
if /i "%choice%"=="x" goto end

echo ⚠️ Неверный выбор. Попробуйте снова...
timeout /t 2 >nul
goto menu

:check_ngrok
where ngrok >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ⚡ Установка ngrok...
    powershell -Command "& {Invoke-WebRequest -Uri https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip -OutFile ngrok.zip}"
    powershell -Command "& {Expand-Archive ngrok.zip -DestinationPath . -Force}"
    del ngrok.zip
)
goto check_ngrok_auth

:check_ngrok_auth
ngrok config get all >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Требуется авторизация ngrok
    echo.
    echo Для получения токена:
    echo 1. Зарегистрируйтесь на https://ngrok.com
    echo 2. Перейдите в раздел "Your Authtoken"
    echo.
    set /p ngrok_token="Введите ваш authtoken: "
    ngrok config add-authtoken %ngrok_token%
)
goto public

:local
call venv\Scripts\activate.bat
set PYTHONIOENCODING=utf-8
python api.py
goto end

:public
call venv\Scripts\activate.bat
set PYTHONIOENCODING=utf-8
start cmd /c "title JL Studio - ngrok && ngrok http 7860"
timeout /t 2 >nul
python api.py
goto end

:end
endlocal
exit