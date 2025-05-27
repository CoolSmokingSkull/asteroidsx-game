// ShipCustomizer - Ship design and customization system
export class ShipCustomizer {
  constructor() {
    this.shipStyles = {
      classic: {
        name: 'Classic',
        description: 'The original triangular fighter',
        points: [
          [15, 0],     // Nose - pointing RIGHT (positive X direction)
          [-10, -8],   // Left wing
          [-5, 0],     // Center back
          [-10, 8]     // Right wing
        ],
        thrusterOffset: [-8, 0],  // Thruster position (behind center)
        color: '#00ffff',
        glowColor: '#00ffff'
      },
      
      arrow: {
        name: 'Arrow',
        description: 'Sleek arrow-shaped interceptor',
        points: [
          [0, -18],    // Sharp nose
          [-4, -8],    // Neck left
          [-8, 0],     // Wing left
          [-6, 12],    // Back left
          [0, 8],      // Center back
          [6, 12],     // Back right
          [8, 0],      // Wing right
          [4, -8]      // Neck right
        ],
        thrusterOffset: [0, 10],
        color: '#ff00ff',
        glowColor: '#ff44ff'
      },
      
      diamond: {
        name: 'Diamond',
        description: 'Balanced diamond configuration',
        points: [
          [0, -12],    // Top
          [10, 0],     // Right
          [0, 12],     // Bottom
          [-10, 0]     // Left
        ],
        thrusterOffset: [0, 12],
        color: '#ffff00',
        glowColor: '#ffff44'
      },
      
      triangle: {
        name: 'Triangle',
        description: 'Wide-wing heavy fighter',
        points: [
          [0, -12],    // Nose
          [-12, 8],    // Left wing
          [-4, 12],    // Left back
          [4, 12],     // Right back
          [12, 8]      // Right wing
        ],
        thrusterOffset: [0, 12],
        color: '#00ff00',
        glowColor: '#44ff44'
      },
      
      stealth: {
        name: 'Stealth',
        description: 'Angular stealth fighter',
        points: [
          [0, -15],    // Nose
          [6, -6],     // Right nose
          [12, 0],     // Right wing tip
          [8, 8],      // Right wing back
          [3, 10],     // Right center
          [0, 12],     // Back center
          [-3, 10],    // Left center
          [-8, 8],     // Left wing back
          [-12, 0],    // Left wing tip
          [-6, -6]     // Left nose
        ],
        thrusterOffset: [0, 12],
        color: '#ff4400',
        glowColor: '#ff6644'
      },
      
      viper: {
        name: 'Viper',
        description: 'Dual-engine racing ship',
        points: [
          [0, -16],    // Nose
          [4, -8],     // Right nose
          [8, -4],     // Right engine front
          [10, 8],     // Right engine back
          [6, 12],     // Right thruster
          [2, 10],     // Right center
          [0, 8],      // Center
          [-2, 10],    // Left center
          [-6, 12],    // Left thruster
          [-10, 8],    // Left engine back
          [-8, -4],    // Left engine front
          [-4, -8]     // Left nose
        ],
        thrusterOffset: [0, 10],
        dualThrusters: [[-6, 12], [6, 12]], // Dual thruster positions
        color: '#8800ff',
        glowColor: '#aa44ff'
      }
    };
    
    this.currentStyle = 'classic';
    this.unlockedStyles = new Set(['classic']);
    
    // Customization settings (available for all ships)
    this.customization = {
      color: {
        primary: '#00ffff',
        secondary: '#ffffff',
        trail: '#00ffff'
      },
      stats: {
        speed: 1.0,        // 0.8 - 1.2
        agility: 1.0,      // 0.8 - 1.2  
        fireRate: 1.0,     // 0.8 - 1.2
        shield: 1.0        // 0.8 - 1.2
      },
      trail: {
        enabled: true,
        length: 1.0,       // 0.5 - 2.0
        intensity: 1.0,    // 0.5 - 1.5
        particles: true
      }
    };
    
    this.loadProgress();
  }
  
  getCurrentStyle() {
    return this.shipStyles[this.currentStyle];
  }
  
  setStyle(styleName) {
    if (this.isUnlocked(styleName)) {
      this.currentStyle = styleName;
      this.saveProgress();
      return true;
    }
    return false;
  }
  
  isUnlocked(styleName) {
    return this.unlockedStyles.has(styleName);
  }
  
  unlockStyle(styleName) {
    if (this.shipStyles[styleName]) {
      this.unlockedStyles.add(styleName);
      this.saveProgress();
      console.log(`🚀 Ship style unlocked: ${this.shipStyles[styleName].name}`);
      return true;
    }
    return false;
  }
  
  getUnlockRequirements() {
    return {
      arrow: { type: 'score', value: 1000, description: 'Reach 1,000 points' },
      diamond: { type: 'level', value: 3, description: 'Reach level 3' },
      triangle: { type: 'asteroids', value: 50, description: 'Destroy 50 asteroids' },
      stealth: { type: 'score', value: 5000, description: 'Reach 5,000 points' },
      viper: { type: 'level', value: 5, description: 'Reach level 5' }
    };
  }
  
  checkUnlocks(gameStats) {
    const requirements = this.getUnlockRequirements();
    const newUnlocks = [];
    
    Object.entries(requirements).forEach(([style, req]) => {
      if (!this.isUnlocked(style)) {
        let shouldUnlock = false;
        
        switch (req.type) {
          case 'score':
            shouldUnlock = gameStats.highScore >= req.value;
            break;
          case 'level':
            shouldUnlock = gameStats.maxLevel >= req.value;
            break;
          case 'asteroids':
            shouldUnlock = gameStats.totalAsteroids >= req.value;
            break;
        }
        
        if (shouldUnlock) {
          this.unlockStyle(style);
          newUnlocks.push(style);
        }
      }
    });
    
    return newUnlocks;
  }
  
  getAllStyles() {
    return Object.entries(this.shipStyles).map(([key, style]) => ({
      key,
      ...style,
      unlocked: this.isUnlocked(key),
      requirements: this.getUnlockRequirements()[key]
    }));
  }
  
  renderCustomizationPreview(ctx, x, y, scale = 1, rotation = 0) {
    const style = this.getCurrentStyle();
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    
    // Draw ship outline
    ctx.strokeStyle = style.color;
    ctx.fillStyle = style.color + '40'; // Semi-transparent fill
    ctx.lineWidth = 2;
    ctx.shadowColor = style.glowColor;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(style.points[0][0], style.points[0][1]);
    
    for (let i = 1; i < style.points.length; i++) {
      ctx.lineTo(style.points[i][0], style.points[i][1]);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw center core
    ctx.fillStyle = style.glowColor;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  // Customization methods
  setCustomColor(colorType, color) {
    if (this.customization.color.hasOwnProperty(colorType)) {
      this.customization.color[colorType] = color;
      this.saveProgress();
      return true;
    }
    return false;
  }
  
  setCustomStat(statType, value) {
    if (this.customization.stats.hasOwnProperty(statType)) {
      // Clamp values between 0.8 and 1.2
      this.customization.stats[statType] = Math.max(0.8, Math.min(1.2, value));
      this.saveProgress();
      return true;
    }
    return false;
  }
  
  setTrailSetting(settingType, value) {
    if (this.customization.trail.hasOwnProperty(settingType)) {
      if (settingType === 'enabled' || settingType === 'particles') {
        this.customization.trail[settingType] = Boolean(value);
      } else {
        // Clamp numeric values
        const limits = { length: [0.5, 2.0], intensity: [0.5, 1.5] };
        const [min, max] = limits[settingType] || [0.5, 2.0];
        this.customization.trail[settingType] = Math.max(min, Math.min(max, value));
      }
      this.saveProgress();
      return true;
    }
    return false;
  }
  
  getCustomizedShipData() {
    const baseStyle = this.getCurrentStyle();
    return {
      ...baseStyle,
      color: this.customization.color.primary,
      glowColor: this.customization.color.secondary,
      trailColor: this.customization.color.trail,
      stats: { ...this.customization.stats },
      trail: { ...this.customization.trail }
    };
  }
  
  resetCustomization() {
    this.customization = {
      color: {
        primary: '#00ffff',
        secondary: '#ffffff', 
        trail: '#00ffff'
      },
      stats: {
        speed: 1.0,
        agility: 1.0,
        fireRate: 1.0,
        shield: 1.0
      },
      trail: {
        enabled: true,
        length: 1.0,
        intensity: 1.0,
        particles: true
      }
    };
    this.saveProgress();
  }

  saveProgress() {
    const data = {
      currentStyle: this.currentStyle,
      unlockedStyles: Array.from(this.unlockedStyles),
      customization: this.customization
    };
    
    localStorage.setItem('asteroidsX_shipCustomization', JSON.stringify(data));
  }
  
  loadProgress() {
    try {
      const saved = localStorage.getItem('asteroidsX_shipCustomization');
      if (saved) {
        const data = JSON.parse(saved);
        this.currentStyle = data.currentStyle || 'classic';
        this.unlockedStyles = new Set(data.unlockedStyles || ['classic']);
        
        // Load customization data with fallbacks
        if (data.customization) {
          this.customization = {
            color: { ...this.customization.color, ...data.customization.color },
            stats: { ...this.customization.stats, ...data.customization.stats },
            trail: { ...this.customization.trail, ...data.customization.trail }
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load ship customization data:', error);
      this.currentStyle = 'classic';
      this.unlockedStyles = new Set(['classic']);
    }
  }
  
  exportStyle(styleName) {
    const style = this.shipStyles[styleName];
    if (!style) return null;
    
    return {
      name: style.name,
      points: [...style.points],
      color: style.color,
      glowColor: style.glowColor,
      thrusterOffset: [...style.thrusterOffset],
      dualThrusters: style.dualThrusters ? [...style.dualThrusters] : null
    };
  }
  
  createCustomStyle(name, config) {
    const customKey = `custom_${Date.now()}`;
    
    this.shipStyles[customKey] = {
      name: name,
      description: 'Custom ship design',
      points: config.points,
      thrusterOffset: config.thrusterOffset,
      color: config.color || '#ffffff',
      glowColor: config.glowColor || '#ffffff',
      custom: true
    };
    
    this.unlockStyle(customKey);
    return customKey;
  }
}
