/**
 * Web Audio API Sound Synthesizer for Anime Arcade SFX
 * Completely self-contained, instant loading, 0 external asset dependency.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.chargeOsc = null;
    this.chargeGain = null;
    this.isCharging = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.chargeGain) {
      this.chargeGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.muted;
  }

  // --- Sound Effects ---

  playHit(isHeavy = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isHeavy ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(isHeavy ? 180 : 280, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + (isHeavy ? 0.35 : 0.18));

    gain.gain.setValueAtTime(isHeavy ? 0.5 : 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + (isHeavy ? 0.35 : 0.18));

    // Add noise burst for crunch impact
    const bufferSize = this.ctx.sampleRate * (isHeavy ? 0.15 : 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(isHeavy ? 600 : 1200, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isHeavy ? 0.4 : 0.25, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + (isHeavy ? 0.15 : 0.08));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + (isHeavy ? 0.35 : 0.18));
    noise.start(t);
  }

  playGuard() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(980, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  playWhoosh() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  playJump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playRasengan() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Dual oscillating vortex hum
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(320, t);
    osc1.frequency.linearRampToValueAtTime(680, t + 0.4);

    osc2.frequency.setValueAtTime(160, t);
    osc2.frequency.linearRampToValueAtTime(340, t + 0.4);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.45);
    osc2.stop(t + 0.45);
  }

  playChidori() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // High pitched buzzing electrical chirping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    // Rapid pitch wobble
    for (let i = 0; i < 8; i++) {
      osc.frequency.setValueAtTime(700 + Math.random() * 500, t + i * 0.05);
    }

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.42);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  startChakraLoop() {
    if (this.muted || this.isCharging) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.isCharging = true;
      const t = this.ctx.currentTime;
      this.chargeOsc = this.ctx.createOscillator();
      this.chargeGain = this.ctx.createGain();

      this.chargeOsc.type = 'sine';
      this.chargeOsc.frequency.setValueAtTime(110, t);
      this.chargeOsc.frequency.linearRampToValueAtTime(220, t + 1.5);

      this.chargeGain.gain.setValueAtTime(0.01, t);
      this.chargeGain.gain.linearRampToValueAtTime(0.2, t + 0.2);

      this.chargeOsc.connect(this.chargeGain);
      this.chargeGain.connect(this.ctx.destination);

      this.chargeOsc.start(t);
    } catch {
      // Audio safety
    }
  }

  stopChakraLoop() {
    if (!this.isCharging) return;
    this.isCharging = false;
    if (this.chargeGain && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.chargeGain.gain.linearRampToValueAtTime(0.01, t + 0.1);
        if (this.chargeOsc) {
          this.chargeOsc.stop(t + 0.1);
        }
      } catch {
        // Audio safety
      }
    }
  }

  playKO() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.9);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.9);
  }

  playFightStart() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Gong / gong impact chime
    const notes = [440, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.3, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.08);
      osc.stop(t + 1.2);
    });
  }
}

export const audioManager = new SoundSystem();
