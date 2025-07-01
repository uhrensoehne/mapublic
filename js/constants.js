const ZOOM = 1;

// Icon-Konfiguration - zentrale Steuerung der Icongröße
const ICON_CONFIG = {
  SIZE_PERCENT: 5, // Prozent der Container-Größe (5% = 5% von width/height)
  MIN_SIZE_PX: 20, // Minimale Größe in Pixeln
  MAX_SIZE_PX: 80, // Maximale Größe in Pixeln
  // Neue Größenstufen für den Slider
  SIZE_LEVELS: {
    small: 0.7,   // 70% der berechneten Größe
    medium: 1.0,  // 100% der berechneten Größe (Standard)
    large: 1.3    // 130% der berechneten Größe
  }
};

// Map-Scale-Konfiguration
const MAP_SCALE_CONFIG = {
  TARGET_PRODUCT: 100, // width * scale = 100
  AUTO_UPDATE: true    // Automatische Anpassung aktiviert
};

// Main-Wrapper und Map-Größen Konfiguration
const MAP_SIZE_CONFIG = {
  // Referenz-Dimensionen des main-wrapper (Standard-Größe)
  REFERENCE_WRAPPER: {
    width: 600,  // px
    height: 600  // px
  },
  // Referenz-Dimensionen der map (bei Standard main-wrapper Größe)
  REFERENCE_MAP: {
    width: 120,  // %
    height: 120  // %
  },
  AUTO_ADJUST: true // Automatische Größenanpassung aktiviert
};

// Zentrale Icon-Konfiguration - hier können neue Icons hinzugefügt werden
const ICONS_CONFIG = {
  herz: {
    name: 'Herz',
    url: 'https://raw.githubusercontent.com/ErikP98/WebsitePages/11a9f8f78bbfe6c951277befb5c0cebb5259076e/Herz.svg'
  },
  wasserfall: {
    name: 'Wasserfall',
    url: 'https://raw.githubusercontent.com/ErikP98/Test/49a87ce3d73f5fe8ea7e0640a208b5f774b5dd72/Wasserfall.svg'
  },
  diamant: {
    name: 'Diamant',
    url: 'https://raw.githubusercontent.com/ErikP98/Test/05aa0352a4b4ed29124eeda678f9f293863e1f07/Diamant.svg'
  },
  stern: {
    name: 'Stern',
    url: 'https://raw.githubusercontent.com/ErikP98/Test/9e140dfe2e05129de10a8e69907c47711c88df06/Stern.svg'
  },
  vulkan: {
    name: 'Vulkan',
    url: 'https://raw.githubusercontent.com/ErikP98/Test/e831546e097fcdb3e75916376706c54414e4d5aa/Vulkan.svg'
  },
  haus: {
    name: 'Haus',
    url: 'https://raw.githubusercontent.com/ErikP98/Test/39719f90547d5a42d908b8c7dd5f076425867d52/Haus.svg'
  },
  pin: {
    name: 'Pin',
    url: 'https://raw.githubusercontent.com/ErikP98/Test/f31198d6d1fb881791337fd5ef85fd85df67e959/Pin.svg'
  },
  ringe: {
    name: 'Ringe',
    url: 'https://raw.githubusercontent.com/ErikP98/Test/37002584dd01b1e0d8c3fe0eaface3c84d7c523c/Ringe.svg'
  },
  flagge: {
    name: 'Flagge',
    url: 'https://raw.githubusercontent.com/ErikP98/Test/61541799c2c6dd900ddd99dc5a2f779b04cdeef2/Flagge.svg'
  }
};

let currentIconSize = 'medium';

const LAYER_IDS = {
  road: [
    'tunnel_motorway_link_casing', 
    'road_motorway_link_casing', 
    'road_link_casing', 
    'road_minor_casing', 
    'road_secondary_tertiary_casing', 
    'road_trunk_primary_casing', 
    'road_motorway_casing', 
    'road_motorway_link', 
    'road_service_track', 
    'road_link', 
    'road_minor', 
    'road_secondary_tertiary', 
    'road_trunk_primary', 
    'road_motorway', 
    'bridge_motorway_link_casing', 
    'bridge_service_track_casing', 
    'bridge_link_casing', 
    'bridge_street_casing', 
    'bridge_secondary_tertiary_casing', 
    'bridge_trunk_primary_casing', 
    'bridge_motorway_casing', 
    'bridge_motorway_link', 
    'bridge_service_track', 
    'bridge_link', 
    'bridge_street', 
    'bridge_secondary_tertiary', 
    'bridge_trunk_primary', 
    'bridge_motorway'
  ],
  water: [
    'waterway_river', 
    'waterway_other', 
    'water'
  ]
};

let map;
let isMapMoving = false;
let mapMoveTimeout;
let savedMapData = {
  slot1: null,
  slot2: null,
  slot3: null
};

// Hilfsfunktion zur Berechnung der Icongröße
function calculateIconSize(containerSize, sizeLevel = 'medium') {
  const percentSize = (containerSize * ICON_CONFIG.SIZE_PERCENT) / 100;
  const baseSize = Math.max(ICON_CONFIG.MIN_SIZE_PX, Math.min(ICON_CONFIG.MAX_SIZE_PX, percentSize));
  const multiplier = ICON_CONFIG.SIZE_LEVELS[sizeLevel] || 1.0;
  return Math.round(baseSize * multiplier);
}

// Hilfsfunktion um Icon-URL nach Typ zu bekommen
function getIconUrlByType(iconType) {
  return ICONS_CONFIG[iconType]?.url || null;
}

// Hilfsfunktion um Icon-Name nach Typ zu bekommen
function getIconNameByType(iconType) {
  return ICONS_CONFIG[iconType]?.name || iconType;
}