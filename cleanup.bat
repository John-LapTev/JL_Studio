@echo off
chcp 65001 > nul
echo ===============================================
echo          JL Studio - Очистка кэша
echo ===============================================
echo.

echo Очистка временных файлов...
del /s /q *.pyc
del /s /q *.pyo
del /s /q __pycache__

echo Очистка логов...
del /q logs\*

echo Очистка кэша CUDA...
del /s /q %TEMP%\torch_extensions
del /s /q %USERPROFILE%\.cache\torch_extensions

echo.
echo ✨ Очистка завершена
echo.
pause