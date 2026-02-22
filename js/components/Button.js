import { BaseComponent } from './BaseComponent.js';

export class ButtonComponent extends BaseComponent {
    constructor(w, h, color, soundManager) {
        super(w, h, color, soundManager);
        
        this.btnInner = document.createElement('div');
        this.btnInner.className = 'btn-inner';
        this.btnInner.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 65%;
            height: 65%;
            border-radius: 12px;
            background: var(--component-color);
            box-shadow: 4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light);
            transition: all 0.15s ease;
        `;
        
        this.element.appendChild(this.btnInner);
        
        this.element.addEventListener('pointerdown', this.onDown.bind(this));
        this.element.addEventListener('pointerup', this.onUp.bind(this));
        this.element.addEventListener('pointerleave', this.onUp.bind(this));
    }

    onDown(e) {
        if (this.isCompleted && !this._zenMode) return;
        e.preventDefault();
        
        this.btnInner.style.boxShadow = 'inset 3px 3px 6px rgba(0, 0, 0, 0.2), inset -3px -3px 6px rgba(255, 255, 255, 0.1)';
        this.btnInner.style.transform = 'translate(-50%, -50%) scale(0.95)';
        
        this.soundManager.playClick();
        
        if (!this._zenMode) {
            this.complete();
        }
    }

    onUp() {
        if (this._zenMode) {
            this.btnInner.style.boxShadow = '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)';
            this.btnInner.style.transform = 'translate(-50%, -50%)';
        }
    }
}
