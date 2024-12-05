class JLStudioAPI {
    constructor() {
        this.baseUrl = window.location.origin;
    }

    async getLoRAs() {
        try {
            const response = await fetch(`${this.baseUrl}/api/loras`);
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            this.updateLoRAInterface(data.data);
            return data.data;
        } catch (error) {
            console.error('Ошибка загрузки LoRA:', error);
            throw error;
        }
    }

    async refreshLoRAs() {
        try {
            const response = await fetch(`${this.baseUrl}/api/loras`, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            this.updateLoRAInterface(data.data);
            return data.data;
        } catch (error) {
            console.error('Ошибка обновления LoRA:', error);
            throw error;
        }
    }

    updateLoRAInterface(loraData) {
        try {
            // Обновление галереи
            const gallery = document.querySelector('.style-grid');
            if (gallery && loraData.gallery_loras) {
                gallery.innerHTML = '';
                loraData.gallery_loras.forEach((lora, index) => {
                    const card = document.createElement('div');
                    card.className = 'lora-card';
                    card.innerHTML = `
                        <img src="${lora.image}" alt="${lora.title}">
                        <div class="lora-title">${lora.title}</div>
                    `;
                    card.dataset.loraIndex = index;
                    gallery.appendChild(card);
                });
            }

            // Обновление локальных LoRA
            const loraSelect = document.querySelector('.lora-select');
            if (loraSelect && loraData.local_loras) {
                const currentValue = loraSelect.value;
                loraSelect.innerHTML = '<option value="">Выберите LoRA</option>';
                
                const sortedLoras = [...loraData.local_loras].sort((a, b) => 
                    a.title.localeCompare(b.title)
                );
                
                sortedLoras.forEach(lora => {
                    const option = document.createElement('option');
                    option.value = lora.title;
                    option.textContent = lora.title;
                    loraSelect.appendChild(option);
                });

                if (currentValue && [...loraSelect.options].some(opt => opt.value === currentValue)) {
                    loraSelect.value = currentValue;
                }
            }
        } catch (error) {
            console.error('Ошибка обновления интерфейса LoRA:', error);
        }
    }

    async openLoraFolder() {
        try {
            await fetch(`${this.baseUrl}/api/open-loras-folder`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Ошибка открытия папки LoRA:', error);
        }
    }

    async generateImage(params, onProgress) {
        try {
            console.log('Отправка запроса на генерацию:', params);
            
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка генерации');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const {value, done} = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.status === 'progress' && onProgress) {
                                onProgress(data);
                            } else if (data.status === 'complete') {
                                const previewArea = document.querySelector('#preview-area');
                                if (previewArea) {
                                    this.updatePreview(data.result, previewArea);
                                }
                                return data.result;
                            } else if (data.status === 'error') {
                                throw new Error(data.message);
                            }
                        } catch (e) {
                            if (line.trim()) {
                                console.warn('Ошибка обработки данных:', e, 'строка:', line);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка генерации:', error);
            throw error;
        }
    }

    async handlePastedImage(clipboardData) {
        try {
            const items = clipboardData.items;
            for (const item of items) {
                if (item.type.indexOf('image') === 0) {
                    const file = item.getAsFile();
                    const base64Data = await this.preprocessImage(file);
                    return base64Data;
                }
            }
        } catch (error) {
            console.error('Ошибка обработки вставленного изображения:', error);
            throw error;
        }
        return null;
    }

    async preprocessImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

window.jlAPI = new JLStudioAPI();

document.addEventListener('DOMContentLoaded', () => {
    window.jlAPI.getLoRAs().catch(error => {
        console.error('Ошибка загрузки первоначальных LoRA:', error);
    });

    // Кнопка обновления
    const refreshButton = document.querySelector('.custom-loras-section .reset-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            window.jlAPI.refreshLoRAs().catch(error => {
                console.error('Ошибка обновления LoRA:', error);
            });
        });
    }

    // Ссылка на папку
    const folderLink = document.querySelector('.folder-path');
    if (folderLink) {
        folderLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.jlAPI.openLoraFolder();
        });
    }
});