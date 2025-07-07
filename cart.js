// Sammle aktuelle Icon-Daten
function collectCurrentIconData() {
    try {
        const container = document.getElementById('scaled-container');
        if (!container) return [];
        
        const icons = [];
        const placedBoxes = container.querySelectorAll('.placed-box');
        
        placedBoxes.forEach(box => {
            const iconData = {
                type: box.dataset.iconType,
                size: box.dataset.iconSize,
                left: box.style.left,
                top: box.style.top,
                transform: box.style.transform || ''
            };
            icons.push(iconData);
        });
        
        return icons;
    } catch (error) {
        console.error('Fehler beim Sammeln der Icon-Daten:', error);
        return [];
    }
}

// Hauptfunktion zum Hinzufügen zum WooCommerce-Warenkorb
async function addToCartWithPreview() {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (!addToCartBtn) return;
    
    const originalText = addToCartBtn.innerHTML;
    addToCartBtn.innerHTML = '<span>🔄 Wird hinzugefügt...</span>';
    addToCartBtn.disabled = true;
    
    try {
        // 1. Karten- und Markerdaten sammeln
        let mapCenter, zoom, markerCount;
        
        try {
            mapCenter = map.getCenter();
            zoom = map.getZoom();
            markerCount = typeof getMarkerCount === 'function' ? getMarkerCount() : 0;
        } catch (error) {
            console.error('Fehler beim Zugriff auf Kartenfunktionen:', error);
            mapCenter = { lng: 0, lat: 0 };
            zoom = 1;
            markerCount = 0;
        }
        
        // 2. Suchtext und Icons sammeln
        const searchInput = document.getElementById('search-input');
        const currentSearchText = searchInput ? searchInput.value : '';
        const currentIcons = collectCurrentIconData();
        
        // 3. Vorschaubild generieren
        const forceUseCachedLayers = typeof isIn3DView !== 'undefined' && isIn3DView;
        const previewImage = await generatePreviewImage(forceUseCachedLayers);
        
        // 4. Konfiguration für WooCommerce erstellen
        const config = {
            product_id: 421, // Ihre WooCommerce Produkt-ID
            productName: `Gridclock'd - ${currentSearchText}`,
            mapCenter: [mapCenter.lng, mapCenter.lat],
            zoom: zoom,
            markerCount: markerCount,
            price: 69.99,
            searchText: currentSearchText,
            icons: currentIcons,
            previewImage: previewImage,
            timestamp: new Date().toISOString()
        };
        
        // 5. Daten an WooCommerce senden (Cookie + Redirect)
        const configStr = encodeURIComponent(JSON.stringify(config));
        document.cookie = `clock_config=${configStr}; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
        window.location.href = `https://uhrensoehne.shop/?add-to-cart=${config.product_id}`;
        
    } catch (error) {
        console.error('Fehler beim Hinzufügen zum Warenkorb:', error);
        alert('Fehler beim Hinzufügen zum Warenkorb: ' + error.message);
    } finally {
        addToCartBtn.innerHTML = originalText;
        addToCartBtn.disabled = false;
    }
}

// Hilfsfunktion zum Speichern eines spezifischen Slots in sessionStorage
function saveSavedDataToSessionStorage(slot, previewImage) {
    try {
        const storedData = JSON.parse(sessionStorage.getItem('savedMapData') || '{}');
        if (savedMapData[slot]) {
            storedData[slot] = {
                ...savedMapData[slot],
                previewImage: previewImage
            };
            sessionStorage.setItem('savedMapData', JSON.stringify(storedData));
        }
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
    }
}

// Initialisierung
function initCartFunctions() {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addToCartWithPreview();
        });
    }
}

// Warten bis die Karte bereit ist
if (typeof map !== 'undefined' && typeof map.getCenter === 'function') {
    initCartFunctions();
} else {
    document.addEventListener('maplibre-loaded', initCartFunctions);
}