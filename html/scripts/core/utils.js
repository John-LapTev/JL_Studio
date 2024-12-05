/**
 * Utility functions
 */

// Delay execution
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Format number to string with specified precision
const formatNumber = (number, precision = 2) => {
    return Number(number).toFixed(precision);
};

// Generate random number between min and max
const randomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

// Generate random seed
const generateRandomSeed = () => {
    return Math.floor(Math.random() * 2147483647);
};

// Update slider background gradient
const updateSliderBackground = (slider) => {
    const percent = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--value-percent', `${percent}%`);
};

// Handle value editing
const initializeValueEditing = (element, onSave) => {
    if (element.dataset.editingInitialized) return;
    element.dataset.editingInitialized = 'true';

    const createInput = (value) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.className = 'value-input';
        return input;
    };

    const saveValue = (input, originalValue) => {
        const newValue = input.value;
        if (!isNaN(newValue) && onSave) {
            onSave(Number(newValue));
        } else {
            element.textContent = originalValue;
        }
        element.classList.remove('editing');
    };

    element.addEventListener('click', function(e) {
        if (element.classList.contains('editing')) return;

        const currentValue = this.textContent.replace(' ✎', '');
        const input = createInput(currentValue);

        this.textContent = '';
        this.classList.add('editing');
        this.appendChild(input);
        input.focus();
        input.select();

        input.addEventListener('blur', () => saveValue(input, currentValue));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveValue(input, currentValue);
                input.blur();
            }
        });

        e.stopPropagation();
    });
};

// File size formatter
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if element is in viewport
const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

// Convert image to base64
const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Handle errors
const handleError = (error, message = 'Произошла ошибка') => {
    console.error(error);
    alert(`${message}: ${error.message}`);
};

// Update progress bar
const updateProgress = (progressBar, percent) => {
    if (!progressBar) return;
    progressBar.innerHTML = `
        <div class="jl_progress-container">
            <div class="jl_progress-bar" style="width: ${percent}%"></div>
        </div>
    `;
};

// Export utilities
window.utils = {
    debounce,
    formatNumber,
    randomNumber,
    generateRandomSeed,
    updateSliderBackground,
    initializeValueEditing,
    formatFileSize,
    isInViewport,
    convertImageToBase64,
    handleError,
    updateProgress
};