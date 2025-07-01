const imageCache = new Map();
const loadingPromises = new Map();

const ESSENTIAL_IMAGES = [
  'https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/Overlay.png',
  'https://raw.githubusercontent.com/ErikP98/WebsitePages/refs/heads/main/Holz.png',
  'https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/Sub.png',
  'https://raw.githubusercontent.com/ErikP98/WebsitePages/refs/heads/main/seamless-water.png'
];

const OPTIONAL_IMAGES = [
  'https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/Linde.png',
  'https://raw.githubusercontent.com/ErikP98/WebsitePages/refs/heads/main/wasser-textur.png',
  'https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/Mutter.png',
  'https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/Befestigung.png',
  'https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/RahmenSchrift.png',
  'https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/Ziffernblatt.png'
];

const preloadImages = async () => {
  await Promise.all(ESSENTIAL_IMAGES.map(loadAndCacheImage));
  OPTIONAL_IMAGES.forEach(loadAndCacheImage);
};

const loadAndCacheImage = url => {
  if (imageCache.has(url)) return imageCache.get(url);
  if (loadingPromises.has(url)) return loadingPromises.get(url);

  const promise = new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => (imageCache.set(url, img), loadingPromises.delete(url), resolve(img));
    img.onerror = () => (console.warn(`Failed to load: ${url}`), loadingPromises.delete(url), resolve(null));
    img.src = url;
  });
  
  return loadingPromises.set(url, promise), promise;
};

const getMapContainerScale = () => {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return 1;
  const transform = window.getComputedStyle(mapContainer).transform;
  const match = transform.match(/matrix\(([^)]+)\)/) || transform.match(/scale\(([^)]+)\)/);
  return match ? parseFloat(match[1].split(',')[0]) || 1 : 1;
};

const createCanvas = (width, height, willRead = false) => {
  const canvas = document.createElement('canvas');
  return Object.assign(canvas, {width, height}), {canvas, ctx: canvas.getContext('2d', {willReadFrequently: willRead})};
};

const extractLayersFromMap = async (map, layerIds) => {
  const scaledContainer = document.getElementById('map-container');
  const containerRect = scaledContainer.getBoundingClientRect();
  const scale = getMapContainerScale();
  const size = Math.min(containerRect.width, containerRect.height) * (1/ZOOM) / scale;
  
  const tempContainer = document.createElement('div');
  Object.assign(tempContainer.style, {
    width: size + 'px', height: size + 'px', position: 'absolute', 
    top: '-10000px', borderRadius: '50%', overflow: 'hidden'
  });
  document.body.appendChild(tempContainer);
  
  const tempMap = new maplibregl.Map({
    container: tempContainer, style: map.getStyle(), center: map.getCenter(),
    zoom: map.getZoom(), preserveDrawingBuffer: true, antialias: false, fadeDuration: 0
  });
  
  return new Promise(resolve => {
    const cleanup = () => (tempMap.remove(), document.body.removeChild(tempContainer));
    const timeout = setTimeout(() => (console.warn('Map extraction timeout'), cleanup(), resolve(createCanvas(size, size).canvas)), 2000);
    
    tempMap.on('load', () => {
      const waterPattern = imageCache.get(ESSENTIAL_IMAGES[3]);
      if (waterPattern && layerIds.includes('water')) {
        tempMap.addImage('water-pattern', waterPattern, {sdf: false});
      }
      
      const style = tempMap.getStyle();
      const updates = [];
      
      style.layers.forEach(layer => {
        const shouldShow = layerIds.includes(layer.id);
        updates.push(() => tempMap.setLayoutProperty(layer.id, 'visibility', shouldShow ? 'visible' : 'none'));
        
        if (shouldShow && layer.id === 'water' && waterPattern) {
          updates.push(() => {
            tempMap.setPaintProperty('water', 'fill-pattern', 'water-pattern');
            tempMap.setPaintProperty('water', 'fill-opacity', 1.0);
          });
        }
      });
      
      updates.forEach(update => update());
      
      const checkAndExtract = () => {
        clearTimeout(timeout);
        const canvas = tempMap.getCanvas();
        const {canvas: result, ctx} = createCanvas(canvas.width, canvas.height);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
        
        cleanup();
        resolve(result);
      };
      
      setTimeout(checkAndExtract, layerIds.includes('water') ? 300 : 100);
    });
  });
};

const createLayerCanvas = async (layerType, color) => {
  const sourceCanvas = await extractLayersFromMap(map, LAYER_IDS[layerType]);
  const {canvas, ctx} = createCanvas(sourceCanvas.width, sourceCanvas.height, true);
  
  const sourceCtx = sourceCanvas.getContext('2d', {willReadFrequently: true});
  const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const imageData = ctx.createImageData(sourceCanvas.width, sourceCanvas.height);
  
  const src = sourceData.data, dst = imageData.data;
  const [r, g, b] = color;
  
  for (let i = 0; i < src.length; i += 4) {
    const alpha = src[i + 3];
    if (alpha > 50) {
      dst[i] = r; dst[i + 1] = g; dst[i + 2] = b; dst[i + 3] = alpha;
    }
  }
  
  return ctx.putImageData(imageData, 0, 0), canvas;
};

const processLightLayer = async roadCanvas => {
  const {canvas, ctx} = createCanvas(roadCanvas.width, roadCanvas.height);
  ctx.drawImage(roadCanvas, 0, 0);
  
  const mapElement = document.getElementById('map');
  const mapRect = mapElement.getBoundingClientRect();
  const scaleX = canvas.width / (mapRect.width / ZOOM);
  const scaleY = canvas.height / (mapRect.height / ZOOM);
  
  const boxes = document.getElementById('scaled-container').querySelectorAll('.placed-box');
  if (boxes.length > 0) {
    ctx.fillStyle = '#e3c8ab';
    boxes.forEach(box => {
      const rect = box.getBoundingClientRect();
      const x = ((rect.left - mapRect.left) / ZOOM) * scaleX;
      const y = ((rect.top - mapRect.top) / ZOOM) * scaleY;
      const w = (rect.width / ZOOM) * scaleX;
      const h = (rect.height / ZOOM) * scaleY;
      
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.2);
      ctx.fill();
    });
  }
  
  let result = await applyImageOverlay(canvas, ESSENTIAL_IMAGES[0]);
  result = await applySubtractionMask(result);
  return await applyTextureIfAvailable(result, OPTIONAL_IMAGES[0]);
};

const processDarkLayer = async (waterCanvas, lightLayer) => {
  const canvas = await applyImageOverlay(null, ESSENTIAL_IMAGES[1], waterCanvas.width, waterCanvas.height);
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const waterCtx = waterCanvas.getContext('2d', {willReadFrequently: true});
  const waterData = waterCtx.getImageData(0, 0, canvas.width, canvas.height);
  
  const img = imageData.data, water = waterData.data;
  for (let i = 3; i < img.length; i += 4) {
    if (water[i] > 50) img[i] = 0;
  }
  
  ctx.putImageData(imageData, 0, 0);
  ctx.drawImage(lightLayer, 0, 0);
  
  // Overlay-Bild vor der Inselbestimmung hinzufügen
  const overlayImg = imageCache.get(ESSENTIAL_IMAGES[0]);
  if (overlayImg) {
    ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
  }
  
  // Jetzt die Inselbestimmung auf das kombinierte Bild anwenden
  const finalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  removeSmallIslands(finalImageData, canvas.width, canvas.height);
  ctx.putImageData(finalImageData, 0, 0);
  
  return await applySubtractionMask(canvas);
};

const removeSmallIslands = (imageData, width, height) => {
  const data = imageData.data;
  const visited = new Uint8Array(width * height);
  const container = document.getElementById('map-container');
  const minSize = Math.floor(5000 * (container?.offsetWidth || 800) / 800);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!visited[idx] && data[idx * 4 + 3] > 0) {
        const island = floodFill(data, visited, x, y, width, height);
        if (island.length < minSize) {
          island.forEach(i => data[i * 4 + 3] = 0);
        }
      }
    }
  }
};

const floodFill = (data, visited, startX, startY, width, height) => {
  const stack = [startY * width + startX];
  const island = [];
  
  while (stack.length) {
    const idx = stack.pop();
    if (visited[idx]) continue;
    
    visited[idx] = 1;
    island.push(idx);
    
    const y = Math.floor(idx / width), x = idx % width;
    [[y-1,x],[y+1,x],[y,x-1],[y,x+1]].forEach(([ny, nx]) => {
      if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx] && data[nIdx * 4 + 3] > 0) {
          stack.push(nIdx);
        }
      }
    });
  }
  
  return island;
};

const applySubtractionMask = async canvas => {
  const maskImg = imageCache.get(ESSENTIAL_IMAGES[2]);
  if (!maskImg) return canvas;
  
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  const {canvas: tempCanvas, ctx: tempCtx} = createCanvas(canvas.width, canvas.height, true);
  tempCtx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
  const maskData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
  
  const img = imageData.data, mask = maskData.data;
  for (let i = 0; i < img.length; i += 4) {
    const alpha = mask[i + 3];
    if (alpha > 50 && mask[i] < 50 && mask[i + 1] < 50 && mask[i + 2] < 50) {
      img[i + 3] = 0;
    }
  }
  
  return ctx.putImageData(imageData, 0, 0), canvas;
};

const applyImageOverlay = async (baseCanvas, imageUrl, width, height) => {
  const img = imageCache.get(imageUrl);
  if (!img) {
    console.warn(`Image not cached: ${imageUrl}`);
    return baseCanvas || createCanvas(width || 100, height || 100).canvas;
  }
  
  const canvas = baseCanvas || createCanvas(width, height).canvas;
  const ctx = canvas.getContext('2d');
  
  if (baseCanvas) ctx.drawImage(baseCanvas, 0, 0);
  return ctx.drawImage(img, 0, 0, canvas.width, canvas.height), canvas;
};

const applyTextureIfAvailable = async (canvas, textureUrl) => {
  const img = imageCache.get(textureUrl);
  if (!img) return canvas;
  
  const {canvas: result, ctx} = createCanvas(canvas.width, canvas.height, true);
  ctx.drawImage(img, 0, 0, result.width, result.height);
  
  const canvasCtx = canvas.getContext('2d', {willReadFrequently: true});
  const canvasData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
  const resultData = ctx.getImageData(0, 0, result.width, result.height);
  
  for (let i = 3; i < resultData.data.length; i += 4) {
    resultData.data[i] = canvasData.data[i];
  }
  
  return ctx.putImageData(resultData, 0, 0), result;
};

const createTextureLayer = url => async referenceCanvas => 
  await applyImageOverlay(null, url, referenceCanvas.width, referenceCanvas.height);

const createWaterTextureLayer = createTextureLayer(OPTIONAL_IMAGES[1]);
const createMutterLayer = createTextureLayer(OPTIONAL_IMAGES[2]);
const createBefestigungLayer = createTextureLayer(OPTIONAL_IMAGES[3]);
const createRandLayer = createTextureLayer(OPTIONAL_IMAGES[4]);

const createZiffernblattLayer = async referenceCanvas => {
  const canvas = await applyImageOverlay(null, OPTIONAL_IMAGES[5], referenceCanvas.width, referenceCanvas.height);
  const ctx = canvas.getContext('2d');
  
  const searchInput = document.getElementById('search-input');
  const text = searchInput?.value.trim();
  if (text) {
    const mapRect = document.getElementById('map').getBoundingClientRect();
    const scale = canvas.width / (mapRect.width / ZOOM);
    const fontSize = parseFloat(getComputedStyle(searchInput).fontSize) * scale;
    const inputRect = searchInput.getBoundingClientRect();
    
    ctx.font = `${fontSize}px Broadway`;
    ctx.fillStyle = '#3e2311';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = ((inputRect.left - mapRect.left) / ZOOM + inputRect.width / (2 * ZOOM)) * scale;
    const centerY = ((inputRect.top - mapRect.top) / ZOOM + inputRect.height / (2 * ZOOM)) * scale;
    
    ctx.fillText(text, centerX, centerY - fontSize * 0.1);
  }
  
  return await addIconsToCanvas(ctx, canvas.width, canvas.height), canvas;
};

const addIconsToCanvas = async (ctx, canvasWidth, canvasHeight) => {
  const mapElement = document.getElementById('map');
  const mapRect = mapElement.getBoundingClientRect();
  const scaleX = canvasWidth / (mapRect.width / ZOOM);
  const scaleY = canvasHeight / (mapRect.height / ZOOM);
  
  const boxes = document.getElementById('scaled-container').querySelectorAll('.placed-box');
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < boxes.length; i += BATCH_SIZE) {
    const batch = Array.from(boxes).slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async box => {
      const svgElement = box.querySelector('svg image, img');
      const iconSrc = svgElement?.src || svgElement?.getAttribute('href');
      if (!iconSrc) return;
      
      const boxRect = box.getBoundingClientRect();
      const iconSizeLevel = box.dataset.iconSize || 'medium';
      const baseIconSize = calculateIconSize(document.getElementById('scaled-container').offsetWidth, iconSizeLevel);
      const size = baseIconSize / ZOOM * Math.min(scaleX, scaleY) * 0.8;
      
      const centerX = ((boxRect.left + boxRect.width/2 - mapRect.left) / ZOOM) * scaleX;
      const centerY = ((boxRect.top + boxRect.height/2 - mapRect.top) / ZOOM) * scaleY;
      
      const img = imageCache.get(iconSrc) || await loadAndCacheImage(iconSrc);
      if (img) {
        ctx.drawImage(img, centerX - size/2*ZOOM, centerY - size/2*ZOOM, size*ZOOM, size*ZOOM);
      }
    }));
  }
};

preloadImages().catch(console.error);