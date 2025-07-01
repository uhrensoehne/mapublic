function addClockHands() {
  const container = document.getElementById('scaled-container');
  if (!container) return console.error('Scaled container nicht gefunden');

  const existing = document.getElementById('clock-hands-overlay');
  existing?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'clock-hands-overlay';
  Object.assign(overlay.style, {
    position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
    zIndex: '4', pointerEvents: 'none'
  });

  const now = new Date();
  const [h, m, s] = [now.getHours() % 12, now.getMinutes(), now.getSeconds()];
  const angles = [h * 30 + m * 0.5 + s * 0.00833, m * 6 + s * 0.1];
  
  ['ZeigerStunde', 'ZeigerMinute'].forEach((name, i) => {
    const img = document.createElement('img');
    img.src = `https://raw.githubusercontent.com/ErikP98/Test/refs/heads/main/${name}.png`;
    img.onerror = () => {
      const div = document.createElement('div');
      Object.assign(div.style, {
        position: 'absolute', width: '4px', height: i ? '200px' : '150px',
        backgroundColor: i ? '#666' : '#333', left: '50%', top: '50%',
        transformOrigin: '50% 90%', transform: `translate(-50%, -90%) rotate(${angles[i]}deg)`,
        zIndex: i + 5, pointerEvents: 'none'
      });
      overlay.appendChild(div);
    };
    Object.assign(img.style, {
      position: 'absolute', width: '100%', height: '100%', top: '0', left: '0',
      transformOrigin: 'center center', pointerEvents: 'none', transform: `rotate(${angles[i]}deg)`,
      zIndex: i + 5, opacity: '1'
    });
    overlay.appendChild(img);
  });
  
  container.appendChild(overlay);
}

function updateClockHands() {
  const overlay = document.getElementById('clock-hands-overlay');
  if (!overlay) return addClockHands();
  
  const now = new Date();
  const [h, m, s] = [now.getHours() % 12, now.getMinutes(), now.getSeconds()];
  const angles = [h * 30 + m * 0.5 + s * 0.00833, m * 6 + s * 0.1];
  
  [...overlay.children].forEach((child, i) => {
    child.style.transform = child.tagName === 'IMG' ? `rotate(${angles[i]}deg)` : 
      `translate(-50%, -90%) rotate(${angles[i]}deg)`;
  });
}

function initializeClockUpdater() {
  addClockHands();
  setInterval(updateClockHands, 1000);
  
  if (typeof map !== 'undefined' && map) {
    ['moveend', 'zoomend'].forEach(event => 
      map.on(event, () => setTimeout(updateClockHands, 100))
    );
  }
}