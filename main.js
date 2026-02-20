import { GridManager } from './js/GridManager.js';

const GRID_COLS = 3;
const GRID_ROWS = 6;

const gameContainer = document.getElementById('game-container');
const gridManager = new GridManager(gameContainer, GRID_COLS, GRID_ROWS);

function resize() {
    const margin = 20;
    const availableWidth = window.innerWidth - (margin * 2);
    const availableHeight = window.innerHeight - (margin * 2);

    let sizeByWidth = availableWidth / GRID_COLS;
    let sizeByHeight = availableHeight / GRID_ROWS;

    const CELL_SIZE = Math.min(sizeByWidth, sizeByHeight, 150);

    const gridWidth = CELL_SIZE * GRID_COLS;
    const gridHeight = CELL_SIZE * GRID_ROWS;

    const GRID_OFFSET_X = (window.innerWidth - gridWidth) / 2;
    const GRID_OFFSET_Y = (window.innerHeight - gridHeight) / 2;
    
    const borderWidth = Math.max(1, Math.round(CELL_SIZE * 0.02));
    document.documentElement.style.setProperty('--border-width', `${borderWidth}px`);
    
    gridManager.resize(CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y);
}

resize();
gridManager.generateLevel();

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resize();
    }, 200);
});

console.log("Game Initialized (Neumorphism CSS)");
