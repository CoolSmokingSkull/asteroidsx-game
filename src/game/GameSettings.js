// GameSettings - Settings and options management
export class GameSettings {
  constructor() {
    this.defaults = {
      // Audio settings
      masterVolume: 0.7,
      musicVolume: 0.5,
      sfxVolume: 0.8,
      
      // Graphics settings
      particleCount: 'high', // low, medium, high, ultra
      screenShake: true,
      flashEffects: true,
      trailEffects: true,
      glowEffects: true,
      
      // Gameplay settings
      difficulty: 'normal', // easy, normal, hard, insane
      autofire: false,
      showFPS: false,
      
      // Controls settings
      rotationSensitivity: 1.0,
      thrustDeadzone: 0.1,
      
      // Visual preferences
      colorTheme: 'psychedelic', // classic, psychedelic, neon, matrix
      backgroundIntensity: 1.0,
      
      // Accessibility
      reducedMotion: false,
      highContrast: false,
      colorBlindMode: 'none' // none, protanopia, deuteranopia, tritanopia
    };
    
    this.settings = { ...this.defaults };
    this.loadSettings();
  }
  
  get(key) {
    return this.settings[key];
  }
  
  set(key, value) {
    if (this.defaults.hasOwnProperty(key)) {
      this.settings[key] = value;
      this.saveSettings();
      this.onSettingChanged(key, value);
      return true;
    }
    return false;
  }
  
  reset() {
    this.settings = { ...this.defaults };
    this.saveSettings();
    console.log('🔄 Settings reset to defaults');
  }
  
  getParticleCountMultiplier() {
    const multipliers = {
      low: 0.25,
      medium: 0.5,
      high: 1.0,
      ultra: 2.0
    };
    return multipliers[this.settings.particleCount] || 1.0;
  }
  
  getDifficultyMultiplier() {
    const multipliers = {
      easy: 0.7,
      normal: 1.0,
      hard: 1.3,
      insane: 1.6
    };
    return multipliers[this.settings.difficulty] || 1.0;
  }
  
  getColorTheme() {
    const themes = {
      classic: {
        primary: '#ffffff',
        accent: '#ffff00',
        background: '#000000',
        particle: '#ff0000'
      },
      psychedelic: {
        primary: '#ff00ff',
        accent: '#00ffff',
        background: '#001122',
        particle: '#ffff00'
      },
      neon: {
        primary: '#00ff00',
        accent: '#ff0080',
        background: '#000011',
        particle: '#0080ff'
      },
      matrix: {
        primary: '#00ff00',
        accent: '#008800',
        background: '#000000',
        particle: '#004400'
      }
    };
    
    return themes[this.settings.colorTheme] || themes.psychedelic;
  }
  
  onSettingChanged(key, value) {
    switch (key) {
      case 'masterVolume':
      case 'musicVolume':
      case 'sfxVolume':
        this.updateAudioSettings();
        break;
        
      case 'particleCount':
        this.updateParticleSettings();
        break;
        
      case 'colorTheme':
        this.updateVisualTheme();
        break;
        
      case 'reducedMotion':
        this.updateMotionSettings();
        break;
        
      case 'highContrast':
        this.updateContrastSettings();
        break;
    }
  }
  
  updateAudioSettings() {
    // Dispatch event for audio manager to pick up
    window.dispatchEvent(new CustomEvent('audioSettingsChanged', {
      detail: {
        masterVolume: this.settings.masterVolume,
        musicVolume: this.settings.musicVolume,
        sfxVolume: this.settings.sfxVolume
      }
    }));
  }
  
  updateParticleSettings() {
    window.dispatchEvent(new CustomEvent('particleSettingsChanged', {
      detail: {
        multiplier: this.getParticleCountMultiplier()
      }
    }));
  }
  
  updateVisualTheme() {
    const theme = this.getColorTheme();
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
    document.documentElement.style.setProperty('--background-color', theme.background);
    
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme }
    }));
  }
  
  updateMotionSettings() {
    if (this.settings.reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }
  
  updateContrastSettings() {
    if (this.settings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }
  
  exportSettings() {
    return JSON.stringify(this.settings, null, 2);
  }
  
  importSettings(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      
      // Validate imported settings
      for (const key in imported) {
        if (this.defaults.hasOwnProperty(key)) {
          this.settings[key] = imported[key];
        }
      }
      
      this.saveSettings();
      this.applyAllSettings();
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }
  
  applyAllSettings() {
    // Apply all settings at once (useful after import or page load)
    this.updateAudioSettings();
    this.updateParticleSettings();
    this.updateVisualTheme();
    this.updateMotionSettings();
    this.updateContrastSettings();
  }
  
  saveSettings() {
    try {
      localStorage.setItem('asteroidsX_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }
  
  loadSettings() {
    try {
      const saved = localStorage.getItem('asteroidsX_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Merge with defaults to handle new settings
        this.settings = { ...this.defaults, ...parsed };
        
        // Apply settings after load
        setTimeout(() => this.applyAllSettings(), 100);
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
      this.settings = { ...this.defaults };
    }
  }
  
  getSettingsForUI() {
    return {
      audio: {
        masterVolume: { 
          value: this.settings.masterVolume, 
          type: 'range', 
          min: 0, 
          max: 1, 
          step: 0.1,
          label: 'Master Volume'
        },
        musicVolume: { 
          value: this.settings.musicVolume, 
          type: 'range', 
          min: 0, 
          max: 1, 
          step: 0.1,
          label: 'Music Volume'
        },
        sfxVolume: { 
          value: this.settings.sfxVolume, 
          type: 'range', 
          min: 0, 
          max: 1, 
          step: 0.1,
          label: 'SFX Volume'
        }
      },
      
      graphics: {
        particleCount: {
          value: this.settings.particleCount,
          type: 'select',
          options: ['low', 'medium', 'high', 'ultra'],
          label: 'Particle Detail'
        },
        screenShake: {
          value: this.settings.screenShake,
          type: 'checkbox',
          label: 'Screen Shake'
        },
        flashEffects: {
          value: this.settings.flashEffects,
          type: 'checkbox',
          label: 'Flash Effects'
        },
        trailEffects: {
          value: this.settings.trailEffects,
          type: 'checkbox',
          label: 'Trail Effects'
        },
        glowEffects: {
          value: this.settings.glowEffects,
          type: 'checkbox',
          label: 'Glow Effects'
        }
      },
      
      gameplay: {
        difficulty: {
          value: this.settings.difficulty,
          type: 'select',
          options: ['easy', 'normal', 'hard', 'insane'],
          label: 'Difficulty'
        },
        autofire: {
          value: this.settings.autofire,
          type: 'checkbox',
          label: 'Auto-fire'
        },
        showFPS: {
          value: this.settings.showFPS,
          type: 'checkbox',
          label: 'Show FPS'
        }
      },
      
      visual: {
        colorTheme: {
          value: this.settings.colorTheme,
          type: 'select',
          options: ['classic', 'psychedelic', 'neon', 'matrix'],
          label: 'Color Theme'
        },
        backgroundIntensity: {
          value: this.settings.backgroundIntensity,
          type: 'range',
          min: 0.1,
          max: 2.0,
          step: 0.1,
          label: 'Background Intensity'
        }
      },
      
      accessibility: {
        reducedMotion: {
          value: this.settings.reducedMotion,
          type: 'checkbox',
          label: 'Reduce Motion'
        },
        highContrast: {
          value: this.settings.highContrast,
          type: 'checkbox',
          label: 'High Contrast'
        },
        colorBlindMode: {
          value: this.settings.colorBlindMode,
          type: 'select',
          options: ['none', 'protanopia', 'deuteranopia', 'tritanopia'],
          label: 'Color Blind Support'
        }
      }
    };
  }
}
