export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;
        this.masterGain.connect(this.ctx.destination);
        
        this.lastProgressTime = 0;
        this.lastSlideFreq = 0;
        this.slideOsc = null;
        this.slideGain = null;
        this.slideNoise = null;
        this.slideNoiseGain = null;
        this.slideFilter = null;
        this.isSlideActive = false;
    }

    createNoiseBuffer(duration) {
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    createFilteredNoise(duration, filterFreq, Q = 1) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(duration);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = Q;
        
        noise.connect(filter);
        return { source: noise, filter };
    }

    playClick() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        
        const fundamental = this.ctx.createOscillator();
        fundamental.type = 'sine';
        fundamental.frequency.setValueAtTime(180, t);
        fundamental.frequency.exponentialRampToValueAtTime(80, t + 0.08);
        
        const harmonic = this.ctx.createOscillator();
        harmonic.type = 'sine';
        harmonic.frequency.setValueAtTime(360, t);
        harmonic.frequency.exponentialRampToValueAtTime(160, t + 0.06);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(2000, t);
        lowpass.frequency.exponentialRampToValueAtTime(400, t + 0.08);
        lowpass.Q.value = 1;
        
        const gainMain = this.ctx.createGain();
        gainMain.gain.setValueAtTime(0, t);
        gainMain.gain.linearRampToValueAtTime(0.55, t + 0.003);
        gainMain.gain.setValueAtTime(0.55, t + 0.005);
        gainMain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        
        const gainHarmonic = this.ctx.createGain();
        gainHarmonic.gain.setValueAtTime(0, t);
        gainHarmonic.gain.linearRampToValueAtTime(0.2, t + 0.002);
        gainHarmonic.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        
        fundamental.connect(lowpass);
        lowpass.connect(gainMain);
        gainMain.connect(this.masterGain);
        
        harmonic.connect(gainHarmonic);
        gainHarmonic.connect(this.masterGain);
        
        const { source: noise, filter: noiseFilter } = this.createFilteredNoise(0.02, 800, 2);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.1, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
        
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        fundamental.start(t);
        fundamental.stop(t + 0.1);
        harmonic.start(t);
        harmonic.stop(t + 0.08);
        noise.start(t);
        noise.stop(t + 0.02);
    }

    playSwitch() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(150, t);
        osc1.frequency.exponentialRampToValueAtTime(400, t + 0.03);
        osc1.frequency.exponentialRampToValueAtTime(200, t + 0.12);
        
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(300, t);
        osc2.frequency.exponentialRampToValueAtTime(800, t + 0.03);
        osc2.frequency.exponentialRampToValueAtTime(400, t + 0.1);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(3000, t);
        lowpass.frequency.exponentialRampToValueAtTime(600, t + 0.15);
        lowpass.Q.value = 2;
        
        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0, t);
        gain1.gain.linearRampToValueAtTime(0.5, t + 0.005);
        gain1.gain.setValueAtTime(0.5, t + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        
        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0, t);
        gain2.gain.linearRampToValueAtTime(0.18, t + 0.003);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        
        osc1.connect(lowpass);
        lowpass.connect(gain1);
        gain1.connect(this.masterGain);
        
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        
        const { source: noise, filter: noiseFilter } = this.createFilteredNoise(0.04, 1200, 3);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        osc1.start(t);
        osc1.stop(t + 0.18);
        osc2.start(t);
        osc2.stop(t + 0.12);
        noise.start(t);
        noise.stop(t + 0.04);
    }

    playSlide() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (this.isSlideActive) return;
        
        const t = this.ctx.currentTime;
        
        this.slideOsc = this.ctx.createOscillator();
        this.slideOsc.type = 'sine';
        this.slideOsc.frequency.setValueAtTime(200, t);
        
        this.slideFilter = this.ctx.createBiquadFilter();
        this.slideFilter.type = 'lowpass';
        this.slideFilter.frequency.value = 600;
        this.slideFilter.Q.value = 0.5;
        
        this.slideGain = this.ctx.createGain();
        this.slideGain.gain.setValueAtTime(0, t);
        this.slideGain.gain.linearRampToValueAtTime(0.1, t + 0.08);
        
        this.slideOsc.connect(this.slideFilter);
        this.slideFilter.connect(this.slideGain);
        this.slideGain.connect(this.masterGain);
        
        const noiseBuffer = this.createNoiseBuffer(2);
        this.slideNoise = this.ctx.createBufferSource();
        this.slideNoise.buffer = noiseBuffer;
        this.slideNoise.loop = true;
        
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 300;
        noiseFilter.Q.value = 1;
        
        this.slideNoiseGain = this.ctx.createGain();
        this.slideNoiseGain.gain.setValueAtTime(0, t);
        this.slideNoiseGain.gain.linearRampToValueAtTime(0.02, t + 0.08);
        
        this.slideNoise.connect(noiseFilter);
        noiseFilter.connect(this.slideNoiseGain);
        this.slideNoiseGain.connect(this.masterGain);
        
        this.slideOsc.start(t);
        this.slideNoise.start(t);
        this.isSlideActive = true;
    }

    updateSlideSound(value) {
        if (!this.isSlideActive || !this.slideOsc) return;
        
        const t = this.ctx.currentTime;
        const freq = 180 + value * 80;
        this.slideOsc.frequency.linearRampToValueAtTime(freq, t + 0.03);
        
        if (this.slideFilter) {
            this.slideFilter.frequency.linearRampToValueAtTime(500 + value * 200, t + 0.03);
        }
        
        if (this.slideGain) {
            const vol = 0.08 + value * 0.06;
            this.slideGain.gain.linearRampToValueAtTime(vol, t + 0.03);
        }
    }

    stopSlide() {
        if (!this.isSlideActive) return;
        
        const t = this.ctx.currentTime;
        
        if (this.slideGain) {
            this.slideGain.gain.linearRampToValueAtTime(0, t + 0.12);
        }
        if (this.slideNoiseGain) {
            this.slideNoiseGain.gain.linearRampToValueAtTime(0, t + 0.12);
        }
        
        const osc = this.slideOsc;
        const noise = this.slideNoise;
        
        setTimeout(() => {
            if (osc) { try { osc.stop(); } catch(e) {} }
            if (noise) { try { noise.stop(); } catch(e) {} }
        }, 150);
        
        this.slideOsc = null;
        this.slideGain = null;
        this.slideNoise = null;
        this.slideNoiseGain = null;
        this.slideFilter = null;
        this.isSlideActive = false;
    }

    playSlideProgress(value) {
        this.updateSlideSound(value);
    }

    playSpin(speed) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        const duration = 0.4 + speed * 1.5;
        const normalizedSpeed = Math.min(speed, 1);
        
        const wind1 = this.ctx.createOscillator();
        wind1.type = 'sine';
        wind1.frequency.setValueAtTime(60 + normalizedSpeed * 40, t);
        wind1.frequency.linearRampToValueAtTime(30, t + duration);
        
        const wind2 = this.ctx.createOscillator();
        wind2.type = 'sine';
        wind2.frequency.setValueAtTime(120 + normalizedSpeed * 80, t);
        wind2.frequency.linearRampToValueAtTime(50, t + duration);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(400 + normalizedSpeed * 200, t);
        lowpass.frequency.linearRampToValueAtTime(100, t + duration);
        lowpass.Q.value = 0.7;
        
        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0.15 + normalizedSpeed * 0.1, t);
        gain1.gain.linearRampToValueAtTime(0.08, t + duration * 0.3);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + duration);
        
        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0.08 + normalizedSpeed * 0.05, t);
        gain2.gain.linearRampToValueAtTime(0.04, t + duration * 0.3);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + duration);
        
        wind1.connect(lowpass);
        lowpass.connect(gain1);
        gain1.connect(this.masterGain);
        
        wind2.connect(gain2);
        gain2.connect(this.masterGain);
        
        const noiseBuffer = this.createNoiseBuffer(duration);
        const windNoise = this.ctx.createBufferSource();
        windNoise.buffer = noiseBuffer;
        
        const windFilter = this.ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(150 + normalizedSpeed * 100, t);
        windFilter.frequency.linearRampToValueAtTime(80, t + duration);
        windFilter.Q.value = 0.5;
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.06 + normalizedSpeed * 0.04, t);
        noiseGain.gain.linearRampToValueAtTime(0.03, t + duration * 0.5);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        
        windNoise.connect(windFilter);
        windFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        wind1.start(t);
        wind1.stop(t + duration + 0.1);
        wind2.start(t);
        wind2.stop(t + duration + 0.1);
        windNoise.start(t);
        windNoise.stop(t + duration);
    }

    playTone(freq) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, t);
        
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, t);
        
        const osc3 = this.ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(freq * 3, t);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = freq * 4;
        lowpass.Q.value = 0.5;
        
        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0, t);
        gain1.gain.linearRampToValueAtTime(0.25, t + 0.01);
        gain1.gain.setValueAtTime(0.25, t + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        
        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0, t);
        gain2.gain.linearRampToValueAtTime(0.1, t + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        
        const gain3 = this.ctx.createGain();
        gain3.gain.setValueAtTime(0, t);
        gain3.gain.linearRampToValueAtTime(0.04, t + 0.01);
        gain3.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        
        osc1.connect(lowpass);
        lowpass.connect(gain1);
        gain1.connect(this.masterGain);
        
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        
        osc3.connect(gain3);
        gain3.connect(this.masterGain);
        
        osc1.start(t);
        osc1.stop(t + 0.45);
        osc2.start(t);
        osc2.stop(t + 0.3);
        osc3.start(t);
        osc3.stop(t + 0.2);
    }

    playDetent(index, total) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        
        const progress = (index + 1) / total;
        const baseFreq = 200 + progress * 150;
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq + 100, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq - 50, t + 0.025);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(2500, t);
        lowpass.frequency.exponentialRampToValueAtTime(600, t + 0.04);
        lowpass.Q.value = 2;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.002);
        gain.gain.setValueAtTime(0.35, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        
        osc.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.masterGain);
        
        const { source: noise, filter: noiseFilter } = this.createFilteredNoise(0.025, 1500 + progress * 500, 3);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        const click = this.ctx.createOscillator();
        click.type = 'square';
        click.frequency.setValueAtTime(800 + progress * 200, t);
        
        const clickGain = this.ctx.createGain();
        clickGain.gain.setValueAtTime(0.08, t);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.008);
        
        const clickFilter = this.ctx.createBiquadFilter();
        clickFilter.type = 'highpass';
        clickFilter.frequency.value = 400;
        
        click.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.05);
        noise.start(t);
        noise.stop(t + 0.025);
        click.start(t);
        click.stop(t + 0.01);
    }

    playPop() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(3000, t);
        lowpass.frequency.exponentialRampToValueAtTime(400, t + 0.1);
        lowpass.Q.value = 2;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.45, t + 0.002);
        gain.gain.setValueAtTime(0.45, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        
        osc.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.masterGain);
        
        const { source: noise, filter: noiseFilter } = this.createFilteredNoise(0.05, 1000, 4);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.15);
        noise.start(t);
        noise.stop(t + 0.05);
    }

    playProgress(progress) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const now = this.ctx.currentTime;
        if (now - this.lastProgressTime < 0.05) return;
        this.lastProgressTime = now;
        
        const baseFreq = 150 + progress * 300;
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.linearRampToValueAtTime(baseFreq + 30, now + 0.04);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 800 + progress * 400;
        lowpass.Q.value = 0.8;
        
        const volume = 0.2 + progress * 0.25;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        
        osc.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playDot(dotIndex, totalDots) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        
        const progress = (dotIndex + 1) / totalDots;
        const baseFreq = 300 + progress * 400;
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, t + 0.08);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 1500;
        lowpass.Q.value = 1;
        
        const volume = 0.12 + progress * 0.12;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.005);
        gain.gain.setValueAtTime(volume, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        
        osc.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.12);
    }

    playComplete() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(300, t);
        osc1.frequency.exponentialRampToValueAtTime(120, t + 0.04);
        
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, t);
        osc2.frequency.exponentialRampToValueAtTime(240, t + 0.03);
        
        const highClick = this.ctx.createOscillator();
        highClick.type = 'sine';
        highClick.frequency.setValueAtTime(1200, t);
        highClick.frequency.exponentialRampToValueAtTime(400, t + 0.02);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(2500, t);
        lowpass.frequency.exponentialRampToValueAtTime(400, t + 0.05);
        lowpass.Q.value = 1;
        
        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0, t);
        gain1.gain.linearRampToValueAtTime(0.4, t + 0.001);
        gain1.gain.setValueAtTime(0.4, t + 0.005);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        
        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0, t);
        gain2.gain.linearRampToValueAtTime(0.18, t + 0.001);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
        
        const gainHigh = this.ctx.createGain();
        gainHigh.gain.setValueAtTime(0, t);
        gainHigh.gain.linearRampToValueAtTime(0.12, t + 0.001);
        gainHigh.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
        
        osc1.connect(lowpass);
        lowpass.connect(gain1);
        gain1.connect(this.masterGain);
        
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        
        highClick.connect(gainHigh);
        gainHigh.connect(this.masterGain);
        
        const { source: noise, filter: noiseFilter } = this.createFilteredNoise(0.02, 1500, 4);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
        
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        osc1.start(t);
        osc1.stop(t + 0.06);
        osc2.start(t);
        osc2.stop(t + 0.04);
        highClick.start(t);
        highClick.stop(t + 0.03);
        noise.start(t);
        noise.stop(t + 0.02);
    }
}
