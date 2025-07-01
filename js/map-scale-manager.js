class MapScaleManager {
  constructor() {
    this.breakpoints = {
      desktop: { width: 550, height: 550, mediaQuery: '(min-width: 1201px)' },
      mobile: { width: 400, height: 400, mediaQuery: '(max-width: 1200px)' }
    };
    
    this.state = {
      current: null,
      lastWrapperSize: null,
      styles: {}
    };
    
    this.init();
  }

  init() {
    this.calculateStyles();
    this.injectStyles();
    this.setupEventListeners();
    this.applyInitialStyles();
    console.log('Map scale manager initialized');
  }

  calculateStyles() {
    Object.entries(this.breakpoints).forEach(([key, config]) => {
      const mapSize = this.calculateMapSize(config);
      const scale = this.calculateScale(mapSize.width);
      
      this.state.styles[key] = {
        width: `${mapSize.width}%`,
        height: `${mapSize.height}%`,
        transform: `translate(-50%, -50%) scale(${scale.toFixed(6)})`,
        wrapperSize: config
      };
    });
  }

  calculateMapSize(wrapperDimensions) {
    if (!MAP_SIZE_CONFIG?.AUTO_ADJUST) return MAP_SIZE_CONFIG?.REFERENCE_MAP || { width: 100, height: 100 };
    
    const reference = MAP_SIZE_CONFIG.REFERENCE_WRAPPER;
    const widthFactor = reference.width / wrapperDimensions.width;
    const heightFactor = reference.height / wrapperDimensions.height;
    
    return {
      width: MAP_SIZE_CONFIG.REFERENCE_MAP.width * widthFactor,
      height: MAP_SIZE_CONFIG.REFERENCE_MAP.height * heightFactor
    };
  }

  calculateScale(widthPercent) {
    return widthPercent > 0 ? (MAP_SCALE_CONFIG?.TARGET_PRODUCT || 100) / widthPercent : 1;
  }

  injectStyles() {
    if (document.getElementById('dynamic-map-styles')) return;
    
    const styles = Object.entries(this.state.styles)
      .map(([key, style]) => {
        const mediaQuery = key === 'mobile' ? `@media ${this.breakpoints.mobile.mediaQuery}` : '';
        return `
          ${mediaQuery} {
            #map {
              width: ${style.width} !important;
              height: ${style.height} !important;
              transform: ${style.transform} !important;
            }
          }
        `.replace(/^\s+/gm, '');
      })
      .join('\n');

    const styleElement = document.createElement('style');
    styleElement.id = 'dynamic-map-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  getCurrentBreakpoint() {
    return window.innerWidth <= 1200 ? 'mobile' : 'desktop';
  }

  applyInitialStyles() {
    const breakpoint = this.getCurrentBreakpoint();
    this.state.current = breakpoint;
    this.state.lastWrapperSize = this.state.styles[breakpoint].wrapperSize;
    this.applyStyles();
  }

  applyStyles() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return console.warn('Map element not found');
    
    const breakpoint = this.getCurrentBreakpoint();
    const styles = this.state.styles[breakpoint];
    
    Object.assign(mapElement.style, {
      width: styles.width,
      height: styles.height,
      transform: styles.transform
    });
  }

  rescaleIcons() {
    const icons = document.querySelectorAll('.placed-box');
    if (!icons.length) return;

    const currentSize = this.state.styles[this.state.current].wrapperSize;
    const { lastWrapperSize } = this.state;
    
    if (!lastWrapperSize) return;
    
    const scaleX = currentSize.width / lastWrapperSize.width;
    const scaleY = currentSize.height / lastWrapperSize.height;
    
    icons.forEach((icon, index) => {
      const currentLeft = parseFloat(icon.style.left) || 0;
      const currentTop = parseFloat(icon.style.top) || 0;
      
      icon.style.left = `${currentLeft * scaleX}px`;
      icon.style.top = `${currentTop * scaleY}px`;
    });
    
    this.state.lastWrapperSize = { ...currentSize };
    
    // Update icon manager if available
    if (typeof updateDragIconsStatus === 'function') {
      updateDragIconsStatus();
    }
    
    console.log(`Icons rescaled with factors: ${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}`);
  }

  handleResize() {
    const newBreakpoint = this.getCurrentBreakpoint();
    const breakpointChanged = this.state.current !== newBreakpoint;
    
    if (breakpointChanged) {
      console.log(`Breakpoint changed: ${this.state.current} → ${newBreakpoint}`);
      this.state.current = newBreakpoint;
      
      // Apply styles and rescale icons after DOM update
      this.applyStyles();
      setTimeout(() => this.rescaleIcons(), 0);
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.handleResize());
  }

  // Public API
  recalculateIconPositions() {
    console.log('Manual icon recalculation triggered');
    this.rescaleIcons();
  }

  getDebugInfo() {
    return {
      currentBreakpoint: this.state.current,
      styles: this.state.styles,
      lastWrapperSize: this.state.lastWrapperSize
    };
  }
}

// Initialize and expose global functions
let mapScaleManager;

function initializeMapScale() {
  mapScaleManager = new MapScaleManager();
}

function initializeOptimizedMapScale() {
  initializeMapScale();
}

function recalculateIconPositions() {
  mapScaleManager?.recalculateIconPositions();
}

// Global exports
Object.assign(window, {
  initializeMapScale,
  initializeOptimizedMapScale,
  recalculateIconPositions,
  getCurrentBreakpoint: () => mapScaleManager?.state.current,
  getCalculatedMapStyles: () => mapScaleManager?.state.styles,
  getLastWrapperSize: () => mapScaleManager?.state.lastWrapperSize
});