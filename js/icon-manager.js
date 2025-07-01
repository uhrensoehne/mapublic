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

function getPlacedIconCount() {
    return iconAnimationManager.getIconCount();
}

function updateDragIconsStatus() {
    iconAnimationManager.updateIconStatus();
}

function clearAllIcons() {
    iconAnimationManager.removeAllIcons();
}

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

function setupDragAndDrop() {
    const container = document.getElementById('scaled-container');
    
    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.addEventListener('dragstart', e => {
            if (getPlacedIconCount() >= 10) {
                e.preventDefault();
                iconAnimationManager.showIconLimitWarning();
                return false;
            }
            
            const img = icon.querySelector('img');
            const iconSize = calculateIconSize(container.offsetWidth, currentIconSize);
            const svg = img ? `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 ${iconSize} ${iconSize}"><image href="${img.src}" width="${iconSize}" height="${iconSize}"/></svg>` : icon.innerHTML;
            
            e.dataTransfer.setData('iconType', icon.dataset.type);
            e.dataTransfer.setData('svgHTML', svg);
            e.dataTransfer.setData('iconSize', currentIconSize);
            
            const dragImg = document.createElement('div');
            dragImg.innerHTML = svg;
            Object.assign(dragImg.style, {position: 'absolute', top: '-1000px', width: iconSize + 'px', height: iconSize + 'px'});
            document.body.appendChild(dragImg);
            e.dataTransfer.setDragImage(dragImg, iconSize/2, iconSize/2);
            setTimeout(() => document.body.removeChild(dragImg), 1);
        });
    });

    const getCircleParams = e => {
        const mapRect = document.getElementById('map').getBoundingClientRect();
        const adjustedX = e.clientX / ZOOM;
        const adjustedY = e.clientY / ZOOM;
        const mapCenterX = (mapRect.left / ZOOM) + (mapRect.width / ZOOM) / 2;
        const mapCenterY = (mapRect.top / ZOOM) + (mapRect.height / ZOOM) / 2;
        const dx = adjustedX - mapCenterX;
        const dy = adjustedY - mapCenterY;
        const radius = container.offsetWidth * 0.4125;
        return {dx, dy, radius, adjustedX, adjustedY, isInside: dx * dx + dy * dy <= radius * radius};
    };

    container.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = getPlacedIconCount() >= 10 ? 'none' : (getCircleParams(e).isInside ? 'copy' : 'none');
    });

    container.addEventListener('drop', async e => {
        e.preventDefault();
        
        if (getPlacedIconCount() >= 10) {
            iconAnimationManager.showIconLimitWarning();
            return;
        }
        
        const svg = e.dataTransfer.getData('svgHTML');
        const type = e.dataTransfer.getData('iconType');
        const iconSizeLevel = e.dataTransfer.getData('iconSize') || 'medium';
        if (!svg) return;
        
        const params = getCircleParams(e);
        if (params.isInside) {
            const containerRect = container.getBoundingClientRect();
            const iconSize = calculateIconSize(container.offsetWidth, iconSizeLevel);
            
            const iconData = {
                type: type,
                size: iconSizeLevel,
                svg: svg
            };
            
            const position = {
                x: params.adjustedX - containerRect.left / ZOOM - iconSize/2,
                y: params.adjustedY - containerRect.top / ZOOM - iconSize/2
            };
            
            await iconAnimationManager.addIcon(iconData, container, position);
        }
    });
    
    iconAnimationManager.updateIconStatus();
}

function startBoxDrag(e, box) {
    const container = document.getElementById('scaled-container');
    const boxRect = box.getBoundingClientRect();
    const shiftX = e.clientX / ZOOM - boxRect.left / ZOOM;
    const shiftY = e.clientY / ZOOM - boxRect.top / ZOOM;

    const move = ev => {
        const mapRect = document.getElementById('map').getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const adjustedX = ev.clientX / ZOOM;
        const adjustedY = ev.clientY / ZOOM;
        const mapCenterX = (mapRect.left / ZOOM) + (mapRect.width / ZOOM) / 2;
        const mapCenterY = (mapRect.top / ZOOM) + (mapRect.height / ZOOM) / 2;
        const dx = adjustedX - mapCenterX;
        const dy = adjustedY - mapCenterY;
        const radius = container.offsetWidth * 0.4125;
        
        if (dx * dx + dy * dy <= radius * radius) {
            box.style.opacity = '1';
            box.style.left = (adjustedX - containerRect.left / ZOOM - shiftX) + 'px';
            box.style.top = (adjustedY - containerRect.top / ZOOM - shiftY) + 'px';
        } else {
            box.style.opacity = '0.5';
        }
    };

    const stop = ev => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', stop);
        box.style.opacity = '1';
        ev.preventDefault();
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', stop);
    e.preventDefault();
}

function generateIconSidebar() {
    const iconSidebar = document.getElementById('icon-sidebar');
    if (!iconSidebar) return;
    
    iconSidebar.innerHTML = '';
    
    Object.keys(ICONS_CONFIG).forEach(iconType => {
        const iconConfig = ICONS_CONFIG[iconType];
        const iconDiv = document.createElement('div');
        iconDiv.className = 'sidebar-icon';
        iconDiv.setAttribute('data-type', iconType);
        iconDiv.setAttribute('draggable', 'true');
        iconDiv.innerHTML = `<img src="${iconConfig.url}" width="100%" height="100%" alt="${iconConfig.name}">`;
        iconSidebar.appendChild(iconDiv);
    });
    
    setupClearButton();
}

function updateAllIconSizes() {
    iconAnimationManager.updateIconSizes();
}

function getMarkerCount() {
    return iconAnimationManager.getIconCount();
}

function updateIconCounter() {
    iconAnimationManager.updateIconStatus();
}