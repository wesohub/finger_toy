import { BaseComponent } from './BaseComponent.js';

export class RapidFireButtonComponent extends BaseComponent {
    constructor(w, h, color, soundManager) {
        super(w, h, color, soundManager);
        
        this.progress = 0;
        this.isPressed = false;
        this.accumulateSpeed = 0.8;
        this.lastFrameTime = 0;
        
        this.ring = document.createElement('div');
        this.ring.className = 'rapid-ring';
        this.ring.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 85%;
            height: 85%;
            border-radius: 50%;
            background: var(--bg-color);
            box-shadow: inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light);
        `;
        
        this.progressEl = document.createElement('div');
        this.progressEl.className = 'rapid-progress';
        this.progressEl.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 85%;
            height: 85%;
        `;
        this.progressEl.innerHTML = `
            <svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg)">
                <circle class="progress-bg" cx="50" cy="50" r="45" fill="none" stroke="var(--shadow-dark)" stroke-width="6" stroke-linecap="round" opacity="0.3"/>
                <circle class="progress-fill" cx="50" cy="50" r="45" fill="none" stroke="var(--component-color)" stroke-width="6" stroke-linecap="round" stroke-dasharray="283" stroke-dashoffset="283" style="transition: stroke-dashoffset 0.05s linear"/>
            </svg>
        `;
        
        this.btn = document.createElement('div');
        this.btn.className = 'rapid-btn';
        this.btn.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 55%;
            height: 55%;
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
            <i class="fa-solid fa-circle-notch" style="font-size: 36px; color: var(--component-color);"></i>
        `;
        
        this.element.appendChild(this.ring);
        this.element.appendChild(this.progressEl);
        this.element.appendChild(this.btn);
        
        this.progressCircle = this.progressEl.querySelector('.progress-fill');
        
        this.element.addEventListener('pointerdown', this.onDown.bind(this));
        this.element.addEventListener('pointerup', this.onUp.bind(this));
        this.element.addEventListener('pointerleave', this.onUp.bind(this));
    }

    updateProgress() {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference * (1 - this.progress);
        this.progressCircle.style.strokeDashoffset = offset;
    }

    onDown(e) {
        if (this.isCompleted) return;
        e.preventDefault();
        this.isPressed = true;
        this.lastFrameTime = 0;
        
        this.btn.style.boxShadow = 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)';
        this.soundManager.playClick();
        
        requestAnimationFrame((ts) => this.accumulate(ts));
    }

    accumulate(timestamp) {
        if (!this.isPressed || this.isCompleted) return;
        
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
        }
        
        const deltaTime = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;
        
        this.progress += this.accumulateSpeed * deltaTime;
        this.updateProgress();
        
        this.soundManager.playProgress(this.progress);
        
        if (this.progress >= 0.99) {
            this.complete();
            return;
        }
        
        requestAnimationFrame((ts) => this.accumulate(ts));
    }

    onUp() {
        this.isPressed = false;
        this.lastFrameTime = 0;
        this.btn.style.boxShadow = '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)';
    }
}
