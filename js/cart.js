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

// Sicherer Zugriff auf die Karte
function getMapCenter() {
    try {
        if (window.map && typeof window.map.getCenter === 'function') {
            const center = window.map.getCenter();
            return [center.lng, center.lat];
        }
    } catch (error) {
        console.error('Fehler beim Zugriff auf Kartencenter:', error);
    }
    return null;
}

function getMapZoom() {
    try {
        if (window.map && typeof window.map.getZoom === 'function') {
            return window.map.getZoom();
        }
    } catch (error) {
        console.error('Fehler beim Zugriff auf Zoom-Level:', error);
    }
    return null;
}

// Generiere Konfigurationsdaten für WooCommerce
function generateWooCommerceConfig() {
    const searchInput = document.getElementById('search-input');
    const currentSearchText = searchInput ? searchInput.value : '';
    
    return {
        product_id: 421, // Ihre WooCommerce Produkt-ID
        map_center: getMapCenter(),
        zoom: getMapZoom(),
        search_text: currentSearchText,
        icons: collectCurrentIconData(),
        timestamp: new Date().toISOString()
    };
}

// Hauptfunktion zum Hinzufügen zum WooCommerce-Warenkorb
async function addToWooCommerceCart() {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (!addToCartBtn) return;
    
    const originalText = addToCartBtn.innerHTML;
    addToCartBtn.innerHTML = '<span>🔄 Wird hinzugefügt...</span>';
    addToCartBtn.disabled = true;
    
    try {
        // 1. Konfiguration erstellen
        const config = generateWooCommerceConfig();
        
        // 2. Screenshot erstellen (falls verfügbar)
        let screenshotData = '';
        try {
            if (typeof getScreenshotAsDataURL === 'function') {
                screenshotData = await getScreenshotAsDataURL();
                config.screenshot = screenshotData;
            }
        } catch (e) {
            console.error('Screenshot konnte nicht erstellt werden:', e);
        }
        
        // 3. Daten an WooCommerce senden
        const configStr = encodeURIComponent(JSON.stringify(config));
        document.cookie = `clock_config=${configStr}; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
        window.location.href = `https://uhrensoehne.shop/?add-to-cart=${config.product_id}`;
        
    } catch (error) {
        console.error('Fehler beim Hinzufügen zum Warenkorb:', error);
        alert('Fehler: ' + error.message);
    } finally {
        addToCartBtn.innerHTML = originalText;
        addToCartBtn.disabled = false;
    }
}

// Event Listener für den Warenkorb-Button
function initCartButton() {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addToWooCommerceCart();
        });
    }
}

// Initialisierung wenn die Karte bereit ist
if (typeof map !== 'undefined') {
    initCartButton();
} else {
    document.addEventListener('maplibre-loaded', initCartButton);
}