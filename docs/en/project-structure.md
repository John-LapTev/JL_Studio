# JL Studio Project Structure

[Русская версия](../project-structure.md)

```
JL_Studio/
├── .github/                      # [Core] GitHub configuration
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md        # Bug report template (RU/EN)
│   │   └── feature_request.md   # Feature request template (RU/EN)
│   ├── CODE_OF_CONDUCT.md       # Code of conduct (RU)
│   ├── CODE_OF_CONDUCT_EN.md    # Code of conduct (EN)
│   └── PULL_REQUEST_TEMPLATE.md  # Pull request template (RU/EN)
│
├── backup/                      # [Generated] Backup copies
│   ├── YYYYMMDD_HHMMSS/        # Backup folders with timestamp
│   │   ├── loras/             # LoRA models backup
│   │   ├── output/            # Images backup
│   │   └── token.txt          # Token backup
│   └── .gitkeep
│
├── cache/                      # [Generated] Program cache
│   ├── torch_extensions/      # PyTorch cache
│   └── huggingface/          # Hugging Face cache
│
├── docs/                      # [Core] Documentation
│   ├── images/               # Documentation images
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
│   ├── installation.md       # Installation guide (RU)
│   ├── user-guide.md         # User manual (RU)
│   ├── lora-guide.md         # LoRA guide (RU)
│   ├── faq.md               # FAQ (RU)
│   ├── requirements.md       # System requirements (RU)
│   └── project-structure.md  # Project structure (RU)
│
├── html/                     # [Core] Web interface
│   ├── scripts/
│   │   ├── components/
│   │   │   ├── collapse.js         # Panel collapse (2.07 KB)
│   │   │   ├── customSelect.js     # Custom selects (8.13 KB)
│   │   │   ├── loraManager.js      # LoRA management (8.82 KB)
│   │   │   ├── panels.js           # Interface panels (2.85 KB)
│   │   │   ├── sliders.js          # Settings sliders (6.79 KB)
│   │   │   └── upload.js           # File upload (10.33 KB)
│   │   ├── core/
│   │   │   ├── api-client.js       # API client (7.47 KB)
│   │   │   ├── init.js             # Initialization (12.50 KB)
│   │   │   └── utils.js            # Utilities (4.05 KB)
│   │   └── features/
│   │       ├── history.js          # Generation history (17.21 KB)
│   │       └── imageViewer.js      # Image viewer (6.74 KB)
│   ├── styles/
│   │   ├── base/
│   │   │   ├── breakpoints.css     # Breakpoints (1.66 KB)
│   │   │   ├── reset.css           # Style reset (1.39 KB)
│   │   │   ├── typography.css      # Typography (2.79 KB)
│   │   │   └── variables.css       # Variables (3.46 KB)
│   │   ├── components/
│   │   │   ├── buttons.css         # Button styles (4.57 KB)
│   │   │   ├── inputs.css          # Input field styles (6.28 KB)
│   │   │   ├── modals.css          # Modal window styles (3.29 KB)
│   │   │   ├── sliders.css         # Slider styles (2.47 KB)
│   │   │   └── upload.css          # Upload styles (3.01 KB)
│   │   ├── layout/
│   │   │   ├── grid.css            # Grid (4.68 KB)
│   │   │   ├── modal.css           # Modal grid (4.17 KB)
│   │   │   ├── panels.css          # Panel styles (4.19 KB)
│   │   │   └── sections.css        # Section styles (10.90 KB)
│   │   └── media/
│   │       ├── desktop.css         # Desktop styles (2.36 KB)
│   │       ├── mobile.css          # Mobile styles (3.14 KB)
│   │       └── tablet.css          # Tablet styles (2.55 KB)
│   ├── favicon.ico                 # Website icon (318 B)
│   └── index.html                  # Main page (24.83 KB)
│
├── img2img/                  # [Created on Install] Source images folder
│   ├── input_YYYYMMDD_HHMMSS.png  # [Generated] Uploaded images
│   └── .gitkeep
│
├── logs/                     # [Created on Install] Program logs
│   ├── error.log            # [Generated] Error log
│   ├── info.log             # [Generated] Information log
│   ├── debug.log            # [Generated] Debug log
│   └── install.log          # [Generated] Installation log
│
├── models/                   # [Created on Install] AI models
│   └── flux/
│       ├── loras/           # [User Data] Custom LoRA models
│       │   ├── Style/       # [Optional] Style category
│       │   ├── Effects/     # [Optional] Effects category
│       │   └── .gitkeep
│       ├── model_index.json # Models index (536 B)
│       ├── scheduler/
│       │   └── scheduler_config.json  # Scheduler configuration (273 B)
│       ├── text_encoder/            # Text encoder
│       │   ├── config.json          # Configuration (613 B)
│       │   └── model.safetensors    # Model (246.14 MB)
│       ├── text_encoder_2/          # Second text encoder
│       │   ├── config.json          # Configuration (782 B)
│       │   ├── model-00001-of-00002.safetensors  # Part 1 (4.99 GB)
│       │   ├── model-00002-of-00002.safetensors  # Part 2 (4.53 GB)
│       │   └── model.safetensors.index.json      # Index (19.89 KB)
│       ├── tokenizer/              # Tokenizer
│       │   ├── merges.txt          # Merge rules (524.62 KB)
│       │   ├── special_tokens_map.json  # Token map (588 B)
│       │   ├── tokenizer_config.json    # Configuration (705 B)
│       │   └── vocab.json          # Vocabulary (1.06 MB)
│       ├── tokenizer_2/            # Second tokenizer
│       │   ├── special_tokens_map.json  # Token map (2.54 KB)
│       │   ├── spiece.model         # Model (791.66 KB)
│       │   ├── tokenizer.json       # Main file (2.42 MB)
│       │   └── tokenizer_config.json  # Configuration (20.82 KB)
│       ├── transformer/            # Transformer
│       │   ├── config.json         # Configuration (378 B)
│       │   ├── diffusion_pytorch_model-00001-of-00003.safetensors  # Part 1 (9.98 GB)
│       │   ├── diffusion_pytorch_model-00002-of-00003.safetensors  # Part 2 (9.95 GB)
│       │   ├── diffusion_pytorch_model-00003-of-00003.safetensors  # Part 3 (3.87 GB)
│       │   ├── diffusion_pytorch_model.safetensors.index.json  # Index (121.26 KB)
│       │   └── flux1-dev.sft       # Main model (23.80 GB)
│       └── vae/                   # Autoencoder
│           ├── config.json         # Configuration (820 B)
│           └── diffusion_pytorch_model.safetensors  # Model (167.67 MB)
│
├── output/                   # [Created on Install] Generation results
│   ├── YYYYMMDD_HHMMSS_seed_prompt.png  # [Generated] Images
│   ├── YYYYMMDD_HHMMSS_seed_prompt.json # [Generated] Metadata
│   └── .gitkeep
│
├── venv/                     # [Created on Install] Python virtual environment
│   ├── Lib/
│   │   └── site-packages/   # Installed Python packages
│   │       ├── torch/       # PyTorch
│   │       ├── transformers/ # Hugging Face Transformers
│   │       ├── diffusers/   # Diffusers
│   │       └── ...          # Other libraries
│   ├── Scripts/
│   │   ├── activate        # Environment activation
│   │   ├── activate.bat    # Windows activation
│   │   ├── python.exe      # Python interpreter
│   │   └── pip.exe         # Package manager
│   └── pyvenv.cfg          # Environment configuration
│
├── __pycache__/             # [Generated] Python cache
│   ├── api.cpython-310.pyc
│   ├── app.cpython-310.pyc
│   └── live_preview_helpers.cpython-310.pyc
│
├── api.py                    # [Core] FastAPI server (38.47 KB)
├── app.py                    # [Core] Application core (16.71 KB)
├── CHANGELOG.md              # [Core] Version history (1.39 KB)
├── cleanup.bat              # [Core] Cache cleanup (529 B)
├── CONTRIBUTING.md          # [Core] Contribution guide (1.06 KB)
├── create_folders.bat       # [Core] Directory structure creator (290 B)
├── .gitattributes          # [Core] Git LFS settings (1.52 KB)
├── .gitignore              # [Core] Git ignore rules (502 B)
├── INSTALL.bat             # [Core] Installation script (5.02 KB)
├── LICENSE                 # [Core] MIT License (1.07 KB)
├── live_preview_helpers.py # [Core] Preview helper (8.43 KB)
├── loras.json              # [Core] LoRA configuration (9.12 KB)
├── prompts.csv             # [Core] Prompt examples (15.38 KB)
├── README.md               # [Core] Project description RU (3.14 KB)
├── README_EN.md            # [Core] Project description EN (2.03 KB)
├── requirements.txt        # [Core] Python dependencies (1.11 KB)
├── SECURITY.md             # [Core] Security policy RU
├── SECURITY_EN.md          # [Core] Security policy EN
├── setup.py               # [Core] Setup script (10.88 KB)
├── START-WEB_JL_STUDIO.bat # [Core] Server launcher (235 B)
├── SUPPORT.md             # [Core] Support info RU
├── SUPPORT_EN.md          # [Core] Support info EN
├── token.txt              # [User Data] Hugging Face token (37 B)
└── UPDATE.bat             # [Core] Update script (598 B)
```

# Structure Explanations

## Component Types

### [Core]
Main files present right after download:
- Python scripts (api.py, app.py etc.)
- Documentation and descriptions
- Configuration files
- Web interface

### [Created on Install]
Created during first installation (INSTALL.bat):
- img2img/ - input images folder
- logs/ - operation logs
- models/ - neural network and LoRA models
- output/ - generation results
- venv/ - Python virtual environment

### [Generated]
Created automatically during operation:
- Logs (*.log) in logs/
- Images (*.png) and metadata (*.json) in output/
- Temporary files in img2img/
- Backups in backup/
- Python cache (__pycache__/)
- PyTorch and Hugging Face cache in cache/

### [User Data]
User data:
- token.txt - created manually by user
- models/flux/loras/ - custom LoRA models
- output/ - generated images and metadata

### [Optional]
Optional components:
- Categories in loras/ (Style/, Effects/, etc.)
- Custom configurations
- Additional scripts and utilities

## Space Requirements

### Base Components
- Core files: ~100 MB
- Virtual environment (venv/): 2-3 GB
- Cache (cache/): 1-2 GB
- Logs (logs/): several MB

### FLUX Models
- text_encoder: 246 MB
- text_encoder_2: 9.52 GB
- transformer: 23.8 GB
- vae: 168 MB
Total models size: ~35 GB

### Working Space
- output/: depends on generation count (~10 MB per image)
- img2img/: temporary files (~5 MB per file)
- backup/: depends on backup settings
- loras/: depends on installed LoRA count (~100 MB per model)

### Recommended Requirements
- Minimum 50 GB free space:
  - 35 GB for models
  - 5 GB for environment and cache
  - 10 GB for operation and generations