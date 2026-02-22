export class StartScreen {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.element = null;
        this.letters = [];
        this.isAnimating = false;
        this.colors = [
            '#3B82F6',
            '#10B981',
            '#F97316',
            '#EF4444',
            '#FBBF24',
            '#8B5CF6',
            '#14B8A6',
            '#EC4899',
        ];
        
        this.init();
    }
    
    init() {
        this.element = document.createElement('div');
        this.element.className = 'start-screen';
        
        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-container';
        
        const title = 'TAP TOYS';
        const shuffledIndices = this.shuffleArray([...Array(title.length).keys()]);
        
        [...title].forEach((char, index) => {
            const letterWrapper = document.createElement('div');
            letterWrapper.className = 'letter-wrapper';
            
            if (char === ' ') {
                letterWrapper.classList.add('space');
            } else {
                const letter = document.createElement('div');
                letter.className = 'letter';
                letter.textContent = char;
                letter.setAttribute('data-text', char);
                
                const color = this.colors[Math.floor(Math.random() * this.colors.length)];
                letter.style.setProperty('--letter-color', color);
                
                const appearOrder = shuffledIndices.indexOf(index);
                letter.style.setProperty('--appear-order', appearOrder);
                
                this.letters.push(letter);
                letterWrapper.appendChild(letter);
            }
            
            titleContainer.appendChild(letterWrapper);
        });
        
        this.element.appendChild(titleContainer);
        this.container.appendChild(this.element);
        
        this.element.addEventListener('click', () => this.handleClick());
        this.element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick();
        }, { passive: false });
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    handleClick() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animateOut();
    }
    
    animateOut() {
        this.element.classList.add('exit');
        
        const exitDelay = 800;
        
        setTimeout(() => {
            this.destroy();
            if (this.onComplete) {
                this.onComplete();
            }
        }, exitDelay);
    }
    
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.remove();
        }
        this.element = null;
        this.letters = [];
    }
}
