function initializeMap() {

  map = new maplibregl.Map({
    container: 'map',
    style: 'https://erikp98.github.io/WebsitePages/dark_matter.json',
    center: [-0.552078, 38.894028],
    zoom: 0.32,
    interactive: true,
    preserveDrawingBuffer: true
  });

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
  map.addControl(new maplibregl.AttributionControl({ compact: true }));

  map.on('load', () => {
  map.loadImage('https://raw.githubusercontent.com/ErikP98/WebsitePages/refs/heads/main/seamless-water.png', (_, img) => {
  map.addImage('water-pattern', img);
  map.setPaintProperty('water', 'fill-pattern', 'water-pattern');
  map.setPaintProperty('water', 'fill-opacity', 1.0);
});
    map.setPaintProperty('background', 'background-color', 'rgba(0,0,0,0)');
    const attrib = document.querySelector('.maplibregl-ctrl-attrib');
    attrib && document.getElementById('attribution-wrapper').appendChild(attrib);
  });

  ['movestart', 'move', 'zoomstart'].forEach(e => map.on(e, () => {
    isMapMoving = true;
    setDownloadState(false, '...');
    clearTimeout(mapMoveTimeout);
  }));

  ['moveend', 'zoomend'].forEach(e => map.on(e, () => {
    mapMoveTimeout = setTimeout(() => {
      isMapMoving = false;
      setDownloadState(true);
    }, 5);
  }));
}

function handleCitySearch(cityName) {
  fetch(`https://nominatim.openstreetmap.org/search?city=${cityName}&format=json&limit=1`)
    .then(res => res.json())
    .then(data => data[0] ? map.flyTo({ center: [data[0].lon, data[0].lat], zoom: 12 }) : alert("Stadt nicht gefunden."))
    .catch(() => alert("Fehler bei der Stadtsuche."));
}

function setDownloadState(enabled, text = 'Vorschau') {
  const btn = document.getElementById('download-btn');
  btn.disabled = !enabled;
  btn.style.opacity = enabled ? '1' : '0.5';
  btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  btn.textContent = text;
}