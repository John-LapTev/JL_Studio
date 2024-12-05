const initializeCollapsibleSections = () => {
    const sections = document.querySelectorAll('[data-collapsible="true"]');
    sections.forEach(initializeSection);
};

const initializeSection = (section) => {
    const header = section.querySelector('.section-header');
    const content = section.querySelector('.section-content');
    const button = section.querySelector('.collapse-button');
    
    if (!header || !content || !button) return;

    if (section.dataset.collapsed === 'true') {
        collapseSection(content, button);
    }
    
    header.addEventListener('click', () => {
        toggleSection(section, content, button);
    });
};

const toggleSection = (section, content, button) => {
    const isCollapsed = section.dataset.collapsed === 'true';
    
    if (isCollapsed) {
        expandSection(content, button);
        section.dataset.collapsed = 'false';
    } else {
        collapseSection(content, button);
        section.dataset.collapsed = 'true';
    }
};

const collapseSection = (content, button) => {
    content.style.visibility = 'visible';
    content.style.height = content.scrollHeight + 'px';
    content.style.opacity = '1';
    
    requestAnimationFrame(() => {
        content.style.height = '0';
        content.style.opacity = '0';
    });
    
    content.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'height' && content.style.height === '0px') {
            content.style.visibility = 'hidden';
        }
    }, { once: true });
};

const expandSection = (content, button) => {
    content.style.visibility = 'visible';
    content.style.opacity = '1';
    content.style.display = 'flex';
    
    content.style.height = '0';
    requestAnimationFrame(() => {
        content.style.height = content.scrollHeight + 'px';
        
        content.addEventListener('transitionend', () => {
            content.style.height = 'auto';
        }, { once: true });
    });
};

window.collapse = {
    initializeCollapsibleSections,
    toggleSection,
    expandSection,
    collapseSection
};