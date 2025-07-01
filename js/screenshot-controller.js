let layerCache = {
    lightLayer: null,
    darkLayer: null,
    waterTextureLayer: null,
    befestigungLayer: null,
    ziffernblattLayer: null,
    randLayer: null,
    mutterLayer: null,
    isValid: false,
    mapState: null,
    iconState: null
};

function getCurrentMapState() {
    if (!map) return null;
    const center = map.getCenter();
    return {
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
    };
}

function getCurrentIconState() {
    const container = document.getElementById('scaled-container');
    if (!container) return null;
    
    const icons = Array.from(container.querySelectorAll('.placed-box')).map(box => ({
        type: box.dataset.iconType,
        size: box.dataset.iconSize,
        left: box.style.left,
        top: box.style.top
    }));
    
    return {
        count: icons.length,
        positions: icons.map(icon => `${icon.type}-${icon.size}-${icon.left}-${icon.top}`).sort().join('|')
    };
}

function checkCacheValidityOnDemand(forceValid = false) {
    // Wenn forceValid true ist (z.B. in 3D-Ansicht), Cache als gültig betrachten
    if (forceValid && layerCache.isValid) {
        console.log('Cache-Validität wird übersprungen (forceValid=true)');
        return true;
    }
    
    if (!layerCache.isValid || !layerCache.mapState || !layerCache.iconState) {
        console.log('Cache ungültig: Keine gecachten Daten vorhanden');
        return false;
    }
    
    const currentMapState = getCurrentMapState();
    const currentIconState = getCurrentIconState();
    
    if (!currentMapState || !currentIconState) {
        console.log('Cache ungültig: Aktueller Zustand nicht verfügbar');
        return false;
    }
    
    const tolerance = 0.0001;
    const mapValid = Math.abs(currentMapState.center[0] - layerCache.mapState.center[0]) < tolerance &&
                    Math.abs(currentMapState.center[1] - layerCache.mapState.center[1]) < tolerance &&
                    Math.abs(currentMapState.zoom - layerCache.mapState.zoom) < tolerance;
    
    const iconValid = currentIconState.count === layerCache.iconState.count &&
                     currentIconState.positions === layerCache.iconState.positions;
    
    if (!mapValid) {
        console.log('Cache ungültig: Kartenposition/Zoom hat sich geändert');
    }
    if (!iconValid) {
        console.log('Cache ungültig: Icon-Positionen haben sich geändert');
    }
    
    return mapValid && iconValid;
}

function invalidateLayerCache() {
    layerCache.isValid = false;
    layerCache.mapState = null;
    layerCache.iconState = null;
    console.log('Layer-Cache manuell invalidiert');
}

async function createAndCacheAllLayers() {
    try {
        console.log('Erstelle und cache alle Layer...');
        
        const roadCanvas = await extractLayersFromMap(map, LAYER_IDS.road);
        const waterCanvas = await extractLayersFromMap(map, LAYER_IDS.water);
        
        const lightLayer = await processLightLayer(roadCanvas);
        const darkLayer = await processDarkLayer(waterCanvas, lightLayer);
        const ziffernblattLayer = await createZiffernblattLayer(lightLayer);
        const waterTextureLayer = await createWaterTextureLayer(lightLayer);
        const befestigungLayer = await createBefestigungLayer(lightLayer);
        const randLayer = await createRandLayer(lightLayer);
        const mutterLayer = await createMutterLayer(lightLayer);
        
        layerCache = {
            lightLayer: lightLayer,
            darkLayer: darkLayer,
            waterTextureLayer: waterTextureLayer,
            befestigungLayer: befestigungLayer,
            ziffernblattLayer: ziffernblattLayer,
            randLayer: randLayer,
            mutterLayer: mutterLayer,
            isValid: true,
            mapState: getCurrentMapState(),
            iconState: getCurrentIconState()
        };
        
        console.log('Alle Layer erfolgreich gecacht');
        return layerCache;
        
    } catch (error) {
        console.error('Fehler beim Erstellen und Cachen der Layer:', error);
        layerCache.isValid = false;
        throw error;
    }
}

// Erweiterte generatePreviewImage Funktion mit Zeigern
// Erweiterte generatePreviewImage Funktion mit Zeigern und Mutter als oberste Ebene
async function generatePreviewImage(forceUseCachedLayers = false) {
    try {
        let layers;
        
        if (checkCacheValidityOnDemand(forceUseCachedLayers)) {
            console.log('Verwende gecachte Layer für Vorschaubild');
            layers = layerCache;
        } else {
            console.log('Cache ungültig oder nicht vorhanden, erstelle neue Layer...');
            layers = await createAndCacheAllLayers();
        }
        
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = layers.lightLayer.width;
        finalCanvas.height = layers.lightLayer.height;
        const ctx = finalCanvas.getContext('2d');

        const drawScaledCentered = (ctx, img, scale) => {
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (finalCanvas.width - w) / 2;
            const y = (finalCanvas.height - h) / 2;
            ctx.drawImage(img, x, y, w, h);
        };

        // Layer in korrekter Reihenfolge zeichnen (ohne Mutter hier)
        ctx.drawImage(layers.waterTextureLayer, 0, 0);
        drawScaledCentered(ctx, layers.lightLayer, 0.9);
        drawScaledCentered(ctx, layers.darkLayer, 0.9);
        ctx.drawImage(layers.befestigungLayer, 0, 0);
        ctx.drawImage(layers.randLayer, 0, 0);
        drawScaledCentered(ctx, layers.ziffernblattLayer, 0.9);

        // Zeiger hinzufügen
        await drawClockHands(ctx, finalCanvas.width, finalCanvas.height);

        // Mutter als oberste Ebene hinzufügen (nach den Zeigern)
        const mutterImage = await loadImageFromUrl('https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/Mutter.png');
        if (mutterImage) {
            drawScaledCentered(ctx, mutterImage, 0.9);
            console.log('Mutter-Ebene als oberste Schicht hinzugefügt');
        } else {
            console.warn('Mutter-Bild konnte nicht geladen werden');
        }

        return finalCanvas.toDataURL('image/jpeg', 0.1);
        
    } catch (error) {
        console.error('Fehler beim Erstellen des Vorschaubildes:', error);
        return null;
    }
}
// Neue Funktion zum Zeichnen der Zeiger
async function drawClockHands(ctx, canvasWidth, canvasHeight) {
    try {
        const now = new Date();
        const h = now.getHours() % 12;
        const m = now.getMinutes();
        const s = now.getSeconds();
        
        const hourAngle = (h * 30) + (m * 0.5) + (s * 0.00833);
        const minuteAngle = (m * 6) + (s * 0.1);
        
        // Stundenzeiger laden und zeichnen
        const hourHand = await loadImageFromUrl('https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/ZeigerStunde.png');
        if (hourHand) {
            drawRotatedImage(ctx, hourHand, canvasWidth / 2, canvasHeight / 2, hourAngle, canvasWidth, canvasHeight);
        }
        
        // Minutenzeiger laden und zeichnen
        const minuteHand = await loadImageFromUrl('https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/ZeigerMinute.png');
        if (minuteHand) {
            drawRotatedImage(ctx, minuteHand, canvasWidth / 2, canvasHeight / 2, minuteAngle, canvasWidth, canvasHeight);
        }
        
    } catch (error) {
        console.error('Fehler beim Zeichnen der Zeiger:', error);
    }
}

// Hilfsfunktion zum Laden von Bildern
function loadImageFromUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

// Hilfsfunktion zum Zeichnen rotierter Bilder
function drawRotatedImage(ctx, image, centerX, centerY, angle, canvasWidth, canvasHeight) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((angle * Math.PI) / 180);
    
    // Zeiger in derselben Größe wie in der 3D-Ansicht zeichnen
    const scale = 0.9; // Gleiche Skalierung wie lightLayer/darkLayer
    const width = canvasWidth * scale;
    const height = canvasHeight * scale;
    
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
}
async function createThumbnailFromPreview(previewDataUrl, thumbnailWidth = 100, thumbnailHeight = 100) {
    if (!previewDataUrl) return null;
    
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = thumbnailWidth;
        canvas.height = thumbnailHeight;
        
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = () => reject(new Error('Fehler beim Erstellen des Thumbnails'));
        img.src = previewDataUrl;
    });
}

async function createPreviewScreenshotForButton(slot, previewImage, previewContainer, searchText, btn) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
        // Für Button-Vorschaubilder immer neues Bild generieren (nicht gecachte verwenden)
        const dataUrl = await generatePreviewImage(false);
        
        // WICHTIG: Vorschaubild sowohl in savedMapData als auch in sessionStorage speichern
        savedMapData[slot].previewImage = dataUrl;
        
        // Auch in sessionStorage aktualisieren für Persistenz
        saveSavedDataToSessionStorage(slot, dataUrl);
        
        if (previewImage) previewImage.src = dataUrl;
        if (previewContainer) previewContainer.style.display = 'block';
        
        const textDiv = btn.querySelector('.button-text');
        if (textDiv) textDiv.textContent = searchText || 'unbenannt';
        
        btn.classList.add('has-data');
        btn.classList.remove('loading');
        btn.disabled = false;
        
        console.log(`Vorschaubild für ${slot} erfolgreich erstellt und gespeichert`);
        
    } catch (error) {
        console.error(`Fehler beim Erstellen des Vorschaubilds für ${slot}:`, error);
        
        btn.classList.remove('loading');
        btn.disabled = false;
        resetButtonState(btn);
        throw error;
    }
}

function getCachedLayers() {
    return checkCacheValidityOnDemand() ? layerCache : null;
}

function setCachedLayers(layers, mapState = null, iconState = null) {
    layerCache = {
        ...layers,
        isValid: true,
        mapState: mapState || getCurrentMapState(),
        iconState: iconState || getCurrentIconState()
    };
    console.log('Layer-Cache von extern gesetzt');
}

// Funktion zum manuellen Invalidieren des Cache (falls extern benötigt)
function forceInvalidateCache() {
    invalidateLayerCache();
    console.log('Cache wurde manuell invalidiert');
}