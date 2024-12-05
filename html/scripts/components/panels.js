const initializePanels = () => {
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');
    
    if (!leftPanel || !rightPanel) return;

    createPanelToggles(leftPanel, rightPanel);
    updatePanelStates();
};

const createPanelToggles = (leftPanel, rightPanel) => {
    // Создаем кнопку для левой панели
    const leftButton = document.createElement('button');
    leftButton.className = 'panel-toggle';
    leftButton.title = 'Свернуть/развернуть панель настроек';
    leftButton.textContent = '◀';
    leftPanel.appendChild(leftButton);

    // Создаем кнопку для правой панели
    const rightButton = document.createElement('button');
    rightButton.className = 'panel-toggle';
    rightButton.title = 'Свернуть/развернуть историю';
    rightButton.textContent = '▶';
    rightPanel.appendChild(rightButton);

    // Добавляем обработчики кликов
    leftButton.addEventListener('click', () => toggleLeftPanel());
    rightButton.addEventListener('click', () => toggleRightPanel());
};

const toggleLeftPanel = () => {
    const leftPanel = document.querySelector('.left-panel');
    const button = leftPanel.querySelector('.panel-toggle');
    
    leftPanel.classList.toggle('collapsed');
    button.textContent = leftPanel.classList.contains('collapsed') ? '▶' : '◀';
};

const toggleRightPanel = () => {
    const rightPanel = document.querySelector('.right-panel');
    const button = rightPanel.querySelector('.panel-toggle');
    
    rightPanel.classList.toggle('collapsed');
    button.textContent = rightPanel.classList.contains('collapsed') ? '◀' : '▶';
};

const updatePanelStates = () => {
    const isMobile = window.innerWidth <= 768;
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');

    if (isMobile) {
        // Сбрасываем состояние панелей на мобильных
        leftPanel.classList.remove('collapsed');
        rightPanel.classList.remove('collapsed');
        
        // Скрываем кнопки переключения
        const toggles = document.querySelectorAll('.panel-toggle');
        toggles.forEach(toggle => toggle.style.display = 'none');
    } else {
        // Показываем кнопки переключения
        const toggles = document.querySelectorAll('.panel-toggle');
        toggles.forEach(toggle => toggle.style.display = 'flex');
    }
};

// Экспортируем функции для внешнего использования
window.panels = {
    initializePanels,
    toggleLeftPanel,
    toggleRightPanel,
    updatePanelStates
};