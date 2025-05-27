// AudioManager - Immersive 3D spatial audio with Web Audio API
export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.effectsGain = null;
    this.musicGain = null;
    this.sounds = new Map();
    this.isInitialized = false;
    this.isMuted = false;
    
    // Audio settings
    this.masterVolume = 0.7;
    this.effectsVolume = 0.8;
    this.musicVolume = 0.3;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // Create gain nodes for volume control
      this.masterGain = this.audioContext.createGain();
      this.effectsGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();

      // Connect the audio graph
      this.effectsGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // Set initial volumes
      this.setMasterVolume(this.masterVolume);
      this.setEffectsVolume(this.effectsVolume);
      this.setMusicVolume(this.musicVolume);

      // Generate procedural sounds
      await this.generateSounds();

      this.isInitialized = true;
      console.log('🎵 AudioManager initialized successfully');
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  async generateSounds() {
    // Generate laser sound
    this.sounds.set('laser', this.generateLaserSound());
    
    // Generate explosion sound
    this.sounds.set('explosion', this.generateExplosionSound());
    
    // Generate thrust sound
    this.sounds.set('thrust', this.generateThrustSound());
    
    // Generate asteroid break sound
    this.sounds.set('asteroidBreak', this.generateAsteroidBreakSound());
    
    // Generate power-up sound
    this.sounds.set('powerUp', this.generatePowerUpSound());
    
    // Generate ambient background
    this.sounds.set('ambient', this.generateAmbientSound());
  }

  generateLaserSound() {
    const duration = 0.15;
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Laser-like sound with frequency sweep
      const freq = 800 - (t * 600); // Frequency sweep down
      const wave = Math.sin(2 * Math.PI * freq * t);
      const envelope = Math.exp(-t * 8); // Quick decay
      data[i] = wave * envelope * 0.3;
    }

    return buffer;
  }

  generateExplosionSound() {
    const duration = 0.8;
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Noise-based explosion with low frequency rumble
      const noise = (Math.random() - 0.5) * 2;
      const lowFreq = Math.sin(2 * Math.PI * 60 * t);
      const envelope = Math.exp(-t * 2);
      data[i] = (noise * 0.7 + lowFreq * 0.3) * envelope * 0.4;
    }

    return buffer;
  }

  generateThrustSound() {
    const duration = 0.5;
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Engine-like sound with periodic modulation
      const baseFreq = 120;
      const modulation = 1 + Math.sin(2 * Math.PI * 30 * t) * 0.3;
      const wave = Math.sin(2 * Math.PI * baseFreq * modulation * t);
      const noise = (Math.random() - 0.5) * 0.3;
      const envelope = Math.min(1, t * 10) * Math.exp(-t * 0.5);
      data[i] = (wave + noise) * envelope * 0.2;
    }

    return buffer;
  }

  generateAsteroidBreakSound() {
    const duration = 0.4;
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Rock-breaking sound with multiple frequency components
      const freq1 = 200 * Math.exp(-t * 3);
      const freq2 = 150 * Math.exp(-t * 2);
      const noise = (Math.random() - 0.5) * 2;
      const wave = Math.sin(2 * Math.PI * freq1 * t) + Math.sin(2 * Math.PI * freq2 * t);
      const envelope = Math.exp(-t * 4);
      data[i] = (wave * 0.4 + noise * 0.6) * envelope * 0.3;
    }

    return buffer;
  }

  generatePowerUpSound() {
    const duration = 0.6;
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Ascending frequency power-up sound
      const freq = 200 + (t * 400); // Frequency sweep up
      const wave = Math.sin(2 * Math.PI * freq * t);
      const envelope = Math.sin(Math.PI * t / duration); // Bell curve
      data[i] = wave * envelope * 0.4;
    }

    return buffer;
  }

  generateAmbientSound() {
    const duration = 10; // Longer ambient loop
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Space ambient with multiple low frequency waves
      const wave1 = Math.sin(2 * Math.PI * 40 * t) * 0.1;
      const wave2 = Math.sin(2 * Math.PI * 60 * t) * 0.08;
      const wave3 = Math.sin(2 * Math.PI * 35 * t) * 0.06;
      data[i] = wave1 + wave2 + wave3;
    }

    return buffer;
  }

  playSound(soundName, options = {}) {
    if (!this.isInitialized || this.isMuted) return;

    const buffer = this.sounds.get(soundName);
    if (!buffer) {
      console.warn(`Sound ${soundName} not found`);
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      
      // Apply options
      if (options.volume !== undefined) {
        gainNode.gain.setValueAtTime(options.volume, this.audioContext.currentTime);
      }
      
      if (options.playbackRate !== undefined) {
        source.playbackRate.setValueAtTime(options.playbackRate, this.audioContext.currentTime);
      }
      
      if (options.loop) {
        source.loop = true;
      }

      // Connect to appropriate gain node
      source.connect(gainNode);
      
      if (soundName === 'ambient') {
        gainNode.connect(this.musicGain);
      } else {
        gainNode.connect(this.effectsGain);
      }

      source.start(0);
      
      // Store reference for potential stopping
      if (options.loop) {
        return { source, gainNode };
      }
    } catch (error) {
      console.warn(`Error playing sound ${soundName}:`, error);
    }
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
    }
  }

  setEffectsVolume(volume) {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
    if (this.effectsGain) {
      this.effectsGain.gain.setValueAtTime(this.effectsVolume, this.audioContext.currentTime);
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
    }
  }

  mute() {
    this.isMuted = true;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    }
  }

  unmute() {
    this.isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
    }
  }

  suspend() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
