// Vereinheitlichte icon-manager.js mit einheitlichem Drag-System

let clickPlacementMode = false;
let selectedIconForPlacement = null;
let touchDragMode = false;
let currentDragIcon = null;
let touchStartTime = 0;
let isMobile = false;

// Unified Drag System Variables
let isDragging = false;
let currentDragElement = null;
let dragStartPos = { x: 0, y: 0 };
let dragOffset = { x: 0, y: 0 };
let dragPreview = null;
let isFromSidebar = false;

// Mobile Detection
function detectMobile() {
    isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile;
}

function setupIconSizeSlider() {
    const slider = document.getElementById('icon-size-slider');
    if (!slider) return;
    
    const sizeMap = { '0': 'small', '1': 'medium', '2': 'large' };
    slider.value = '1';
    currentIconSize = 'medium';
    
    slider.addEventListener('input', function() {
        const newSize = sizeMap[this.value];
        if (newSize && newSize !== currentIconSize) {
            currentIconSize = newSize;
            console.log(`Icongröße geändert auf: ${currentIconSize}`);
        }
    });
}

function getPlacedIconCount() { return iconAnimationManager.getIconCount(); }
function updateDragIconsStatus() { iconAnimationManager.updateIconStatus(); }
function clearAllIcons() { iconAnimationManager.removeAllIcons(); }

function setupClearButton() {
    const clearButton = document.getElementById('clear-all-button');
    if (clearButton) {
        clearButton.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            clearAllIcons();
        });
    }
}

// Zentrale Funktion zur Icon-Element-Erstellung
function createIconElement(iconType, size, isPreview = false) {
    const container = document.getElementById('scaled-container');
    const iconSize = calculateIconSize(container.offsetWidth, size);
    const iconConfig = ICONS_CONFIG[iconType];
    
    const iconElement = document.createElement('div');
    iconElement.className = isPreview ? 'placed-box global-drag-preview' : 'placed-box';
    iconElement.dataset.iconType = iconType;
    iconElement.dataset.iconSize = size;
    
    const baseStyles = {
        width: iconSize + 'px',
        height: iconSize + 'px',
        background: '#e3c8ab',
        borderRadius: '20%',
        padding: isPreview ? '0.25%' : '0.625%',
        display: 'flex',
        cursor: 'move',
        transition: 'none'
    };
    
    if (isPreview) {
        Object.assign(baseStyles, {
            zIndex: '9999',
            pointerEvents: 'none',
        });
    } else {
        Object.assign(baseStyles, {
            zIndex: '2'
        });
    }
    
    Object.assign(iconElement.style, baseStyles);
    
    if (iconConfig) {
        iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 ${iconSize} ${iconSize}"><image href="${iconConfig.url}" width="${iconSize}" height="${iconSize}"/></svg>`;
        
        const svg = iconElement.querySelector('svg');
        if (svg) {
            Object.assign(svg.style, {
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                objectFit: 'contain'
            });
            
            if (isPreview) {
                svg.style.filter = 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))';
            }
        }
    }
    
    return iconElement;
}

function createDragIconElement(iconType, size = currentIconSize) {
    return createIconElement(iconType, size, true);
}

function startUnifiedDrag(e, sourceElement, iconType = null) {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDragging) return;
    
    console.log('[startUnifiedDrag] Starting drag for:', iconType || 'existing icon');
    
    const container = document.getElementById('scaled-container');
    const isTouch = e.type.includes('touch');
    const eventPos = isTouch ? e.touches[0] : e;
    
    isFromSidebar = iconType !== null;
    
    if (isFromSidebar && getPlacedIconCount() >= 10) {
        iconAnimationManager.showIconLimitWarning();
        return;
    }
    
    isDragging = true;
    dragStartPos = { x: eventPos.clientX, y: eventPos.clientY };
    
    if (isFromSidebar) {
        currentDragElement = createDragIconElement(iconType);
        dragOffset = { x: 0, y: 0 };
        document.body.appendChild(currentDragElement);
        
        if (isTouch && navigator.vibrate) navigator.vibrate(50);
    } else {
        currentDragElement = sourceElement;
        const elementRect = sourceElement.getBoundingClientRect();
        
        dragOffset = {
            x: (eventPos.clientX - elementRect.left) / ZOOM,
            y: (eventPos.clientY - elementRect.top) / ZOOM
        };
        
        Object.assign(currentDragElement.style, {
            zIndex: '1000',
            transition: 'none'
        });
        currentDragElement.classList.add('dragging');
    }
    
    updateDragPosition(eventPos);
    
    const moveHandler = (ev) => {
        if (!isDragging) return;
        ev.preventDefault();
        updateDragPosition(ev.type.includes('touch') ? ev.touches[0] : ev);
    };
    
    const endHandler = (ev) => {
        if (!isDragging) return;
        
        const endPos = ev.type.includes('touch') ? ev.changedTouches[0] : ev;
        endUnifiedDrag(endPos);
        
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', endHandler);
        document.removeEventListener('touchmove', moveHandler, { passive: false });
        document.removeEventListener('touchend', endHandler);
        document.removeEventListener('touchcancel', endHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', endHandler);
    document.addEventListener('touchcancel', endHandler);
}

function updateDragPosition(eventPos) {
    if (!currentDragElement || !isDragging) return;
    
    const container = document.getElementById('scaled-container');
    
    if (isFromSidebar) {
        currentDragElement.style.left = eventPos.clientX + 'px';
        currentDragElement.style.top = eventPos.clientY + 'px';
        
        const containerRect = container.getBoundingClientRect();
        const isInCircle = isPointInsideCircle(eventPos, containerRect);
        
        if (isInCircle) {
            Object.assign(currentDragElement.style, {
                opacity: '1',
                transform: 'translate(-50%, -50%) scale(1)',
                filter: 'none'
            });
            
            const svg = currentDragElement.querySelector('svg');
            if (svg) svg.style.filter = 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))';
        } else {
            Object.assign(currentDragElement.style, {
                opacity: '0.5',
                transform: 'translate(-50%, -50%) scale(0.8)',
                filter: 'grayscale(100%)'
            });
            
            const svg = currentDragElement.querySelector('svg');
            if (svg) svg.style.filter = 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3)) grayscale(100%)';
        }
    } else {
        const containerRect = container.getBoundingClientRect();
        const newLeft = (eventPos.clientX - containerRect.left) / ZOOM - dragOffset.x;
        const newTop = (eventPos.clientY - containerRect.top) / ZOOM - dragOffset.y;
        
        currentDragElement.style.left = newLeft + 'px';
        currentDragElement.style.top = newTop + 'px';
        
        const isInCircle = isElementInsideCircle(currentDragElement, container);
        
        if (isInCircle) {
            Object.assign(currentDragElement.style, {
                opacity: '1',
                transform: 'scale(1)',
                filter: 'none'
            });
        } else {
            Object.assign(currentDragElement.style, {
                opacity: '0.5',
                transform: 'scale(0.8)',
                filter: 'grayscale(100%)'
            });
        }
    }
}

function isPointInsideCircle(point, containerRect) {
    const mapRect = document.getElementById('map').getBoundingClientRect();
    
    const relativeX = (point.clientX - containerRect.left) / ZOOM;
    const relativeY = (point.clientY - containerRect.top) / ZOOM;
    
    const mapCenterX = (mapRect.left - containerRect.left) / ZOOM + mapRect.width / (2 * ZOOM);
    const mapCenterY = (mapRect.top - containerRect.top) / ZOOM + mapRect.height / (2 * ZOOM);
    
    const dx = relativeX - mapCenterX;
    const dy = relativeY - mapCenterY;
    const radius = containerRect.width * 0.4125 / ZOOM;
    
    return dx * dx + dy * dy <= radius * radius;
}

async function endUnifiedDrag(eventPos) {
    if (!isDragging || !currentDragElement) return;
    
    console.log('[endUnifiedDrag] Ending drag, isFromSidebar:', isFromSidebar);
    
    isDragging = false;
    const container = document.getElementById('scaled-container');
    
    if (isFromSidebar) {
        const containerRect = container.getBoundingClientRect();
        const isInCircle = isPointInsideCircle(eventPos, containerRect);
        
        if (isInCircle) {
            const iconType = currentDragElement.dataset.iconType;
            const iconSize = currentDragElement.dataset.iconSize;
            
            const relativeX = (eventPos.clientX - containerRect.left) / ZOOM - parseFloat(currentDragElement.style.width) / 2;
            const relativeY = (eventPos.clientY - containerRect.top) / ZOOM - parseFloat(currentDragElement.style.height) / 2;
            
            currentDragElement.remove();
            
            // Verwende die zentrale createIconElement Funktion
            const iconElement = createIconElement(iconType, iconSize, false);
            
            Object.assign(iconElement.style, {
                left: relativeX + 'px',
                top: relativeY + 'px'
            });
            
            container.appendChild(iconElement);
            iconAnimationManager.attachIconEventListeners(iconElement);
            await iconAnimationManager.animateIconIn(iconElement);
            iconAnimationManager.updateIconStatus();
            
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        } else {
            currentDragElement.remove();
            iconAnimationManager.showMessage('Marker kann nur auf der Uhr platziert werden!', 'warning');
            
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
    } else {
        const isInCircle = isElementInsideCircle(currentDragElement, container);
        
        if (isInCircle) {
            Object.assign(currentDragElement.style, {
                opacity: '1',
                transform: 'scale(1)',
                filter: 'none',
                zIndex: '2',
                transition: ''
            });
            currentDragElement.classList.remove('dragging');
        } else {
            Object.assign(currentDragElement.style, {
                transition: 'all 0.3s ease-out',
                opacity: '0',
                transform: 'scale(0)'
            });
            
            setTimeout(async () => {
                await iconAnimationManager.removeIcon(currentDragElement, true);
                if (navigator.vibrate) navigator.vibrate([50, 25, 50]);
            }, 300);
        }
    }
    
    currentDragElement = null;
    isFromSidebar = false;
    dragOffset = { x: 0, y: 0 };
}

// Click Placement Mode
function enableClickPlacementMode(iconType) {
    clickPlacementMode = true;
    selectedIconForPlacement = iconType;

    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.classList[icon.dataset.type === iconType ? 'add' : 'remove']('selected-for-placement');
    });

    const container = document.getElementById('scaled-container');
    const mapCanvas = document.querySelector('.maplibregl-canvas');
    container.style.cursor = 'crosshair';
    if (mapCanvas) mapCanvas.style.cursor = 'crosshair';

    showPlacementHint();
}

function disableClickPlacementMode() {
    clickPlacementMode = false;
    selectedIconForPlacement = null;

    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.classList.remove('selected-for-placement');
    });

    const container = document.getElementById('scaled-container');
    const mapCanvas = document.querySelector('.maplibregl-canvas');
    container.style.cursor = '';
    if (mapCanvas) mapCanvas.style.cursor = '';

    hidePlacementHint();
}

function showPlacementHint() {
    document.querySelector('.placement-hint')?.remove();
    
    const hint = document.createElement('div');
    hint.className = 'placement-hint';
    hint.textContent = detectMobile() 
        ? 'Tippe auf ein Icon und dann auf die Karte zum Platzieren.'
        : 'Klicke auf ein Icon und dann auf die Karte oder ziehe es direkt auf die Karte.';
    
    hint.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8); color: white; padding: 10px 20px;
        border-radius: 20px; font-size: 12px; z-index: 1000;
        backdrop-filter: blur(10px); animation: fadeIn 0.3s ease-out;
        max-width: 90%; text-align: center; box-sizing: border-box;
    `;
    
    document.body.appendChild(hint);
}

function hidePlacementHint() {
    const hint = document.querySelector('.placement-hint');
    if (hint) {
        hint.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => hint.remove(), 300);
    }
}

async function handleContainerClick(event) {
    if (!clickPlacementMode || !selectedIconForPlacement) return;
    
    const container = document.getElementById('scaled-container');
    const params = getCircleParams(event);
    
    if (params.isInside) {
        const containerRect = container.getBoundingClientRect();
        const iconSize = calculateIconSize(container.offsetWidth, currentIconSize);
        
        const iconConfig = ICONS_CONFIG[selectedIconForPlacement];
        const svg = iconConfig ? `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 ${iconSize} ${iconSize}"><image href="${iconConfig.url}" width="${iconSize}" height="${iconSize}"/></svg>` : '';
        
        const iconData = {
            type: selectedIconForPlacement,
            size: currentIconSize,
            svg: svg
        };
        
        const position = {
            x: params.adjustedX - containerRect.left / ZOOM - iconSize/2,
            y: params.adjustedY - containerRect.top / ZOOM - iconSize/2
        };
        
        await iconAnimationManager.addIcon(iconData, container, position);
        disableClickPlacementMode();
    } else {
        iconAnimationManager.showMessage('Icon kann nur innerhalb des Kreises platziert werden!', 'warning');
    }
}

function getCircleParams(eventOrTouch) {
    const container = document.getElementById('scaled-container');
    const mapRect = document.getElementById('map').getBoundingClientRect();
    
    const clientX = eventOrTouch.clientX;
    const clientY = eventOrTouch.clientY;
    
    const adjustedX = clientX / ZOOM;
    const adjustedY = clientY / ZOOM;
    const mapCenterX = (mapRect.left / ZOOM) + (mapRect.width / ZOOM) / 2;
    const mapCenterY = (mapRect.top / ZOOM) + (mapRect.height / ZOOM) / 2;
    const dx = adjustedX - mapCenterX;
    const dy = adjustedY - mapCenterY;
    const radius = container.offsetWidth * 0.4125;
    
    return { dx, dy, radius, adjustedX, adjustedY, isInside: dx * dx + dy * dy <= radius * radius };
}

function isElementInsideCircle(element, container) {
    const elementRect = element.getBoundingClientRect();
    const mapRect = document.getElementById('map').getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const elementCenterX = (elementRect.left + elementRect.width / 2 - containerRect.left) / ZOOM;
    const elementCenterY = (elementRect.top + elementRect.height / 2 - containerRect.top) / ZOOM;
    
    const mapCenterX = (mapRect.left - containerRect.left) / ZOOM + mapRect.width / (2 * ZOOM);
    const mapCenterY = (mapRect.top - containerRect.top) / ZOOM + mapRect.height / (2 * ZOOM);
    
    const dx = elementCenterX - mapCenterX;
    const dy = elementCenterY - mapCenterY;
    const radius = container.offsetWidth * 0.4125;
    
    return dx * dx + dy * dy <= radius * radius;
}

function setupDragAndDrop() {
    const container = document.getElementById('scaled-container');

    container.addEventListener('click', handleContainerClick);

    container.addEventListener('touchstart', (e) => {
        if (clickPlacementMode && selectedIconForPlacement) {
            e.preventDefault();
            const touch = e.touches[0];
            const params = getCircleParams(touch);

            if (params.isInside) {
                const rect = container.getBoundingClientRect();
                const iconSize = calculateIconSize(container.offsetWidth, currentIconSize);
                const iconConfig = ICONS_CONFIG[selectedIconForPlacement];
                const svg = iconConfig ? `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 ${iconSize} ${iconSize}"><image href="${iconConfig.url}" width="${iconSize}" height="${iconSize}"/></svg>` : '';

                const iconData = { type: selectedIconForPlacement, size: currentIconSize, svg };
                const position = {
                    x: params.adjustedX - rect.left / ZOOM - iconSize / 2,
                    y: params.adjustedY - rect.top / ZOOM - iconSize / 2
                };

                iconAnimationManager.addIcon(iconData, container, position);
                disableClickPlacementMode();
            } else {
                iconAnimationManager.showMessage('Icon kann nur innerhalb des Kreises platziert werden!', 'warning');
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && clickPlacementMode) disableClickPlacementMode();
    });

    window.addEventListener('resize', detectMobile);
    detectMobile();

    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        const iconType = icon.dataset.type;
        
        icon.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            
            setTimeout(() => {
                if (Date.now() - touchStartTime < 150) {
                    if (clickPlacementMode && selectedIconForPlacement === iconType) {
                        disableClickPlacementMode();
                    } else {
                        enableClickPlacementMode(iconType);
                    }
                }
            }, 150);
            
            setTimeout(() => {
                if (Date.now() - touchStartTime >= 150) {
                    startUnifiedDrag(e, icon, iconType);
                }
            }, 150);
        });
        
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (clickPlacementMode && selectedIconForPlacement === iconType) {
                disableClickPlacementMode();
            } else {
                enableClickPlacementMode(iconType);
            }
        });

        icon.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            setTimeout(() => {
                if (e.buttons === 1) {
                    startUnifiedDrag(e, icon, iconType);
                }
            }, 100);
        });
    });

    iconAnimationManager.updateIconStatus();
}


// Legacy Functions
function startBoxDrag(e, box) { startUnifiedDrag(e, box); }

function generateIconSidebar() {
    const iconSidebar = document.getElementById('icon-sidebar');
    if (!iconSidebar) return;
    
    iconSidebar.innerHTML = '';
    
    Object.keys(ICONS_CONFIG).forEach(iconType => {
        const iconConfig = ICONS_CONFIG[iconType];
        const iconDiv = document.createElement('div');
        iconDiv.className = 'sidebar-icon';
        iconDiv.setAttribute('data-type', iconType);
        iconDiv.innerHTML = `<img src="${iconConfig.url}" width="100%" height="100%" alt="${iconConfig.name}">`;
        iconSidebar.appendChild(iconDiv);
    });
    
    setupClearButton();
}

function updateAllIconSizes() { iconAnimationManager.updateIconSizes(); }
function getMarkerCount() { return iconAnimationManager.getIconCount(); }
function updateIconCounter() { iconAnimationManager.updateIconStatus(); }