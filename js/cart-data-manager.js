// Sammle aktuelle Icon-Daten
function collectCurrentIconData() {
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
    
    console.log('Aktuelle Icon-Daten gesammelt:', icons);
    return icons;
}

// Hauptfunktion zum Hinzufügen von Produkten zum Warenkorb mit Vorschaubild
async function addToCartWithPreview() {
    const mapCenter = map.getCenter();
    const zoom = map.getZoom();
    const markerCount = getMarkerCount();
    
    // Sammle alle aktuellen Daten
    const searchInput = document.getElementById('search-input');
    const currentSearchText = searchInput ? searchInput.value : '';
    const currentIcons = collectCurrentIconData();
    
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const originalText = addToCartBtn.innerHTML;
    addToCartBtn.innerHTML = '<span>🔄 Bild wird erstellt...</span>';
    addToCartBtn.disabled = true;
    
    try {
        // Prüfe ob wir in der 3D-Ansicht sind (isIn3DView ist global verfügbar)
        const forceUseCachedLayers = typeof isIn3DView !== 'undefined' && isIn3DView;
        
        if (forceUseCachedLayers) {
            console.log('Warenkorb-Hinzufügung in 3D-Ansicht: Verwende gecachte Layer');
        }
        
        // Verwende gecachte Layer wenn in 3D-Ansicht, sonst immer aktuelles Vorschaubild generieren
        const previewImage = await generatePreviewImage(forceUseCachedLayers);
        
        const cartItem = {
	    productName: `Gridclock'd - ${currentSearchText}`,
            mapCenter: [mapCenter.lng, mapCenter.lat],
            zoom: zoom,
            markerCount: markerCount,
            price: 69.99,
            timestamp: Date.now(),
            previewImage: previewImage,
            // Speichere zusätzliche Bearbeitungsdaten
            searchText: currentSearchText,
            icons: currentIcons
        };
        
        const currentCart = JSON.parse(sessionStorage.getItem('cart') || '[]');
        currentCart.push({...cartItem, quantity: 1, id: Date.now()});
        sessionStorage.setItem('cart', JSON.stringify(currentCart));
        
        window.location.href = '../cart/index.html';
        
    } catch (error) {
        console.error('Fehler beim Hinzufügen zum Warenkorb:', error);
        alert('Fehler beim Hinzufügen zum Warenkorb');
    } finally {
        addToCartBtn.innerHTML = originalText;
        addToCartBtn.disabled = false;
    }
}

// Hilfsfunktion zum Speichern eines spezifischen Slots in sessionStorage
function saveSavedDataToSessionStorage(slot, previewImage) {
    try {
        // Aktuelle Daten aus sessionStorage laden
        const storedData = JSON.parse(sessionStorage.getItem('savedMapData') || '{}');
        
        // Spezifischen Slot mit Vorschaubild aktualisieren
        if (savedMapData[slot]) {
            storedData[slot] = {
                ...savedMapData[slot],
                previewImage: previewImage
            };
        }
        
        // Zurück in sessionStorage speichern
        sessionStorage.setItem('savedMapData', JSON.stringify(storedData));
        console.log(`${slot} mit Vorschaubild in sessionStorage gespeichert`);
        
    } catch (error) {
        console.error('Fehler beim Speichern des Vorschaubilds in sessionStorage:', error);
    }
}