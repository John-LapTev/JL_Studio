let modal = null;
let modalImage = null;
let currentHistoryIndex = -1;

const initialize = () => {
   createModal();
   initializeViewerHandlers();
   initializeKeyboardNavigation();
};

const createModal = () => {
   if (!modal) {
       modal = document.createElement('div');
       modal.className = 'image-modal';
       modal.innerHTML = `
           <button class="nav-prev" title="Предыдущее изображение">←</button>
           <button class="nav-next" title="Следующее изображение">→</button>
           <button class="close-button" title="Закрыть">×</button>
           <img src="" alt="Просмотр изображения">
       `;
       document.body.appendChild(modal);
       
       modalImage = modal.querySelector('img');
       
       modal.addEventListener('click', (e) => {
           if (e.target === modal || e.target.className === 'close-button') {
               closeViewer();
           }
       });

       initializeNavigationButtons();
   }
};

const initializeViewerHandlers = () => {
   const previewArea = document.querySelector('.preview-area');
   if (previewArea) {
       previewArea.addEventListener('click', (e) => {
           const img = e.target.closest('img');
           if (img) {
               currentHistoryIndex = -1;
               openViewer(img.src);
           }
       });
   }

   const historyGrid = document.querySelector('.history-grid');
   if (historyGrid) {
       historyGrid.addEventListener('click', async (e) => {
           const img = e.target.closest('img');
           if (img) {
               const images = Array.from(historyGrid.querySelectorAll('img'));
               currentHistoryIndex = images.indexOf(img);
               
               try {
                   const response = await fetch(img.src);
                   const blob = await response.blob();
                   const imageUrl = URL.createObjectURL(blob);
                   openViewer(imageUrl);
               } catch (error) {
                   console.error('Ошибка загрузки изображения:', error);
               }
           }
       });
   }
};

const initializeNavigationButtons = () => {
   const prevButton = modal.querySelector('.nav-prev');
   const nextButton = modal.querySelector('.nav-next');

   prevButton.addEventListener('click', (e) => {
       e.stopPropagation();
       showPreviousImage();
   });

   nextButton.addEventListener('click', (e) => {
       e.stopPropagation();
       showNextImage();
   });
};

const initializeKeyboardNavigation = () => {
   document.addEventListener('keydown', (e) => {
       if (!modal?.classList.contains('active')) return;

       switch(e.key) {
           case 'Escape':
               closeViewer();
               break;
           case 'ArrowLeft':
               showPreviousImage();
               break;
           case 'ArrowRight':
               showNextImage();
               break;
       }
   });
};

const showPreviousImage = async () => {
   if (currentHistoryIndex === -1) return;
   
   const historyGrid = document.querySelector('.history-grid');
   const images = Array.from(historyGrid.querySelectorAll('img'));
   
   if (currentHistoryIndex > 0) {
       currentHistoryIndex--;
       try {
           const response = await fetch(images[currentHistoryIndex].src);
           const blob = await response.blob();
           const imageUrl = URL.createObjectURL(blob);
           openViewer(imageUrl);
       } catch (error) {
           console.error('Ошибка загрузки изображения:', error);
       }
   }
};

const showNextImage = async () => {
   if (currentHistoryIndex === -1) return;
   
   const historyGrid = document.querySelector('.history-grid');
   const images = Array.from(historyGrid.querySelectorAll('img'));
   
   if (currentHistoryIndex < images.length - 1) {
       currentHistoryIndex++;
       try {
           const response = await fetch(images[currentHistoryIndex].src);
           const blob = await response.blob();
           const imageUrl = URL.createObjectURL(blob);
           openViewer(imageUrl);
       } catch (error) {
           console.error('Ошибка загрузки изображения:', error);
       }
   }
};

const openViewer = (imageSrc) => {
   if (!modal || !modalImage) return;
   
   // Освобождаем предыдущий URL
   if (modalImage.src && modalImage.src.startsWith('blob:')) {
       URL.revokeObjectURL(modalImage.src);
   }

   modalImage.src = imageSrc;
   modal.classList.add('active');
   document.body.style.overflow = 'hidden';

   const img = new Image();
   img.src = imageSrc;
   img.onload = () => {
       modalImage.classList.add('loaded');
       updateNavigationButtons();
   };
   img.onerror = () => {
       console.error('Ошибка загрузки изображения:', imageSrc);
       modalImage.src = '';
       modalImage.classList.remove('loaded');
   };
};

const closeViewer = () => {
   if (!modal) return;
   
   modal.classList.remove('active');
   document.body.style.overflow = '';
   
   // Очищаем и освобождаем URL
   setTimeout(() => {
       if (!modal.classList.contains('active')) {
           if (modalImage.src && modalImage.src.startsWith('blob:')) {
               URL.revokeObjectURL(modalImage.src);
           }
           modalImage.src = '';
           modalImage.classList.remove('loaded');
       }
   }, 300);
};

const updateNavigationButtons = () => {
   if (!modal) return;

   const prevButton = modal.querySelector('.nav-prev');
   const nextButton = modal.querySelector('.nav-next');

   if (currentHistoryIndex === -1) {
       prevButton.style.display = 'none';
       nextButton.style.display = 'none';
       return;
   }

   const historyGrid = document.querySelector('.history-grid');
   const images = historyGrid.querySelectorAll('img');

   prevButton.style.display = currentHistoryIndex > 0 ? 'block' : 'none';
   nextButton.style.display = currentHistoryIndex < images.length - 1 ? 'block' : 'none';
};

const updateModalPosition = () => {
   if (!modal || !modalImage) return;
   
   if (modal.classList.contains('active')) {
       const windowAspect = window.innerWidth / window.innerHeight;
       const imageAspect = modalImage.naturalWidth / modalImage.naturalHeight;
       
       if (windowAspect > imageAspect) {
           modalImage.style.height = '90vh';
           modalImage.style.width = 'auto';
       } else {
           modalImage.style.width = '90vw';
           modalImage.style.height = 'auto';
       }
   }
};

window.imageViewer = {
   initialize,
   openViewer,
   closeViewer,
   updateModalPosition
};