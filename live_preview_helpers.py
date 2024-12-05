"""
JL Studio - Вспомогательные функции для предпросмотра генерации
Версия: 1.0
Автор: John LapTev
Copyright (c) 2024 John LapTev. Все права защищены.
"""

import torch
import numpy as np
from diffusers import FluxPipeline, AutoencoderTiny, FlowMatchEulerDiscreteScheduler
from typing import Any, Dict, List, Optional, Union

def JL_calculate_shift(
    image_seq_len,
    base_seq_len: int = 256,
    max_seq_len: int = 4096,
    base_shift: float = 0.5,
    max_shift: float = 1.16,
):
    """
    Рассчет параметра сдвига для генерации
    
    Args:
        image_seq_len: Длина последовательности изображения
        base_seq_len: Базовая длина последовательности
        max_seq_len: Максимальная длина последовательности
        base_shift: Базовый сдвиг
        max_shift: Максимальный сдвиг
    """
    # Линейная интерполяция для расчета mu
    m = (max_shift - base_shift) / (max_seq_len - base_seq_len)
    b = base_shift - m * base_seq_len
    mu = image_seq_len * m + b
    return mu

def JL_retrieve_timesteps(
    scheduler,
    num_inference_steps: Optional[int] = None,
    device: Optional[Union[str, torch.device]] = None,
    timesteps: Optional[List[int]] = None,
    sigmas: Optional[List[float]] = None,
    **kwargs,
):
    """
    Получение временных шагов для генерации
    
    Args:
        scheduler: Планировщик шагов
        num_inference_steps: Количество шагов
        device: Устройство для вычислений
        timesteps: Список временных шагов
        sigmas: Список значений сигма
    """
    # Проверка входных параметров
    if timesteps is not None and sigmas is not None:
        raise ValueError("Можно указать только один параметр: timesteps или sigmas")
        
    if timesteps is not None:
        scheduler.set_timesteps(timesteps=timesteps, device=device, **kwargs)
        timesteps = scheduler.timesteps
        num_inference_steps = len(timesteps)
    elif sigmas is not None:
        scheduler.set_timesteps(sigmas=sigmas, device=device, **kwargs)
        timesteps = scheduler.timesteps
        num_inference_steps = len(timesteps)
    else:
        scheduler.set_timesteps(num_inference_steps, device=device, **kwargs)
        timesteps = scheduler.timesteps
    return timesteps, num_inference_steps

@torch.inference_mode()
def JL_flux_pipe_call_that_returns_an_iterable_of_images(
    self,
    prompt: Union[str, List[str]] = None,
    prompt_2: Optional[Union[str, List[str]]] = None,
    height: Optional[int] = None,
    width: Optional[int] = None,
    num_inference_steps: int = 28,
    timesteps: List[int] = None,
    guidance_scale: float = 3.5,
    num_images_per_prompt: Optional[int] = 1,
    generator: Optional[Union[torch.Generator, List[torch.Generator]]] = None,
    latents: Optional[torch.FloatTensor] = None,
    prompt_embeds: Optional[torch.FloatTensor] = None,
    pooled_prompt_embeds: Optional[torch.FloatTensor] = None,
    output_type: Optional[str] = "pil",
    return_dict: bool = True,
    joint_attention_kwargs: Optional[Dict[str, Any]] = None,
    max_sequence_length: int = 512,
    good_vae: Optional[Any] = None,
):
    """
    Итеративная генерация изображений с предпросмотром
    
    Args:
        prompt: Текстовое описание
        height: Высота изображения
        width: Ширина изображения
        num_inference_steps: Количество шагов
        guidance_scale: Сила следования промпту
        и другие параметры пайплайна
    """
    # Установка размеров по умолчанию
    height = height or self.default_sample_size * self.vae_scale_factor
    width = width or self.default_sample_size * self.vae_scale_factor

    # 1. Проверка входных данных
    self.check_inputs(
        prompt,
        prompt_2,
        height,
        width,
        prompt_embeds=prompt_embeds,
        pooled_prompt_embeds=pooled_prompt_embeds,
        max_sequence_length=max_sequence_length,
    )

    # Установка параметров
    self._guidance_scale = guidance_scale
    self._joint_attention_kwargs = joint_attention_kwargs
    self._interrupt = False

    # 2. Подготовка параметров
    batch_size = 1 if isinstance(prompt, str) else len(prompt)
    device = self._execution_device

    # 3. Кодирование промпта
    lora_scale = joint_attention_kwargs.get("scale", None) if joint_attention_kwargs is not None else None
    prompt_embeds, pooled_prompt_embeds, text_ids = self.encode_prompt(
        prompt=prompt,
        prompt_2=prompt_2,
        prompt_embeds=prompt_embeds,
        pooled_prompt_embeds=pooled_prompt_embeds,
        device=device,
        num_images_per_prompt=num_images_per_prompt,
        max_sequence_length=max_sequence_length,
        lora_scale=lora_scale,
    )

    # 4. Подготовка латентного пространства
    num_channels_latents = self.transformer.config.in_channels // 4
    latents, latent_image_ids = self.prepare_latents(
        batch_size * num_images_per_prompt,
        num_channels_latents,
        height,
        width,
        prompt_embeds.dtype,
        device,
        generator,
        latents,
    )

    # 5. Подготовка временных шагов
    sigmas = np.linspace(1.0, 1 / num_inference_steps, num_inference_steps)
    image_seq_len = latents.shape[1]
    mu = JL_calculate_shift(
        image_seq_len,
        self.scheduler.config.base_image_seq_len,
        self.scheduler.config.max_image_seq_len,
        self.scheduler.config.base_shift,
        self.scheduler.config.max_shift,
    )
    timesteps, num_inference_steps = JL_retrieve_timesteps(
        self.scheduler,
        num_inference_steps,
        device,
        timesteps,
        sigmas,
        mu=mu,
    )
    self._num_timesteps = len(timesteps)

    # Подготовка параметров guidance
    guidance = torch.full([1], guidance_scale, device=device, dtype=torch.float32).expand(latents.shape[0]) if self.transformer.config.guidance_embeds else None

    # 6. Цикл генерации
    for i, t in enumerate(timesteps):
        if self.interrupt:
            continue

        timestep = t.expand(latents.shape[0]).to(latents.dtype)

        # Предсказание шума
        noise_pred = self.transformer(
            hidden_states=latents,
            timestep=timestep / 1000,
            guidance=guidance,
            pooled_projections=pooled_prompt_embeds,
            encoder_hidden_states=prompt_embeds,
            txt_ids=text_ids,
            img_ids=latent_image_ids,
            joint_attention_kwargs=self.joint_attention_kwargs,
            return_dict=False,
        )[0]

        # Промежуточный результат для предпросмотра только не для последнего шага
        if i < len(timesteps) - 1:
            latents_for_image = self._unpack_latents(latents, height, width, self.vae_scale_factor)
            latents_for_image = (latents_for_image / self.vae.config.scaling_factor) + self.vae.config.shift_factor
            image = self.vae.decode(latents_for_image, return_dict=False)[0]
            yield self.image_processor.postprocess(image, output_type=output_type)[0]

        # Следующий шаг
        latents = self.scheduler.step(noise_pred, t, latents, return_dict=False)[0]
        torch.cuda.empty_cache()

    # Финальный результат с good_vae
    latents = self._unpack_latents(latents, height, width, self.vae_scale_factor)
    latents = (latents / good_vae.config.scaling_factor) + good_vae.config.shift_factor
    image = good_vae.decode(latents, return_dict=False)[0]
    self.maybe_free_model_hooks()
    torch.cuda.empty_cache()
    yield self.image_processor.postprocess(image, output_type=output_type)[0]