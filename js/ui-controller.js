// Haupt UI Controller - koordiniert alle UI Module

function initializeUI() {
    setupDragAndDrop();
    setupSearchInput();
    setupDownloadButton();
    setupIconSizeSlider();
}

// JavaScript Code für die Hilfe-Funktionalität
// Füge diesen Code zu einer deiner bestehenden JS-Dateien hinzu oder erstelle eine neue

document.addEventListener('DOMContentLoaded', function() {
    const helpButton = document.getElementById('marker-help-btn');
    const helpPopup = document.getElementById('marker-help-popup');
    const closeButton = document.getElementById('marker-help-close');

    // Hilfe-Popup öffnen
    helpButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        helpPopup.classList.add('show');
        
        // Fokus auf Schließen-Button setzen für Barrierefreiheit
        setTimeout(() => {
            closeButton.focus();
        }, 100);
    });

    // Hilfe-Popup schließen über Schließen-Button
    closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        helpPopup.classList.remove('show');
        
        // Fokus zurück auf Hilfe-Button
        setTimeout(() => {
            helpButton.focus();
        }, 100);
    });

    // Hilfe-Popup schließen beim Klick auf Overlay
    helpPopup.addEventListener('click', function(e) {
        if (e.target === helpPopup) {
            helpPopup.classList.remove('show');
        }
    });

    // Hilfe-Popup schließen mit Escape-Taste
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && helpPopup.classList.contains('show')) {
            helpPopup.classList.remove('show');
            helpButton.focus();
        }
    });

    // Verhindere Propagation innerhalb des Popup-Contents
    const popupContent = document.querySelector('.help-popup-content');
    if (popupContent) {
        popupContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});