// Suchfunktionalität und Input-Handling

function setupSearchInput() {
    const input = document.getElementById('search-input');
    const adjust = () => adjustFontSizeToFit(input);
    adjust();
    
    ['input', 'blur', 'resize'].forEach(event => input.addEventListener(event, adjust));
    input.addEventListener('keypress', e => e.key === 'Enter' && handleCitySearch(e.target.value));
    
    if (window.ResizeObserver) {
        const observer = new ResizeObserver(adjust);
        const container = document.getElementById('scaled-container');
        if (container) observer.observe(container);
    }
}

function adjustFontSizeToFit(input) {
    const container = document.getElementById('scaled-container');
    if (!container) return;
    
    const h = container.offsetHeight;
    const w = container.offsetWidth;
    const maxSize = h * 0.0425;
    const minSize = h * 0.02;
    
    let fontSize = maxSize;
    const maxChars = Math.floor(w / (fontSize * 0.6));
    
    const span = document.createElement('span');
    Object.assign(span.style, {
        visibility: 'hidden',
        whiteSpace: 'nowrap',
        position: 'absolute',
        fontFamily: getComputedStyle(input).fontFamily
    });
    document.body.appendChild(span);

    let text = input.value;
    if (text.length > maxChars) {
        text = text.slice(0, maxChars) + '\n' + text.slice(maxChars, maxChars * 2);
        input.value = text;
    }

    while (fontSize >= minSize) {
        span.style.fontSize = fontSize + 'px';
        span.textContent = text;
        if (span.offsetWidth <= input.offsetWidth * 0.95) break;
        fontSize--;
    }

    input.style.fontSize = fontSize + 'px';
    
    const existing = document.head.querySelector('#dynamic-placeholder-style');
    if (existing) existing.remove();
    
    const style = document.createElement('style');
    style.id = 'dynamic-placeholder-style';
    style.textContent = `#search-input::placeholder { font-size: ${fontSize-5}px !important; }`;
    document.head.appendChild(style);
    
    document.body.removeChild(span);
}