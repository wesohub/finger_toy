import { BaseComponent } from './BaseComponent.js';

export class SliderComponent extends BaseComponent {
    constructor(w, h, color, soundManager, isHorizontal = false) {
        super(w, h, color, soundManager);
        
        this.value = 0;
        this.dragging = false;
        this.pointerId = null;
        this.lastValue = 0;
        this.isHorizontal = isHorizontal;
        this.padding = 24;
        this.zenCompleted = false;
        
        this.track = document.createElement('div');
        this.track.className = 'slider-track';
        
        this.fill = document.createElement('div');
        this.fill.className = 'slider-fill';
        this.track.appendChild(this.fill);
        
        this.handle = document.createElement('div');
        this.handle.className = 'slider-handle';
        this.track.appendChild(this.handle);
        
        this.element.appendChild(this.track);
        
        if (this.isHorizontal) {
            this.element.classList.add('slider-horizontal');
        }
        
        this.updateVisual();
        
        this.handle.addEventListener('pointerdown', this.onDragStart.bind(this));
        this.element.addEventListener('globalpointermove', this.onDragMove.bind(this));
        document.addEventListener('pointermove', this.onDragMove.bind(this));
        document.addEventListener('pointerup', this.onDragEnd.bind(this));
        document.addEventListener('pointercancel', this.onDragEnd.bind(this));
    }

    updateVisual() {
        const handleSize = 44;
        
        if (this.isHorizontal) {
            const trackWidth = this._w - this.padding * 2;
            const trackLength = trackWidth - handleSize;
            
            const leftPos = this.value * trackLength;
            this.handle.style.left = `${leftPos}px`;
            this.handle.style.top = '';
            
            const fillWidth = leftPos + handleSize / 2;
            this.fill.style.width = `${fillWidth}px`;
            this.fill.style.height = '';
        } else {
            const trackHeight = this._h - this.padding * 2;
            const trackLength = trackHeight - handleSize;
            
            const topPos = (1 - this.value) * trackLength;
            this.handle.style.top = `${topPos}px`;
            this.handle.style.left = '';
            
            const fillHeight = trackHeight - (topPos + handleSize / 2);
            this.fill.style.height = `${fillHeight}px`;
            this.fill.style.width = '';
        }
    }

    onDragStart(e) {
        if (this.isCompleted && !this._zenMode) return;
        if (this.dragging) return;
        e.preventDefault();
        this.dragging = true;
        this.pointerId = e.pointerId;
        this.handle.setPointerCapture(e.pointerId);
        this.lastValue = this.value;
        this.soundManager.playSlide();
    }

    onDragMove(e) {
        if (!this.dragging) return;
        if (e.pointerId !== this.pointerId) return;
        if (this.isCompleted && !this._zenMode) return;
        
        const handleSize = 44;
        const rect = this.track.getBoundingClientRect();
        
        if (this.isHorizontal) {
            const trackWidth = this._w - this.padding * 2;
            const trackLength = trackWidth - handleSize;
            
            const x = e.clientX - rect.left - handleSize / 2;
            
            let val = x / trackLength;
            this.value = Math.max(0, Math.min(1, val));
        } else {
            const trackHeight = this._h - this.padding * 2;
            const trackLength = trackHeight - handleSize;
            
            const y = e.clientY - rect.top - handleSize / 2;
            
            let val = 1 - (y / trackLength);
            this.value = Math.max(0, Math.min(1, val));
        }
        
        this.updateVisual();
        
        this.soundManager.playSlideProgress(this.value);
        this.lastValue = this.value;
        
        if (this.value >= 0.99) {
            if (this._zenMode) {
                if (!this.zenCompleted) {
                    this.zenCompleted = true;
                    this.complete();
                }
            } else {
                this.complete();
                this.dragging = false;
                this.soundManager.stopSlide();
            }
        } else if (this._zenMode) {
            this.zenCompleted = false;
        }
    }

    onDragEnd(e) {
        if (e.pointerId !== this.pointerId) return;
        this.dragging = false;
        this.pointerId = null;
        this.soundManager.stopSlide();
    }
}
