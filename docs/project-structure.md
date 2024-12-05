# Полная структура проекта JL Studio

[English version](en/project-structure.md)

```
JL_Studio/
├── .github/                      # [Core] GitHub конфигурация
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md        # Шаблон отчёта об ошибке (RU/EN)
│   │   └── feature_request.md   # Шаблон запроса функции (RU/EN)
│   ├── CODE_OF_CONDUCT.md       # Правила поведения (RU)
│   ├── CODE_OF_CONDUCT_EN.md    # Правила поведения (EN)
│   └── PULL_REQUEST_TEMPLATE.md  # Шаблон пул-реквеста (RU/EN)
│
├── backup/                      # [Generated] Резервные копии
│   ├── YYYYMMDD_HHMMSS/        # Папки с датой и временем бэкапа
│   │   ├── loras/             # Копии LoRA моделей
│   │   ├── output/            # Копии изображений
│   │   └── token.txt          # Копия токена
│   └── .gitkeep
│
├── cache/                      # [Generated] Кэш программы
│   ├── torch_extensions/      # Кэш PyTorch
│   └── huggingface/          # Кэш Hugging Face
│
├── docs/                      # [Core] Документация
│   ├── images/               # Изображения документации
│   │   ├── interface-main.png
│   │   ├── text-to-image.png
│   │   ├── lora-panel.png
│   │   ├── img2img.png
│   │   ├── history.png
│   │   ├── history-modal.png
│   │   ├── settings.png
│   │   ├── collapsed-panels.png
│   │   ├── system-overview.png
│   │   ├── installation.png
│   │   ├── interface.png
│   │   ├── generation.png
│   │   ├── lora.png
│   │   └── update.png
│   ├── en/                   
│   │   ├── installation.md   # Installation guide
│   │   ├── user-guide.md     # User manual
│   │   ├── lora-guide.md     # LoRA guide
│   │   ├── faq.md           # FAQ
│   │   ├── requirements.md   # System requirements
│   │   └── project-structure.md  # Project structure
│   ├── installation.md       # Инструкция по установке
│   ├── user-guide.md         # Руководство пользователя
│   ├── lora-guide.md         # Руководство по LoRA
│   ├── faq.md               # Частые вопросы
│   ├── requirements.md       # Системные требования
│   └── project-structure.md  # Структура проекта
│
├── html/                     # [Core] Веб-интерфейс
│   ├── scripts/
│   │   ├── components/
│   │   │   ├── collapse.js         # Сворачивание панелей (2.07 KB)
│   │   │   ├── customSelect.js     # Кастомные селекты (8.13 KB)
│   │   │   ├── loraManager.js      # Управление LoRA (8.82 KB)
│   │   │   ├── panels.js           # Панели интерфейса (2.85 KB)
│   │   │   ├── sliders.js          # Слайдеры настроек (6.79 KB)
│   │   │   └── upload.js           # Загрузка файлов (10.33 KB)
│   │   ├── core/
│   │   │   ├── api-client.js       # API клиент (7.47 KB)
│   │   │   ├── init.js             # Инициализация (12.50 KB)
│   │   │   └── utils.js            # Утилиты (4.05 KB)
│   │   └── features/
│   │       ├── history.js          # История генераций (17.21 KB)
│   │       └── imageViewer.js      # Просмотр изображений (6.74 KB)
│   ├── styles/
│   │   ├── base/
│   │   │   ├── breakpoints.css     # Точки перелома (1.66 KB)
│   │   │   ├── reset.css           # Сброс стилей (1.39 KB)
│   │   │   ├── typography.css      # Типографика (2.79 KB)
│   │   │   └── variables.css       # Переменные (3.46 KB)
│   │   ├── components/
│   │   │   ├── buttons.css         # Стили кнопок (4.57 KB)
│   │   │   ├── inputs.css          # Стили полей ввода (6.28 KB)
│   │   │   ├── modals.css          # Стили модальных окон (3.29 KB)
│   │   │   ├── sliders.css         # Стили слайдеров (2.47 KB)
│   │   │   └── upload.css          # Стили загрузки (3.01 KB)
│   │   ├── layout/
│   │   │   ├── grid.css            # Сетка (4.68 KB)
│   │   │   ├── modal.css           # Модальная сетка (4.17 KB)
│   │   │   ├── panels.css          # Стили панелей (4.19 KB)
│   │   │   └── sections.css        # Стили секций (10.90 KB)
│   │   └── media/
│   │       ├── desktop.css         # Стили для десктопа (2.36 KB)
│   │       ├── mobile.css          # Стили для мобильных (3.14 KB)
│   │       └── tablet.css          # Стили для планшетов (2.55 KB)
│   ├── favicon.ico                 # Иконка сайта (318 B)
│   └── index.html                  # Главная страница (24.83 KB)
│
├── img2img/                  # [Created on Install] Папка для исходных изображений
│   ├── input_YYYYMMDD_HHMMSS.png  # [Generated] Загруженные изображения
│   └── .gitkeep
│
├── logs/                     # [Created on Install] Логи программы
│   ├── error.log            # [Generated] Журнал ошибок
│   ├── info.log             # [Generated] Информационный журнал
│   ├── debug.log            # [Generated] Отладочный журнал
│   └── install.log          # [Generated] Лог установки
│
├── models/                   # [Created on Install] AI модели
│   └── flux/
│       ├── loras/           # [User Data] Пользовательские LoRA модели
│       │   ├── Style/       # [Optional] Категория стилей
│       │   ├── Effects/     # [Optional] Категория эффектов
│       │   └── .gitkeep
│       ├── model_index.json # Индекс моделей (536 B)
│       ├── scheduler/
│       │   └── scheduler_config.json  # Конфигурация планировщика (273 B)
│       ├── text_encoder/            # Кодировщик текста
│       │   ├── config.json          # Конфигурация (613 B)
│       │   └── model.safetensors    # Модель (246.14 MB)
│       ├── text_encoder_2/          # Второй кодировщик текста
│       │   ├── config.json          # Конфигурация (782 B)
│       │   ├── model-00001-of-00002.safetensors  # Часть 1 (4.99 GB)
│       │   ├── model-00002-of-00002.safetensors  # Часть 2 (4.53 GB)
│       │   └── model.safetensors.index.json      # Индекс (19.89 KB)
│       ├── tokenizer/              # Токенизатор
│       │   ├── merges.txt          # Правила слияния (524.62 KB)
│       │   ├── special_tokens_map.json  # Карта токенов (588 B)
│       │   ├── tokenizer_config.json    # Конфигурация (705 B)
│       │   └── vocab.json          # Словарь (1.06 MB)
│       ├── tokenizer_2/            # Второй токенизатор
│       │   ├── special_tokens_map.json  # Карта токенов (2.54 KB)
│       │   ├── spiece.model         # Модель (791.66 KB)
│       │   ├── tokenizer.json       # Основной файл (2.42 MB)
│       │   └── tokenizer_config.json  # Конфигурация (20.82 KB)
│       ├── transformer/            # Трансформер
│       │   ├── config.json         # Конфигурация (378 B)
│       │   ├── diffusion_pytorch_model-00001-of-00003.safetensors  # Часть 1 (9.98 GB)
│       │   ├── diffusion_pytorch_model-00002-of-00003.safetensors  # Часть 2 (9.95 GB)
│       │   ├── diffusion_pytorch_model-00003-of-00003.safetensors  # Часть 3 (3.87 GB)
│       │   ├── diffusion_pytorch_model.safetensors.index.json  # Индекс (121.26 KB)
│       │   └── flux1-dev.sft       # Основная модель (23.80 GB)
│       └── vae/                   # Автоэнкодер
│           ├── config.json         # Конфигурация (820 B)
│           └── diffusion_pytorch_model.safetensors  # Модель (167.67 MB)
│
├── output/                   # [Created on Install] Результаты генерации
│   ├── YYYYMMDD_HHMMSS_seed_prompt.png  # [Generated] Изображения
│   ├── YYYYMMDD_HHMMSS_seed_prompt.json # [Generated] Метаданные
│   └── .gitkeep
│
├── venv/                     # [Created on Install] Виртуальное окружение Python
│   ├── Lib/
│   │   └── site-packages/   # Установленные Python пакеты
│   │       ├── torch/       # PyTorch
│   │       ├── transformers/ # Hugging Face Transformers
│   │       ├── diffusers/   # Diffusers
│   │       └── ...          # Другие библиотеки
│   ├── Scripts/
│   │   ├── activate        # Активация окружения
│   │   ├── activate.bat    # Активация для Windows
│   │   ├── python.exe      # Python интерпретатор
│   │   └── pip.exe         # Менеджер пакетов
│   └── pyvenv.cfg          # Конфигурация окружения
│
├── __pycache__/             # [Generated] Кэш Python
│   ├── api.cpython-310.pyc
│   ├── app.cpython-310.pyc
│   └── live_preview_helpers.cpython-310.pyc
│
├── api.py                    # [Core] FastAPI сервер (38.47 KB)
├── app.py                    # [Core] Ядро приложения (16.71 KB)
├── CHANGELOG.md              # [Core] История изменений (1.39 KB)
├── cleanup.bat              # [Core] Очистка кэша (529 B)
├── CONTRIBUTING.md          # [Core] Руководство контрибьютора (1.06 KB)
├── create_folders.bat       # [Core] Создание структуры папок (290 B)
├── .gitattributes          # [Core] Настройки Git LFS (1.52 KB)
├── .gitignore              # [Core] Игнорируемые файлы (502 B)
├── INSTALL.bat             # [Core] Скрипт установки (5.02 KB)
├── LICENSE                 # [Core] Лицензия MIT (1.07 KB)
├── live_preview_helpers.py # [Core] Помощник предпросмотра (8.43 KB)
├── loras.json              # [Core] Конфигурация LoRA (9.12 KB)
├── prompts.csv             # [Core] База примеров промптов (15.38 KB)
├── README.md               # [Core] Описание проекта RU (3.14 KB)
├── README_EN.md            # [Core] Описание проекта EN (2.03 KB)
├── requirements.txt        # [Core] Python зависимости (1.11 KB)
├── SECURITY.md             # [Core] Политика безопасности RU
├── SECURITY_EN.md          # [Core] Политика безопасности EN
├── setup.py               # [Core] Установщик (10.88 KB)
├── START-WEB_JL_STUDIO.bat # [Core] Запуск сервера (235 B)
├── SUPPORT.md             # [Core] Поддержка RU
├── SUPPORT_EN.md          # [Core] Поддержка EN
├── token.txt              # [User Data] Hugging Face токен (37 B)
└── UPDATE.bat             # [Core] Скрипт обновления (598 B)
```

# Пояснения к структуре

## Типы компонентов

### [Core]
Основные файлы, присутствующие сразу после скачивания:
- Скрипты Python (api.py, app.py и др.)
- Документация и описания
- Конфигурационные файлы
- Веб-интерфейс

### [Created on Install]
Создаются при первой установке (INSTALL.bat):
- img2img/ - папка для входных изображений
- logs/ - логи работы
- models/ - модели нейросетей и LoRA
- output/ - результаты генерации
- venv/ - виртуальное окружение Python

### [Generated]
Создаются автоматически при работе:
- Логи (*.log) в logs/
- Изображения (*.png) и метаданные (*.json) в output/
- Временные файлы в img2img/
- Резервные копии в backup/
- Кэш Python (__pycache__/)
- Кэш PyTorch и Hugging Face в cache/

### [User Data]
Пользовательские данные:
- token.txt - создаётся пользователем вручную
- models/flux/loras/ - пользовательские LoRA модели
- output/ - сгенерированные изображения и метаданные

### [Optional]
Необязательные компоненты:
- Подкатегории в loras/ (Style/, Effects/ и др.)
- Пользовательские конфигурации
- Дополнительные скрипты и утилиты

## Требования к пространству

### Базовые компоненты
- Основные файлы: ~100 MB
- Виртуальное окружение (venv/): 2-3 GB
- Кэш (cache/): 1-2 GB
- Логи (logs/): несколько MB

### Модели FLUX
- text_encoder: 246 MB
- text_encoder_2: 9.52 GB
- transformer: 23.8 GB
- vae: 168 MB
Общий размер моделей: ~35 GB

### Рабочее пространство
- output/: зависит от количества генераций (~10 MB на изображение)
- img2img/: временные файлы (~5 MB на файл)
- backup/: зависит от настроек резервного копирования
- loras/: зависит от количества установленных LoRA (~100 MB на модель)

### Рекомендуемые требования
- Минимум 50 GB свободного места:
  - 35 GB для моделей
  - 5 GB для окружения и кэша
  - 10 GB для работы и генераций