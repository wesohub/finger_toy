import { GridManager } from './js/GridManager.js';
import { StartScreen } from './js/StartScreen.js';

const GRID_COLS = 3;
const GRID_ROWS = 6;

const gameContainer = document.getElementById('game-container');
const gridManager = new GridManager(gameContainer, GRID_COLS, GRID_ROWS);

let zenMode = false;
let volumeLevel = 1;
let gameStarted = false;

function createBottomControls() {
    const controls = document.createElement('div');
    controls.className = 'bottom-controls';
    controls.id = 'bottom-controls';
    controls.style.opacity = '0';
    controls.style.pointerEvents = 'none';
    controls.style.transition = 'opacity 0.5s ease';
    
    const zenBtn = document.createElement('button');
    zenBtn.className = 'control-btn';
    zenBtn.id = 'zen-btn';
    zenBtn.style.marginRight = '15px';
    zenBtn.innerHTML = `
        <i class="fa-solid fa-spa"></i>
    `;
    zenBtn.addEventListener('click', toggleZenMode);
    
    const volumeControl = document.createElement('div');
    volumeControl.className = 'volume-control';
    volumeControl.innerHTML = `
        <i class="fa-solid fa-volume-off volume-icon" id="volume-icon"></i>
        <div class="volume-slider-container" id="volume-slider">
            <div class="volume-track">
                <div class="volume-fill" id="volume-fill"></div>
            </div>
            <div class="volume-markers">
                <div class="volume-marker active" data-level="0"></div>
                <div class="volume-marker" data-level="1"></div>
                <div class="volume-marker" data-level="2"></div>
            </div>
            <div class="volume-handle" id="volume-handle"></div>
        </div>
    `;
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'control-btn';
    nextBtn.id = 'next-btn';
    nextBtn.style.marginLeft = '15px';
    nextBtn.innerHTML = `
        <i class="fa-solid fa-forward"></i>
    `;
    nextBtn.addEventListener('click', nextLevel);
    
    controls.appendChild(zenBtn);
    controls.appendChild(volumeControl);
    controls.appendChild(nextBtn);
    
    document.body.appendChild(controls);
    
    setupVolumeControl();
    updateVolumeUI();
}

function toggleZenMode() {
    zenMode = !zenMode;
    gridManager.setZenMode(zenMode);
    
    const zenBtn = document.getElementById('zen-btn');
    if (zenMode) {
        zenBtn.classList.add('active');
    } else {
        zenBtn.classList.remove('active');
    }
}

function nextLevel() {
    if (gridManager.isTransitioning) return;
    gridManager.transitionToNextLevel(null, true);
}

function setupVolumeControl() {
    const slider = document.getElementById('volume-slider');
    const handle = document.getElementById('volume-handle');
    let isDragging = false;
    
    function updateVolumeFromPosition(clientX) {
        const rect = slider.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(rect.width, x));
        
        const rawValue = x / rect.width;
        
        if (rawValue < 0.15) {
            volumeLevel = 0;
        } else if (rawValue < 0.65) {
            volumeLevel = 1;
        } else {
            volumeLevel = 2;
        }
        
        updateVolumeUI();
        applyVolume();
    }
    
    slider.addEventListener('pointerdown', (e) => {
        isDragging = true;
        slider.setPointerCapture(e.pointerId);
        updateVolumeFromPosition(e.clientX);
    });
    
    slider.addEventListener('pointermove', (e) => {
        if (isDragging) {
            updateVolumeFromPosition(e.clientX);
        }
    });
    
    slider.addEventListener('pointerup', () => {
        isDragging = false;
    });
    
    slider.addEventListener('pointercancel', () => {
        isDragging = false;
    });
}

function updateVolumeUI() {
    const fill = document.getElementById('volume-fill');
    const handle = document.getElementById('volume-handle');
    const icon = document.getElementById('volume-icon');
    const markers = document.querySelectorAll('.volume-marker');
    
    let position;
    switch (volumeLevel) {
        case 0:
            position = 0;
            icon.className = 'fa-solid fa-volume-xmark volume-icon';
            break;
        case 1:
            position = 0.5;
            icon.className = 'fa-solid fa-volume-low volume-icon';
            break;
        case 2:
            position = 1;
            icon.className = 'fa-solid fa-volume-high volume-icon';
            break;
    }
    
    fill.style.width = `${position * 100}%`;
    handle.style.left = `${position * 100}%`;
    
    markers.forEach((marker, index) => {
        if (index <= volumeLevel) {
            marker.classList.add('active');
        } else {
            marker.classList.remove('active');
        }
    });
}

function applyVolume() {
    let gain;
    switch (volumeLevel) {
        case 0:
            gain = 0;
            break;
        case 1:
            gain = 0.8;
            break;
        case 2:
            gain = 1.6;
            break;
    }
    gridManager.soundManager.setVolume(gain);
}

function resize() {
    const margin = 20;
    const bottomBarHeight = 70;
    const availableWidth = window.innerWidth - (margin * 2);
    const availableHeight = window.innerHeight - (margin * 2) - bottomBarHeight;

    let sizeByWidth = availableWidth / GRID_COLS;
    let sizeByHeight = availableHeight / GRID_ROWS;

    const CELL_SIZE = Math.min(sizeByWidth, sizeByHeight, 150);

    const gridWidth = CELL_SIZE * GRID_COLS;
    const gridHeight = CELL_SIZE * GRID_ROWS;

    const GRID_OFFSET_X = (window.innerWidth - gridWidth) / 2;
    const GRID_OFFSET_Y = (window.innerHeight - bottomBarHeight - gridHeight) / 2;
    
    const borderWidth = Math.max(1, Math.round(CELL_SIZE * 0.02));
    document.documentElement.style.setProperty('--border-width', `${borderWidth}px`);
    
    gridManager.resize(CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y);
}

createBottomControls();
resize();

const startScreen = new StartScreen(document.body, gridManager.soundManager, () => {
    gameStarted = true;
    gridManager.generateLevel();
    gridManager.showGameWithAnimation();
    
    const bottomControls = document.getElementById('bottom-controls');
    if (bottomControls) {
        bottomControls.style.opacity = '1';
        bottomControls.style.pointerEvents = 'auto';
    }
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resize();
    }, 200);
});

console.log("Game Initialized (Neumorphism CSS)");
