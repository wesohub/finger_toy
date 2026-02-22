export class BaseComponent {
    constructor(w, h, color, soundManager) {
        this._w = w;
        this._h = h;
        this._color = color || '#4d96ff';
        this.soundManager = soundManager;
        this.isCompleted = false;
        this._eventListeners = new Map();
        this._skipCompleteSound = false;
        this._zenMode = false;
        
        this.element = document.createElement('div');
        this.element.className = 'component';
        this.element.style.width = `${w}px`;
        this.element.style.height = `${h}px`;
        this.element.style.setProperty('--component-color', this._color);
    }

    setPosition(x, y) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    on(event, callback) {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, []);
        }
        this._eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }

    setZenMode(enabled) {
        this._zenMode = enabled;
    }

    complete() {
        if (this.isCompleted && !this._zenMode) return;
        
        if (!this._zenMode) {
            this.isCompleted = true;
            this.element.classList.add('completed');
        }
        
        if (!this._skipCompleteSound) {
            this.soundManager.playComplete();
        }
        this.emit('completed', this);
    }

    disable() {
        this.element.style.pointerEvents = 'none';
    }

    destroy() {
        this.element.remove();
        this._eventListeners.clear();
    }
}
