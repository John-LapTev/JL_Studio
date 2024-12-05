@echo off
chcp 65001 > nul
echo ===============================================
echo       JL Studio - Установка программы
echo ===============================================
echo.

rem Проверка наличия точки восстановления
if exist .install_progress (
    echo Обнаружена прерванная установка
    echo Возобновление установки...
    echo.
)

:CHECK_REQUIREMENTS
echo Проверка необходимых компонентов...
echo.

set REQUIREMENTS_FAILED=0

rem Проверка Python
echo Проверка наличия Python...
python --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Python не найден!
    set REQUIREMENTS_FAILED=1
) else (
    python -c "import sys; exit(0 if sys.version_info[:2] == (3,10) else 1)" > nul 2>&1
    if errorlevel 1 (
        echo ❌ Требуется Python версии 3.10.x!
        set REQUIREMENTS_FAILED=1
    ) else (
        for /f "tokens=2" %%I in ('python --version 2^>^&1') do set PYTHON_VERSION=%%I
        echo ✓ Найден Python %PYTHON_VERSION%
    )
)

rem Проверка Git
echo Проверка наличия Git...
git --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Git не найден!
    set REQUIREMENTS_FAILED=1
) else (
    for /f "tokens=3" %%I in ('git --version') do set GIT_VERSION=%%I
    echo ✓ Найден Git %GIT_VERSION%
)

rem Если есть ошибки, открываем инструкцию
if %REQUIREMENTS_FAILED%==1 (
    echo.
    echo ❌ Не все компоненты установлены!
    echo.
    if exist requirements.html (
        echo Открываю инструкцию по установке...
        start requirements.html
    ) else (
        echo ❌ Файл requirements.html не найден!
        echo Пожалуйста, установите:
        echo 1. Python 3.10.x
        echo 2. Git
        echo 3. Visual C++ Redistributable
    )
    echo.
    echo После установки всех компонентов запустите этот файл снова.
    echo.
    pause
    exit /b
)

rem Проверка наличия CUDA (опционально)
echo Проверка наличия NVIDIA GPU и CUDA...
nvidia-smi > nul 2>&1
if errorlevel 1 (
    echo ⚠️ NVIDIA GPU не обнаружен или CUDA не установлена
    echo Программа будет работать медленнее без GPU
    echo.
    echo Хотите продолжить установку? (Y/N^)
    choice /c YN /n
    if errorlevel 2 (
        if exist requirements.html (
            start requirements.html
        )
        echo.
        pause
        exit /b
    )
) else (
    for /f "tokens=3" %%i in ('nvidia-smi ^| findstr "CUDA Version"') do set CUDA_VERSION=%%i
    echo ✓ NVIDIA GPU и CUDA %CUDA_VERSION% обнаружены
)

:CHECK_TOKEN
echo.
echo Проверка файла token.txt...
if not exist token.txt (
    echo ❌ Файл token.txt не найден!
    echo.
    if exist requirements.html (
        echo Открываю инструкцию по получению токена...
        start requirements.html
    ) else (
        echo Создайте файл token.txt с вашим токеном Hugging Face
    )
    echo.
    pause
    exit /b
)

echo ✓ Файл token.txt найден
echo.

:CHECK_SPACE
echo Проверка свободного места...
python -c "import psutil; free_gb=psutil.disk_usage('.').free/1024**3; exit(1 if free_gb < 50 else 0)"
if errorlevel 1 (
    echo ❌ Недостаточно свободного места на диске!
    echo Требуется минимум 50 GB свободного места.
    echo.
    pause
    exit /b
)
echo ✓ Достаточно свободного места
echo.

:START_INSTALL
echo Запуск установки...
echo ⚠️ Это может занять длительное время (30-60 минут)
echo Пожалуйста, не закрывайте окно
echo.
echo Если возникнут проблемы при установке,
echo вы можете обратиться к автору: https://t.me/john_laptev
echo.

python setup.py

if errorlevel 1 (
    echo.
    echo ❌ Произошла ошибка при установке
    echo Проверьте сообщения об ошибках выше
    pause
    exit /b
)

echo.
echo ===============================================
echo    ✨ Установка успешно завершена! ✨
echo ===============================================
echo.
echo Для запуска:
echo 1. Запустите START-WEB_JL_STUDIO.bat
echo 2. Откройте в браузере: http://127.0.0.1:7860
echo.
pause