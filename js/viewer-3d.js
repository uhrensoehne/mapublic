let viewer3DUpdateInterval = null;
let handElements = { hour: null, minute: null, second: null };

// Berechne den Skalierungsfaktor basierend auf der Main-Wrapper-Größe
function getScaleFactor() {
    const mainWrapper = document.getElementById('main-wrapper');
    if (!mainWrapper) return 1;
    const currentWidth = mainWrapper.offsetWidth;
    const baseWidth = 550;
    return currentWidth / baseWidth;
}

function scaleZValue(zValue) {
    return Math.round(zValue * getScaleFactor());
}

async function build3DView() {
    const stack = document.getElementById('stack');
    stack.innerHTML = '';

    try {
        let layers;

        if (typeof getCachedLayers === 'function') {
            layers = getCachedLayers();
        }

        if (!layers) {
            console.log('Erstelle neue Layer für 3D-Ansicht...');
            const roadCanvas = await extractLayersFromMap(map, LAYER_IDS.road);
            const waterCanvas = await extractLayersFromMap(map, LAYER_IDS.water);

            const lightLayer = await processLightLayer(roadCanvas);
            const darkLayer = await processDarkLayer(waterCanvas, lightLayer);
            const ziffernblattLayer = await createZiffernblattLayer(lightLayer);
            const waterTextureLayer = await createWaterTextureLayer(lightLayer);
            const befestigungLayer = await createBefestigungLayer(lightLayer);
            const randLayer = await createRandLayer(lightLayer);
            const mutterLayer = await createMutterLayer(lightLayer);

            layers = {
                lightLayer,
                darkLayer,
                ziffernblattLayer,
                waterTextureLayer,
                befestigungLayer,
                randLayer,
                mutterLayer
            };

            if (typeof setCachedLayers === 'function') {
                setCachedLayers(layers);
                console.log('Layer für Screenshot-Controller gecacht');
            }
        } else {
            console.log('Verwende bereits gecachte Layer für 3D-Ansicht');
        }

        createImageLayer(layers.darkLayer, -5, 0, stack, '', true);
        createImageLayer(layers.waterTextureLayer, -6, -5, stack);
        createImageLayer(layers.lightLayer, 0, 5, stack, '', true);
        createImageLayer(layers.befestigungLayer, 6, 6, stack);
        createImageLayer(layers.mutterLayer, 6, 22, stack);
        createImageLayer(layers.ziffernblattLayer, 6, 6, stack);

        await addFrameAndLiveHands(stack);
        setupViewerRotation();

        console.log('3D-Ansicht erfolgreich erstellt mit Skalierungsfaktor:', getScaleFactor());

    } catch (error) {
        console.error('Fehler beim Erstellen der 3D-Ansicht:', error);
        await build3DViewFallback();
    }
}

function createImageLayer(canvas, zStart, zEnd, targetStack, filter = '', blackenLower = false) {
    const url = canvas.toDataURL();
    for (let z = zStart; z <= zEnd; z++) {
        const div = document.createElement('div');
        div.className = 'layer';
        div.dataset.zStart = zStart;
        div.dataset.zEnd = zEnd;
        div.dataset.zIndex = z;
        div.style.transform = `translateZ(${scaleZValue(z)}px)`;

        const img = document.createElement('img');
        img.src = url;
        if (blackenLower && z < zEnd) img.style.filter = 'brightness(0)';
        else if (filter && z < zEnd) img.style.filter = filter;

        div.appendChild(img);
        targetStack.appendChild(div);
    }
}

async function addFrameAndLiveHands(stack) {
    try {
        const response = await fetch('https://raw.githubusercontent.com/ErikP98/Test/85e24ea7d3a06756fc5c789b1884f76847f84990/Rand.svg');
        const svgText = await response.text();

        const frameZStart = -5;
        const frameZEnd = 10;

        for (let z = frameZStart; z <= frameZEnd; z++) {
            const div = document.createElement('div');
            div.className = 'layer';
            div.dataset.zStart = frameZStart;
            div.dataset.zEnd = frameZEnd;
            div.dataset.zIndex = z;
            div.style.transform = `translateZ(${scaleZValue(z)}px)`;

            const wrapper = document.createElement('div');
            Object.assign(wrapper.style, {
                width: '104.6%', height: '104.6%', position: 'absolute', left: '-2.3%', top: '-2.3%'
            });
            wrapper.innerHTML = svgText;
            div.appendChild(wrapper);
            stack.appendChild(div);
        }

        await addLiveHands(stack);
    } catch (error) {
        console.error('Error adding frame/hands:', error);
    }
}

async function addLiveHands(stack) {
    await addLiveHand(stack, 'https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/ZeigerStunde.png', 'hour', 12);
    await addLiveHand(stack, 'https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/ZeigerMinute.png', 'minute', 19);
    updateClockHandsIn3D();
}

async function addLiveHand(stack, src, handType, zOriginal) {
    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const div = document.createElement('div');
            div.className = 'layer clock-hand-layer';
            div.dataset.zIndex = zOriginal;
            div.style.transform = `translateZ(${scaleZValue(zOriginal)}px)`;
            div.setAttribute('data-hand-type', handType);

            const handImg = img.cloneNode();
            handImg.style.cssText = 'width: 100%; height: 100%; transform-origin: center center; transition: transform 0.1s ease-out; transform: scale(0.9);';
            div.appendChild(handImg);
            stack.appendChild(div);
            handElements[handType] = handImg;
            resolve();
        };
        img.onerror = () => resolve();
        img.src = src;
    });
}

function updateClockHandsIn3D() {
    const now = new Date();
    const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();

    const hourAngle = (h * 30) + (m * 0.5) + (s * 0.00833);
    const minuteAngle = (m * 6) + (s * 0.1);

    if (handElements.hour) handElements.hour.style.transform = `rotate(${hourAngle}deg)`;
    if (handElements.minute) handElements.minute.style.transform = `rotate(${minuteAngle}deg)`;
    if (handElements.second) handElements.second.style.transform = `rotate(${s * 6}deg)`;
}

function startClockUpdatesIn3D() {
    updateClockHandsIn3D();
    viewer3DUpdateInterval = setInterval(updateClockHandsIn3D, 1000);
}

function stopClockUpdatesIn3D() {
    if (viewer3DUpdateInterval) {
        clearInterval(viewer3DUpdateInterval);
        viewer3DUpdateInterval = null;
    }
    handElements = { hour: null, minute: null, second: null };
}

function setupViewerRotation() {
    const viewer = document.getElementById('viewer');
    const stack = document.getElementById('stack');

    let currentAngle = 0, animationFrame = null, targetAngle = 0;
    let startX = 0, startAngle = 0;
    let isDragging = false;

    function animateToTarget() {
        const diff = targetAngle - currentAngle;
        if (Math.abs(diff) < 0.1) {
            currentAngle = targetAngle;
            const finalAngle = Math.abs(currentAngle) < 0.01 ? 0.01 : currentAngle;
            stack.style.transform = `rotateY(${finalAngle}deg)`;
            animationFrame = null;
            return;
        }
        currentAngle += diff * 0.12;
        stack.style.transform = `rotateY(${currentAngle}deg)`;
        animationFrame = requestAnimationFrame(animateToTarget);
    }

    function stopAnimation() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    function returnToCenter() {
        targetAngle = 0.01;
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(animateToTarget);
        }
    }

    function calculateMouseRotation(clientX) {
        const rect = viewer.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width - 0.5;
        return Math.max(-60, Math.min(60, x * 120));
    }

    function calculateTouchRotation(deltaX) {
        const sensitivity = 0.8;
        return Math.max(-60, Math.min(60, startAngle + deltaX * sensitivity));
    }

    // Mausrotation nur zulassen, wenn kein Touch-Drag aktiv ist
    viewer.addEventListener('mousemove', e => {
        if (isDragging) return;
        stopAnimation();
        currentAngle = calculateMouseRotation(e.clientX);
        targetAngle = currentAngle;
        stack.style.transform = `rotateY(${currentAngle}deg)`;
    });

    viewer.addEventListener('mouseleave', () => {
        if (isDragging) return;
        returnToCenter();
    });

    viewer.addEventListener('mouseenter', () => {
        if (isDragging) return;
        stopAnimation();
    });

    // Touch-Events
    viewer.addEventListener('touchstart', handleTouchStart, { passive: true });
    viewer.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewer.addEventListener('touchend', handleTouchEnd, { passive: true });
    viewer.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    function handleTouchStart(e) {
        isDragging = true;
        stopAnimation();
        const touch = e.touches[0];
        startX = touch.clientX;
        startAngle = currentAngle;
    }

    function handleTouchMove(e) {
        if (!isDragging || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - startX;
        if (Math.abs(deltaX) > 10) e.preventDefault();
        currentAngle = calculateTouchRotation(deltaX);
        targetAngle = currentAngle;
        stack.style.transform = `rotateY(${currentAngle}deg)`;
    }

    function handleTouchEnd() {
        if (!isDragging) return;
        isDragging = false;
        setTimeout(() => returnToCenter(), 100);
    }

    viewer.addEventListener('contextmenu', e => {
        e.preventDefault();
        return false;
    });

    viewer.style.touchAction = 'pan-y pinch-zoom';
    viewer.style.userSelect = 'none';
    viewer.style.webkitUserSelect = 'none';
    viewer.style.webkitTouchCallout = 'none';
}

// Neue Funktion: Z-Werte bei Resize aktualisieren
function rescaleZLayers() {
    const layers = document.querySelectorAll('#stack .layer');
    layers.forEach(layer => {
        const z = parseFloat(layer.dataset.zIndex);
        if (!isNaN(z)) {
            layer.style.transform = `translateZ(${scaleZValue(z)}px)`;
        }
    });
    console.log('Z-Werte der Layer neu skaliert mit Skalierungsfaktor:', getScaleFactor());
}

// Resize-Handler mit neuer Skalierung
window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        const viewerOverlay = document.getElementById('viewer-overlay');
        if (viewerOverlay && viewerOverlay.style.display !== 'none') {
            console.log('Rescaling 3D view due to window resize');
            rescaleZLayers();
        }
    }, 250);
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-viewer-btn').addEventListener('click', hideViewer);
});

window.addEventListener('beforeunload', stopClockUpdatesIn3D);
