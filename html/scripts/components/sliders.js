const initializeSliders = () => {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const valueDisplay = slider.closest('.slider-control')?.querySelector('.value');
        const resetButton = slider.closest('.slider-control')?.querySelector('.reset-button');
        const defaultValue = slider.value;
        initializeSlider(slider, valueDisplay, resetButton, defaultValue);
    });

    initializeAspectRatio();
    initializeSeedControl();
    initializeQualitySlider();
    initializeStrengthSlider();
};

const initializeQualitySlider = () => {
    const formatSelect = document.querySelector('.format-select');
    const qualityControl = document.querySelector('.quality-control');
    const qualitySlider = qualityControl?.querySelector('.quality-slider');
    const qualityDisplay = qualityControl?.querySelector('.value');
    const resetButton = qualityControl?.querySelector('.reset-button');

    if (!formatSelect || !qualityControl || !qualitySlider) return;

    // Инициализируем слайдер качества
    if (qualitySlider && qualityDisplay) {
        initializeSlider(qualitySlider, qualityDisplay, resetButton, 100);
        qualitySlider.value = 100;
        utils.updateSliderBackground(qualitySlider);
        qualityDisplay.textContent = '100 ✎';
    }

    // Всегда показываем слайдер
    qualityControl.style.display = 'block';
};

const initializeStrengthSlider = () => {
    const strengthSlider = document.querySelector('.img2img-section .strength-slider');
    const strengthDisplay = document.querySelector('.img2img-section .value');
    const resetButton = document.querySelector('.img2img-section .reset-button');

    if (strengthSlider && strengthDisplay) {
        initializeSlider(strengthSlider, strengthDisplay, resetButton, 0.2);
        strengthSlider.max = 1.0;
        strengthSlider.value = 0.2;
        utils.updateSliderBackground(strengthSlider);
        strengthDisplay.textContent = '0.2 ✎';
    }
};

const initializeSlider = (slider, valueDisplay, resetButton, defaultValue) => {
    const updateSlider = () => {
        utils.updateSliderBackground(slider);
        
        if (valueDisplay && !valueDisplay.classList.contains('editing')) {
            let displayValue = slider.value;
            
            if (slider.classList.contains('strength-slider') || 
                slider.classList.contains('cfg-slider')) {
                displayValue = utils.formatNumber(displayValue, 2);
            } else if (slider.classList.contains('quality-slider') ||
                     slider.classList.contains('steps-slider')) {
                displayValue = Math.round(displayValue);
            }
            
            valueDisplay.textContent = displayValue + ' ✎';
        }
    };

    slider.addEventListener('input', updateSlider);
    slider.addEventListener('change', updateSlider);

    if (valueDisplay) {
        utils.initializeValueEditing(valueDisplay, (newValue) => {
            const minVal = parseFloat(slider.min);
            const maxVal = parseFloat(slider.max);
            const validValue = Math.min(Math.max(newValue, minVal), maxVal);
            slider.value = validValue;
            updateSlider();
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            slider.value = defaultValue;
            updateSlider();
        });
    }
    
    updateSlider();
};

const initializeAspectRatio = () => {
    const customSelect = document.querySelector('.custom-select.aspect-ratio-select');
    const hiddenSelect = customSelect?.querySelector('.hidden-select');
    const widthSlider = document.querySelector('.width-slider');
    const heightSlider = document.querySelector('.height-slider');
    const resetButton = document.querySelector('.aspect-ratio-section .reset-button');
    
    if (!hiddenSelect || !widthSlider || !heightSlider) return;

    const updateDimensions = () => {
        const [w, h] = hiddenSelect.value.split(':').map(Number);
        const baseSize = 1024;
        
        let newWidth, newHeight;
        if (w > h) {
            newWidth = baseSize;
            newHeight = Math.round(baseSize * (h / w) / 64) * 64;
        } else {
            newHeight = baseSize;
            newWidth = Math.round(baseSize * (w / h) / 64) * 64;
        }
        
        widthSlider.value = newWidth;
        heightSlider.value = newHeight;
        widthSlider.dispatchEvent(new Event('input'));
        heightSlider.dispatchEvent(new Event('input'));
    };
    
    hiddenSelect.addEventListener('change', updateDimensions);
    resetButton?.addEventListener('click', updateDimensions);
    updateDimensions();

    const handleSliderChange = () => {
        const width = parseInt(widthSlider.value);
        const height = parseInt(heightSlider.value);
        const ratio = utils.formatNumber(width / height, 2);
        
        const options = Array.from(customSelect.querySelectorAll('.select-option'));
        let closestOption = null;
        let minDiff = Infinity;
        
        options.forEach(option => {
            const [w, h] = option.dataset.value.split(':').map(Number);
            const optionRatio = w / h;
            const diff = Math.abs(optionRatio - ratio);
            
            if (diff < minDiff) {
                minDiff = diff;
                closestOption = option;
            }
        });

        if (closestOption) {
            const trigger = customSelect.querySelector('.select-trigger .aspect-ratio-option');
            trigger.innerHTML = closestOption.innerHTML;
            hiddenSelect.value = closestOption.dataset.value;
        }
    };

    widthSlider.addEventListener('change', handleSliderChange);
    heightSlider.addEventListener('change', handleSliderChange);
};

const initializeSeedControl = () => {
    const checkbox = document.querySelector('.seed-settings input[type="checkbox"]');
    const seedControl = document.querySelector('.seed-slider')?.closest('.slider-control');
    
    if (!checkbox || !seedControl) return;

    const updateVisibility = () => {
        if (checkbox.checked) {
            seedControl.classList.remove('visible');
            seedControl.style.height = '0';
        } else {
            seedControl.classList.add('visible');
            const height = seedControl.scrollHeight;
            seedControl.style.height = height + 'px';
        }
    };
    
    checkbox.addEventListener('change', updateVisibility);
    updateVisibility();
};

window.sliders = {
    initializeSliders,
    initializeSlider,
    initializeAspectRatio,
    initializeSeedControl,
    initializeQualitySlider,
    initializeStrengthSlider
};