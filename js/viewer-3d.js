let viewer3DUpdateInterval = null;
let handElements = { hour: null, minute: null, second: null };

// Optimierte 3D-View-Erstellung mit On-Demand Cache-Prüfung
async function build3DView() {
    const stack = document.getElementById('stack');
    stack.innerHTML = '';
    
    try {
        let layers;
        
        // Prüfe ob bereits gecachte Layer vorhanden und gültig sind
        if (typeof getCachedLayers === 'function') {
            layers = getCachedLayers(); // Diese Funktion prüft bereits die Cache-Gültigkeit
        }
        
        // Wenn keine gültigen gecachten Layer vorhanden sind, erstelle neue
        if (!layers) {
            console.log('Erstelle neue Layer für 3D-Ansicht...');
            
            // Basis-Layer aus der Map extrahieren
            const roadCanvas = await extractLayersFromMap(map, LAYER_IDS.road);
            const waterCanvas = await extractLayersFromMap(map, LAYER_IDS.water);
            
            // Alle Layer erstellen
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
            
            // Layer in Cache speichern für spätere Verwendung
            if (typeof setCachedLayers === 'function') {
                setCachedLayers(layers);
                console.log('Layer für Screenshot-Controller gecacht');
            }
        } else {
            console.log('Verwende bereits gecachte Layer für 3D-Ansicht');
        }
        
        // 3D-Stack mit den Layern aufbauen
        createImageLayer(layers.darkLayer, -5, 0, stack, '', true);
        createImageLayer(layers.waterTextureLayer, -6, -5, stack);
        createImageLayer(layers.lightLayer, 0, 5, stack, '', true);
        createImageLayer(layers.befestigungLayer, 6, 6, stack);
        createImageLayer(layers.mutterLayer, 6, 22, stack);
        createImageLayer(layers.ziffernblattLayer, 6, 6, stack);
        
        await addFrameAndLiveHands(stack);
        setupViewerRotation();
        
        console.log('3D-Ansicht erfolgreich erstellt');
        
    } catch (error) {
        console.error('Fehler beim Erstellen der 3D-Ansicht:', error);
        // Fallback auf alte Methode falls nötig
        await build3DViewFallback();
    }
}



function createImageLayer(canvas, zStart, zEnd, targetStack, filter = '', blackenLower = false) {
    const url = canvas.toDataURL();
    for (let z = zStart; z <= zEnd; z++) {
        const div = document.createElement('div');
        div.className = 'layer';
        div.style.transform = `translateZ(${z}px)`;
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
        
        for (let z = -5; z <= 10; z++) {
            const div = document.createElement('div');
            div.className = 'layer';
            div.style.transform = `translateZ(${z}px)`;
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

async function addLiveHand(stack, src, handType, z) {
    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const div = document.createElement('div');
            div.className = 'layer clock-hand-layer';
            div.style.transform = `translateZ(${z}px)`;
            div.setAttribute('data-hand-type', handType);
            
            const handImg = img.cloneNode();
            handImg.style.cssText = 'width: 100%; height: 100%; transform-origin: center center; transition: transform 0.1s ease-out;';
            
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
    
    viewer.addEventListener('mousemove', e => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        const rect = viewer.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        currentAngle = Math.max(-60, Math.min(60, x * 120));
        targetAngle = currentAngle;
        stack.style.transform = `rotateY(${currentAngle}deg)`;
    });
    
    viewer.addEventListener('mouseleave', () => {
        targetAngle = 0.01;
        if (!animationFrame) animationFrame = requestAnimationFrame(animateToTarget);
    });
    
    viewer.addEventListener('mouseenter', () => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-viewer-btn').addEventListener('click', hideViewer);
});

window.addEventListener('beforeunload', stopClockUpdatesIn3D);