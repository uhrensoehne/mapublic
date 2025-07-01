class IconAnimationManager {
    constructor() {
        this.animationDuration = 400;
        this.staggerDelay = 50;
        this.maxIcons = 10;
        this.colors = {
            success: 'rgba(52, 199, 89, 0.95)',
            warning: 'rgba(255, 59, 48, 0.95)',
            info: 'rgba(0, 122, 255, 0.95)'
        };
    }

    async addIcon(iconData, container, position = null) {
        if (this.getIconCount() >= this.maxIcons) {
            this.showIconLimitWarning();
            return null;
        }

        const iconElement = this.createIconElement(iconData, container);
        
        if (position) {
            Object.assign(iconElement.style, {
                left: position.x + 'px',
                top: position.y + 'px'
            });
        }

        container.appendChild(iconElement);
        await this.animateIconIn(iconElement);
        this.updateIconStatus();
        
        return iconElement;
    }

    async removeIcon(iconElement, updateStatus = true) {
        if (!iconElement?.parentNode) return;

        await this.animateIconOut(iconElement);
        iconElement.remove();
        
        if (updateStatus) this.updateIconStatus();
    }

    async removeAllIcons(showMessage = true) {
        const container = document.getElementById('scaled-container');
        if (!container) return;

        const icons = [...container.querySelectorAll('.placed-box')];
        
        if (!icons.length) {
            if (showMessage) this.showMessage('Keine Icons zum Löschen vorhanden!', 'info');
            return;
        }

        await Promise.all(icons.map((icon, index) => 
            new Promise(resolve => {
                setTimeout(async () => {
                    await this.removeIcon(icon, false);
                    resolve();
                }, index * this.staggerDelay);
            })
        ));
        
        this.updateIconStatus();
        
        if (showMessage) {
            this.showMessage(`${icons.length} Icons erfolgreich entfernt!`, 'success');
        }
    }

    async replaceAllIcons(newIconsData) {
        await this.removeAllIcons(false);
        
        const container = document.getElementById('scaled-container');
        if (!container || !Array.isArray(newIconsData)) return;

        await Promise.all(newIconsData.map((iconData, index) => 
            new Promise(resolve => {
                setTimeout(async () => {
                    const position = this.calculateIconPosition(iconData, container);
                    await this.addIcon(iconData, container, position);
                    resolve();
                }, index * this.staggerDelay * 2);
            })
        ));

        this.updateIconSizes();
    }

    createIconElement(iconData, container) {
        const iconElement = document.createElement('div');
        const iconSize = this.calculateIconSize(container.offsetWidth, iconData.size || 'medium');
        
        Object.assign(iconElement, {
            className: 'placed-box',
            innerHTML: this.getIconSVG(iconData.type) || ''
        });
        
        Object.assign(iconElement.dataset, {
            iconType: iconData.type,
            iconSize: iconData.size || 'medium'
        });

        Object.assign(iconElement.style, {
            width: iconSize + 'px',
            height: iconSize + 'px',
            position: 'absolute',
            cursor: 'move'
        });

        this.attachIconEventListeners(iconElement);
        return iconElement;
    }

    attachIconEventListeners(iconElement) {
        iconElement.addEventListener('mousedown', ev => {
            if (typeof startBoxDrag === 'function') startBoxDrag(ev, iconElement);
        });

        iconElement.addEventListener('contextmenu', ev => {
            ev.preventDefault();
            this.removeIcon(iconElement);
        });
    }

    async animateIconIn(iconElement) {
        Object.assign(iconElement.style, {
            transform: 'scale(0)',
            opacity: '0',
            transition: `all ${this.animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
        });

        return new Promise(resolve => {
            requestAnimationFrame(() => {
                Object.assign(iconElement.style, {
                    transform: 'scale(1)',
                    opacity: '1'
                });
                
                setTimeout(() => {
                    iconElement.style.transition = '';
                    resolve();
                }, this.animationDuration);
            });
        });
    }

    async animateIconOut(iconElement) {
        Object.assign(iconElement.style, {
            transition: `all ${this.animationDuration * 0.75}ms ease-out`,
            transform: 'scale(0)',
            opacity: '0'
        });

        return new Promise(resolve => {
            setTimeout(resolve, this.animationDuration * 0.75);
        });
    }

    calculateIconPosition(iconData, container) {
        if (iconData.x !== undefined && iconData.y !== undefined) {
            return {
                x: iconData.x * container.offsetWidth / 100,
                y: iconData.y * container.offsetHeight / 100
            };
        }
        
        if (iconData.left && iconData.top) {
            return {
                x: parseFloat(iconData.left),
                y: parseFloat(iconData.top)
            };
        }

        return { x: 0, y: 0 };
    }

    getIconSVG(iconType) {
        if (typeof getIconSVGByType === 'function') {
            return getIconSVGByType(iconType);
        }
        
        const iconUrl = this.getIconUrl(iconType);
        return iconUrl ? `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><image href="${iconUrl}" width="30" height="30"/></svg>` : null;
    }

    getIconUrl(iconType) {
        if (typeof getIconUrlByType === 'function') {
            return getIconUrlByType(iconType);
        }
        
        return typeof ICONS_CONFIG !== 'undefined' && ICONS_CONFIG[iconType] 
            ? ICONS_CONFIG[iconType].url 
            : null;
    }

    calculateIconSize(containerWidth, sizeLevel) {
        if (typeof calculateIconSize === 'function') {
            return calculateIconSize(containerWidth, sizeLevel);
        }
        
        const sizes = { small: 0.025, medium: 0.04, large: 0.06 };
        return Math.round(containerWidth * (sizes[sizeLevel] || sizes.medium));
    }

    getIconCount() {
        const container = document.getElementById('scaled-container');
        return container ? container.querySelectorAll('.placed-box').length : 0;
    }

    updateIconStatus() {
        const iconCount = this.getIconCount();
        const isLimitReached = iconCount >= this.maxIcons;
        
        document.querySelectorAll('.sidebar-icon').forEach(icon => {
            Object.assign(icon.style, {
                opacity: isLimitReached ? '0.4' : '1',
                cursor: isLimitReached ? 'not-allowed' : 'grab'
            });
            
            isLimitReached 
                ? icon.setAttribute('data-disabled', 'true') 
                : icon.removeAttribute('data-disabled');
        });
        
        this.updateIconCounter(iconCount, this.maxIcons);
    }

    updateIconCounter(current, max) {
        const counter = document.getElementById('icon-counter');
        const clearButton = document.getElementById('clear-all-button');
        
        if (!counter || !clearButton) return;
        
        const isLimitReached = current >= max;
        
        Object.assign(counter, {
            textContent: `${current}/${max} Icons verwendet`
        });
        
        counter.style.color = isLimitReached ? '#ff6b6b' : 'rgba(255,255,255,0.7)';
        
        const counterContainer = document.getElementById('icon-counter-container');
        if (counterContainer) {
            counterContainer.style.borderColor = isLimitReached 
                ? 'rgba(255,107,107,0.3)' 
                : 'rgba(255,255,255,0.08)';
        }
        
        Object.assign(clearButton.style, {
            opacity: current > 0 ? '0.9' : '0.4',
            cursor: current > 0 ? 'pointer' : 'not-allowed'
        });
        
        clearButton.disabled = current === 0;
    }

    updateIconSizes() {
        const container = document.getElementById('scaled-container');
        if (!container) return;
        
        container.querySelectorAll('.placed-box').forEach(icon => {
            const sizeLevel = icon.dataset.iconSize || 'medium';
            const iconSize = this.calculateIconSize(container.offsetWidth, sizeLevel);
            Object.assign(icon.style, {
                width: iconSize + 'px',
                height: iconSize + 'px'
            });
        });
    }

    showIconLimitWarning() {
        this.showMessage('Maximal 10 Icons erlaubt! Entfernen Sie ein Icon (Rechtsklick), um ein neues hinzuzufügen.', 'warning');
    }

    showMessage(message, type = 'info') {
        document.querySelector('.icon-animation-message')?.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'icon-animation-message';
        messageDiv.textContent = message;
        
        const bgColor = this.colors[type] || this.colors.info;
        
        messageDiv.style.cssText = `
            position: fixed; 
            top: 20px; 
            left: 50%; 
            transform: translateX(-50%); 
            background: ${bgColor}; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 8px; 
            font-family: 'Inter', sans-serif; 
            font-size: 14px; 
            font-weight: 500; 
            z-index: 10000; 
            backdrop-filter: blur(10px); 
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); 
            animation: slideDown 0.3s ease-out;
        `;
        
        if (!document.querySelector('style[data-icon-animation-styles]')) {
            const style = document.createElement('style');
            style.setAttribute('data-icon-animation-styles', 'true');
            style.textContent = `
                @keyframes slideDown { 
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; } 
                    to { transform: translateX(-50%) translateY(0); opacity: 1; } 
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideDown 0.3s ease-out reverse';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, type === 'warning' ? 3000 : 2000);
    }
}

const iconAnimationManager = new IconAnimationManager();