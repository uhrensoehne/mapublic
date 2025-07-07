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

// Generiere Konfigurationsdaten für WooCommerce
function generateWooCommerceConfig() {
    const mapCenter = window.map?.getCenter();
    const zoom = window.map?.getZoom();
    const searchInput = document.getElementById('search-input');
    const currentSearchText = searchInput ? searchInput.value : '';
    
    return {
        product_id: 421, // Ihre WooCommerce Produkt-ID
        map_center: mapCenter ? [mapCenter.lng, mapCenter.lat] : null,
        zoom: zoom || null,
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
        await sendToWooCommerceCart(config);
        
    } catch (error) {
        console.error('Fehler beim Hinzufügen zum Warenkorb:', error);
        alert('Fehler beim Hinzufügen zum Warenkorb: ' + error.message);
    } finally {
        addToCartBtn.innerHTML = originalText;
        addToCartBtn.disabled = false;
    }
}

// Daten an WooCommerce senden
async function sendToWooCommerceCart(config) {
    // Methode 1: Einfache Weiterleitung (ohne AJAX)
    const configStr = encodeURIComponent(JSON.stringify(config));
    document.cookie = `clock_config=${configStr}; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
    window.location.href = `https://uhrensoehne.shop/?add-to-cart=${config.product_id}`;
    
    // Alternative Methode 2: AJAX Request (falls benötigt)
    /*
    try {
        const response = await fetch('https://uhrensoehne.shop/?wc-ajax=add_to_cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'add-to-cart': config.product_id,
                'custom_config': JSON.stringify(config)
            })
        });
        
        const data = await response.json();
        if (data.success) {
            window.location.href = 'https://uhrensoehne.shop/cart/';
        } else {
            throw new Error(data.message || 'Unbekannter Fehler');
        }
    } catch (error) {
        console.error('AJAX Fehler:', error);
        throw error;
    }
    */
}

// Event Listener für den Warenkorb-Button
document.addEventListener('DOMContentLoaded', function() {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addToWooCommerceCart();
        });
    }
});

// Hilfsfunktion zum Speichern von Daten (für gespeicherte Uhren)
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