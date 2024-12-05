const initializeImageUpload = () => {
    initializeDropZone();
    initializeUploadControls();
    initializePasteHandler();
    initializeStrengthControl();
};

const initializeDropZone = () => {
    const uploadArea = document.querySelector('.image-upload-area');
    if (!uploadArea) return;

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (!uploadArea.classList.contains('has-image')) {
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith('image/')) {
                handleImageUpload(file);
            }
        }
    });
    
    uploadArea.addEventListener('click', () => {
        if (!uploadArea.classList.contains('has-image')) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = () => {
                if (input.files[0]) {
                    handleImageUpload(input.files[0]);
                }
            };
            input.click();
        }
    });
};

const initializeUploadControls = () => {
    const controls = document.querySelector('.image-controls');
    if (!controls) return;

    // Создаем группу кнопок
    const buttonsGroup = document.createElement('div');
    buttonsGroup.className = 'image-buttons-group';

    // Кнопки управления
    const uploadButton = document.createElement('button');
    uploadButton.className = 'image-control-button';
    uploadButton.title = 'Загрузить файл';
    uploadButton.textContent = '📁';

    const cameraButton = document.createElement('button');
    cameraButton.className = 'image-control-button';
    cameraButton.title = 'Сделать снимок';
    cameraButton.textContent = '📷';

    const pasteButton = document.createElement('button');
    pasteButton.className = 'image-control-button';
    pasteButton.title = 'Вставить из буфера';
    pasteButton.textContent = '📋';

    const removeButton = document.createElement('button');
    removeButton.className = 'image-control-button remove-button';
    removeButton.title = 'Удалить изображение';
    removeButton.textContent = '🗑️';
    removeButton.style.display = 'none';

    buttonsGroup.appendChild(uploadButton);
    buttonsGroup.appendChild(cameraButton);
    buttonsGroup.appendChild(pasteButton);
    buttonsGroup.appendChild(removeButton);
    controls.appendChild(buttonsGroup);

    // Обработчики событий
    uploadButton.onclick = () => document.querySelector('.image-upload-area')?.click();
    cameraButton.onclick = () => initializeCamera();
    pasteButton.onclick = () => handlePasteFromClipboard();
    removeButton.onclick = () => removeUploadedImage();
};

const removeUploadedImage = () => {
    const uploadArea = document.querySelector('.image-upload-area');
    const removeButton = document.querySelector('.remove-button');
    const strengthControl = document.querySelector('.strength-control');

    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="upload-placeholder">
                Перетащите изображение сюда или нажмите для загрузки
            </div>
        `;
        uploadArea.classList.remove('has-image');
    }

    if (removeButton) removeButton.style.display = 'none';
    if (strengthControl) strengthControl.style.display = 'none';
};

const initializePasteHandler = () => {
    document.addEventListener('paste', handlePaste);
};

const handlePaste = async (e) => {
    try {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.indexOf('image') === 0) {
                const file = item.getAsFile();
                await handleImageUpload(file);
                break;
            }
        }
    } catch (error) {
        console.error('Ошибка при вставке из буфера:', error);
    }
};

const handlePasteFromClipboard = async () => {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    const file = new File([blob], 'pasted-image.png', { type });
                    await handleImageUpload(file);
                    return;
                }
            }
        }
        alert('Изображение не найдено в буфере обмена');
    } catch (error) {
        console.error('Ошибка при работе с буфером обмена:', error);
        alert('Не удалось получить доступ к буферу обмена');
    }
};

const handleImageUpload = async (file) => {
    if (!validateImage(file)) return;

    const reader = new FileReader();
    const uploadArea = document.querySelector('.image-upload-area');
    const strengthControl = document.querySelector('.strength-control');
    const removeButton = document.querySelector('.remove-button');
    
    reader.onload = async (e) => {
        try {
            const img = document.createElement('img');
            img.src = e.target.result;
            
            img.onload = () => {
                if (uploadArea) {
                    uploadArea.innerHTML = '';
                    uploadArea.appendChild(img);
                    uploadArea.classList.add('has-image');
                }
                if (strengthControl) {
                    strengthControl.style.display = 'block';
                }
                if (removeButton) {
                    removeButton.style.display = 'block';
                }
                img.style.display = 'block';
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.margin = 'auto';
                img.style.objectFit = 'contain';
            };
        } catch (error) {
            console.error('Ошибка обработки изображения:', error);
            alert('Ошибка загрузки изображения');
        }
    };
    
    reader.onerror = () => {
        console.error('Ошибка чтения файла');
        alert('Ошибка чтения файла');
    };
    
    reader.readAsDataURL(file);
};

const initializeStrengthControl = () => {
    const strengthControl = document.querySelector('.strength-control');
    if (!strengthControl) return;

    const strengthSlider = strengthControl.querySelector('.strength-slider');
    const strengthValue = strengthControl.querySelector('.value');
    const resetButton = strengthControl.querySelector('.reset-button');

    // Устанавливаем начальное значение 0.8 (реальное 0.4)
    if (strengthSlider) {
        strengthSlider.value = 0.8;
        strengthSlider.max = 1.0;
        strengthSlider.addEventListener('input', () => {
            // Преобразование визуального значения в реальное (0-1 -> 0-0.5)
            const visualValue = parseFloat(strengthSlider.value);
            const realValue = visualValue * 0.5;
            
            if (strengthValue) {
                strengthValue.textContent = `${visualValue.toFixed(2)} ✎`;
                // Сохраняем реальное значение как data-атрибут
                strengthSlider.dataset.realValue = realValue.toString();
            }
        });
        strengthSlider.dispatchEvent(new Event('input'));
    }
}; 

const initializeCamera = async () => {
    const uploadArea = document.querySelector('.image-upload-area');
    if (!uploadArea) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.style.width = '100%';
        video.style.height = 'auto';
        
        uploadArea.innerHTML = '';
        uploadArea.appendChild(video);

        const captureButton = document.createElement('button');
        captureButton.textContent = 'Сделать снимок';
        captureButton.className = 'capture-button';
        uploadArea.appendChild(captureButton);

        captureButton.onclick = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            stream.getTracks().forEach(track => track.stop());
            
            canvas.toBlob(blob => {
                const file = new File([blob], 'camera-capture.png', { type: 'image/png' });
                handleImageUpload(file);
            }, 'image/png');
        };
    } catch (error) {
        console.error('Ошибка доступа к камере:', error);
        alert('Не удалось получить доступ к камере');
    }
};

const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        alert('Пожалуйста, загрузите изображение в формате JPEG, PNG, WEBP или GIF');
        return false;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        alert('Размер изображения не должен превышать 10MB');
        return false;
    }
    
    return true;
};

window.upload = {
    initializeImageUpload,
    handlePaste,
    handlePasteFromClipboard,
    handleImageUpload,
    validateImage,
    removeUploadedImage
};