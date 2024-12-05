@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ===============================================
echo       JL Studio - Обновление программы
echo ===============================================
echo.

rem Проверка наличия git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git не установлен!
    echo Пожалуйста, установите Git с https://git-scm.com/
    pause
    exit /b 1
)

rem Проверка подключения к интернету
ping -n 1 github.com >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Нет подключения к интернету!
    pause
    exit /b 1
)

rem Создание резервной копии важных файлов
echo 📦 Создание резервной копии...
if not exist "backup" mkdir backup
set backup_dir=backup\%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%
mkdir "%backup_dir%"
xcopy /y "token.txt" "%backup_dir%\" >nul 2>nul
xcopy /y "models\flux\loras\*" "%backup_dir%\loras\" /s /e /i >nul 2>nul
xcopy /y "output\*" "%backup_dir%\output\" /s /e /i >nul 2>nul

rem Инициализация git repo если его нет
if not exist .git (
    git init
    git remote add origin https://github.com/John-LapTev/JL_Studio.git
)

echo 🔄 Проверка обновлений...
git fetch origin main

rem Сравнение версий
for /f %%i in ('git rev-parse HEAD') do set current=%%i
for /f %%i in ('git rev-parse origin/main') do set latest=%%i

if "%current%"=="%latest%" (
    echo ✨ У вас уже установлена последняя версия!
    goto cleanup
)

rem Активация виртуального окружения
call venv\Scripts\activate.bat

echo 📥 Загрузка обновлений...

rem Список файлов для обновления
set "update_files=api.py app.py live_preview_helpers.py html/* README*.md docs/* requirements.txt"

rem Обновление только нужных файлов
for %%f in (%update_files%) do (
    git checkout origin/main -- %%f
)

echo 📚 Обновление зависимостей...
python -m pip install -q --upgrade pip
python -m pip install -q -r requirements.txt

echo 🔄 Обновление компонентов...
python setup.py --update-components

:cleanup
echo.
echo ✨ Обновление завершено
if exist "%backup_dir%" (
    echo 💾 Резервная копия сохранена в: %backup_dir%
)
echo.
pause