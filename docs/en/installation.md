# JL Studio Installation

[Main Page](../../README_EN.md) | [Requirements](requirements.md) | [User Guide](user-guide.md) | [LoRA Guide](lora-guide.md) | [FAQ](faq.md) | [🇷🇺 Russian](../installation.md)

## System Requirements

- Windows 10/11 (64-bit)
- Python 3.10.6 (this exact version)
- NVIDIA GPU with 6+ GB VRAM (8+ GB recommended)
- 16+ GB RAM
- 50+ GB free disk space

![system-overview](../images/system-overview.png)

## Installation Process

1. **Preparation**
   - Install [Python 3.10.6](https://www.python.org/ftp/python/3.10.6/python-3.10.6-amd64.exe)
   - Install [Git](https://git-scm.com/download/win)
   - Install [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)

2. **JL Studio Installation**
   - Download latest version from [Releases](https://github.com/John-LapTev/JL_Studio/releases)
   - Get token from [huggingface.co](https://huggingface.co/settings/tokens)
   - Run `INSTALL.bat`

![installation](../images/installation.png)

## Starting the Program

1. Run `START-WEB_JL_STUDIO.bat`
2. Open http://127.0.0.1:7860 in browser

![interface](../images/interface.png)

## Troubleshooting

### CUDA not found
- Install [NVIDIA drivers](https://www.nvidia.com/download/index.aspx)
- If needed, install [CUDA Toolkit 11.8](https://developer.nvidia.com/cuda-11-8-0-download-archive)

### Python errors
- Make sure version 3.10.6 is installed
- Check PATH variable

## Additional Information

- [User Guide](user-guide.md)
- [Working with LoRA](lora-guide.md)
- [FAQ](faq.md)