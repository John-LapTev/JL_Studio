# Working with LoRA in JL Studio

[Main Page](../../README_EN.md) | [Installation](installation.md) | [User Guide](user-guide.md) | [FAQ](faq.md) | [Requirements](requirements.md) | [🇷🇺 Russian](../lora-guide.md)

## About LoRA Technology

LoRA (Low-Rank Adaptation) is an image stylization technology that allows applying various artistic styles without retraining the base model.

![lora-examples](../images/lora-examples.png)

## Built-in Gallery

JL Studio includes pre-installed LoRA models:
- Artistic styles
- Retro effects
- Animation styles
- 3D renders

## Using LoRA

### Basic Principles
1. Select LoRA from gallery
2. Adjust influence strength (0.1 - 2.0)
3. Use trigger words
4. Combine multiple LoRA

![lora-settings](../images/lora-settings.png)

### Combining Styles
- Start with low strength values
- Avoid conflicting styles
- Consider application order
- Use no more than 2-3 LoRA simultaneously

## Custom LoRA

### Installation
1. Download .safetensors file
2. Place in models/flux/loras
3. Create preview (optional)
4. Restart program

### Organization
```
models/flux/loras/
├── Styles/           # Artistic styles
├── Effects/          # Visual effects
└── Animation/        # Animation styles
```

## Finding LoRA

Recommended sources:
- Hugging Face
- Civitai
- GitHub
- Discord communities

## Troubleshooting

### LoRA Not Loading
- Check file format
- Verify file path
- Check file version

### Weak Effect
- Increase influence strength
- Use trigger words
- Check compatibility

## Recommendations

- Experiment with settings
- Save successful combinations
- Create style collections
- Study usage examples