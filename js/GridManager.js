import { ButtonComponent } from './components/Button.js';
import { SliderComponent } from './components/Slider.js';
import { KnobComponent } from './components/Knob.js';
import { SpinnerComponent } from './components/Spinner.js';
import { AudioSliderComponent } from './components/AudioSlider.js';
import { RapidFireButtonComponent } from './components/RapidFireButton.js';
import { TapButtonComponent } from './components/TapButton.js';
import { SoundManager } from './SoundManager.js';

export class GridManager {
    constructor(container, cols, rows) {
        this.container = container;
        this.cols = cols;
        this.rows = rows;
        
        this.soundManager = new SoundManager();
        this.components = [];
        this.grid = [];
        
        this.palette = [
            '#3B82F6',
            '#10B981',
            '#F97316',
            '#EF4444',
            '#FBBF24',
            '#8B5CF6',
            '#14B8A6',
            '#EC4899',
        ];

        this.isTransitioning = false;
        this.gridElement = null;
    }

    resize(cellSize, x, y) {
        this.cellSize = cellSize;
        this.offsetX = x;
        this.offsetY = y;
        
        if (this.gridElement) {
            this.gridElement.style.width = `${this.cols * cellSize}px`;
            this.gridElement.style.height = `${this.rows * cellSize}px`;
            this.gridElement.style.left = `${x}px`;
            this.gridElement.style.top = `${y}px`;
        }
        
        if (this.components.length > 0) {
            this.generateLevel();
        }
    }

    initGrid() {
        this.grid = Array(this.cols).fill().map(() => Array(this.rows).fill(false));
    }

    createGridElement(replace = true) {
        if (replace && this.gridElement) {
            this.gridElement.remove();
        }
        
        this.gridElement = document.createElement('div');
        this.gridElement.className = 'game-grid';
        this.gridElement.style.width = `${this.cols * this.cellSize}px`;
        this.gridElement.style.height = `${this.rows * this.cellSize}px`;
        this.gridElement.style.left = `${this.offsetX}px`;
        this.gridElement.style.top = `${this.offsetY}px`;
        this.container.appendChild(this.gridElement);
    }

    generateLevel() {
        if (this.isTransitioning) return;

        this.components.forEach(comp => comp.destroy());
        this.components = [];
        this.initGrid();
        this.createGridElement();
        
        const numLarge = Math.floor(Math.random() * 3) + 1; 
        for (let i = 0; i < numLarge; i++) {
            this.tryPlaceRandomLarge();
        }
        
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                if (!this.grid[x][y]) {
                    this.placeComponentAt(x, y);
                }
            }
        }
    }

    tryPlaceRandomLarge() {
        const w = 2;
        const h = 2;
        
        for(let k = 0; k < 10; k++) {
            const x = Math.floor(Math.random() * (this.cols - w + 1));
            const y = Math.floor(Math.random() * (this.rows - h + 1));
            
            if (this.canPlace(x, y, w, h)) {
                this.createAndPlace(x, y, w, h);
                return;
            }
        }
    }

    canPlace(x, y, w, h) {
        if (x + w > this.cols || y + h > this.rows) return false;
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                if (this.grid[x + i][y + j]) return false;
            }
        }
        return true;
    }

    placeComponentAt(x, y) {
        if (this.grid[x][y]) return;
        
        let w = 1;
        let h = 1;
        
        let maxH = 0;
        for (let j = 0; j < this.rows - y; j++) {
            if (!this.grid[x][y + j]) {
                maxH++;
            } else {
                break;
            }
        }
        
        let maxW = 0;
        for (let i = 0; i < this.cols - x; i++) {
            if (!this.grid[x + i][y]) {
                maxW++;
            } else {
                break;
            }
        }
        
        let isSquare2x2 = false;
        if (x + 1 < this.cols && y + 1 < this.rows) {
            if (!this.grid[x + 1][y] && !this.grid[x][y + 1] && !this.grid[x + 1][y + 1]) {
                if (Math.random() > 0.7) {
                    w = 2;
                    h = 2;
                    isSquare2x2 = true;
                }
            }
        }
        
        if (!isSquare2x2) {
            const rand = Math.random();
            if (rand < 0.35 && maxH > 1) {
                h = Math.floor(Math.random() * Math.min(maxH, 3)) + 1;
                w = 1;
            } else if (rand < 0.7 && maxW > 1) {
                w = Math.floor(Math.random() * Math.min(maxW, 3)) + 1;
                h = 1;
            } else {
                w = 1;
                h = 1;
            }
        }

        this.createAndPlace(x, y, w, h);
    }

    createAndPlace(x, y, w, h) {
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                this.grid[x + i][y + j] = true;
            }
        }
        
        let ComponentClass;
        let isHorizontal = false;
        
        if (w === 2 && h === 2) {
            const types = [KnobComponent, SpinnerComponent, RapidFireButtonComponent, TapButtonComponent];
            ComponentClass = types[Math.floor(Math.random() * types.length)];
        } else {
            if (h > 1) {
                const types = [SliderComponent, AudioSliderComponent];
                ComponentClass = types[Math.floor(Math.random() * types.length)];
                isHorizontal = false;
            } else if (w > 1) {
                const types = [SliderComponent, AudioSliderComponent];
                ComponentClass = types[Math.floor(Math.random() * types.length)];
                isHorizontal = true;
            } else {
                ComponentClass = ButtonComponent;
            }
        }
        
        const color = this.palette[Math.floor(Math.random() * this.palette.length)] || '#4d96ff';
        const margin = 16;
        const pixelW = w * this.cellSize - margin; 
        const pixelH = h * this.cellSize - margin;
        
        const comp = new ComponentClass(pixelW, pixelH, color, this.soundManager, isHorizontal);
        comp.setPosition(
            x * this.cellSize + margin / 2,
            y * this.cellSize + margin / 2
        );
        
        comp.on('completed', () => this.checkAllCompleted());
        
        this.gridElement.appendChild(comp.element);
        this.components.push(comp);
    }

    checkAllCompleted() {
        if (this.isTransitioning) return;
        if (this.components.every(c => c.isCompleted)) {
            this.transitionToNextLevel();
        }
    }

    transitionToNextLevel() {
        this.isTransitioning = true;
        this.soundManager.playComplete();
        
        this.components.forEach(c => c.disable());
        
        const prevGrid = this.gridElement;
        const prevComponents = this.components;
        
        this.gridElement = null;
        this.components = [];
        this.initGrid();
        this.createGridElement(false);
        
        const newGrid = this.gridElement;
        const newGridStartOffset = 150;
        newGrid.style.transform = `translateY(-${newGridStartOffset}%)`;
        
        this.populateGrid();
        
        const delay = 1000;
        const duration = 600;
        const extraDistance = 50;
        
        setTimeout(() => {
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / duration);
                const ease = 1 - Math.pow(1 - progress, 3);
                
                prevGrid.style.transform = `translateY(${ease * (100 + extraDistance)}%)`;
                newGrid.style.transform = `translateY(${-newGridStartOffset + ease * newGridStartOffset}%)`;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    prevGrid.remove();
                    prevComponents.forEach(c => c.destroy());
                    newGrid.style.transform = '';
                    this.isTransitioning = false;
                }
            };
            
            requestAnimationFrame(animate);
        }, delay);
    }

    populateGrid() {
        const numLarge = Math.floor(Math.random() * 3) + 1; 
        for (let i = 0; i < numLarge; i++) {
            this.tryPlaceRandomLarge();
        }
        
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                if (!this.grid[x][y]) {
                    this.placeComponentAt(x, y);
                }
            }
        }
    }
}