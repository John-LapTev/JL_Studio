const initializeCustomSelects = () => {
    const customSelects = document.querySelectorAll('.custom-select');
    customSelects.forEach(initializeCustomSelect);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            closeAllDropdowns();
        }
    });
};

const initializeCustomSelect = (selectContainer) => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        selectContainer.classList.add('mobile-view');
    }
    
    const trigger = selectContainer.querySelector('.select-trigger');
    const triggerOption = trigger.querySelector('.aspect-ratio-option');
    const dropdown = selectContainer.querySelector('.select-dropdown');
    const options = selectContainer.querySelectorAll('.select-option');
    const hiddenSelect = selectContainer.querySelector('.hidden-select');
    
    const updateDropdownPosition = () => {
        if (isMobile) return;
        
        const rect = trigger.getBoundingClientRect();
        const dropdownRect = dropdown.getBoundingClientRect();
        
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const optimalHeight = window.innerWidth >= 1200 ? 155 : 180;
        
        if (spaceBelow < optimalHeight && spaceAbove > spaceBelow) {
            dropdown.style.bottom = '100%';
            dropdown.style.top = 'auto';
            dropdown.style.marginBottom = '4px';
            dropdown.style.marginTop = '0';
            dropdown.style.maxHeight = `${Math.min(optimalHeight, spaceAbove - 8)}px`;
        } else {
            dropdown.style.top = '100%';
            dropdown.style.bottom = 'auto';
            dropdown.style.marginTop = '4px';
            dropdown.style.marginBottom = '0';
            dropdown.style.maxHeight = `${Math.min(optimalHeight, spaceBelow - 8)}px`;
        }
        
        dropdown.style.width = `${rect.width}px`;
        const leftOverflow = rect.left + dropdownRect.width - window.innerWidth;
        dropdown.style.left = leftOverflow > 0 ? `${-leftOverflow}px` : '0';
    };

    dropdown.addEventListener('wheel', (e) => {
        const isScrollable = dropdown.scrollHeight > dropdown.clientHeight;
        if (!isScrollable) return;

        e.preventDefault();
        dropdown.scrollTop += e.deltaY;
    }, { passive: false });
    
    const updateVisualState = (value) => {
        const [width, height] = value.split(':').map(Number);
        const ratio = width / height;
        
        let matchingOption = null;
        let minDiff = Infinity;
        
        options.forEach(option => {
            const [w, h] = option.dataset.value.split(':').map(Number);
            const optionRatio = w / h;
            const diff = Math.abs(optionRatio - ratio);
            
            if (diff < minDiff) {
                minDiff = diff;
                matchingOption = option;
            }
        });
        
        if (matchingOption) {
            options.forEach(opt => opt.classList.remove('selected'));
            matchingOption.classList.add('selected');
            
            const newBox = matchingOption.querySelector('.aspect-ratio-box').cloneNode(true);
            const newText = matchingOption.querySelector('.option-text').cloneNode(true);
            
            triggerOption.innerHTML = '';
            triggerOption.appendChild(newBox);
            triggerOption.appendChild(newText);
            
            const aspectRatioClass = matchingOption.className
                .split(' ')
                .find(cls => cls.startsWith('aspect-ratio-'));
            
            triggerOption.className = `aspect-ratio-option ${aspectRatioClass}`;
            
            if (dropdown.scrollHeight > dropdown.clientHeight) {
                matchingOption.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }
    };

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(selectContainer, updateDropdownPosition);
    });
    
    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.dataset.value;
            
            hiddenSelect.value = value;
            hiddenSelect.dispatchEvent(new Event('change'));
            
            updateVisualState(value);
            closeDropdown(selectContainer);
        });

        option.addEventListener('mouseenter', () => {
            options.forEach(opt => opt.classList.remove('hover'));
            option.classList.add('hover');
        });

        option.addEventListener('mouseleave', () => {
            option.classList.remove('hover');
        });
    });

    const widthSlider = document.querySelector('.width-slider');
    const heightSlider = document.querySelector('.height-slider');
    
    if (widthSlider && heightSlider) {
        const handleSliderChange = () => {
            const width = parseInt(widthSlider.value);
            const height = parseInt(heightSlider.value);
            const ratio = `${width}:${height}`;
            updateVisualState(ratio);
        };

        widthSlider.addEventListener('input', handleSliderChange);
        heightSlider.addEventListener('input', handleSliderChange);
    }

    selectContainer.addEventListener('keydown', (e) => {
        const currentOption = dropdown.querySelector('.selected');
        const options = Array.from(dropdown.querySelectorAll('.select-option'));
        const currentIndex = options.indexOf(currentOption);

        if (selectContainer.classList.contains('open')) {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < options.length - 1) {
                        const nextOption = options[currentIndex + 1];
                        nextOption.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        nextOption.click();
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        const prevOption = options[currentIndex - 1];
                        prevOption.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        prevOption.click();
                    }
                    break;
                case 'Enter':
                case 'Escape':
                    e.preventDefault();
                    closeDropdown(selectContainer);
                    break;
            }
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown(selectContainer, updateDropdownPosition);
        }
    });

    const firstOption = Array.from(options).find(opt => 
        opt.classList.contains('selected')) || options[0];
    firstOption.click();

    window.addEventListener('resize', () => {
        if (selectContainer.classList.contains('open')) {
            updateDropdownPosition();
        }
        selectContainer.classList.toggle('mobile-view', window.innerWidth <= 768);
    });

    selectContainer._updatePosition = updateDropdownPosition;
};

document.addEventListener('scroll', () => {
    const openSelect = document.querySelector('.custom-select.open');
    if (openSelect) {
        openSelect._updatePosition?.();
    }
}, { passive: true });

const toggleDropdown = (selectContainer, updatePosition) => {
    const isOpen = selectContainer.classList.contains('open');
    closeAllDropdowns();
    
    if (!isOpen) {
        selectContainer.classList.add('open');
        selectContainer.focus();
        updatePosition?.();
    }
};

const closeDropdown = (selectContainer) => {
    selectContainer.classList.remove('open');
};

const closeAllDropdowns = () => {
    document.querySelectorAll('.custom-select').forEach(closeDropdown);
};

window.customSelect = {
    initializeCustomSelects,
    toggleDropdown,
    closeDropdown,
    closeAllDropdowns
};