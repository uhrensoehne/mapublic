// Download/Preview Funktionalität und Loading States

function setupDownloadButton() {
    document.getElementById('download-btn').addEventListener('click', async e => {
        if (isMapMoving || e.target.disabled) {
            e.preventDefault();
            return;
        }

        try {
            showLoadingOverlay();
            updateLoadingProgress(0, 'Erstelle 3D-Vorschau...');
            setDownloadState(false, 'Wird erstellt...');

            const roadLayer = await createLayerCanvas('road', [227, 200, 171]);
            updateLoadingProgress(25, 'Erstelle Wasserebene...');
            const waterLayer = await createLayerCanvas('water', [74, 144, 226]);
            
            updateLoadingProgress(50, 'Verarbeite Ebenen...');
            const lightLayer = await processLightLayer(roadLayer);
            const darkLayer = await processDarkLayer(waterLayer, lightLayer);
            
            updateLoadingProgress(80, 'Baue 3D-Ansicht auf...');
            await build3DView(lightLayer, darkLayer);
            
            updateLoadingProgress(100, 'Fertig!');
            setTimeout(() => {
                hideLoadingOverlay();
                showViewer();
                setDownloadState(true);
            }, 500);
            
        } catch (error) {
            console.error('Fehler:', error);
            hideLoadingOverlay();
            alert('Fehler beim Erstellen der 3D-Ansicht: ' + error.message);
            setDownloadState(true);
        }
    });
}

const showLoadingOverlay = () => document.getElementById('loading-overlay').style.display = 'flex';
const hideLoadingOverlay = () => document.getElementById('loading-overlay').style.display = 'none';
const updateLoadingProgress = (percentage, text) => {
    document.getElementById('loading-bar').style.width = percentage + '%';
    if (text) document.getElementById('loading-text').textContent = text;
};