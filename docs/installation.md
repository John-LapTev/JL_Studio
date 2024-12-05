# Установка JL Studio

[Главная](../README.md) | [Требования](requirements.md) | [Руководство](user-guide.md) | [LoRA](lora-guide.md) | [FAQ](faq.md) | [🇺🇸 English](en/installation.md)

## Требования к системе

- Windows 10/11 (64-bit)
- Python 3.10.6 (строго данная версия)
- NVIDIA GPU с 6+ GB VRAM (рекомендуется 8+ GB)
- 16+ GB RAM
- 50+ GB свободного места на диске

![system-overview](images/system-overview.png)

## Процесс установки

1. **Подготовка**
   - Установите [Python 3.10.6](https://www.python.org/ftp/python/3.10.6/python-3.10.6-amd64.exe)
   - Установите [Git](https://git-scm.com/download/win)
   - Установите [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)

2. **Установка JL Studio**
   - Скачайте последнюю версию из [Releases](https://github.com/John-LapTev/JL_Studio/releases)
   - Получите токен на [huggingface.co](https://huggingface.co/settings/tokens)
   - Запустите `INSTALL.bat`

![installation](images/installation.png)

## Запуск программы

1. Запустите `START-WEB_JL_STUDIO.bat`
2. Откройте в браузере http://127.0.0.1:7860

![interface](images/interface.png)

## Возможные проблемы

### CUDA не найдена
- Установите [драйверы NVIDIA](https://www.nvidia.ru/download/index.aspx)
- При необходимости установите [CUDA Toolkit 11.8](https://developer.nvidia.com/cuda-11-8-0-download-archive)

### Ошибки Python
- Убедитесь, что установлена версия 3.10.6
- Проверьте переменную PATH

## Дополнительная информация

- [Руководство пользователя](user-guide.md)
- [Работа с LoRA](lora-guide.md)
- [FAQ](faq.md)