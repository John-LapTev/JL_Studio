"""
JL Studio - Система генерации изображений
Версия: 1.0
Автор: John LapTev
Copyright (c) 2024 John LapTev. Все права защищены.
"""

import os
import json
import logging
import torch
import pandas as pd
from PIL import Image
from pathlib import Path
from huggingface_hub import HfApi
from datetime import datetime
import time
from diffusers import FluxPipeline, AutoencoderTiny, AutoencoderKL, AutoPipelineForImage2Image
from live_preview_helpers import JL_calculate_shift, JL_retrieve_timesteps, JL_flux_pipe_call_that_returns_an_iterable_of_images
import random
import numpy as np
import sys

# Глобальные константы
JL_MAX_SEED = 2**32-1
JL_DEFAULT_QUALITY = 100
JL_DEFAULT_FORMAT = "PNG"
JL_DEFAULT_NAME_FORMAT = "prompt"

# Настройка вывода
print("\n" + "="*80)
print("🚀 ЗАПУСК JL STUDIO")
print("="*80 + "\n")

# --- Инициализация ---
print("🔍 ПРОВЕРКА ОКРУЖЕНИЯ")
print("├─ Проверка токена...", end=" ")
token_path = Path('token.txt')
if token_path.exists():
    with open(token_path) as f:
        token = f.read().strip()
        os.environ["HUGGING_FACE_HUB_TOKEN"] = token
    print("✅")
else:
    print("❌\n❌ ОШИБКА: Файл token.txt не найден!")
    sys.exit(1)

print("├─ Проверка GPU...", end=" ")
if torch.cuda.is_available():
    gpu_name = torch.cuda.get_device_name(0)
    gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
    print("✅")
    print(f"   ├─ Устройство: {gpu_name}")
    print(f"   └─ Память: {gpu_memory:.1f} GB")
    torch.cuda.empty_cache()
    torch.cuda.synchronize()
else:
    print("⚠️ GPU не найден, используется CPU")

print("└─ Настройка памяти...", end=" ")
if torch.cuda.is_available():
    torch.cuda.empty_cache()
    torch.backends.cudnn.benchmark = True
print("✅")

# Подготовка конфигурации
jl_dtype = torch.float16
jl_model_path = Path("models/flux")

print("\n📦 ПРОВЕРКА ФАЙЛОВ")
print(f"├─ Проверка папки моделей...", end=" ")
if not jl_model_path.exists():
    print("❌\n❌ ОШИБКА: Папка models/flux не найдена!")
    sys.exit(1)
print("✅")

print("├─ Проверка model_index.json...", end=" ")
model_index = jl_model_path / "model_index.json"
if not model_index.exists():
    print("❌\n❌ ОШИБКА: Не найден model_index.json!")
    sys.exit(1)
with open(model_index) as f:
    config = json.load(f)
print("✅")

print("└─ Проверка файла модели...", end=" ")
model_file = jl_model_path / "transformer" / "flux1-dev.sft"
if not model_file.exists():
    print("❌\n❌ ОШИБКА: Не найден файл модели!")
    sys.exit(1)
print("✅")

# Загрузка моделей
print("\n⚙️ ЗАГРУЗКА МОДЕЛЕЙ")

try:
    print("├─ Основной пайплайн...", end=" ")
    jl_pipe = FluxPipeline.from_pretrained(
        "models/flux",
        torch_dtype=jl_dtype,
        device_map=None,
        use_safetensors=True,
        local_files_only=True,
        low_cpu_mem_usage=True,
        max_sequence_length=512
    )
    print("✅")
    
    print("├─ VAE tiny...", end=" ")
    jl_taef1 = AutoencoderTiny.from_pretrained(
        "madebyollin/taef1",
        torch_dtype=jl_dtype,
        low_cpu_mem_usage=True
    )
    print("✅")
    
    print("├─ Основной VAE...", end=" ")
    jl_good_vae = AutoencoderKL.from_pretrained(
        "black-forest-labs/FLUX.1-dev",
        subfolder="vae",
        torch_dtype=jl_dtype
    ).to("cuda" if torch.cuda.is_available() else "cpu")
    print("✅")

    print("├─ Image-to-image пайплайн...", end=" ")
    jl_pipe_i2i = AutoPipelineForImage2Image.from_pretrained(
        "black-forest-labs/FLUX.1-dev",
        vae=jl_good_vae,
        transformer=jl_pipe.transformer,
        text_encoder=jl_pipe.text_encoder,
        tokenizer=jl_pipe.tokenizer,
        text_encoder_2=jl_pipe.text_encoder_2,
        tokenizer_2=jl_pipe.tokenizer_2,
        torch_dtype=jl_dtype
    )
    print("✅")
    
    print("├─ Оптимизация пайплайна...", end=" ")
    jl_pipe.vae_preview = jl_taef1 # Сохраняем быстрый VAE для предпросмотра
    jl_pipe.vae = jl_good_vae      # Используем качественный VAE по умолчанию
    print("✅")
    
    print("└─ CPU offloading...", end=" ")
    jl_device = "cuda" if torch.cuda.is_available() else "cpu"
    jl_pipe.enable_sequential_cpu_offload(device=jl_device)
    jl_pipe_i2i.enable_sequential_cpu_offload(device=jl_device)
    jl_pipe.flux_pipe_call_that_returns_an_iterable_of_images = JL_flux_pipe_call_that_returns_an_iterable_of_images.__get__(jl_pipe)
    print("✅")

except Exception as e:
    print(f"\n❌ ОШИБКА при загрузке моделей: {str(e)}")
    raise

# Загрузка конфигураций
print("\n📥 ЗАГРУЗКА КОНФИГУРАЦИЙ")

# Загрузка списка LoRA
print("├─ Загрузка списка LoRA...", end=" ")
try:
    with open('loras.json', 'r', encoding='utf-8') as f:
        jl_loras = json.load(f)
    print(f"✅ (найдено: {len(jl_loras)})")
except Exception as e:
    print(f"⚠️ {str(e)}")
    jl_loras = []

# Загрузка промптов
print("└─ Загрузка промптов...", end=" ")
try:
    jl_prompts_df = pd.read_csv('prompts.csv', header=None, encoding='utf-8')
    jl_prompt_values = jl_prompts_df[0].values
    print(f"✅ (найдено: {len(jl_prompt_values)})")
except Exception as e:
    print(f"⚠️ {str(e)}")
    jl_prompt_values = []

def JL_load_local_loras():
    """Загрузка локальных LoRA из пользовательской папки"""
    loras_path = Path("models/flux/loras")
    loras_path.mkdir(exist_ok=True)
    local_loras = []

    print("\n📁 ДОСТУПНЫЕ ЛОКАЛЬНЫЕ LORA:")
    
    for lora_file in loras_path.rglob("*.safetensors"):
        rel_path = lora_file.relative_to(loras_path)
        folder_path = str(rel_path.parent) if rel_path.parent != Path(".") else ""
        display_name = str(rel_path.with_suffix(""))
        display_name = display_name.replace("\\", "/")

        # Поиск превью для локальной LoRA
        preview = None
        preview_extensions = ['.png', '.jpg', '.jpeg', '.webp']
        for ext in preview_extensions:
            preview_path = lora_file.with_suffix(ext)
            if preview_path.exists():
                preview = str(preview_path)
                break
        
        local_loras.append({
            "title": display_name,
            "path": str(lora_file),
            "folder": folder_path,
            "trigger_word": "",
            "preview": preview
        })
        
        if folder_path:
            print(f"├─ [{folder_path}] {display_name}")
        else:
            print(f"├─ {display_name}")
    
    local_loras.sort(key=lambda x: (x["folder"], x["title"]))
    if local_loras:
        print(f"└─ Всего найдено: {len(local_loras)}")
    else:
        print("└─ Локальные LoRA не найдены")
    return local_loras

def JL_find_best_lora_file(repo_id):
    """Находит наиболее подходящий файл LoRA"""
    try:
        from huggingface_hub import list_repo_files
        
        files = list_repo_files(repo_id)
        safetensors_files = [f for f in files if f.endswith('.safetensors')]
        
        if not safetensors_files:
            print(f"⚠️ LoRA файлы не найдены в {repo_id}")
            return None
            
        if len(safetensors_files) == 1:
            return safetensors_files[0]
            
        repo_name = repo_id.split('/')[-1].lower()
        
        priority_names = [
            f"{repo_name}.safetensors",
            "lora.safetensors",
            "model.safetensors",
            "flux.safetensors"
        ]
        
        for name in priority_names:
            if name in safetensors_files:
                print(f"✓ Найден приоритетный файл: {name}")
                return name
                
        for file in safetensors_files:
            if repo_name in file.lower():
                print(f"✓ Найден файл по имени репозитория: {file}")
                return file
                
        print(f"⚠️ Используем первый найденный файл: {safetensors_files[0]}")
        return safetensors_files[0]
        
    except Exception as e:
        print(f"❌ Ошибка при поиске файла LoRA: {e}")
        return None

def JL_load_image(image_path):
    """Загрузка и подготовка изображения для обработки"""
    try:
        image = Image.open(image_path)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
        return image
    except Exception as e:
        raise ValueError(f"❌ Ошибка загрузки изображения: {str(e)}")

def JL_save_generated_image(image, prompt, seed, format='PNG', quality=100, name_format='prompt'):
    """Сохранение сгенерированного изображения"""
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%d.%m.%Y_%H%M%S")
    
    # Ограничиваем длину промпта в зависимости от формата имени
    if name_format == 'full':
        prompt_slug = sanitize_filename(prompt[:15])
    else:  # prompt
        prompt_slug = sanitize_filename(prompt[:30])
    
    if name_format == 'full':
        filename = f"{timestamp}_{seed}_{prompt_slug}"
    elif name_format == 'date':
        filename = timestamp
    elif name_format == 'seed':
        filename = f"{timestamp}_{seed}"
    else:  # prompt
        filename = prompt_slug
        
    base_filename = filename
    counter = 0
    while True:
        suffix = f"({counter})" if counter > 0 else ""
        filename_with_suffix = f"{base_filename}{suffix}"
        full_path = output_dir / f"{filename_with_suffix}.{format.lower()}"
        if not full_path.exists():
            break
        counter += 1
    
    try:
        if format.upper() in ['JPEG', 'JPG']:
            image.save(full_path, format=format.upper(), quality=quality, optimize=True)
        elif format.upper() == 'WEBP':
            image.save(full_path, format='WEBP', quality=quality, method=6)
        else:  # PNG
            image.save(full_path, format='PNG', optimize=True)
        
        # Сохраняем метаданные
        metadata = {
            'prompt': prompt,
            'seed': seed,
            'timestamp': str(datetime.now()),
            'format': format,
            'quality': quality
        }
        
        metadata_path = full_path.with_suffix('.json')
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        print(f"💾 Сохранено: {full_path}")
        return str(full_path)
    except Exception as e:
        print(f"❌ Ошибка при сохранении изображения: {str(e)}")
        raise ValueError(f"Ошибка сохранения: {str(e)}")

def JL_randomize_prompt():
    """Генерация случайного промпта из загруженного списка"""
    if jl_prompt_values is not None and len(jl_prompt_values) > 0:
        return random.choice(jl_prompt_values.tolist())
    return ""

def JL_generate_image(prompt_mash, steps, seed, cfg_scale, width, height, lora_scale):
    """
    Основная функция генерации изображения
    
    Args:
        prompt_mash (str): Подготовленный промпт с trigger words
        steps (int): Количество шагов генерации
        seed (int): Сид для воспроизводимости результата
        cfg_scale (float): Параметр CFG
        width (int): Ширина изображения
        height (int): Высота изображения
        lora_scale (float): Сила влияния LoRA
    """
    generator = torch.Generator(device="cuda").manual_seed(seed)
    start_time = time.time()
    total_time = 0
    
    with torch.inference_mode():
        for i, img in enumerate(jl_pipe.flux_pipe_call_that_returns_an_iterable_of_images(
            prompt=prompt_mash,
            num_inference_steps=steps,
            guidance_scale=cfg_scale,
            width=width,
            height=height,
            generator=generator,
            joint_attention_kwargs={"scale": lora_scale},
            output_type="pil",
            good_vae=jl_good_vae
        )):
            current_step = i + 1
            elapsed_time = time.time() - start_time
            eta = (elapsed_time / current_step) * (steps - current_step) if current_step > 0 else 0
            
            # Очищаем предыдущую строку и выводим новую
            sys.stdout.write('\r')
            sys.stdout.write(f"[{'=' * (current_step * 50 // steps)}{' ' * (50 - current_step * 50 // steps)}] ")
            sys.stdout.write(f"{current_step}/{steps} шаг ")
            sys.stdout.write(f"({(current_step/steps)*100:.1f}%) ")
            sys.stdout.write(f"[{int(elapsed_time)}с/{int(eta)}с] ")
            sys.stdout.flush()
            
            if i == steps - 1:  # Последний шаг
                total_time = time.time() - start_time
                sys.stdout.write('\n\n')  # Перевод строки после завершения
                print(f"✨ Генерация завершена за {total_time:.1f} секунд\n")
            
            yield img

def JL_generate_image_to_image(prompt_mash, image_input_path, image_strength, steps, cfg_scale, width, height, lora_scale, seed):
    """
    Функция для генерации изображения на основе другого изображения
    
    Args:
        prompt_mash (str): Подготовленный промпт
        image_input_path (str): Путь к исходному изображению
        image_strength (float): Сила влияния исходного изображения
        steps (int): Количество шагов
        cfg_scale (float): Параметр CFG
        width (int): Ширина результата
        height (int): Высота результата
        lora_scale (float): Сила влияния LoRA
        seed (int): Сид для воспроизводимости
    """
    start_time = time.time()
    
    try:
        image_input = JL_load_image(image_input_path)
        print(f"📥 Загружено исходное изображение: {image_input.size}")
        
        generator = torch.Generator(device="cuda").manual_seed(seed)
        final_image = jl_pipe_i2i(
            prompt=prompt_mash,
            image=image_input,
            strength=image_strength,
            num_inference_steps=steps,
            guidance_scale=cfg_scale,
            width=width,
            height=height,
            generator=generator,
            joint_attention_kwargs={"scale": lora_scale},
            output_type="pil"
        ).images[0]
        
        total_time = time.time() - start_time
        print(f"\n✨ Генерация завершена за {total_time:.1f} секунд\n")
        return final_image
        
    except Exception as e:
        print(f"\n❌ Ошибка при генерации img2img: {str(e)}")
        raise

def sanitize_filename(prompt: str, max_length: int = 30) -> str:
    """Очистка и ограничение длины имени файла"""
    # Заменяем недопустимые символы
    invalid_chars = '<>:"/\\|?*'
    filename = prompt
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    
    # Убираем множественные пробелы и ограничиваем длину
    filename = " ".join(filename.split())[:max_length]
    return filename.strip()

print("\n✅ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА")
print("="*80)