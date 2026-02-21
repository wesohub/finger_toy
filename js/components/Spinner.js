import { BaseComponent } from './BaseComponent.js';

export class SpinnerComponent extends BaseComponent {
    constructor(w, h, color, soundManager) {
        super(w, h, color, soundManager);
        this._skipCompleteSound = true;
        
        this.spinAngle = 0;
        this.velocity = 0;
        this.friction = 0.985;
        this.isDragging = false;
        this.lastAngle = 0;
        this.lastTime = 0;
        this.totalRotation = 0;
        this.lastSoundTime = 0;
        
        this.centerX = w / 2;
        this.centerY = h / 2;
        
        const bladeRadius = 22;
        const armLength = 36;
        
        this.blades = document.createElement('div');
        this.blades.className = 'spinner-blades';
        this.blades.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            transform: translate(-50%, -50%);
            transform-origin: center center;
        `;
        
        this.bladeElements = [];
        
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            
            const arm = document.createElement('div');
            arm.className = 'spinner-arm';
            arm.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                width: ${armLength}%;
                height: 6%;
                background: ${this._color}40;
                border-radius: 3px;
                transform-origin: 0% 50%;
                transform: translate(0, -50%) rotate(${angle}rad);
            `;
            this.blades.appendChild(arm);
            
            const blade = document.createElement('div');
            blade.className = 'spinner-blade';
            const x = 50 + Math.cos(angle) * armLength;
            const y = 50 + Math.sin(angle) * armLength;
            blade.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${bladeRadius}%;
                height: ${bladeRadius}%;
                border-radius: 50%;
                background: var(--bg-color);
                box-shadow: 2px 2px 4px var(--shadow-dark), -2px -2px 4px var(--shadow-light);
                border: var(--border-width) solid var(--component-color);
                transform: translate(-50%, -50%);
            `;
            this.blades.appendChild(blade);
            this.bladeElements.push(blade);
        }
        
        this.center = document.createElement('div');
        this.center.className = 'spinner-center';
        this.center.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 16%;
            height: 16%;
            border-radius: 50%;
            background: var(--component-color);
            box-shadow: 2px 2px 4px var(--shadow-dark), -2px -2px 4px var(--shadow-light);
            transform: translate(-50%, -50%);
        `;
        
        this.bearing = document.createElement('div');
        this.bearing.className = 'spinner-bearing';
        this.bearing.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 8%;
            height: 8%;
            border-radius: 50%;
            background: var(--bg-color);
            box-shadow: inset 1px 1px 2px var(--shadow-dark), inset -1px -1px 2px var(--shadow-light);
            transform: translate(-50%, -50%);
        `;
        
        this.element.appendChild(this.blades);
        this.element.appendChild(this.center);
        this.element.appendChild(this.bearing);
        
        this.rpmDisplay = document.createElement('div');
        this.rpmDisplay.className = 'spinner-rpm';
        this.rpmDisplay.style.cssText = `
            position: absolute;
            left: 8px;
            bottom: 6px;
            font-size: 10px;
            color: #888;
            font-family: sans-serif;
            pointer-events: none;
        `;
        this.rpmDisplay.textContent = '0 RPM';
        this.element.appendChild(this.rpmDisplay);
        
        this.element.addEventListener('pointerdown', this.onDragStart.bind(this));
        document.addEventListener('pointermove', this.onDragMove.bind(this));
        document.addEventListener('pointerup', this.onDragEnd.bind(this));
        document.addEventListener('pointercancel', this.onDragEnd.bind(this));
        
        this.animationId = null;
        this.update = this.update.bind(this);
        this.lastFrameTime = 0;
        this.constantRotationPerMs = 0.025;
        this.lastRPMUpdateTime = 0;
        this.rpmUpdateInterval = 100;
        this.lastMovementTime = 0;
    }

    updateBladeRotation() {
        this.bladeElements.forEach(blade => {
            blade.style.transform = `translate(-50%, -50%) rotate(${-this.spinAngle}rad)`;
        });
    }

    onDragStart(e) {
        if (this.isCompleted) return;
        e.preventDefault();
        this.isDragging = true;
        this.velocity = 0;
        this.element.setPointerCapture(e.pointerId);
        
        const rect = this.element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.lastAngle = Math.atan2(y - this.centerY, x - this.centerX);
        this.lastTime = Date.now();
        this.lastSoundTime = 0;
        
        this.soundManager.startSpin();
    }

    onDragMove(e) {
        if (!this.isDragging) return;
        
        const rect = this.element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const currentAngle = Math.atan2(y - this.centerY, x - this.centerX);
        
        let delta = currentAngle - this.lastAngle;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        
        this.spinAngle += delta;
        this.blades.style.transform = `translate(-50%, -50%) rotate(${this.spinAngle}rad)`;
        this.updateBladeRotation();
        
        const now = Date.now();
        const dt = now - this.lastTime;
        if (dt > 0) {
            const newVel = delta / dt;
            const smoothingFactor = 0.7;
            this.velocity = this.velocity * smoothingFactor + newVel * (1 - smoothingFactor);
            
            this.soundManager.updateSpinSound(Math.min(Math.abs(this.velocity) * 16, 1));
        }
        
        this.lastMovementTime = now;
        
        this.lastAngle = currentAngle;
        this.lastTime = now;
    }

    onDragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        
        this.soundManager.stopSpin();
        
        if (!this.animationId) {
            this.animationId = requestAnimationFrame(this.update);
        }
    }

    update(timestamp) {
        if (this.isDragging) {
            this.animationId = null;
            return;
        }
        
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
        }
        
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        if (this.isCompleted) {
            this.spinAngle += this.constantRotationPerMs * deltaTime;
            this.blades.style.transform = `translate(-50%, -50%) rotate(${this.spinAngle}rad)`;
            this.updateBladeRotation();
            this.updateRPM(this.constantRotationPerMs * 1000);
            this.animationId = requestAnimationFrame(this.update);
        } else if (Math.abs(this.velocity) > 0.0001 || Date.now() - this.lastMovementTime < 100) {
            this.spinAngle += this.velocity * deltaTime;
            this.blades.style.transform = `translate(-50%, -50%) rotate(${this.spinAngle}rad)`;
            this.updateBladeRotation();
            this.velocity *= Math.pow(this.friction, deltaTime / 16);
            
            this.updateRPM(Math.abs(this.velocity) * 1000);
            
            this.totalRotation += Math.abs(this.velocity * deltaTime);
            
            if (this.totalRotation > Math.PI * 6 && !this.isCompleted) {
                this.complete();
            }
            
            this.animationId = requestAnimationFrame(this.update);
        } else {
            this.velocity = 0;
            this.updateRPM(0);
            this.animationId = null;
        }
    }
    
    updateRPM(radiansPerSecond) {
        const now = Date.now();
        if (now - this.lastRPMUpdateTime < this.rpmUpdateInterval) return;
        
        const rpm = Math.round(Math.abs(radiansPerSecond) * 60 / (2 * Math.PI));
        this.rpmDisplay.textContent = `${rpm} RPM`;
        this.lastRPMUpdateTime = now;
    }

    complete() {
        if (this.isCompleted) return;
        super.complete();
        this.constantRotationPerMs = this.velocity;
        this.lastFrameTime = 0;
        if (!this.animationId) {
            this.animationId = requestAnimationFrame(this.update);
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        super.destroy();
    }
}
