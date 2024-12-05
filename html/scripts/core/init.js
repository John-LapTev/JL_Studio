let isGenerating = false;

document.addEventListener('DOMContentLoaded', () => {
    initializeComponents();
    initializeFeatures();
    setupGlobalListeners();
    initializeGeneration();
    clearHistory();
});

function clearHistory() {
    try {
        localStorage.removeItem('generationHistory');
        const historyDiv = document.querySelector('.history-grid');
        if (historyDiv) {
            historyDiv.innerHTML = `
                <div class="history-placeholder">
                    Здесь будут отображаться сгенерированные изображения
                </div>
            `;
        }

        const preview = document.querySelector('#preview-area');
        if (preview) {
            preview.innerHTML = `
                <div class="preview-placeholder">
                    Здесь появится сгенерированное изображение
                </div>
            `;
        }
    } catch (e) {
        console.warn('Ошибка очистки localStorage:', e);
    }
}

function initializeComponents() {
    if (window.customSelect) window.customSelect.initializeCustomSelects();
    if (window.panels) window.panels.initializePanels();
    if (window.collapse) window.collapse.initializeCollapsibleSections();
    if (window.sliders) window.sliders.initializeSliders();
    if (window.upload) window.upload.initializeImageUpload();
    if (window.loraManager) window.loraManager.init();
}

function initializeFeatures() {
    if (window.imageViewer) window.imageViewer.initialize();
    if (window.historyManager) window.historyManager.initialize();
}

function updateProgressUI(data) {
    const progressContainer = document.querySelector('.progress-wrapper');
    if (!progressContainer) return;

    if (data.status === 'progress') {
        const percent = Math.round(data.progress * 100);
        progressContainer.style.display = 'block';

        progressContainer.innerHTML = `
            <div class="progress-container">
                <div class="progress-status">
                    <div class="progress-info">
                        <span class="progress-percent">${percent}%</span>
                        <span class="progress-step">Шаг ${data.step}/${data.total_steps}</span>
                        <span class="progress-time">${data.elapsed} / ${data.eta}</span>
                    </div>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${percent}%">
                        <div class="progress-glow"></div>
                    </div>
                </div>
                <div class="progress-stage">${data.stage}</div>
            </div>
        `;
    } else if (data.status === 'complete') {
        progressContainer.style.display = 'none';
    }
}

async function getGenerationParams() {
    const params = {
        prompt: document.querySelector('.main-input')?.value || '',
        width: parseInt(document.querySelector('.width-slider')?.value || 1024),
        height: parseInt(document.querySelector('.height-slider')?.value || 1024),
        steps: parseInt(document.querySelector('.steps-slider')?.value || 28),
        cfg_scale: parseFloat(document.querySelector('.cfg-slider')?.value || 3.5),
        seed: parseInt(document.querySelector('.seed-slider')?.value || 0),
        randomize_seed: document.querySelector('.seed-settings input[type="checkbox"]')?.checked || true,
        save_format: 'PNG',
        save_quality: 100,
        save_name_format: 'prompt',
        max_sequence_length: 512
    };

    const formatSelect = document.querySelector('.format-select');
    const qualitySlider = document.querySelector('.quality-slider');
    const nameFormatSelect = document.querySelector('.name-format-select');

    if (formatSelect) params.save_format = formatSelect.value;
    if (qualitySlider) params.save_quality = parseInt(qualitySlider.value);
    if (nameFormatSelect) params.save_name_format = nameFormatSelect.value;

    if (window.loraManager) {
        const loraParams = window.loraManager.getLoraParams();
        params.lora_indices = loraParams.indices;
        params.lora_scales = loraParams.scales;
    }

    const imgSection = document.querySelector('.img2img-section');
    if (imgSection) {
        const uploadedImg = imgSection.querySelector('.image-upload-area img');
        if (uploadedImg && uploadedImg.src) {
            params.image_input = uploadedImg.src;
            const strengthSlider = imgSection.querySelector('.strength-slider');
            if (strengthSlider) {
                params.image_strength = parseFloat(strengthSlider.value);
            }
        }
    }

    return params;
}

function updatePreview(result, preview) {
    if (!result) {
        console.error('Результат генерации пустой');
        return;
    }

    try {
        preview.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'preview-wrapper';
        
        const img = document.createElement('img');
        img.className = 'preview-image';
        img.alt = 'Generated';

        img.onload = async () => {
            if (window.historyManager) {
                const params = await getGenerationParams();
                window.historyManager.addToHistory(`output/${result}`, params);
            }
        };

        const downloadButton = document.createElement('button');
        downloadButton.className = 'download-button';
        downloadButton.innerHTML = '⬇️';
        downloadButton.title = 'Скачать изображение с метаданными';
        downloadButton.addEventListener('click', async () => {
            const imagePath = `output/${result}`;
            const jsonPath = imagePath.replace(/\.[^.]+$/, '.json');

            try {
                // Скачивание изображения
                const imageResponse = await fetch(imagePath);
                const imageBlob = await imageResponse.blob();
                const imageLink = document.createElement('a');
                imageLink.href = URL.createObjectURL(imageBlob);
                imageLink.download = result;
                imageLink.click();

                // Скачивание JSON с метаданными
                const jsonResponse = await fetch(jsonPath);
                if (jsonResponse.ok) {
                    const jsonBlob = await jsonResponse.blob();
                    const jsonLink = document.createElement('a');
                    jsonLink.href = URL.createObjectURL(jsonBlob);
                    jsonLink.download = result.replace(/\.[^.]+$/, '.json');
                    jsonLink.click();
                }
            } catch (error) {
                console.error('Ошибка скачивания:', error);
            }
        });

        img.onerror = () => {
            console.error('Ошибка загрузки изображения:', result);
            preview.innerHTML = '<div class="error-message">Ошибка загрузки изображения</div>';
        };

        img.src = `output/${result}`;
        wrapper.appendChild(img);
        wrapper.appendChild(downloadButton);
        preview.appendChild(wrapper);

    } catch (error) {
        console.error('Ошибка обновления превью:', error);
        preview.innerHTML = `<div class="error-message">Ошибка: ${error.message}</div>`;
    }
}

function initializeGeneration() {
    const generateButton = document.querySelector('.generate-button');
    const progressBar = document.querySelector('.progress-wrapper');
    const preview = document.querySelector('#preview-area');
    const mainInput = document.querySelector('.main-input');

    if (!generateButton || !progressBar || !preview || !mainInput) {
        console.error('Не найдены необходимые элементы интерфейса');
        return;
    }

    generateButton.addEventListener('click', async () => {
        if (!mainInput.value.trim()) {
            alert('Пожалуйста, введите описание изображения');
            return;
        }

        if (isGenerating) return;

		try {
			isGenerating = true;
			generateButton.disabled = true;
			progressBar.style.display = 'block';
			
			const params = await getGenerationParams();
			
			const response = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(params)
			});

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const {value, done} = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = JSON.parse(line.slice(6));
						updateProgressUI(data);

						if (data.status === 'complete') {
							updatePreview(data.result, preview);
							isGenerating = false;
							generateButton.disabled = false;
							progressBar.style.display = 'none';
							break;
						}
					}
				}
			}
		} catch (error) {
			console.error('Ошибка генерации:', error);
			preview.innerHTML = `<div class="error-message">Ошибка генерации: ${error.message}</div>`;
			isGenerating = false;
			generateButton.disabled = false;
			progressBar.style.display = 'none';
		}
    });

    mainInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateButton.click();
        }
    });

    // Отключаем навигацию по истории при редактировании промпта
    mainInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.stopPropagation();
        }
    });
}

function setupGlobalListeners() {
    if (window.upload) {
        document.addEventListener('paste', (e) => window.upload.handlePaste(e));
    }
    
    if (window.historyManager) {
        document.addEventListener('keydown', (e) => {
            const mainInput = document.querySelector('.main-input');
            if (!mainInput || !mainInput.matches(':focus')) {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    window.historyManager.handleKeyNavigation(e);
                }
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === '[' && window.panels) {
            window.panels.toggleLeftPanel();
        }
        if (e.altKey && e.key === ']' && window.panels) {
            window.panels.toggleRightPanel();
        }
        if (e.key === 'Escape' && window.customSelect) {
            window.customSelect.closeAllDropdowns();
        }
    });

    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileOverlay = document.querySelector('.mobile-overlay');
    const leftPanel = document.querySelector('.left-panel');

    if (mobileMenuToggle && mobileOverlay && leftPanel) {
        mobileMenuToggle.addEventListener('click', () => {
            leftPanel.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = leftPanel.classList.contains('active') ? 'hidden' : '';
        });

        mobileOverlay.addEventListener('click', () => {
            leftPanel.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (window.utils) {
        window.addEventListener('resize', window.utils.debounce(() => {
            if (window.panels) window.panels.updatePanelStates();
            if (window.imageViewer) window.imageViewer.updateModalPosition();
            if (window.customSelect) window.customSelect.closeAllDropdowns();
        }, 250));
    }

    if (window.customSelect) {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select')) {
                window.customSelect.closeAllDropdowns();
            }
        });
    }
}

window.init = {
    initializeComponents,
    initializeFeatures,
    setupGlobalListeners,
    updateProgressUI,
    getGenerationParams
};