function initializeLoadDataController() {
    // Laden der gespeicherten Daten beim Start
    loadSavedDataFromStorage();
    
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`load-data-btn-${i}`);
        const slot = `slot${i}`;
        
        if (!btn) continue;
        
        // Button-Status basierend auf gespeicherten Daten setzen
        updateButtonState(btn, slot, i);
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('close-icon')) return;
            handleLoadDataButton(btn, slot, i);
        });
        
        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            handleDeleteData(btn, slot, i);
        });
        
        const closeIcon = btn.querySelector('.close-icon');
        if (closeIcon) {
            closeIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteData(btn, slot, i);
            });
        }
    }
}

// NEU: Laden der gespeicherten Daten aus sessionStorage beim Start
function loadSavedDataFromStorage() {
    try {
        const storedData = sessionStorage.getItem('savedMapData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            // Merge mit vorhandenen savedMapData
            for (const slot in parsedData) {
                if (parsedData[slot]) {
                    savedMapData[slot] = parsedData[slot];
                }
            }
            console.log('Gespeicherte Kartendaten aus sessionStorage geladen');
        }
    } catch (error) {
        console.error('Fehler beim Laden der gespeicherten Daten:', error);
    }
}

// NEU: Speichern der Daten in sessionStorage
function saveSavedDataToStorage() {
    try {
        // Nur die Slots speichern, die Daten enthalten
        const dataToSave = {};
        for (const slot in savedMapData) {
            if (savedMapData[slot]) {
                dataToSave[slot] = savedMapData[slot];
            }
        }
        sessionStorage.setItem('savedMapData', JSON.stringify(dataToSave));
        console.log('Kartendaten in sessionStorage gespeichert');
    } catch (error) {
        console.error('Fehler beim Speichern in sessionStorage:', error);
    }
}

// VERBESSERT: Mobile-freundliche Button-Status-Aktualisierung
function updateButtonState(btn, slot, slotNumber) {
    if (savedMapData[slot]) {
        const data = savedMapData[slot];
        const textDiv = btn.querySelector('.button-text');
        const spanElement = btn.querySelector('span');
        const previewContainer = btn.querySelector('.preview-container');
        const previewImage = btn.querySelector('.preview-image');
        const closeIcon = btn.querySelector('.close-icon');

        btn.classList.add('has-data');

        const displayText = data.searchText || 'unbenannt';
        if (textDiv) textDiv.textContent = displayText;
        if (spanElement) spanElement.textContent = displayText;

        if (data.previewImage && previewImage && previewContainer) {
            previewImage.src = data.previewImage;
            previewContainer.style.display = 'block';
        }

        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

        if (closeIcon) {
            if (isMobile) {
                closeIcon.style.display = 'flex';
                closeIcon.style.opacity = '0.8';
            } else {
                // Wichtig: damit CSS-Hover greifen kann – NICHT display:none!
                closeIcon.style.display = '';
                closeIcon.style.opacity = '';
            }
        }

        console.log(`Button-Status für Slot ${slotNumber} wiederhergestellt`);
    } else {
        resetButtonState(btn);
    }
}


async function handleLoadDataButton(btn, slot, slotNumber) {
    const textDiv = btn.querySelector('.button-text');
    const spanElement = btn.querySelector('span');
    const previewContainer = btn.querySelector('.preview-container');
    const previewImage = btn.querySelector('.preview-image');
    
    btn.disabled = true;
    
    if (!savedMapData[slot]) {
        // Speichern-Modus
        const savingText = 'Speichert...';
        if (textDiv) textDiv.textContent = savingText;
        if (spanElement) spanElement.textContent = savingText;
        btn.classList.add('loading');
        
        try {
            // Kartendaten speichern
            saveMapData(slot);
            const searchText = document.getElementById('search-input')?.value.trim() || '';
            
            // Screenshot erstellen und Button-Status nach Fertigstellung aktualisieren
            await createPreviewScreenshotForButton(slot, previewImage, previewContainer, searchText, btn);
            
            // WICHTIG: Nach dem Speichern in sessionStorage speichern
            saveSavedDataToStorage();
            
            // Button-Status nach erfolgreichem Speichern aktualisieren
            updateButtonState(btn, slot, slotNumber);
            
            console.log(`Kartendaten erfolgreich in Slot ${slotNumber} gespeichert`);
            
        } catch (error) {
            console.error(`Fehler beim Speichern der Kartendaten in Slot ${slotNumber}:`, error);
            btn.classList.remove('loading');
            btn.disabled = false;
            resetButtonState(btn);
            alert(`Fehler beim Speichern der Kartendaten in Slot ${slotNumber}: ` + error.message);
        }
    } else {
        // Laden-Modus
        const currentText = (textDiv?.textContent || spanElement?.textContent) || '';
        const loadingText = 'Lädt...';
        if (textDiv) textDiv.textContent = loadingText;
        if (spanElement) spanElement.textContent = loadingText;
        btn.classList.add('loading');
        
        try {
            loadMapData(slot);
            setTimeout(() => {
                if (textDiv) textDiv.textContent = currentText;
                if (spanElement) spanElement.textContent = currentText;
                btn.classList.remove('loading');
                btn.disabled = false;
                // Button-Status nach dem Laden wiederherstellen
                updateButtonState(btn, slot, slotNumber);
                console.log(`Kartendaten erfolgreich aus Slot ${slotNumber} geladen`);
            }, 3000);
        } catch (error) {
            console.error(`Fehler beim Laden der Kartendaten aus Slot ${slotNumber}:`, error);
            if (textDiv) textDiv.textContent = currentText;
            if (spanElement) spanElement.textContent = currentText;
            btn.classList.remove('loading');
            btn.disabled = false;
            alert(`Fehler beim Laden der Kartendaten aus Slot ${slotNumber}: ` + error.message);
        }
    }
}

// NEU: Mobile-freundliche Löschfunktion
function handleDeleteData(btn, slot, slotNumber) {
    if (!savedMapData[slot]) return;
    
    const searchText = savedMapData[slot].searchText || 'Unbenannte Karte';
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    
    let shouldDelete = false;
    
    if (isMobile) {
        // Mobile: Direkt löschen ohne Bestätigung
        shouldDelete = true;
    } else {
        // Desktop: Mit Bestätigung
        shouldDelete = confirm(`Gespeicherte Daten "${searchText}" aus Slot ${slotNumber} löschen?`);
    }
    
    if (!shouldDelete) return;
    
    savedMapData[slot] = null;
    resetButtonState(btn);
    
    // WICHTIG: Nach dem Löschen auch aus sessionStorage entfernen
    saveSavedDataToStorage();
    
    console.log(`Kartendaten aus Slot ${slotNumber} gelöscht`);
}

// VERBESSERT: Reset-Funktion für mobile Kompatibilität
function resetButtonState(btn) {
    const textDiv = btn.querySelector('.button-text');
    const spanElement = btn.querySelector('span');
    const previewContainer = btn.querySelector('.preview-container');
    const closeIcon = btn.querySelector('.close-icon');
    
    // Text zurücksetzen
    if (textDiv) textDiv.textContent = 'speichern';
    if (spanElement) spanElement.textContent = 'speichern';
    
    // Vorschau verstecken
    if (previewContainer) previewContainer.style.display = 'none';
    
    // Close-Icon verstecken
    if (closeIcon) {
        closeIcon.style.display = 'none';
        closeIcon.style.opacity = '';
    }
    
    btn.classList.remove('has-data', 'loading');
    btn.disabled = false;
}

// NEU: Funktion zur Überwachung von Größenänderungen und Mobile-Anpassung
function handleMobileButtonStates() {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`load-data-btn-${i}`);
        const slot = `slot${i}`;
        const closeIcon = btn?.querySelector('.close-icon');
        
        if (!btn || !closeIcon) continue;
        
        if (savedMapData[slot] && isMobile) {
            // Auf mobilen Geräten Close-Icon immer anzeigen wenn Daten vorhanden
            closeIcon.style.display = 'flex';
            closeIcon.style.opacity = '0.8';
        } else if (savedMapData[slot] && !isMobile) {
            // Auf Desktop nur bei Hover anzeigen (via CSS)
            closeIcon.style.display = '';
            closeIcon.style.opacity = '';
        }
    }
}

// Event-Listener für Größenänderungen
window.addEventListener('resize', handleMobileButtonStates);
window.addEventListener('orientationchange', handleMobileButtonStates);

// Rest der Funktionen bleibt unverändert...
function saveMapData(slot = 'slot1') {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const container = document.getElementById('scaled-container');
    const placedBoxes = container.querySelectorAll('.placed-box');
    const searchText = document.getElementById('search-input')?.value.trim() || '';
    
    const icons = Array.from(placedBoxes).map(box => {
        const boxRect = box.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const absoluteLeft = (boxRect.left - containerRect.left) / ZOOM;
        const absoluteTop = (boxRect.top - containerRect.top) / ZOOM;
        
        return {
            type: box.dataset.iconType || 'unknown',
            size: box.dataset.iconSize || 'medium',
            x: parseFloat((absoluteLeft / container.offsetWidth * 100).toFixed(2)),
            y: parseFloat((absoluteTop / container.offsetHeight * 100).toFixed(2))
        };
    });
    
    const mapData = {
        coordinates: {
            lat: parseFloat(center.lat.toFixed(6)),
            lng: parseFloat(center.lng.toFixed(6))
        },
        zoom: parseFloat(zoom.toFixed(2)),
        searchText,
        icons,
        timestamp: new Date().toISOString(),
        previewImage: null // Wird später von createPreviewScreenshotForButton gesetzt
    };
    
    savedMapData[slot] = mapData;
    console.log(`=== Kartendaten in ${slot} gespeichert ===`);
    console.log('Koordinaten:', mapData.coordinates);
    console.log('Zoom-Level:', mapData.zoom);
    console.log('Suchtext:', mapData.searchText || 'Kein Text eingegeben');
    console.log('Anzahl Icons:', mapData.icons.length);
    console.log('Icons Details:', mapData.icons);
    console.log('Zeitstempel:', mapData.timestamp);
    console.log('=====================================');
    
    return mapData;
}

function loadMapData(slot = 'slot1') {
    if (!savedMapData[slot]) {
        alert(`Keine gespeicherten Kartendaten in ${slot} verfügbar.`);
        return;
    }
    
    const data = savedMapData[slot];
    
    if (!data.coordinates || data.coordinates.lng === undefined || data.coordinates.lat === undefined) {
        console.error('Ungültige Kartendaten - fehlende Koordinaten:', data);
        alert(`Ungültige Kartendaten in ${slot} - fehlende Koordinaten.`);
        return;
    }

    removeIconsWithAnimation();
    
    const searchInput = document.getElementById('search-input');
    if (searchInput && data.searchText) {
        searchInput.value = data.searchText;
        if (typeof adjustFontSizeToFit === 'function') adjustFontSizeToFit(searchInput);
    }
    
    map.flyTo({
        center: [data.coordinates.lng, data.coordinates.lat],
        zoom: data.zoom || 12,
        duration: 2000
    });
    
    setTimeout(() => {
        if (data.icons && Array.isArray(data.icons)) loadIconsFromData(data.icons);
    }, 2500);
}

// Zentralisierte Icon-Verwaltung über IconAnimationManager
async function loadIconsFromData(iconsData) {
    console.log('Lade Icons aus gespeicherten Daten:', iconsData);
    
    const container = document.getElementById('scaled-container');
    if (!container || !iconsData || !Array.isArray(iconsData)) return;
    
    // Verwende den zentralisierten IconAnimationManager
    await iconAnimationManager.replaceAllIcons(iconsData);
    
    console.log(`${iconsData.length} Icons aus gespeicherten Daten geladen`);
}

// Hilfsfunktionen für Kompatibilität mit anderen Modulen
function getIconSVGByType(iconType) {
    if (typeof ICONS_CONFIG !== 'undefined' && ICONS_CONFIG[iconType]) {
        const iconUrl = ICONS_CONFIG[iconType].url;
        return iconUrl ? `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><image href="${iconUrl}" width="30" height="30"/></svg>` : null;
    }
    return null;
}

function getIconUrlByType(iconType) {
    if (typeof ICONS_CONFIG !== 'undefined' && ICONS_CONFIG[iconType]) {
        return ICONS_CONFIG[iconType].url;
    }
    return null;
}

// Wrapper-Funktionen für Kompatibilität
function updateIconSizesAfterLoad() {
    iconAnimationManager.updateIconSizes();
}

function removeIconsWithAnimation() {
    return iconAnimationManager.removeAllIcons(false);
}