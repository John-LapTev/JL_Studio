# Frequently Asked Questions (FAQ)

[Main Page](../../README_EN.md) | [Installation](installation.md) | [User Guide](user-guide.md) | [LoRA Guide](lora-guide.md) | [Requirements](requirements.md) | [🇷🇺 Russian](../faq.md)

## Installation and Startup

### What are the GPU requirements?
Minimum 6GB VRAM, 8GB or higher recommended. Only NVIDIA GPUs with CUDA are supported.

### Can I use AMD/Intel GPU?
No, the program only works with NVIDIA GPUs due to CUDA requirements.

### Is internet connection required?
- For initial installation
- For downloading LoRA from gallery
- For program updates
Internet is not required for image generation.

## Image Generation

### Optimal Settings
- Size: 1024x1024
- CFG Scale: 3.5-7.0
- Steps: 28-35
- LoRA: no more than 2-3 simultaneously

### How to improve quality?
- Detailed prompts
- Optimal CFG parameters
- Suitable LoRA models
- Sufficient number of steps

## Working with LoRA

### Where to find new LoRA?
- Hugging Face
- Civitai
- GitHub
- Discord communities

### How to add custom LoRA?
Place .safetensors file in models/flux/loras folder.

## Problems and Solutions

### CUDA Out of Memory
- Reduce image size
- Close other programs
- Use fewer LoRA
- Clear VRAM

### Program won't start
1. Check Python version (3.10.6)
2. Verify CUDA availability
3. Check token.txt

### Update error
1. Close program
2. Run UPDATE.bat again
3. Check internet connection

## Support Contacts

- Email: john.laptev@gmail.com
- Telegram: @john_laptev
- GitHub: John-LapTev