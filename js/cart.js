// cart-data-manager.js - Vollständig integrierte Version

// 1. Konfiguration
const WOOCOMMERCE_PRODUCT_ID = 421;
const WOOCOMMERCE_CART_URL = 'https://uhrensoehne.shop/?add-to-cart=';
const COOKIE_NAME = 'clock_config';
const COOKIE_EXPIRE_DAYS = 30;

// 2. Hilfsfunktionen
function getSafeMapData() {
    try {
        return {
            center: window.map?.getCenter() || { lng: 0, lat: 0 },
            zoom: window.map?.getZoom() || 10,
            markerCount: typeof getMarkerCount === 'function' ? getMarkerCount() : 0
        };
    } catch (error) {
        console.error('Kartendaten nicht verfügbar:', error);
        return {
            center: { lng: 0, lat: 0 },
            zoom: 10,
            markerCount: 0
        };
    }
}

function collectIconData() {
    try {
        const icons = [];
        const boxes = document.querySelectorAll('#scaled-container .placed-box');
        
        boxes.forEach(box => {
            icons.push({
                type: box.dataset.iconType || 'default',
                size: box.dataset.iconSize || 'medium',
                left: box.style.left || '0',
                top: box.style.top || '0',
                transform: box.style.transform || ''
            });
        });
        return icons;
    } catch (error) {
        console.error('Icon-Daten konnten nicht gesammelt werden:', error);
        return [];
    }
}

// NEUE FUNKTION: Prepare WooCommerce Config
function prepareWooCommerceConfig(center, zoom, markerCount, searchText, previewImage) {
    return {
        product_id: WOOCOMMERCE_PRODUCT_ID,
        product_name: `Gridclock'd - ${searchText}`,
        map_center: [center.lng, center.lat],
        zoom: zoom,
        marker_count: markerCount,
        search_text: searchText,
        icons: collectIconData(),
        preview_image: previewImage,
        timestamp: new Date().toISOString(),
        price: 69.99
    };
}

// NEUE FUNKTION: Set WooCommerce Cookie (ersetzt setConfigCookie)
function setWooCommerceCookie(config) {
    try {
        const configStr = encodeURIComponent(JSON.stringify(config));
        const expires = new Date();
        expires.setDate(expires.getDate() + COOKIE_EXPIRE_DAYS);
        
        document.cookie = `${COOKIE_NAME}=${configStr}; ` +
                         `path=/; ` +
                         `expires=${expires.toUTCString()}; ` +
                         `SameSite=Lax; ` +
                         `${location.protocol === 'https:' ? 'Secure' : ''}`;
        return true;
    } catch (error) {
        console.error('Cookie konnte nicht gesetzt werden:', error);
        return false;
    }
}

// 3. Hauptfunktion (angepasst mit den neuen Funktionen)
async function addToCartWithPreview() {
    const btn = document.getElementById('add-to-cart-btn');
    if (!btn) return;

    // Button-Status aktualisieren
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>🔄 Wird verarbeitet...</span>';
    btn.disabled = true;

    try {
        // Daten sammeln
        const { center, zoom, markerCount } = getSafeMapData();
        const searchText = document.getElementById('search-input')?.value || '';
        
        // Vorschaubild generieren
        const useCached = typeof isIn3DView !== 'undefined' && isIn3DView;
        const previewImage = await generatePreviewImage(useCached).catch(() => '');

        // Konfiguration erstellen (mit neuer Funktion)
        const config = prepareWooCommerceConfig(
            center, 
            zoom, 
            markerCount, 
            searchText, 
            previewImage
        );

        console.log('Konfiguration:', config); // Debug-Ausgabe

        // Cookie setzen und weiterleiten (mit neuer Funktion)
        if (setWooCommerceCookie(config)) {
            window.location.href = `${WOOCOMMERCE_CART_URL}${WOOCOMMERCE_PRODUCT_ID}`;
        } else {
            throw new Error('Konfiguration konnte nicht gespeichert werden');
        }

    } catch (error) {
        console.error('Kritischer Fehler:', error);
        alert('Fehler: ' + error.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 4. Initialisierung
function initCart() {
    const btn = document.getElementById('add-to-cart-btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            addToCartWithPreview();
        });
    }
}

// 5. Start
if (document.readyState === 'complete') {
    initCart();
} else {
    window.addEventListener('DOMContentLoaded', initCart);
}