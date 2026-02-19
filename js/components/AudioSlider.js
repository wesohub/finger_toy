import { BaseComponent } from './BaseComponent.js';

export class AudioSliderComponent extends BaseComponent {
    constructor(w, h, color, soundManager, isHorizontal = false) {
        super(w, h, color, soundManager);
        
        this.value = 0;
        this.dragging = false;
        this.lastToneIndex = -1;
        this.isHorizontal = isHorizontal;
        this.padding = 16;
        
        const barSize = 10;
        const barGap = 6;
        
        let barCount;
        if (this.isHorizontal) {
            const availableWidth = w - this.padding * 2;
            barCount = Math.max(5, Math.floor(availableWidth / (barSize + barGap)));
        } else {
            const availableHeight = h - this.padding * 2;
            barCount = Math.max(5, Math.floor(availableHeight / (barSize + barGap)));
        }
        
        this.barCount = barCount;
        
        this.grille = document.createElement('div');
        this.grille.className = 'audio-grille';
        
        if (this.isHorizontal) {
            this.grille.style.cssText = `
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                height: 70%;
                width: calc(100% - ${this.padding * 2}px);
                left: ${this.padding}px;
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            `;
        } else {
            this.grille.style.cssText = `
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                width: 70%;
                height: calc(100% - ${this.padding * 2}px);
                top: ${this.padding}px;
                display: flex;
                flex-direction: column-reverse;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            `;
        }
        
        this.bars = [];
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'audio-bar';
            
            if (this.isHorizontal) {
                bar.style.cssText = `
                    height: 100%;
                    width: ${barSize}px;
                    border-radius: 5px;
                    background: var(--bg-color);
                    box-shadow: inset 2px 2px 4px var(--shadow-dark), inset -2px -2px 4px var(--shadow-light);
                    position: relative;
                    overflow: hidden;
                `;
            } else {
                bar.style.cssText = `
                    width: 100%;
                    height: ${barSize}px;
                    border-radius: 5px;
                    background: var(--bg-color);
                    box-shadow: inset 2px 2px 4px var(--shadow-dark), inset -2px -2px 4px var(--shadow-light);
                    position: relative;
                    overflow: hidden;
                `;
            }
            
            const fill = document.createElement('div');
            fill.className = 'audio-bar-fill';
            fill.style.cssText = `
                position: absolute;
                inset: 2px;
                border-radius: 4px;
                background: var(--component-color);
                opacity: 0;
                transition: opacity 0.1s ease;
            `;
            bar.appendChild(fill);
            
            this.grille.appendChild(bar);
            this.bars.push(bar);
        }
        
        this.element.appendChild(this.grille);
        
        if (this.isHorizontal) {
            this.element.classList.add('audio-slider-horizontal');
        }
        
        this.updateVisual();
        
        this.grille.addEventListener('pointerdown', this.onDragStart.bind(this));
        document.addEventListener('pointermove', this.onDragMove.bind(this));
        document.addEventListener('pointerup', this.onDragEnd.bind(this));
        document.addEventListener('pointercancel', this.onDragEnd.bind(this));
    }

    updateVisual() {
        const activeIndex = Math.floor(this.value * (this.barCount - 0.01));
        
        this.bars.forEach((bar, i) => {
            const fill = bar.querySelector('.audio-bar-fill');
            if (i <= activeIndex) {
                fill.style.opacity = '1';
            } else {
                fill.style.opacity = '0';
            }
        });
    }

    onDragStart(e) {
        if (this.isCompleted) return;
        e.preventDefault();
        this.dragging = true;
        this.grille.setPointerCapture(e.pointerId);
        this.updateValueFromPosition(e);
    }

    updateValueFromPosition(e) {
        const rect = this.grille.getBoundingClientRect();
        
        if (this.isHorizontal) {
            const x = e.clientX - rect.left;
            const trackLength = rect.width;
            
            let val = x / trackLength;
            this.value = Math.max(0, Math.min(1, val));
        } else {
            const y = e.clientY - rect.top;
            const trackLength = rect.height;
            
            let val = 1 - (y / trackLength);
            this.value = Math.max(0, Math.min(1, val));
        }
        
        this.updateVisual();
        
        const noteIndex = Math.floor(this.value * (this.barCount - 0.01));
        
        if (noteIndex !== this.lastToneIndex) {
            this.soundManager.playDetent(noteIndex, this.barCount - 1);
            this.lastToneIndex = noteIndex;
        }
        
        if (noteIndex >= this.barCount - 1) {
            this.complete();
        }
    }

    onDragMove(e) {
        if (!this.dragging || this.isCompleted) return;
        this.updateValueFromPosition(e);
    }

    onDragEnd() {
        this.dragging = false;
    }
}
