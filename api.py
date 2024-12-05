"""
JL Studio - API сервер
Версия: 1.0
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import torch
from pathlib import Path
import asyncio
import logging
import signal
import sys
import os
import subprocess
import re
import pandas as pd 
from datetime import datetime
from PIL import Image
import base64
import io
import traceback
import shutil
import time

# Импорт из основного приложения
from app import (
    jl_pipe, jl_good_vae, jl_pipe_i2i, jl_loras, JL_load_local_loras
)
from live_preview_helpers import JL_flux_pipe_call_that_returns_an_iterable_of_images

# Отключаем вывод HTTP-логов
uvicorn_logger = logging.getLogger("uvicorn.access")
uvicorn_logger.disabled = True

# Настройка логирования без даты/времени
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)

# Создание приложения
app = FastAPI(title="JL Studio API")

# Создаем папки если их нет
output_dir = Path("output")
output_dir.mkdir(exist_ok=True)

img2img_dir = Path("img2img")
img2img_dir.mkdir(exist_ok=True)

loras_dir = Path("models/flux/loras")
loras_dir.mkdir(exist_ok=True)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Вспомогательные функции
def format_time(seconds):
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    if minutes > 0:
        return f"{minutes}м {seconds}с"
    return f"{seconds}с"

def get_stage(progress: float) -> str:
    if progress < 0.2: return "Построение композиции..."
    elif progress < 0.4: return "Создание базовых элементов..."
    elif progress < 0.6: return "Проработка деталей..."
    elif progress < 0.8: return "Улучшение качества..."
    return "Финальные штрихи..."

def calculate_actual_steps(steps: int, strength: float) -> int:
    """
    Вычисляет необходимое количество шагов для получения желаемого количества
    
    Args:
        steps (int): Желаемое количество шагов
        strength (float): Сила влияния (0-1)
        
    Returns:
        int: Скорректированное количество шагов
    """
    # Формула: actual_steps = desired_steps / (1 - strength)
    real_strength = calculate_img2img_impact(strength)
    adjusted_steps = int(steps / (1 - real_strength))
    return min(adjusted_steps, 35)  # Ограничиваем максимальным значением в 50 шагов

def calculate_img2img_impact(visual_strength: float) -> float:
    """
    Пересчитывает визуальное значение силы в реальное
    
    Args:
        visual_strength (float): Значение от 0 до 1 из интерфейса
        
    Returns:
        float: Преобразованное значение для модели
    """
    # Преобразуем визуальное значение в диапазон 0.5-1.0:
    # visual 0.0 -> 1.0 (максимальное изменение)
    # visual 1.0 -> 0.5 (умеренное изменение)
    return 1.0 - (visual_strength * 0.5)

def check_prompt_length(prompt: str, max_tokens: int = 77) -> str:
    """
    Проверяет и обрезает промпт если он превышает максимальное количество токенов
    
    Args:
        prompt (str): Исходный промпт
        max_tokens (int, optional): Максимальное количество токенов. По умолчанию 77.
        
    Returns:
        str: Обработанный промпт
    """
    tokens = prompt.split()
    if len(tokens) > max_tokens:
        print(f"\n⚠️ ВНИМАНИЕ: Промпт слишком длинный!")
        print(f"├─ Текущая длина: {len(tokens)} токенов") 
        print(f"├─ Максимальная длина: {max_tokens} токенов")
        print("└─ Конец промпта будет обрезан\n")
        return ' '.join(tokens[:max_tokens])
    return prompt

@app.get("/api/random-prompt")
async def get_random_prompt():
    """Получение случайного промпта из базы"""
    try:
        if not hasattr(app, 'prompts_df'):
            app.prompts_df = pd.read_csv('prompts.csv', header=None, encoding='utf-8')
        
        random_prompt = app.prompts_df.sample().iloc[0, 0]
        return {"status": "success", "prompt": random_prompt}
    except Exception as e:
        logger.error(f"❌ Ошибка получения случайного промпта: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
# Модели данных
class GenerationParams(BaseModel):
    max_sequence_length: int = 512
    prompt: str
    width: int = 1024
    height: int = 1024
    steps: int = 28
    cfg_scale: float = 3.5
    seed: Optional[int] = None
    lora_indices: List[str] = []
    lora_scales: List[float] = []
    image_input: Optional[str] = None
    image_strength: Optional[float] = 0.75
    randomize_seed: bool = True
    save_format: str = "PNG"
    save_quality: int = 100
    save_name_format: str = "prompt"

def print_generation_params(params: dict):
    """Красивый вывод параметров генерации"""
    print("\n🎯 ПАРАМЕТРЫ ГЕНЕРАЦИИ:")
    print(f"├─ Размеры: {params['width']}x{params['height']}")
    print(f"├─ Шаги: {params['steps']}")
    print(f"├─ CFG: {params['cfg_scale']}")
    print(f"├─ Seed: {params['seed']} ({'случайный' if params['randomize_seed'] else 'фиксированный'})")
    print(f"├─ Формат: {params['save_format'].upper()} (качество: {params['save_quality']}%)")
    if 'image_input' in params and params['image_input']:
        print(f"└─ Сила img2img: {params['image_strength']}")
    else:
        print("└─ Режим: обычная генерация")
    print("="*80)

def decode_base64_image(base64_string: str) -> Image.Image:
    """Декодирование base64 в PIL Image"""
    try:
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_bytes = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_bytes))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        logger.info(f"📥 Загружено изображение: {image.size}")
        return image
    except Exception as e:
        logger.error(f"❌ Ошибка декодирования изображения: {str(e)}")
        raise ValueError("Ошибка обработки загруженного изображения")

def save_img2img_input(image: Image.Image, filename: str) -> str:
    """Сохранение загруженного изображения для img2img"""
    try:
        filepath = img2img_dir / filename
        image.save(filepath, format='PNG', optimize=False)
        return str(filepath)
    except Exception as e:
        logger.error(f"❌ Ошибка сохранения входного изображения: {str(e)}")
        return None

def sanitize_filename(prompt: str, max_length: int = 30) -> str:
    """Очистка имени файла с поддержкой русского языка"""
    # Заменяем недопустимые символы
    invalid_chars = '<>:"/\\|?*'
    filename = prompt
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    
    # Ограничиваем длину и убираем лишние пробелы
    filename = " ".join(filename.split())[:max_length]
    return filename.strip()

def generate_filename(prompt: str, seed: int, fmt: str, name_format: str) -> str:
    """Генерация имени файла для сохранения"""
    timestamp = datetime.now().strftime("%d.%m.%Y_%H%M%S")
    
    if name_format == 'full':
        sanitized_prompt = sanitize_filename(prompt, max_length=15)
        filename = f"{timestamp}_{seed}_{sanitized_prompt}"
    elif name_format == 'date':
        filename = timestamp
    elif name_format == 'seed':
        filename = f"{timestamp}_{seed}"
    else:  # prompt
        filename = sanitize_filename(prompt, max_length=30)
        
    output_dir = Path("output")
    counter = 0
    while True:
        suffix = f"({counter})" if counter > 0 else ""
        filename_with_suffix = f"{filename}{suffix}"
        full_path = output_dir / f"{filename_with_suffix}.{fmt.lower()}"
        if not full_path.exists():
            break
        counter += 1
        
    return filename_with_suffix

async def download_online_lora(repo_id: str, save_dir: Path) -> Optional[dict]:
    """Скачивание LoRA из Hugging Face"""
    try:
        from huggingface_hub import hf_hub_download, list_repo_files
        
        style_dir = save_dir / "Style"
        style_dir.mkdir(exist_ok=True)
        
        repo_name = repo_id.split('/')[-1]
        lora_dir = style_dir / repo_name
        lora_dir.mkdir(exist_ok=True)

        logger.info(f"📥 Загрузка LoRA из {repo_id}")

        try:
            repo_files = await asyncio.to_thread(list_repo_files, repo_id)
        except Exception as e:
            logger.error(f"❌ Не удалось получить список файлов из {repo_id}")
            return None

        model_filename = next((f for f in repo_files if f.endswith(('.safetensors', '.ckpt', '.pt'))), None)
        if not model_filename:
            logger.error(f"❌ Не найден файл модели в {repo_id}")
            return None

        model_file = await asyncio.to_thread(
            hf_hub_download,
            repo_id=repo_id,
            filename=model_filename,
            local_dir=lora_dir
        )

        preview_file = None
        preview_extensions = ['.png', '.jpg', '.jpeg', '.webp']
        for filename in repo_files:
            if any(filename.lower().endswith(ext) for ext in preview_extensions):
                try:
                    preview_file = await asyncio.to_thread(
                        hf_hub_download,
                        repo_id=repo_id,
                        filename=filename,
                        local_dir=lora_dir
                    )
                    break
                except Exception:
                    continue

        if not preview_file:
            logger.warning(f"⚠️ Не удалось найти превью для {repo_id}")

        return {
            "title": repo_name,
            "path": str(model_file),
            "preview": str(preview_file) if preview_file else None,
            "trigger_word": "",
            "trigger_position": "append"
        }

    except Exception as e:
        logger.error(f"❌ Ошибка скачивания LoRA {repo_id}: {str(e)}")
        return None

async def load_lora(pipe, lora_name: str, lora_dir: str, weight_name: str, adapter_name: Optional[str] = None) -> bool:
    """Загрузка локальной LoRA в пайплайн"""
    try:
        adapter_name = adapter_name or lora_name
        await asyncio.to_thread(
            pipe.load_lora_weights,
            lora_dir,
            weight_name=weight_name,
            adapter_name=adapter_name,
            local_files_only=True
        )
        logger.info(f"✅ LoRA {lora_name} успешно загружена")
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка загрузки LoRA {lora_name}: {str(e)}")
        return False

def get_online_lora(repo_id: str):
    """Получение информации о LoRA из галереи"""
    try:
        return next((lora for lora in jl_loras if lora.get('repo') == repo_id), None)
    except Exception as e:
        logger.error(f"❌ Ошибка получения информации о LoRA {repo_id}: {str(e)}")
    return None

def find_local_lora_preview(lora_path: Path) -> Optional[str]:
    """Поиск превью для локальной LoRA"""
    try:
        lora_name = lora_path.stem
        preview_extensions = ['.png', '.jpg', '.jpeg', '.webp']
        
        for ext in preview_extensions:
            preview_path = lora_path.parent / f"{lora_name}{ext}"
            if preview_path.exists():
                return str(preview_path)
        return None
    except Exception as e:
        logger.error(f"❌ Ошибка поиска превью для LoRA: {str(e)}")
        return None

# API endpoints
@app.get("/api/loras")
async def get_loras():
    """Получение списка доступных LoRA"""
    try:
        local_loras = JL_load_local_loras()
        for lora in local_loras:
            if 'path' in lora:
                lora_path = Path(lora['path'])
                lora['path'] = str(lora_path).replace('\\', '/')
                # Поиск превью для локальной LoRA
                preview = find_local_lora_preview(lora_path)
                if preview:
                    lora['preview'] = str(preview).replace('\\', '/')

        return {
            "status": "success",
            "data": {
                "gallery_loras": jl_loras,
                "local_loras": local_loras
            }
        }
    except Exception as e:
        logger.error(f"❌ Ошибка при получении списка LoRA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/open-loras-folder")
async def open_loras_folder():
    """Открытие папки с LoRA в проводнике"""
    try:
        loras_path = Path("models/flux/loras").absolute()
        if sys.platform == 'win32':
            os.startfile(str(loras_path))
        elif sys.platform == 'darwin':  # macOS
            subprocess.run(['open', str(loras_path)])
        else:  # linux
            subprocess.run(['xdg-open', str(loras_path)])
        return {"status": "success"}
    except Exception as e:
        logger.error(f"❌ Ошибка открытия папки: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Статический роут для доступа к файлам моделей
@app.get("/models/{path:path}")
async def get_model_file(path: str):
    try:
        file_path = Path("models") / path
        if file_path.exists():
            return FileResponse(file_path)
        else:
            raise HTTPException(status_code=404, detail=f"Файл не найден: {path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate")
async def generate_image(request: Request):
    """Генерация изображения"""
    try:
        # Получаем и обрабатываем данные запроса
        data = await request.json()
        
        # Скрываем большие данные в логах
        log_data = {k: v if k != 'image_input' else '[base64 image data]' for k, v in data.items()}
        print_generation_params(log_data)
        
        params = GenerationParams(**data)
        
        # Обработка параметров img2img
        if params.image_input:
            # Нормализуем значение силы влияния от 0 до 1
            params.image_strength = max(min(params.image_strength, 1.0), 0.0)

        # Проверяем длину промпта
        tokens = params.prompt.split()
        if len(tokens) > 77:
            print("\n⚠️ ВНИМАНИЕ: Промпт слишком длинный!")
            print(f"├─ Текущая длина: {len(tokens)} токенов")
            print(f"├─ Максимальная длина: 77 токенов")
            print("└─ Конец промпта будет обрезан\n")
            params.prompt = ' '.join(tokens[:77])

        # Генерируем seed если нужно
        if params.randomize_seed or params.seed is None:
            params.seed = torch.randint(0, 2**32-1, (1,)).item()

        # Функция стриминга для генерации
        async def generate_stream():
            try:
                # Загрузка и применение LoRA если они указаны
                if params.lora_indices:
                    print("\n" + "="*80)
                    print("🎨 ПОДГОТОВКА ГЕНЕРАЦИИ:")
                    print(f"├─ Базовый промпт: {params.prompt}")
                    print("│")
                    
                    print("├─ 🔄 ЗАГРУЗКА LoRA:")
                    # Сначала выгружаем текущие LoRA
                    jl_pipe.unload_lora_weights()
                    if params.image_input is not None:
                        jl_pipe_i2i.unload_lora_weights()
                    
                    # Модифицируем промпт, добавляя trigger words
                    modified_prompt = params.prompt
                    
                    # Загружаем каждую LoRA и добавляем trigger words
                    local_loras = JL_load_local_loras()
                    loaded_loras = []
                    
                    for i, lora_name in enumerate(params.lora_indices):
                        print(f"│  ├─ {lora_name}...", end=" ", flush=True)
                        
                        # Сначала проверяем локальные LoRA
                        lora = next((l for l in local_loras if l["title"] == lora_name), None)
                        
                        if not lora:
                            # Если не нашли в локальных, проверяем галерею
                            gallery_lora = next((l for l in jl_loras if l["title"] == lora_name), None)
                            
                            if gallery_lora:
                                print(f"(загрузка из {gallery_lora['repo']})")
                                downloaded_lora = await download_online_lora(gallery_lora['repo'], loras_dir)
                                
                                if downloaded_lora:
                                    lora = downloaded_lora
                                    lora['trigger_word'] = gallery_lora.get('trigger_word', '')
                                    lora['trigger_position'] = gallery_lora.get('trigger_position', 'append')
                                    
                                    if lora['trigger_word']:
                                        print(f"│  │  └─ Trigger word: {lora['trigger_word']}")
                        
                        if lora:
                            # Добавляем trigger word если есть
                            if "trigger_word" in lora and lora["trigger_word"]:
                                trigger_word = lora["trigger_word"]
                                if lora.get("trigger_position") == "prepend":
                                    modified_prompt = f"{trigger_word.strip()} {modified_prompt}"
                                else:
                                    modified_prompt = f"{modified_prompt} {trigger_word.strip()}"
                            
                            # Загружаем LoRA
                            lora_path = Path(lora["path"])
                            adapter_name = f"jl_lora_{i}"
                            adapter_name_i2i = f"jl_lora_i2i_{i}"
                            
                            if await load_lora(jl_pipe, lora_name, str(lora_path.parent), lora_path.name, adapter_name):
                                loaded_loras.append((lora_name, i))
                                if params.image_input is not None:
                                    await load_lora(jl_pipe_i2i, lora_name, str(lora_path.parent), lora_path.name, adapter_name_i2i)
                                print("✅")
                            else:
                                print("❌")

                    if loaded_loras:
                        print("│")
                        print("├─ ⚡ ПРИМЕНЕНИЕ LoRA:")
                        lora_names = [f"jl_lora_{i}" for _, i in loaded_loras]
                        lora_scales = [params.lora_scales[i] if i < len(params.lora_scales) else 1.0 
                                     for _, i in loaded_loras]
                        
                        # Вывод информации о весах
                        for idx, (lora_name, i) in enumerate(loaded_loras):
                            scale = lora_scales[idx]
                            print(f"│  ├─ {lora_name} (scale: {scale})")

                        jl_pipe.set_adapters(lora_names, adapter_weights=lora_scales)
                        if params.image_input is not None:
                            lora_i2i_names = [f"jl_lora_i2i_{i}" for _, i in loaded_loras]
                            jl_pipe_i2i.set_adapters(lora_i2i_names, adapter_weights=lora_scales)
                        
                    # Обновляем промпт с trigger words
                    print("│")
                    print("├─ 📝 МОДИФИКАЦИЯ ПРОМПТА:")
                    print(f"│  └─ {modified_prompt}")
                    print("="*80 + "\n")
                    params.prompt = modified_prompt

                # Проверяем длину промпта
                params.prompt = check_prompt_length(params.prompt)

                # Подготовка генератора
                device = "cuda" if torch.cuda.is_available() else "cpu"
                generator = torch.Generator(device=device).manual_seed(params.seed)

                print("\n" + "="*80)
                print("🎨 НАЧАЛО ГЕНЕРАЦИИ")
                print(f"⏱️  Начало: {datetime.now().strftime('%H:%M:%S')}")
                print("="*80 + "\n")

                # Режим генерации img2img
                if params.image_input:
                    # Декодируем base64 в изображение
                    input_image = decode_base64_image(params.image_input)
                    start_time = time.time()

                    # Сохраняем исходное изображение
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    input_filename = f"input_{timestamp}.png"
                    input_path = save_img2img_input(input_image, input_filename)

                    # Вычисляем реальное количество шагов
                    real_strength = calculate_img2img_impact(params.image_strength)
                    adjusted_steps = calculate_actual_steps(params.steps, params.image_strength)

                    # Генерация image-to-image
                    print(f"📝 Промпт: {params.prompt}")
                    print(f"\n📊 Параметры img2img:")
                    print(f"├─ Запрошенные шаги: {params.steps}")
                    print(f"├─ Скорректированные шаги: {adjusted_steps}")
                    print(f"├─ Визуальная сила влияния: {params.image_strength:.2f}")
                    print(f"├─ Реальная сила влияния: {real_strength:.2f}")
                    print(f"└─ Размер изображения: {input_image.size}\n")

                    result = await asyncio.to_thread(
                        jl_pipe_i2i,
                        prompt=params.prompt,
                        max_sequence_length=params.max_sequence_length,
                        image=input_image,
                        strength=real_strength,
                        num_inference_steps=adjusted_steps,  # Используем скорректированное значение
                        guidance_scale=params.cfg_scale,
                        width=params.width,
                        height=params.height,
                        generator=generator,
                        output_type="pil"
                    )
                    
                    final_image = result.images[0]
                    total_time = time.time() - start_time

                    # Сохраняем результат
                    filename = generate_filename(params.prompt, params.seed, params.save_format, params.save_name_format)
                    filepath = output_dir / f"{filename}.{params.save_format.lower()}"
                    
                    # Сохраняем финальное изображение с максимальным качеством
                    final_image = final_image.convert('RGB')
                    if params.save_format.upper() == 'PNG':
                        final_image.save(filepath, format='PNG', optimize=False, bits=16)
                    else:
                        final_image.save(
                            filepath, 
                            format=params.save_format.upper(), 
                            quality=100,  # Максимальное качество
                            optimize=False  # Без оптимизации размера
                        )   

                    # Сохраняем метаданные
                    metadata = {
                        'prompt': params.prompt,
                        'seed': params.seed,
                        'steps': params.steps,
                        'cfg_scale': params.cfg_scale,
                        'width': params.width,
                        'height': params.height,
                        'save_format': params.save_format,
                        'save_quality': params.save_quality,
                        'lora_indices': params.lora_indices,  # Добавляем информацию о LoRA
                        'lora_scales': params.lora_scales,
                        'timestamp': str(datetime.now()),
                        'generation_time': format_time(total_time)
                    }

                    if params.image_input:  # для img2img
                        metadata['img2img'] = {
                            'input_image': input_path,  # Путь к сохраненному входному изображению
                            'strength': params.image_strength
                        }
                    print(f"Сохраняю метаданные:", metadata) # Добавьте для отладки
                    
                    metadata_path = filepath.with_suffix('.json')
                    with open(metadata_path, 'w', encoding='utf-8') as f:
                        json.dump(metadata, f, ensure_ascii=False, indent=2)

                    print("\n" + "="*80)
                    print("✨ ГЕНЕРАЦИЯ ЗАВЕРШЕНА")
                    print(f"⌛ Общее время: {format_time(total_time)}")
                    print(f"💾 Результат: {filepath}")
                    print("="*80 + "\n")
                    
                    yield f"data: {json.dumps({'status': 'complete', 'result': f'{filename}.{params.save_format.lower()}'})}\n\n"

                # Обычная генерация
                else:
                    start_time = time.time()
                    step_times = []
                    last_update = start_time
                    is_finished = False
                    final_image = None

                    for i, img in enumerate(JL_flux_pipe_call_that_returns_an_iterable_of_images(
                        jl_pipe,
                        prompt=params.prompt,
                        max_sequence_length=params.max_sequence_length,
                        height=params.height,
                        width=params.width,
                        num_inference_steps=params.steps,
                        guidance_scale=params.cfg_scale,
                        generator=generator,
                        output_type="pil",
                        good_vae=jl_good_vae
                    )):
                        current_step = i + 1
                        current_time = time.time()
                        
                        # Вычисляем время на шаг
                        step_time = current_time - last_update
                        step_times.append(step_time)
                        last_update = current_time
                        
                        # Вычисляем среднее время на шаг и ETA
                        avg_step_time = sum(step_times) / len(step_times)
                        eta = avg_step_time * (params.steps - current_step)
                        elapsed_time = current_time - start_time

                        # Определяем стадию генерации
                        progress = current_step / params.steps
                        stage = get_stage(progress)

                        if i == params.steps - 1:
                            is_finished = True
                            final_image = img
                            total_time = time.time() - start_time
                        
                        # Очищаем строку и выводим прогресс
                        sys.stdout.write('\r')
                        sys.stdout.write(f"[{'=' * (current_step * 50 // params.steps)}{' ' * (50 - current_step * 50 // params.steps)}] ")
                        sys.stdout.write(f"{current_step}/{params.steps} ")
                        sys.stdout.write(f"({(current_step/params.steps)*100:.1f}%) ")
                        sys.stdout.write(f"[прошло: {format_time(elapsed_time)} / осталось: {format_time(eta)}] ")
                        sys.stdout.flush()

                        # Отправляем информацию о прогрессе
                        progress_data = {
                            'status': 'progress',
                            'progress': progress, 
                            'step': current_step,
                            'total_steps': params.steps,
                            'elapsed': format_time(elapsed_time),
                            'eta': format_time(eta),
                            'stage': stage
                        }
                        yield f"data: {json.dumps(progress_data)}\n\n"

                        if is_finished and final_image:
                            # Сохраняем финальное изображение
                            filename = generate_filename(params.prompt, params.seed, params.save_format, params.save_name_format)
                            filepath = output_dir / f"{filename}.{params.save_format.lower()}"
                            
                            # Сохраняем с максимальным качеством
                            final_image = final_image.convert('RGB')
                            if params.save_format.upper() == 'PNG':
                                final_image.save(filepath, format='PNG', optimize=False, bits=16)
                            else:
                                final_image.save(
                                    filepath, 
                                    format=params.save_format.upper(), 
                                    quality=100,  # Максимальное качество
                                    optimize=False  # Без оптимизации размера
                                )   

                            # Сохраняем метаданные
                            metadata = {
                                'prompt': params.prompt,
                                'seed': params.seed,
                                'steps': params.steps,
                                'cfg_scale': params.cfg_scale,
                                'width': params.width,
                                'height': params.height,
                                'save_format': params.save_format,
                                'save_quality': params.save_quality,
                                'lora_indices': params.lora_indices,  # Добавляем информацию о LoRA
                                'lora_scales': params.lora_scales,                                
                                'timestamp': str(datetime.now()),
                                'generation_time': format_time(total_time)
                            }
                            print(f"Сохраняю метаданные:", metadata) # Добавьте для отладки
                            
                            metadata_path = filepath.with_suffix('.json')
                            with open(metadata_path, 'w', encoding='utf-8') as f:
                                json.dump(metadata, f, ensure_ascii=False, indent=2)

                            print("\n" + "="*80)
                            print("✨ ГЕНЕРАЦИЯ ЗАВЕРШЕНА")
                            print(f"⌛ Общее время: {format_time(total_time)}")
                            print(f"💾 Результат: {filepath}")
                            print("="*80 + "\n")

                            # Отправляем результат
                            yield f"data: {json.dumps({'status': 'complete', 'result': f'{filename}.{params.save_format.lower()}'})}\n\n"

            except Exception as e:
                logger.error(f"❌ Ошибка при генерации: {str(e)}")
                yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream"
        )

    except Exception as e:
        logger.error(f"❌ Ошибка обработки запроса: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/list-output")
async def list_output_images():
    """Получение списка всех изображений из папки output"""
    try:
        output_dir = Path("output")
        images = []
        
        for file in output_dir.glob("*"):
            if file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
                # Получаем метаданные если есть
                metadata_file = file.with_suffix('.json')
                metadata = None
                if metadata_file.exists():
                    try:
                        with open(metadata_file, 'r', encoding='utf-8') as f:
                            metadata = json.load(f)
                    except:
                        pass

                images.append({
                    "filename": file.name,
                    "timestamp": datetime.fromtimestamp(file.stat().st_mtime).isoformat(),
                    "metadata": metadata
                })

        # Сортируем по времени создания (новые первые)
        images.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return {
            "status": "success",
            "images": images
        }
    except Exception as e:
        logger.error(f"❌ Ошибка получения списка изображений: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/open-output-folder/{filename}")
async def open_output_folder(filename: str):
    """Открытие папки output с выделением файла"""
    try:
        output_path = Path("output").absolute()
        file_path = output_path / filename
        
        if sys.platform == 'win32':
            subprocess.run(['explorer', '/select,', str(file_path)])
        elif sys.platform == 'darwin':  # macOS
            subprocess.run(['open', '-R', str(file_path)])
        else:  # linux
            subprocess.run(['xdg-open', str(output_path)])
            
        return {"status": "success"}
    except Exception as e:
        logger.error(f"❌ Ошибка открытия папки: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Монтируем папки для доступа к файлам
app.mount("/output", StaticFiles(directory="output"), name="output")
app.mount("/img2img", StaticFiles(directory="img2img"), name="img2img")
app.mount("/", StaticFiles(directory="html", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    import requests
    import time

    def signal_handler(sig, frame):
        print("\n👋 Завершение работы сервера...")
        sys.exit(0)

    def get_ngrok_url():
        for _ in range(3):
            try:
                response = requests.get('http://127.0.0.1:4040/api/tunnels')
                return response.json()['tunnels'][0]['public_url']
            except:
                time.sleep(1)
        return None

    signal.signal(signal.SIGINT, signal_handler)

    print("\n🚀 Запуск веб-интерфейса JL Studio...")
    print("📱 Откройте в браузере: http://127.0.0.1:7860")
    url = get_ngrok_url()
    if url:
        print(f"🌐 Публичный URL: {url}\n")
    
    config = uvicorn.Config(
        "api:app",
        host="127.0.0.1",
        port=7860,
        reload=False,
        log_level="error"
    )
    
    try:
        server = uvicorn.Server(config)
        server.run()
    except KeyboardInterrupt:
        print("\n👋 Завершение работы сервера...")
    except Exception as e:
        print(f"\n❌ Ошибка сервера: {str(e)}")
    finally:
        print("✨ Работа сервера завершена")