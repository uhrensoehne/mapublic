let isIn3DView = false;

// Nach dem DOM-Load
document.addEventListener('DOMContentLoaded', function() {
    initializeOptimizedMapScale();
});

async function handleAddToCart() {
  if (isIn3DView) {
    await addToCartWithPreview();
    alert('Produkt wurde dem Warenkorb hinzugefügt!');
    // Warenkorb-Counter nach dem Hinzufügen aktualisieren
    updateCartCounter();
  } else {
    showDisclaimer();
  }
}

// NEUE FUNKTION: Warenkorb-Counter aktualisieren
function updateCartCounter() {
  const cartCountElement = document.getElementById('cart-count');
  const cartButton = document.getElementById('header-cart-btn');
  
  if (!cartCountElement) {
    console.warn('Cart count element nicht gefunden');
    return;
  }
  
  try {
    // Warenkorb-Daten aus sessionStorage laden
    const cartData = sessionStorage.getItem('cart');
    const cartItems = cartData ? JSON.parse(cartData) : [];
    
    // Gesamtanzahl der Produkte berechnen (mit Mengen)
    const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    // Counter-Element aktualisieren
    cartCountElement.textContent = totalCount;
    
    // Counter anzeigen/verstecken basierend auf der Anzahl
    if (totalCount > 0) {
      cartCountElement.classList.remove('hidden');
    } else {
      cartCountElement.classList.add('hidden');
    }
    
    console.log(`Warenkorb-Counter aktualisiert: ${totalCount} Artikel`);
    
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Warenkorb-Counters:', error);
    cartCountElement.textContent = '0';
    cartCountElement.classList.add('hidden');
  }
}

// NEUE FUNKTION: Warenkorb-Änderungen überwachen
function initializeCartWatcher() {
  // Initiale Aktualisierung beim Laden der Seite
  updateCartCounter();
  
  // Storage-Events überwachen (für Änderungen in anderen Tabs)
  window.addEventListener('storage', function(e) {
    if (e.key === 'cart') {
      updateCartCounter();
    }
  });
  
  // MutationObserver für sessionStorage-Änderungen (falls direkt geändert wird)
  // Da sessionStorage keine nativen Events hat, überwachen wir periodisch
  let lastCartData = sessionStorage.getItem('cart');
  
  setInterval(() => {
    const currentCartData = sessionStorage.getItem('cart');
    if (currentCartData !== lastCartData) {
      lastCartData = currentCartData;
      updateCartCounter();
    }
  }, 1000); // Überprüfung alle Sekunde
}

// ERWEITERTE FUNKTION: Warenkorb-Integration für "Trotzdem fortfahren"
async function handleContinueAnyway() {
  try {
    hideDisclaimer();
    await addToCartWithPreview();
    alert('Produkt wurde dem Warenkorb hinzugefügt!');
    updateCartCounter(); // Counter nach dem Hinzufügen aktualisieren
  } catch (error) {
    console.error('Fehler beim Hinzufügen zum Warenkorb:', error);
    alert('Fehler beim Hinzufügen zum Warenkorb. Bitte versuchen Sie es erneut.');
  }
}

function showViewer() {
    const scaledContainer = document.getElementById('scaled-container');
    document.getElementById('viewer-overlay').style.display = 'block';
    scaledContainer.classList.add('viewer-active');
    isIn3DView = true;
    
    if (typeof startClockUpdatesIn3D === 'function') {
        startClockUpdatesIn3D();
    }
}

function hideViewer() {
    const scaledContainer = document.getElementById('scaled-container');
    document.getElementById('viewer-overlay').style.display = 'none';
    scaledContainer.classList.remove('viewer-active');
    isIn3DView = false;
    
    if (typeof stopClockUpdatesIn3D === 'function') {
        stopClockUpdatesIn3D();
    }
    
    setTimeout(() => {
        if (typeof map !== 'undefined' && map) map.resize();
    }, 100);
}

function showDisclaimer() {
    document.getElementById('disclaimer-overlay').style.display = 'flex';
}

function hideDisclaimer() {
    document.getElementById('disclaimer-overlay').style.display = 'none';
}

function initializeApp() {
    const scaledContainer = document.getElementById('scaled-container');
    if (scaledContainer) {
        scaledContainer.style.cssText = `transform: scale(${ZOOM}); transform-origin: top left;`;
    }
    
    generateIconSidebar();
    
    initializeMap();
    initializeUI();
    initializeLoadDataController();
    initializeClockUpdater();
    
    // NEUE FUNKTION: Warenkorb-Watcher initialisieren
    initializeCartWatcher();
    
    setupEventListeners();
    setupResizeHandlers();
}
function setupEventListeners() {
    const downloadBtn = document.getElementById('download-btn');
    const closeViewerBtn = document.getElementById('close-viewer-btn');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const show3DBtn = document.getElementById('show-3d-btn');
    const continueAnywayBtn = document.getElementById('continue-anyway-btn');
    const disclaimerOverlay = document.getElementById('disclaimer-overlay');
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            this.style.display = 'none';
        });
    }
    
    if (closeViewerBtn) {
        closeViewerBtn.addEventListener('click', function() {
            hideViewer();
            if (downloadBtn) {
                downloadBtn.style.display = 'flex';
            }
        });
    }

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCart);
    }

    if (show3DBtn) {
        show3DBtn.addEventListener('click', function() {
            hideDisclaimer();
            if (downloadBtn) {
                downloadBtn.click();
            }
        });
    }

    if (continueAnywayBtn) {
        // GEÄNDERT: Verwende neue Funktion mit Counter-Update
        continueAnywayBtn.addEventListener('click', handleContinueAnyway);
    }
    
    if (disclaimerOverlay) {
        disclaimerOverlay.addEventListener('click', function(e) {
            if (e.target === disclaimerOverlay) {
                hideDisclaimer();
            }
        });
    }
}

function setupResizeHandlers() {
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            iconAnimationManager.updateIconSizes();
        });
        
        const container = document.getElementById('scaled-container');
        if (container) {
            resizeObserver.observe(container);
        }
    }

    window.addEventListener('resize', () => iconAnimationManager.updateIconSizes());
}

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function checkForEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const isEditMode = urlParams.get('edit') === 'true';
  
  if (isEditMode) {
    const editingData = sessionStorage.getItem('editingMapData');
    if (editingData) {
      try {
        const mapData = JSON.parse(editingData);
        console.log('Bearbeitungsmodus aktiviert - lade Kartendaten:', mapData);
        
        if (map && map.loaded()) {
          loadEditingData(mapData);
        } else {
          map.on('load', () => {
            setTimeout(() => loadEditingData(mapData), 1000);
          });
        }
        
        sessionStorage.removeItem('editingMapData');
        window.history.replaceState({}, document.title, window.location.pathname);
        
      } catch (error) {
        console.error('Fehler beim Laden der Bearbeitungsdaten:', error);
      }
    }
  }
}

function loadEditingData(mapData) {
  console.log('Lade Bearbeitungsdaten:', mapData);
  
  const searchInput = document.getElementById('search-input');
  if (searchInput && mapData.searchText) {
    searchInput.value = mapData.searchText;
    if (typeof adjustFontSizeToFit === 'function') {
      adjustFontSizeToFit(searchInput);
    }
  }
  
  if (mapData.mapCenter) {
    map.flyTo({
      center: [mapData.mapCenter[0], mapData.mapCenter[1]],
      zoom: mapData.zoom || 12,
      duration: 2000
    });
  }
  
  setTimeout(() => {
    if (mapData.icons && Array.isArray(mapData.icons)) {
      loadIconsFromEditingData(mapData.icons);
    }
  }, 2500);
}

async function loadIconsFromEditingData(iconsData) {
  console.log('Lade Icons aus Bearbeitungsdaten:', iconsData);
  
  const container = document.getElementById('scaled-container');
  await iconAnimationManager.replaceAllIcons(iconsData);
  
  console.log(`${iconsData.length} Icons aus Bearbeitungsdaten geladen`);
}

function updateIconCounter() {
  iconAnimationManager.updateIconStatus();
}

document.addEventListener('DOMContentLoaded', () => {
  checkForEditMode();
});

// NEUE FUNKTION: Manuelle Counter-Aktualisierung (für externe Aufrufe)
window.updateCartCounter = updateCartCounter;