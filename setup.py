import os
import sys
import shutil
import subprocess
from pathlib import Path
from huggingface_hub import snapshot_download
from tqdm import tqdm
import psutil

# Константы
FLUX_REPO = "black-forest-labs/FLUX.1-dev"
MODEL_DIR = "models/flux"
VENV_DIR = "venv"
OUTPUT_DIR = "output"
IMG2IMG_DIR = "img2img"
REQUIRED_SPACE_GB = 50

def check_free_space(path="."):
    free_space = psutil.disk_usage(path).free / (1024**3)
    if free_space < REQUIRED_SPACE_GB:
        print(f"❌ Недостаточно свободного места на диске!")
        print(f"Требуется: {REQUIRED_SPACE_GB} GB")
        print(f"Доступно: {free_space:.1f} GB")
        return False
    return True

def run_command(command, description):
    print(f"\n>>> {description}...")
    try:
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        for line in process.stdout:
            print(line.strip())
            
        process.wait()
        
        if process.returncode == 0:
            print(f"✓ {description} - успешно")
            return True
        else:
            print(f"✗ Ошибка при {description}")
            return False
    except Exception as e:
        print(f"✗ Ошибка при {description}: {e}")
        return False

def create_directory_structure():
    directories = [
        MODEL_DIR,
        f"{MODEL_DIR}/loras",
        f"{MODEL_DIR}/transformer",
        f"{MODEL_DIR}/vae",
        f"{MODEL_DIR}/text_encoder",
        f"{MODEL_DIR}/text_encoder_2",
        f"{MODEL_DIR}/tokenizer",
        f"{MODEL_DIR}/tokenizer_2",
        f"{MODEL_DIR}/scheduler",
        OUTPUT_DIR,
        IMG2IMG_DIR,
        "logs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✓ Создана папка: {directory}")

def create_startup_script():
    content = """@echo off
chcp 65001 > nul
cd /d "%~dp0"
call venv\\Scripts\\activate.bat
echo Запуск веб-интерфейса JL Studio...
echo.
echo ⚡ Адрес интерфейса: http://127.0.0.1:7860
echo.
python api.py
pause"""
    
    with open("START-WEB_JL_STUDIO.bat", "w", encoding='utf-8') as f:
        f.write(content)
    
    print("✓ Создан файл запуска")

def move_model_file():
    source_file = Path(MODEL_DIR) / "flux1-dev.safetensors"
    target_file = Path(MODEL_DIR) / "transformer" / "flux1-dev.sft"
    
    if source_file.exists() and not target_file.exists():
        try:
            print("Настройка файла модели...")
            shutil.move(source_file, target_file)
            print("✅ Файл модели перемещён")
            return True
        except Exception as e:
            print(f"❌ Ошибка при перемещении файла модели: {e}")
            return False
    return True

def download_tokenizer_files():
    print("Загрузка дополнительных файлов...")
    try:
        auth_token = Path('token.txt').read_text().strip()
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # CLIP токенизатор
        clip_files = [
            "https://huggingface.co/openai/clip-vit-large-patch14/resolve/main/vocab.json",
            "https://huggingface.co/openai/clip-vit-large-patch14/resolve/main/merges.txt",
            "https://huggingface.co/openai/clip-vit-large-patch14/resolve/main/tokenizer_config.json",
            "https://huggingface.co/openai/clip-vit-large-patch14/resolve/main/special_tokens_map.json"
        ]
        
        tokenizer_path = Path(MODEL_DIR) / "tokenizer"
        tokenizer_path.mkdir(parents=True, exist_ok=True)
        
        import requests
        for url in clip_files:
            filename = url.split('/')[-1]
            filepath = tokenizer_path / filename
            
            if not filepath.exists():
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                print(f"✓ Загружен {filename}")
                
        # T5 токенизатор
        t5_url = "https://huggingface.co/google/t5-v1_1-xxl/resolve/main/spiece.model"
        t5_path = Path(MODEL_DIR) / "tokenizer_2" / "spiece.model"
        
        if not t5_path.exists():
            response = requests.get(t5_url, headers=headers)
            response.raise_for_status()
            
            with open(t5_path, 'wb') as f:
                f.write(response.content)
            print("✓ Загружен spiece.model")
            
        return True
    except Exception as e:
        print(f"❌ Ошибка загрузки файлов: {e}")
        return False

def download_and_setup_model():
    print("\n📥 Загрузка модели FLUX...")
    
    try:
        auth_token = Path('token.txt').read_text().strip()
    except FileNotFoundError:
        print("❌ Ошибка: Файл token.txt не найден!")
        return False
        
    allowed_patterns = [
        "*.json",
        "*.safetensors",
        "*.bin",
        "*.sft",
        "spiece.model",
        "tokenizer.json"
    ]
    
    ignored_patterns = [
        "*.md",
        ".gitattributes",
        "*.jpg",
        "*.png",
        "*.txt",
        "ae.safetensors"
    ]
    
    try:
        components = [
            "transformer",
            "vae",
            "text_encoder",
            "text_encoder_2",
            "tokenizer",
            "tokenizer_2",
            "scheduler"
        ]
        
        for component in components:
            component_dir = Path(MODEL_DIR) / component
            component_dir.mkdir(parents=True, exist_ok=True)
        
        # Загружаем основные файлы модели
        snapshot_download(
            FLUX_REPO,
            local_dir=MODEL_DIR,
            local_dir_use_symlinks=False,
            resume_download=True,
            token=auth_token,
            allow_patterns=allowed_patterns,
            ignore_patterns=ignored_patterns
        )
        
        # Перемещаем файл модели
        if not move_model_file():
            return False
        
        # Загружаем недостающие файлы токенизаторов
        if not download_tokenizer_files():
            return False
            
        print("✅ Все необходимые файлы загружены")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при загрузке моделей: {e}")
        return False

def check_requirements():
    try:
        # Проверка версии Python
        python_version = sys.version_info
        if python_version.major != 3 or python_version.minor != 10:
            print("❌ Требуется Python 3.10")
            return False
            
        # Проверка наличия CUDA
        try:
            import torch
            if not torch.cuda.is_available():
                print("⚠️ CUDA не обнаружена. Генерация будет выполняться на CPU (очень медленно)")
            else:
                print(f"✓ Обнаружен GPU: {torch.cuda.get_device_name(0)}")
        except ImportError:
            pass
            
        return True
    except Exception as e:
        print(f"❌ Ошибка при проверке требований: {e}")
        return False

def setup_environment():
    current_dir = Path.cwd()
    print(f"🚀 Настройка проекта в директории: {current_dir}")

    # Проверка свободного места
    if not check_free_space():
        return False

    # Проверка требований
    if not check_requirements():
        return False

    # Создание и активация виртуального окружения
    if not (current_dir / VENV_DIR).exists():
        if not run_command("python -m venv venv", "Создание виртуального окружения"):
            return False

    venv_python = str(current_dir / VENV_DIR / "Scripts" / "python.exe")
    
    # Установка зависимостей
    commands = [
        (f'"{venv_python}" -m pip install --upgrade pip', "Обновление pip"),
        (f'"{venv_python}" -m pip install huggingface_hub tqdm colorama requests', "Установка базовых зависимостей"),
        (f'"{venv_python}" -m pip install torch==2.3.0 torchvision==0.18.0+cu118 torchaudio==2.3.0+cu118 --extra-index-url https://download.pytorch.org/whl/cu118', "Установка PyTorch"),
        (f'"{venv_python}" -m pip install -r requirements.txt', "Установка остальных зависимостей")
    ]
    
    for cmd, desc in commands:
        if not run_command(cmd, desc):
            return False

    # Создание структуры проекта
    create_directory_structure()
    create_startup_script()

    # Скачивание и настройка модели
    if not download_and_setup_model():
        print("❌ Ошибка при установке модели")
        return False

    print("\n✅ Установка завершена успешно!")
    print("\nДля запуска:")
    print("1. Используйте START-WEB_JL_STUDIO.bat для запуска веб-интерфейса")
    print("2. Откройте в браузере: http://127.0.0.1:7860")
    return True

if __name__ == "__main__":
    try:
        if not setup_environment():
            print("\n❌ Установка завершилась с ошибками")
            print("Попробуйте устранить проблемы и запустить установку повторно")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️ Установка прервана пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Произошла неожиданная ошибка: {e}")
        sys.exit(1)
    finally:
        input("\nНажмите Enter для выхода...")