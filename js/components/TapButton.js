import { BaseComponent } from './BaseComponent.js';

export class TapButtonComponent extends BaseComponent {
    constructor(w, h, color, soundManager) {
        super(w, h, color, soundManager);
        
        this.progress = 0;
        this.clicksRequired = 8;
        this.lastActivatedDot = -1;
        this.zenReadyToReset = false;
        
        this.dotsContainer = document.createElement('div');
        this.dotsContainer.className = 'tap-dots';
        this.dotsContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            height: 90%;
        `;
        
        this.dots = [];
        const dotCount = this.clicksRequired;
        const dotRadius = 42;
        
        for (let i = 0; i < dotCount; i++) {
            const angle = (i / dotCount) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(angle) * dotRadius;
            const y = 50 + Math.sin(angle) * dotRadius;
            
            const dot = document.createElement('div');
            dot.className = 'tap-dot';
            dot.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: 8%;
                height: 8%;
                border-radius: 50%;
                background: var(--bg-color);
                box-shadow: inset 2px 2px 4px var(--shadow-dark), inset -2px -2px 4px var(--shadow-light);
                transform: translate(-50%, -50%);
                overflow: hidden;
            `;
            
            const fill = document.createElement('div');
            fill.className = 'tap-dot-fill';
            fill.style.cssText = `
                position: absolute;
                inset: 2px;
                border-radius: 50%;
                background: var(--component-color);
                opacity: 0;
                transition: opacity 0.15s ease;
            `;
            
            dot.appendChild(fill);
            this.dotsContainer.appendChild(dot);
            this.dots.push(fill);
        }
        
        this.btn = document.createElement('div');
        this.btn.className = 'tap-btn';
        this.btn.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 45%;
            height: 45%;
            border-radius: 50%;
            background: var(--bg-color);
            box-shadow: 4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light);
            border: var(--border-width) solid var(--component-color);
            display: flex;
            justify-content: center;
            align-items: center;
            transition: box-shadow 0.1s ease;
        `;
        this.btn.innerHTML = `
            <i class="fa-solid fa-spinner" style="font-size: 36px; color: var(--component-color);"></i>
        `;
        
        this.element.appendChild(this.dotsContainer);
        this.element.appendChild(this.btn);
        
        this.btn.addEventListener('pointerdown', this.onDown.bind(this));
        this.btn.addEventListener('pointerup', this.onUp.bind(this));
        this.btn.addEventListener('pointerleave', this.onUp.bind(this));
    }

    onDown(e) {
        if (this.isCompleted && !this._zenMode) return;
        e.preventDefault();
        
        this.btn.style.boxShadow = 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)';
        this.soundManager.playClick();
        
        if (this._zenMode && this.zenReadyToReset) {
            this.progress = 0;
            this.dots.forEach(fill => {
                fill.style.opacity = '0';
            });
            this.lastActivatedDot = -1;
            this.zenReadyToReset = false;
            return;
        }
        
        this.progress += 1 / this.clicksRequired;
        
        const activeDots = Math.floor(this.progress * this.clicksRequired);
        this.dots.forEach((fill, i) => {
            if (i < activeDots) {
                fill.style.opacity = '1';
            }
        });
        
        if (activeDots > this.lastActivatedDot) {
            this.soundManager.playDot(activeDots - 1, this.clicksRequired);
            this.lastActivatedDot = activeDots;
        }
        
        if (this.progress >= 0.99) {
            if (this._zenMode) {
                this.zenReadyToReset = true;
            }
            this.complete();
        }
    }

    onUp() {
        this.btn.style.boxShadow = '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)';
    }
}
