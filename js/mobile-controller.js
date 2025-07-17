    function handleMobileLayout() {
        const mainWrapper = document.getElementById('main-wrapper');
        const markerSection = document.querySelector('.section:first-child');
        const savedClocksSection = document.querySelector('.section-bottom');
        
        if (window.innerWidth <= 768) {
            // Mobile Ansicht
            let mobileContainer = document.querySelector('.mobile-map-container');
            
            // Container erstellen falls nicht vorhanden
            if (!mobileContainer) {
                mobileContainer = document.createElement('div');
                mobileContainer.className = 'mobile-map-container';
                
                // Container zwischen Marker-Sektion und Gespeicherte Uhren einfügen
                if (markerSection && savedClocksSection) {
                    markerSection.parentNode.insertBefore(mobileContainer, savedClocksSection);
                }
            }
            
            // Main-Wrapper in den mobilen Container verschieben
            if (mainWrapper && mobileContainer && !mobileContainer.contains(mainWrapper)) {
                mobileContainer.appendChild(mainWrapper);
            }
        } else {
            // Desktop Ansicht
            const mapSection = document.getElementById('map-section');
            const mobileContainer = document.querySelector('.mobile-map-container');
            
            // Main-Wrapper zurück in die Map-Section verschieben
            if (mainWrapper && mapSection && !mapSection.contains(mainWrapper)) {
                mapSection.appendChild(mainWrapper);
            }
            
            // Mobilen Container entfernen falls vorhanden
            if (mobileContainer) {
                mobileContainer.remove();
            }
        }
    }

// Mobile Attribution Repositioning
function repositionAttributionMobile() {
  const attribution = document.getElementById('attribution-wrapper');
  const mainWrapper = document.getElementById('main-wrapper');
  const mapSection = document.getElementById('map-section');
  
  if (window.innerWidth <= 768) {
    // Move attribution after main-wrapper on mobile
    if (attribution && mainWrapper && mapSection) {
      // Remove from current position
      if (attribution.parentNode) {
        attribution.parentNode.removeChild(attribution);
      }
      // Insert after main-wrapper
      mainWrapper.insertAdjacentElement('afterend', attribution);
    }
  } else {
    // Move attribution back inside scaled-container for desktop
    const scaledContainer = document.getElementById('scaled-container');
    if (attribution && scaledContainer) {
      // Remove from current position
      if (attribution.parentNode) {
        attribution.parentNode.removeChild(attribution);
      }
      // Insert back into scaled-container
      scaledContainer.appendChild(attribution);
    }
  }
}

// Call on page load and resize
window.addEventListener('load', repositionAttributionMobile);
window.addEventListener('resize', repositionAttributionMobile);

// Call immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', repositionAttributionMobile);
} else {
  repositionAttributionMobile();
}

    // Event Listener
    window.addEventListener('load', handleMobileLayout);
    window.addEventListener('resize', handleMobileLayout);
    
    // Für sofortige Ausführung
    document.addEventListener('DOMContentLoaded', handleMobileLayout);