class LoraManager {
    init() {
        this.container = document.querySelector('.active-loras-container');
        this.section = document.querySelector('.active-loras-section');
        this.template = this.container.querySelector('.active-lora-slot');
        this.emptyState = this.container.querySelector('.empty-state');
        this.browseButton = document.querySelector('.browse-button');
        this.activateButton = document.querySelector('.activate-button');
        
        if (this.template) {
            this.template.remove();
        }
        
        this.activeLoRAs = [];
        this.initializeEventHandlers();
        this.initializeGallery();
        this.updateState();
    }

    async unloadAllLoras() {
        if (this.container) {
            const slots = this.container.querySelectorAll('.active-lora-slot');
            slots.forEach(slot => slot.remove());
        }
        this.activeLoRAs = [];
        this.updateState();
    }

    initializeEventHandlers() {
        if (this.container) {
            this.container.addEventListener('click', (e) => {
                if (e.target.closest('.remove-button')) {
                    const slot = e.target.closest('.active-lora-slot');
                    const index = Array.from(this.container.children).indexOf(slot) - 1;
                    this.removeLora(index);
                }
            });
        }

        if (this.browseButton) {
            this.browseButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.safetensors,.ckpt,.pt';
                input.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        this.handleFileSelect(e.target.files[0]);
                    }
                });
                input.click();
            });
        }

        if (this.activateButton) {
            this.activateButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const loraSelect = document.querySelector('.lora-select');
                if (loraSelect && loraSelect.value) {
                    await this.activateSelectedLora(loraSelect.value);
                    if (this.section) {
                        this.section.dataset.collapsed = 'false';
                        const content = this.section.querySelector('.section-content');
                        const button = this.section.querySelector('.collapse-button');
                        if (window.collapse && content && button) {
                            window.collapse.expandSection(content, button);
                        }
                    }
                } else {
                    alert('Пожалуйста, выберите LoRA для активации');
                }
            });
        }
    }

    initializeGallery() {
        const gallery = document.querySelector('.style-grid');
        if (!gallery) return;

        gallery.addEventListener('click', async (e) => {
            const card = e.target.closest('.lora-card');
            if (!card) return;

            const index = card.dataset.loraIndex;
            if (index !== undefined) {
                try {
                    const response = await fetch('/api/loras');
                    const data = await response.json();
                    const lora = data.data.gallery_loras[parseInt(index)];
                    
                    if (lora) {
                        const loraData = {
                            name: lora.title,
                            path: lora.repo,
                            preview: lora.image,
                            isOnline: true
                        };
                        await this.addLora(loraData);

                        if (this.section) {
                            this.section.dataset.collapsed = 'false';
                            const content = this.section.querySelector('.section-content');
                            const button = this.section.querySelector('.collapse-button');
                            if (window.collapse && content && button) {
                                window.collapse.expandSection(content, button);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Ошибка загрузки LoRA из галереи:', error);
                    alert('Ошибка загрузки LoRA');
                }
            }
        });
    }

    handleFileSelect(file) {
        const validExtensions = ['.safetensors', '.ckpt', '.pt'];
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validExtensions.includes(extension)) {
            alert('Пожалуйста, выберите файл модели в формате .safetensors, .ckpt или .pt');
            return;
        }

        this.addLora({
            name: file.name,
            path: file.path || file.name,
            preview: null,
            isLocal: true
        });
    }

    async activateSelectedLora(loraName) {
        const response = await fetch('/api/loras');
        const data = await response.json();
        
        const localLora = data.data.local_loras.find(l => l.title === loraName);
        if (!localLora) return;

        await this.addLora({
            name: loraName,
            path: localLora.path,
            preview: localLora.preview,
            isLocal: true
        });
    }

    async addLora(loraData) {
        try {
            if (this.activeLoRAs.length >= 2) {
                this.removeLora(0);
            }

            const newSlot = this.template.cloneNode(true);
            newSlot.style.display = 'block';
            
            newSlot.querySelector('.lora-name').textContent = loraData.name;
            
            // Устанавливаем превью изображения
            const previewElement = newSlot.querySelector('.lora-preview');
            if (previewElement && loraData.preview) {
                previewElement.style.backgroundImage = `url(${loraData.preview})`;
            }
            
            this.container.appendChild(newSlot);
            this.activeLoRAs.push(loraData);
            
            this.updateState();
            
            const slider = newSlot.querySelector('.strength-slider');
            const valueDisplay = newSlot.querySelector('.value');
            if (window.sliders && slider && valueDisplay) {
                window.sliders.initializeSlider(slider, valueDisplay);
            }

            return this.activeLoRAs.length - 1;
        } catch (error) {
            console.error('Ошибка добавления LoRA:', error);
            alert('Ошибка добавления LoRA');
        }
    }

    removeLora(index) {
        if (index >= 0 && index < this.activeLoRAs.length) {
            const slots = this.container.querySelectorAll('.active-lora-slot');
            if (slots[index]) {
                slots[index].remove();
                this.activeLoRAs.splice(index, 1);
                this.updateState();
            }
        }
    }

    updateState() {
        if (!this.emptyState || !this.section) return;

        const isEmpty = this.activeLoRAs.length === 0;
        
        this.emptyState.style.display = isEmpty ? 'block' : 'none';
        
        if (isEmpty) {
            this.section.dataset.collapsed = 'true';
            const content = this.section.querySelector('.section-content');
            const button = this.section.querySelector('.collapse-button');
            
            if (window.collapse && content && button) {
                window.collapse.collapseSection(content, button);
            }
        }
    }

    getActiveLoras() {
        return this.activeLoRAs;
    }

    getLoraParams() {
        const params = {
            indices: [],
            scales: []
        };

        const activeLoras = this.getActiveLoras();
        if (activeLoras.length > 0) {
            params.indices = activeLoras.map(lora => lora.name);
            
            const strengthSliders = document.querySelectorAll('.active-lora-slot .strength-slider');
            params.scales = Array.from(strengthSliders).map(slider => 
                parseFloat(slider.value) || 1.0
            );

            while (params.scales.length < params.indices.length) {
                params.scales.push(1.0);
            }
        }

        return params;
    }
}

window.loraManager = new LoraManager();