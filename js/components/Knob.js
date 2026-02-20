import { BaseComponent } from './BaseComponent.js';

export class KnobComponent extends BaseComponent {
    constructor(w, h, color, soundManager) {
        super(w, h, color, soundManager);
        
        this.value = 0;
        this.isDragging = false;
        this.radius = Math.min(w, h) * 0.35;
        this.centerX = w / 2;
        this.centerY = h / 2;
        this.lastAngle = 0;
        this.lastValue = 0;
        
        this.container = document.createElement('div');
        this.container.className = 'knob-container';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        
        this.ticks = document.createElement('div');
        this.ticks.className = 'knob-ticks';
        this.ticks.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            left: 0;
            top: 0;
            pointer-events: none;
        `;
        this.drawTicks();
        
        this.knobBody = document.createElement('div');
        this.knobBody.className = 'knob-body';
        this.knobBody.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 65%;
            height: 65%;
            border-radius: 50%;
            background: var(--bg-color);
            box-shadow: 6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light);
            border: 3px solid var(--component-color);
            cursor: grab;
            transform: translate(-50%, -50%);
        `;
        
        this.pointer = document.createElement('div');
        this.pointer.className = 'knob-pointer';
        this.pointer.style.cssText = `
            position: absolute;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--component-color);
            box-shadow: 2px 2px 4px var(--shadow-dark), -1px -1px 2px var(--shadow-light);
            transform: translate(-50%, -50%);
        `;
        this.knobBody.appendChild(this.pointer);
        
        this.container.appendChild(this.ticks);
        this.container.appendChild(this.knobBody);
        this.element.appendChild(this.container);
        
        this.updatePointer();
        
        this.knobBody.addEventListener('pointerdown', this.onDragStart.bind(this));
        document.addEventListener('pointermove', this.onDragMove.bind(this));
        document.addEventListener('pointerup', this.onDragEnd.bind(this));
        document.addEventListener('pointercancel', this.onDragEnd.bind(this));
    }

    drawTicks() {
        const numTicks = 11;
        const startAngle = -Math.PI * 0.75;
        const endAngle = Math.PI * 0.75;
        const tickDist = 42;
        
        for (let i = 0; i < numTicks; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / (numTicks - 1));
            const tick = document.createElement('div');
            tick.className = 'knob-tick';
            
            const x = 50 + Math.cos(angle) * tickDist;
            const y = 50 + Math.sin(angle) * tickDist;
            
            const tickLength = 6;
            const tickWidth = 2;
            
            tick.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${tickWidth}px;
                height: ${tickLength}px;
                background: var(--shadow-dark);
                border-radius: 1px;
                transform: translate(-50%, -50%) rotate(${angle + Math.PI / 2}rad);
            `;
            
            this.ticks.appendChild(tick);
        }
    }

    updatePointer() {
        const startAngle = -Math.PI * 0.75;
        const endAngle = Math.PI * 0.75;
        const currentAngle = startAngle + (endAngle - startAngle) * this.value;
        
        const ptrDist = 30;
        const x = 50 + Math.cos(currentAngle) * ptrDist;
        const y = 50 + Math.sin(currentAngle) * ptrDist;
        
        this.pointer.style.left = `${x}%`;
        this.pointer.style.top = `${y}%`;
    }

    onDragStart(e) {
        if (this.isCompleted) return;
        e.preventDefault();
        this.isDragging = true;
        this.knobBody.setPointerCapture(e.pointerId);
        
        const rect = this.element.getBoundingClientRect();
        const dx = e.clientX - rect.left - this.centerX;
        const dy = e.clientY - rect.top - this.centerY;
        this.lastAngle = Math.atan2(dy, dx);
    }

    onDragMove(e) {
        if (!this.isDragging || this.isCompleted) return;
        
        const rect = this.element.getBoundingClientRect();
        const dx = e.clientX - rect.left - this.centerX;
        const dy = e.clientY - rect.top - this.centerY;
        
        const currentAngle = Math.atan2(dy, dx);
        
        let delta = currentAngle - this.lastAngle;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        
        this.value += delta / (Math.PI * 1.5);
        this.value = Math.max(0, Math.min(1, this.value));
        
        this.lastAngle = currentAngle;
        
        this.updatePointer();
        
        const tickStep = 0.05;
        if (Math.floor(this.value / tickStep) !== Math.floor(this.lastValue / tickStep)) {
            this.soundManager.playClick();
        }
        this.lastValue = this.value;
        
        if (this.value >= 0.99) {
            this.complete();
        }
    }

    onDragEnd() {
        this.isDragging = false;
    }
}
