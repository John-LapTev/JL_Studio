# Часто задаваемые вопросы (FAQ)

[Главная](../README.md) | [Установка](installation.md) | [Руководство](user-guide.md) | [LoRA](lora-guide.md) | [Требования](requirements.md) | [🇺🇸 English](en/faq.md)

## Установка и запуск

### Какие требования к видеокарте?
Минимум 6GB VRAM, рекомендуется 8GB и выше. Поддерживаются только NVIDIA GPU с CUDA.

### Можно ли использовать AMD/Intel GPU?
Нет, программа работает только с NVIDIA GPU из-за требований CUDA.

### Нужен ли интернет для работы?
- Для первоначальной установки
- Для загрузки LoRA из галереи
- Для обновления программы
Для генерации изображений интернет не требуется.

## Генерация изображений

### Оптимальные настройки
- Размер: 1024x1024
- CFG Scale: 3.5-7.0
- Шаги: 28-35
- LoRA: не более 2-3 одновременно

### Как улучшить качество?
- Детальные промпты
- Оптимальные параметры CFG
- Подходящие LoRA модели
- Достаточное количество шагов

## Работа с LoRA

### Где найти новые LoRA?
- Hugging Face
- Civitai
- GitHub
- Discord сообщества

### Как добавить свою LoRA?
Поместите .safetensors файл в папку models/flux/loras.

## Проблемы и решения

### CUDA Out of Memory
- Уменьшите размер изображения
- Закройте другие программы
- Используйте меньше LoRA
- Очистите VRAM

### Программа не запускается
1. Проверьте версию Python (3.10.6)
2. Убедитесь в наличии CUDA
3. Проверьте token.txt

### Ошибка при обновлении
1. Закройте программу
2. Запустите UPDATE.bat заново
3. Проверьте подключение к интернету

## Контакты для поддержки

- Email: john.laptev@gmail.com
- Telegram: @john_laptev
- GitHub: John-LapTev