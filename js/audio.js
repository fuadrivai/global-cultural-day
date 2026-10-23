/**
 * Global Cultural Day - Web Audio Sound Effects
 * 100% Client-side synthetic audio using Web Audio API (No external MP3 files needed!)
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBeep(freq = 600, duration = 0.12, type = 'sine') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playCountdownTick() {
    this.playBeep(750, 0.08, 'sine');
  }

  playCountdownFinal() {
    this.playBeep(1200, 0.25, 'triangle');
  }

  playShutter() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Shutter click sound simulation: rapid click + white noise burst
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(3, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 0.12);
    } catch (e) {
      console.warn('Shutter sound error:', e);
    }
  }

  playCelebration() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Cheerful arpeggio fanfare (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playBeep(freq, 0.22, 'triangle');
      }, i * 110);
    });
  }

  playPop() {
    this.playBeep(880, 0.06, 'sine');
  }
}

window.soundManager = new SoundManager();
