// engraving-controller.js
class EngravingController {
    constructor() {
        this.currentView = 'map';
        this.engravingText = '';
        this.textElement = null;
        this.init();
    }

    init() {
        this.createTextContainer();
        this.bindEvents();
        this.updateCharacterCount();
    }

    createTextContainer() {
        // Altes Input entfernen falls vorhanden
        const oldInput = document.getElementById('engraving-input');
        if (oldInput) {
            oldInput.remove();
        }

        const engravingTextArea = document.getElementById('engraving-text-area');
        if (!engravingTextArea) return;

        // Einfaches Textfeld erstellen
        this.textElement = document.createElement('textarea');
        this.textElement.id = 'engraving-interactive-text';
        this.textElement.placeholder = 'Klicken Sie hier, um Ihren Text einzugeben...';
        this.textElement.maxLength = 200;
        
        // Styling für rundes Textfeld
        Object.assign(this.textElement.style, {
            position: 'absolute',
            width: '320px',
            height: '320px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            outline: 'none',
            border: '2px solid #3e2311',
            background: 'transparent',
            color: '#3e2311',
            fontFamily: '"Courier New", monospace',
            fontSize: '14px',
            fontWeight: '600',
            lineHeight: '18px',
            textAlign: 'center',
            resize: 'none',
            padding: '40px 20px 20px 20px',
            zIndex: '10',
            overflowY: 'auto',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none'  // IE/Edge
        });

        // Webkit Scrollbar verstecken
        const style = document.createElement('style');
        style.textContent = `
            #engraving-interactive-text::-webkit-scrollbar {
                display: none;
            }
        `;
        document.head.appendChild(style);

        // Event Listeners
        this.textElement.addEventListener('input', () => {
            this.engravingText = this.textElement.value;
            this.formatTextInCircle();
            this.updateCharacterCount();
        });

        this.textElement.addEventListener('keydown', (e) => {
            // Begrenze Zeichen
            if (this.textElement.value.length >= 200 && 
                !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
            }
        });

        engravingTextArea.appendChild(this.textElement);
    }

    formatTextInCircle() {
        if (!this.textElement) return;

        const text = this.textElement.value;
        if (!text.trim()) return;

        // Kreisförmige Textanpassung durch CSS
        const radius = 160;
        const lineHeight = 18;
        const lines = Math.floor((radius * 2) / lineHeight);
        
        // Berechne für jede Zeile die maximale Breite basierend auf der Kreisform
        let formattedText = '';
        const words = text.split(' ');
        let wordIndex = 0;
        
        for (let line = 0; line < lines && wordIndex < words.length; line++) {
            // Berechne Y-Position der Zeile (von oben)
            const y = (line * lineHeight) - radius + (lineHeight / 2);
            
            // Berechne maximale Breite für diese Zeile basierend auf Kreisform
            const distanceFromCenter = Math.abs(y);
            const maxWidth = distanceFromCenter < radius ? 
                2 * Math.sqrt(radius * radius - distanceFromCenter * distanceFromCenter) : 0;
            
            // Geschätzte Zeichen pro Zeile (basierend auf Schriftbreite)
            const charsPerLine = Math.floor(maxWidth / 8); // 8px pro Zeichen (Schätzung für Courier New)
            
            // Füge Wörter zur aktuellen Zeile hinzu
            let currentLine = '';
            while (wordIndex < words.length) {
                const nextWord = words[wordIndex];
                const testLine = currentLine + (currentLine ? ' ' : '') + nextWord;
                
                if (testLine.length <= charsPerLine) {
                    currentLine = testLine;
                    wordIndex++;
                } else {
                    break;
                }
            }
            
            if (currentLine) {
                formattedText += currentLine + (line < lines - 1 ? '\n' : '');
            }
        }
        
        // Setze den formatierten Text (nur wenn er sich unterscheidet)
        if (this.textElement.value !== formattedText && formattedText) {
            const cursorPos = this.textElement.selectionStart;
            this.textElement.value = formattedText;
            this.textElement.setSelectionRange(cursorPos, cursorPos);
        }
    }

    bindEvents() {
        // View-Buttons
        const mapViewBtn = document.getElementById('map-view-btn');
        const engravingViewBtn = document.getElementById('engraving-view-btn');

        if (mapViewBtn) {
            mapViewBtn.addEventListener('click', () => this.switchToMapView());
        }

        if (engravingViewBtn) {
            engravingViewBtn.addEventListener('click', () => this.switchToEngravingView());
        }
    }

    switchToMapView() {
        this.currentView = 'map';
        this.updateView();
        this.updateActiveButton();
    }

    switchToEngravingView() {
        this.currentView = 'engraving';
        this.updateView();
        this.updateActiveButton();
    }

    updateView() {
        const mapContainer = document.getElementById('map-container');
        const engravingContainer = document.getElementById('engraving-container');
        const searchInput = document.getElementById('search-input');
        const imageOverlay = document.getElementById('image-overlay');
        const imageOverlayWood = document.getElementById('image-overlay-wood');
        const clockHandsOverlay = document.getElementById('clock-hands-overlay');
        const placedBoxes = document.querySelectorAll('.placed-box');

        if (this.currentView === 'map') {
            // Karten-Ansicht anzeigen
            if (mapContainer) mapContainer.style.display = 'block';
            if (engravingContainer) engravingContainer.style.display = 'none';
            if (searchInput) searchInput.style.display = 'block';
            if (imageOverlay) imageOverlay.style.display = 'block';
            if (imageOverlayWood) imageOverlayWood.style.display = 'block';
            if (clockHandsOverlay) clockHandsOverlay.style.display = 'block';
            
            // Platzierte Icons anzeigen
            placedBoxes.forEach(box => {
                box.style.display = 'flex';
            });
        } else {
            // Gravur-Ansicht anzeigen
            if (mapContainer) mapContainer.style.display = 'none';
            if (engravingContainer) engravingContainer.style.display = 'block';
            if (searchInput) searchInput.style.display = 'none';
            if (imageOverlay) imageOverlay.style.display = 'none';
            if (imageOverlayWood) imageOverlayWood.style.display = 'none';
            if (clockHandsOverlay) clockHandsOverlay.style.display = 'none';
            
            // Platzierte Icons verstecken
            placedBoxes.forEach(box => {
                box.style.display = 'none';
            });
        }
    }

    updateActiveButton() {
        const mapViewBtn = document.getElementById('map-view-btn');
        const engravingViewBtn = document.getElementById('engraving-view-btn');

        if (mapViewBtn && engravingViewBtn) {
            if (this.currentView === 'map') {
                mapViewBtn.classList.add('active');
                engravingViewBtn.classList.remove('active');
            } else {
                mapViewBtn.classList.remove('active');
                engravingViewBtn.classList.add('active');
            }
        }
    }

    updateCharacterCount() {
        const characterCount = document.getElementById('character-count');
        
        if (characterCount) {
            const currentLength = this.engravingText.length;
            const maxLength = 200;
            characterCount.textContent = `${currentLength}/${maxLength} Zeichen`;
            
            // Warnung bei zu vielen Zeichen
            if (currentLength > maxLength * 0.9) {
                characterCount.style.color = '#ff3b30';
            } else {
                characterCount.style.color = 'rgba(62, 35, 17, 0.7)';
            }
        }
    }

    getEngravingText() {
        return this.engravingText;
    }

    setEngravingText(text) {
        this.engravingText = text;
        if (this.textElement) {
            this.textElement.value = text;
            this.formatTextInCircle();
            this.updateCharacterCount();
        }
    }

    getCurrentView() {
        return this.currentView;
    }
}

// Controller initialisieren
document.addEventListener('DOMContentLoaded', () => {
    window.engravingController = new EngravingController();
});