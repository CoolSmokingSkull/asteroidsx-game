// DeviceDetector - Auto-detect device capabilities
export class DeviceDetector {
  constructor() {
    this.userAgent = navigator.userAgent;
    this.touchSupport = 'ontouchstart' in window;
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }

  isMobile() {
    return this.touchSupport && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.userAgent) ||
      this.screenWidth < 768
    );
  }

  isTablet() {
    return this.touchSupport && this.screenWidth >= 768 && this.screenWidth < 1024;
  }

  isDesktop() {
    return !this.isMobile() && !this.isTablet();
  }

  hasHighDPI() {
    return window.devicePixelRatio > 1;
  }

  supportsWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  supportsAudioContext() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  getMaxTextureSize() {
    if (this.supportsWebGL()) {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      return gl.getParameter(gl.MAX_TEXTURE_SIZE);
    }
    return 2048; // Fallback
  }

  getPerformanceProfile() {
    const profile = {
      level: 'high', // high, medium, low
      particleCount: 1000,
      effectsQuality: 'high',
      audioQuality: 'high'
    };

    if (this.isMobile()) {
      profile.level = 'medium';
      profile.particleCount = 300;
      profile.effectsQuality = 'medium';
    }

    // Adjust for older or lower-end devices
    if (this.screenWidth < 480 || !this.supportsWebGL()) {
      profile.level = 'low';
      profile.particleCount = 100;
      profile.effectsQuality = 'low';
      profile.audioQuality = 'medium';
    }

    return profile;
  }
}
