class MapScaleManager {
  constructor() {
    this.state = {
      current: null,
      lastWrapperSize: null,
      styles: {}
    };

    this.init();
  }

  init() {
    this.state.current = 'dynamic';
    this.calculateStyles();
    this.injectStyles();
    this.applyStyles();
    this.state.lastWrapperSize = { ...this.state.styles.dynamic.wrapperSize };
    this.setupResizeListener();
  }

  getWrapperSize() {
    const wrapper = document.getElementById('main-wrapper');
    if (!wrapper) return { width: window.innerWidth, height: window.innerHeight };
    const rect = wrapper.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  calculateStyles() {
    const { REFERENCE_MAP, REFERENCE_WRAPPER, AUTO_ADJUST } = MAP_SIZE_CONFIG;
    const wrapperSize = this.getWrapperSize();

    const widthFactor = AUTO_ADJUST ? REFERENCE_WRAPPER.width / wrapperSize.width : 1;
    const heightFactor = AUTO_ADJUST ? REFERENCE_WRAPPER.height / wrapperSize.height : 1;

    const mapWidth = REFERENCE_MAP.width * widthFactor;
    const mapHeight = REFERENCE_MAP.height * heightFactor;
    const scale = this.calculateScale(mapWidth);

    this.state.styles.dynamic = {
      width: `${mapWidth}%`,
      height: `${mapHeight}%`,
      transform: `translate(-50%, -50%) scale(${scale.toFixed(6)})`,
      wrapperSize: { ...wrapperSize }
    };
  }

  calculateScale(widthPercent) {
    return widthPercent > 0 ? (MAP_SCALE_CONFIG?.TARGET_PRODUCT || 100) / widthPercent : 1;
  }

  injectStyles() {
    const existing = document.getElementById('dynamic-map-styles');
    if (existing) existing.remove();

    const style = this.state.styles.dynamic;

    const styleTag = document.createElement('style');
    styleTag.id = 'dynamic-map-styles';
    styleTag.textContent = `
      #map {
        width: ${style.width} !important;
        height: ${style.height} !important;
        transform: ${style.transform} !important;
      }
    `.trim();

    document.head.appendChild(styleTag);
  }

  applyStyles() {
    const el = document.getElementById('map');
    if (!el) return;
    const style = this.state.styles.dynamic;
    if (!style) return;

    Object.assign(el.style, {
      width: style.width,
      height: style.height,
      transform: style.transform
    });
  }

  rescaleIcons() {
    const icons = document.querySelectorAll('.placed-box');
    const current = this.state.styles.dynamic.wrapperSize;
    const last = this.state.lastWrapperSize;

    // Update `lastWrapperSize` in any case to keep reference current
    this.state.lastWrapperSize = { ...current };

    if (!icons.length || !last) return;

    const scaleX = current.width / last.width;
    const scaleY = current.height / last.height;

    icons.forEach(icon => {
      const left = parseFloat(icon.style.left) || 0;
      const top = parseFloat(icon.style.top) || 0;
      icon.style.left = `${left * scaleX}px`;
      icon.style.top = `${top * scaleY}px`;
    });

    if (typeof updateDragIconsStatus === 'function') {
      updateDragIconsStatus();
    }
  }

  handleResize() {
    const currentWrapperSize = this.getWrapperSize();
    const lastWrapperSize = this.state.lastWrapperSize;

    const hasChanged =
      !lastWrapperSize ||
      currentWrapperSize.width !== lastWrapperSize.width ||
      currentWrapperSize.height !== lastWrapperSize.height;

    if (hasChanged) {
      this.calculateStyles();
      this.injectStyles();
      this.applyStyles();
      setTimeout(() => this.rescaleIcons(), 0);
    }
  }

  setupResizeListener() {
    window.addEventListener('resize', () => this.handleResize());
  }

  recalculateIconPositions() {
    this.rescaleIcons();
  }

  getDebugInfo() {
    return {
      styles: this.state.styles,
      lastWrapperSize: this.state.lastWrapperSize
    };
  }
}

// Global instance + API
let mapScaleManager;

function initializeMapScale() {
  mapScaleManager = new MapScaleManager();
}

function recalculateIconPositions() {
  mapScaleManager?.recalculateIconPositions();
}

// Global accessors
Object.assign(window, {
  initializeMapScale,
  initializeOptimizedMapScale: initializeMapScale,
  recalculateIconPositions,
  getCurrentBreakpoint: () => 'dynamic',
  getCalculatedMapStyles: () => mapScaleManager?.state.styles,
  getLastWrapperSize: () => mapScaleManager?.state.lastWrapperSize
});
