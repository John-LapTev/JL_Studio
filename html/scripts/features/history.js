class HistoryManager {
    constructor() {
        if (!window.sessionId) {
            window.sessionId = new Date().toISOString();
        }
        this.container = document.querySelector('.history-grid');
        this.sessionItems = [];
        this.sessionItems = this.sessionItems.map(item => ({
            filename: item.filename,
            timestamp: item.timestamp,
            sessionId: item.sessionId
        }));
        this.allItems = [];
        this.selectedIndex = -1;
        this.currentTab = 'session';
        this.modal = null;
        this.currentIndex = -1;
    }

    initialize() {
        if (!this.container) return;
        this.createTabs();
        this.initializeEventListeners();
        this.initializeModal();
        this.loadSessionItems();
        this.loadAllItems();
    }

    createTabs() {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'history-tabs';
        tabsContainer.innerHTML = `
            <button class="tab-button active" data-tab="session">Эта сессия</button>
            <button class="tab-button" data-tab="all">Все генерации</button>
        `;

        const historySection = document.querySelector('.history-section');
        const sectionContent = historySection.querySelector('.section-content');
        historySection.insertBefore(tabsContainer, sectionContent);

        const buttons = tabsContainer.querySelectorAll('.tab-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                this.currentTab = button.dataset.tab;
                this.updateGrid();
            });
        });
    }

    async loadAllItems() {
        try {
            const response = await fetch('/api/list-output');
            const data = await response.json();
            this.allItems = data.images;
            if (this.currentTab === 'all') {
                this.updateGrid();
            }
        } catch (error) {
            console.error('Ошибка загрузки изображений:', error);
        }
    }

    loadSessionItems() {
        try {
            const stored = localStorage.getItem('sessionHistory');
            if (stored) {
                this.sessionItems = JSON.parse(stored);
                this.sessionItems = this.sessionItems.filter(item => item.sessionId === window.sessionId);
            }
            if (this.currentTab === 'session') {
                this.updateGrid();
            }
        } catch (error) {
            console.error('Ошибка загрузки сессии:', error);
            this.sessionItems = [];
        }
    }

    saveSessionItems() {
        try {
            localStorage.setItem('sessionHistory', JSON.stringify(this.sessionItems));
        } catch (error) {
            console.warn('Превышен лимит хранилища, очищаем старые элементы');
            while (this.sessionItems.length > 5) {
                this.sessionItems.pop();
            }
            localStorage.setItem('sessionHistory', JSON.stringify(this.sessionItems));
        }
    }

    addToHistory(imageUrl, metadata) {
        const filename = imageUrl.split('/').pop();
        
        const newItem = {
            filename: filename,
            timestamp: new Date().toISOString(),
            metadata: metadata,
            sessionId: window.sessionId
        };

        this.sessionItems.unshift(newItem);
        this.saveSessionItems();
        
        if (this.currentTab === 'session') {
            this.updateGrid();
        }
    }

    updateGrid() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const items = this.currentTab === 'session' ? this.sessionItems : this.allItems;

        if (items.length === 0) {
            this.container.innerHTML = `
                <div class="history-placeholder">
                    ${this.currentTab === 'session' ? 
                      'История текущей сессии пуста' : 
                      'Нет сохраненных изображений'}
                </div>
            `;
            return;
        }

        items.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            if (index === this.selectedIndex) {
                historyItem.classList.add('selected');
            }
            
            const img = document.createElement('img');
            img.src = `output/${item.filename}`;
            img.className = 'history-image';
            img.loading = 'lazy';
            img.onclick = () => this.showModal(index);

            historyItem.appendChild(img);
            this.container.appendChild(historyItem);
        });
    }

    initializeModal() {
        if (this.modal) return;

        this.modal = document.createElement('div');
        this.modal.className = 'history-modal';
        this.modal.innerHTML = `
            <div class="history-modal-content">
                <button class="close-modal">×</button>
                <div class="modal-preview"></div>
                <div class="modal-info">
                    <h3>Параметры генерации</h3>
                    <div class="info-content"></div>
                    <div class="modal-actions">
                        <button class="apply-settings">Применить настройки</button>
                        <button class="copy-prompt">Копировать промпт</button>
                        <button class="download-files">Скачать файлы</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        this.modal.querySelector('.close-modal').onclick = () => this.closeModal();
        this.modal.querySelector('.apply-settings').onclick = () => this.applyCurrentSettings();
        this.modal.querySelector('.copy-prompt').onclick = () => this.copyCurrentPrompt();
        this.modal.querySelector('.download-files').onclick = () => this.downloadCurrentFiles();

        this.modal.onclick = (e) => {
            if (e.target === this.modal) this.closeModal();
        };
    }

    initializeEventListeners() {
        if (!this.container) return;
        
        this.container.addEventListener('click', (e) => {
            const item = e.target.closest('.history-item');
            if (item) {
                const index = Array.from(this.container.children).indexOf(item);
                if (index !== -1) {
                    this.selectedIndex = index;
                    this.updateGrid();
                    this.showModal(index);
                }
            }
        });
    }

    showModal(index) {
        const items = this.currentTab === 'session' ? this.sessionItems : this.allItems;
        const item = items[index];
        if (!item) return;

        this.currentIndex = index;
        const modalPreview = this.modal.querySelector('.modal-preview');
        const infoContent = this.modal.querySelector('.info-content');

        modalPreview.innerHTML = `<img src="output/${item.filename}" alt="Preview">`;
        infoContent.innerHTML = this.formatMetadata(item.metadata);

        this.modal.classList.add('active');

        this.modal.querySelector('.open-folder-button')?.addEventListener('click', async () => {
            try {
                await fetch(`/api/open-output-folder/${item.filename}`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Ошибка открытия папки:', error);
            }
        });
    }

    formatMetadata(metadata) {
        if (!metadata) return 'Метаданные недоступны';

        const currentItem = this.currentTab === 'session' ? 
            this.sessionItems[this.currentIndex] : 
            this.allItems[this.currentIndex];

        if (!currentItem) return 'Метаданные недоступны';

        let html = `
            <div class="info-group">
                <label>Файл:</label>
                <div class="file-info">
                    <span>${currentItem.filename}</span>
                    <button class="open-folder-button">📂 Открыть папку</button>
                </div>
            </div>
            <div class="info-group">
                <label>Промпт:</label>
                <div class="prompt-text">${metadata.prompt || 'Недоступно'}</div>
            </div>
            <div class="info-row">
                <div class="info-group">
                    <label>Размеры:</label>
                    <div>${metadata.width}x${metadata.height}</div>
                </div>
                <div class="info-group">
                    <label>Шаги:</label>
                    <div>${metadata.steps}</div>
                </div>
                <div class="info-group">
                    <label>CFG Scale:</label>
                    <div>${metadata.cfg_scale}</div>
                </div>
                <div class="info-group">
                    <label>Seed:</label>
                    <div>${metadata.seed || 'Случайный'}</div>
                </div>
            </div>`;

        if (metadata.timestamp) {
            const date = new Date(metadata.timestamp);
            html += `
                <div class="info-row">
                    <div class="info-group">
                        <label>Дата создания:</label>
                        <div>${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}</div>
                    </div>
                    <div class="info-group">
                        <label>Время генерации:</label>
                        <div>${metadata.generation_time || 'Неизвестно'}</div>
                    </div>
                </div>`;
        }

        if (metadata.lora_indices && metadata.lora_indices.length > 0) {
            html += '<div class="info-group"><label>Использованные LoRA:</label>';
            metadata.lora_indices.forEach((lora, index) => {
                const scale = metadata.lora_scales[index] || 1.0;
                html += `<div>• ${lora} (scale: ${scale})</div>`;
            });
            html += '</div>';
        }

        if (metadata.img2img) {
            html += `
                <div class="info-group">
                    <label>Image-to-Image:</label>
                    <div class="img2img-info">
                        <img src="${metadata.img2img.input_image}" class="input-preview">
                        <div>Сила влияния: ${metadata.img2img.strength}</div>
                    </div>
                </div>`;
        }

        return html;
    }

    closeModal() {
        this.modal.classList.remove('active');
    }

    async applyCurrentSettings() {
        const items = this.currentTab === 'session' ? this.sessionItems : this.allItems;
        const item = items[this.currentIndex];
        if (!item?.metadata) return;

        const metadata = item.metadata;

        const mainInput = document.querySelector('.main-input');
        const widthSlider = document.querySelector('.width-slider');
        const heightSlider = document.querySelector('.height-slider');
        const stepsSlider = document.querySelector('.steps-slider');
        const cfgSlider = document.querySelector('.cfg-slider');
        const seedSlider = document.querySelector('.seed-slider');
        const randomSeedCheckbox = document.querySelector('.seed-settings input[type="checkbox"]');

        if (mainInput) mainInput.value = metadata.prompt || '';
        if (widthSlider) {
            widthSlider.value = metadata.width || 1024;
            widthSlider.dispatchEvent(new Event('input'));
        }
        if (heightSlider) {
            heightSlider.value = metadata.height || 1024;
            heightSlider.dispatchEvent(new Event('input'));
        }
        if (stepsSlider) {
            stepsSlider.value = metadata.steps || 28;
            stepsSlider.dispatchEvent(new Event('input'));
        }
        if (cfgSlider) {
            cfgSlider.value = metadata.cfg_scale || 3.5;
            cfgSlider.dispatchEvent(new Event('input'));
        }
        if (seedSlider) {
            seedSlider.value = metadata.seed || 0;
            seedSlider.dispatchEvent(new Event('input'));
        }
        if (randomSeedCheckbox) {
            randomSeedCheckbox.checked = false;
            randomSeedCheckbox.dispatchEvent(new Event('change'));
        }

        if (metadata.lora_indices && metadata.lora_scales && window.loraManager) {
            await window.loraManager.unloadAllLoras();
            const response = await fetch('/api/loras');
            const data = await response.json();
            
            for (let i = 0; i < metadata.lora_indices.length; i++) {
                const loraName = metadata.lora_indices[i];
                const localLora = data.data.local_loras.find(l => l.title === loraName);
                
                if (localLora) {
                    await window.loraManager.addLora({
                        name: loraName,
                        path: localLora.path,
                        preview: localLora.preview,
                        scale: metadata.lora_scales[i],
                        isLocal: true
                    });
                }
            }
        }

        if (metadata.img2img) {
            const imgSection = document.querySelector('.img2img-section');
            if (imgSection) {
                const uploadArea = imgSection.querySelector('.image-upload-area');
                const strengthControl = document.querySelector('.strength-control');
                const strengthSlider = imgSection.querySelector('.strength-slider');
                const removeButton = imgSection.querySelector('.remove-button');

                if (uploadArea) {
                    const img = document.createElement('img');
                    img.src = metadata.img2img.input_image;
                    uploadArea.innerHTML = '';
                    uploadArea.appendChild(img);
                    uploadArea.classList.add('has-image');
                }

                if (strengthControl) strengthControl.style.display = 'block';
                if (strengthSlider) {
                    strengthSlider.value = metadata.img2img.strength;
                    strengthSlider.dispatchEvent(new Event('input'));
                }

                if (removeButton) removeButton.style.display = 'block';
            }
        }
        
        this.closeModal();
    }

    async copyCurrentPrompt() {
        const items = this.currentTab === 'session' ? this.sessionItems : this.allItems;
        const item = items[this.currentIndex];
        if (!item?.metadata?.prompt) return;

        try {
            await navigator.clipboard.writeText(item.metadata.prompt);
            alert('Промпт скопирован в буфер обмена');
        } catch (error) {
            console.error('Ошибка копирования:', error);
            alert('Не удалось скопировать промпт');
        }
    }

    async downloadCurrentFiles() {
       const items = this.currentTab === 'session' ? this.sessionItems : this.allItems;
       const item = items[this.currentIndex];
       if (!item) return;

       try {
           const imageResponse = await fetch(`output/${item.filename}`);
           const imageBlob = await imageResponse.blob();
           const imageLink = document.createElement('a');
           imageLink.href = URL.createObjectURL(imageBlob);
           imageLink.download = item.filename;
           imageLink.click();

           const jsonPath = `output/${item.filename.replace(/\.[^.]+$/, '.json')}`;
           const jsonResponse = await fetch(jsonPath);
           if (jsonResponse.ok) {
               const jsonBlob = await jsonResponse.blob();
               const jsonLink = document.createElement('a');
               jsonLink.href = URL.createObjectURL(jsonBlob);
               jsonLink.download = jsonPath.split('/').pop();
               jsonLink.click();
           }
       } catch (error) {
           console.error('Ошибка скачивания:', error);
           alert('Ошибка при скачивании файлов');
       }
   }

   handleKeyNavigation(event) {
      if (this.modal?.classList.contains('active')) {
          if (event.key === 'ArrowLeft' && this.currentIndex > 0) {
              this.showModal(this.currentIndex - 1);
          } else if (event.key === 'ArrowRight' && this.currentIndex < (this.currentTab === 'session' ? this.sessionItems.length : this.allItems.length) - 1) {
              this.showModal(this.currentIndex + 1);
          }
      }
  }
}

window.historyManager = new HistoryManager();