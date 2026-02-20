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
            box-shadow: var(--s4) var(--s4) var(--b8) var(--shadow-dark), calc(var(--s4) * -1) calc(var(--s4) * -1) var(--b8) var(--shadow-light);
            transition: all 0.15s ease;
        `;
        
        this.element.appendChild(this.btnInner);
        
        this.element.addEventListener('pointerdown', this.onDown.bind(this));
    }

    onDown(e) {
        if (this.isCompleted) return;
        e.preventDefault();
        
        this.btnInner.style.boxShadow = 'inset var(--s3) var(--s3) var(--b6) rgba(0, 0, 0, 0.2), inset calc(var(--s3) * -1) calc(var(--s3) * -1) var(--b6) rgba(255, 255, 255, 0.1)';
        this.btnInner.style.transform = 'translate(-50%, -50%) scale(0.95)';
        
        this.soundManager.playClick();
        this.complete();
    }
}
