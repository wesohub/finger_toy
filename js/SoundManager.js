export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;
        this.masterGain.connect(this.ctx.destination);
        
        this.lastProgressTime = 0;
        this.lastSlideTime = 0;
        this.slideOsc = null;
        this.slideGain = null;
        this.slideNoise = null;
        this.slideNoiseGain = null;
        this.slideFilter = null;
        this.isSlideActive = false;
        this.isSpinActive = false;
    }

    setVolume(gain) {
        this.masterGain.gain.value = Math.max(0, Math.min(2, gain));
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
        fundamental.frequency.setValueAtTime(220, t);
        fundamental.frequency.exponentialRampToValueAtTime(200, t + 0.08);
        
        const harmonic = this.ctx.createOscillator();
        harmonic.type = 'sine';
        harmonic.frequency.setValueAtTime(440, t);
        harmonic.frequency.exponentialRampToValueAtTime(400, t + 0.06);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(2000, t);
        lowpass.frequency.exponentialRampToValueAtTime(600, t + 0.08);
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
        osc1.frequency.setValueAtTime(220, t);
        osc1.frequency.exponentialRampToValueAtTime(400, t + 0.03);
        osc1.frequency.exponentialRampToValueAtTime(280, t + 0.12);
        
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(440, t);
        osc2.frequency.exponentialRampToValueAtTime(800, t + 0.03);
        osc2.frequency.exponentialRampToValueAtTime(560, t + 0.1);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(3000, t);
        lowpass.frequency.exponentialRampToValueAtTime(800, t + 0.15);
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
        this.playClick();
    }

    playSlideMove() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const now = this.ctx.currentTime;
        if (now - this.lastSlideTime < 0.03) return;
        this.lastSlideTime = now;
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 800;
        lowpass.Q.value = 0.5;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        osc.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }

    stopSlide() {
    }

    playSlideProgress(value) {
        this.playSlideMove();
    }

    startSpin() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (this.isSpinActive) return;
        
        const t = this.ctx.currentTime;
        
        const noiseBuffer = this.createNoiseBuffer(2);
        this.spinNoise = this.ctx.createBufferSource();
        this.spinNoise.buffer = noiseBuffer;
        this.spinNoise.loop = true;
        
        this.spinNoiseFilter = this.ctx.createBiquadFilter();
        this.spinNoiseFilter.type = 'lowpass';
        this.spinNoiseFilter.frequency.value = 300;
        this.spinNoiseFilter.Q.value = 0.5;
        
        this.spinNoiseGain = this.ctx.createGain();
        this.spinNoiseGain.gain.setValueAtTime(0, t);
        this.spinNoiseGain.gain.linearRampToValueAtTime(0.35, t + 0.1);
        
        this.spinNoise.connect(this.spinNoiseFilter);
        this.spinNoiseFilter.connect(this.spinNoiseGain);
        this.spinNoiseGain.connect(this.masterGain);
        
        this.spinNoise2 = this.ctx.createBufferSource();
        this.spinNoise2.buffer = this.createNoiseBuffer(2);
        this.spinNoise2.loop = true;
        
        this.spinNoiseFilter2 = this.ctx.createBiquadFilter();
        this.spinNoiseFilter2.type = 'bandpass';
        this.spinNoiseFilter2.frequency.value = 200;
        this.spinNoiseFilter2.Q.value = 1;
        
        this.spinNoiseGain2 = this.ctx.createGain();
        this.spinNoiseGain2.gain.setValueAtTime(0, t);
        this.spinNoiseGain2.gain.linearRampToValueAtTime(0.25, t + 0.1);
        
        this.spinNoise2.connect(this.spinNoiseFilter2);
        this.spinNoiseFilter2.connect(this.spinNoiseGain2);
        this.spinNoiseGain2.connect(this.masterGain);
        
        this.spinNoise.start(t);
        this.spinNoise2.start(t);
        this.isSpinActive = true;
    }

    updateSpinSound(speed) {
        if (!this.isSpinActive) return;
        
        const t = this.ctx.currentTime;
        const normalizedSpeed = Math.min(speed, 1);
        
        this.spinNoiseFilter.frequency.linearRampToValueAtTime(300 + normalizedSpeed * 200, t + 0.03);
        this.spinNoiseFilter2.frequency.linearRampToValueAtTime(200 + normalizedSpeed * 150, t + 0.03);
        
        const vol1 = normalizedSpeed * 0.4;
        const vol2 = normalizedSpeed * 0.3;
        this.spinNoiseGain.gain.linearRampToValueAtTime(vol1, t + 0.03);
        this.spinNoiseGain2.gain.linearRampToValueAtTime(vol2, t + 0.03);
    }

    stopSpin() {
        if (!this.isSpinActive) return;
        
        const t = this.ctx.currentTime;
        const fadeTime = 0.8;
        
        this.spinNoiseGain.gain.linearRampToValueAtTime(0, t + fadeTime);
        this.spinNoiseGain2.gain.linearRampToValueAtTime(0, t + fadeTime);
        
        const noise1 = this.spinNoise;
        const noise2 = this.spinNoise2;
        
        setTimeout(() => {
            if (noise1) { try { noise1.stop(); } catch(e) {} }
            if (noise2) { try { noise2.stop(); } catch(e) {} }
        }, (fadeTime + 0.1) * 1000);
        
        this.spinNoise = null;
        this.spinNoise2 = null;
        this.spinNoiseFilter = null;
        this.spinNoiseFilter2 = null;
        this.spinNoiseGain = null;
        this.spinNoiseGain2 = null;
        this.isSpinActive = false;
    }

    playSpin(speed) {
        this.startSpin();
        this.updateSpinSound(speed);
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
        const baseFreq = 250 + progress * 150;
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq + 80, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, t + 0.03);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(2000, t);
        lowpass.frequency.exponentialRampToValueAtTime(400, t + 0.06);
        lowpass.Q.value = 1;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.004);
        gain.gain.setValueAtTime(0.3, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        
        osc.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.masterGain);
        
        const { source: noise, filter: noiseFilter } = this.createFilteredNoise(0.02, 800 + progress * 300, 1.5);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.06, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
        
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        const click = this.ctx.createOscillator();
        click.type = 'sine';
        click.frequency.setValueAtTime(600 + progress * 150, t);
        
        const clickGain = this.ctx.createGain();
        clickGain.gain.setValueAtTime(0, t);
        clickGain.gain.linearRampToValueAtTime(0.12, t + 0.002);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
        
        const clickFilter = this.ctx.createBiquadFilter();
        clickFilter.type = 'highpass';
        clickFilter.frequency.value = 300;
        
        click.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.07);
        noise.start(t);
        noise.stop(t + 0.02);
        click.start(t);
        click.stop(t + 0.02);
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
        
        const baseFreq = 220 + progress * 300;
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.linearRampToValueAtTime(baseFreq + 30, now + 0.04);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 800 + progress * 400;
        lowpass.Q.value = 0.8;
        
        const volume = 0.35 + progress * 0.2;
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
        osc1.frequency.setValueAtTime(320, t);
        osc1.frequency.exponentialRampToValueAtTime(220, t + 0.04);
        
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(640, t);
        osc2.frequency.exponentialRampToValueAtTime(440, t + 0.03);
        
        const highClick = this.ctx.createOscillator();
        highClick.type = 'sine';
        highClick.frequency.setValueAtTime(1200, t);
        highClick.frequency.exponentialRampToValueAtTime(400, t + 0.02);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(2500, t);
        lowpass.frequency.exponentialRampToValueAtTime(600, t + 0.05);
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

    playLetterAppear(index, total) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        
        const baseFreq = 400 + (index / total) * 200;
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * 1.2, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, t + 0.05);
        
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 2.4, t);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2, t + 0.03);
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(3000, t);
        lowpass.frequency.exponentialRampToValueAtTime(800, t + 0.1);
        lowpass.Q.value = 1;
        
        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0, t);
        gain1.gain.linearRampToValueAtTime(0.25, t + 0.01);
        gain1.gain.setValueAtTime(0.25, t + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        
        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0, t);
        gain2.gain.linearRampToValueAtTime(0.08, t + 0.008);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        
        osc.connect(lowpass);
        lowpass.connect(gain1);
        gain1.connect(this.masterGain);
        
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.18);
        osc2.start(t);
        osc2.stop(t + 0.1);
    }
}
