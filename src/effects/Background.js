// Background - Parallax starfield with nebula effects
import { Vector2 } from '../utils/Vector2.js';

export class Background {
  constructor() {
    this.layers = [];
    this.nebulaClouds = [];
    this.shootingStars = [];
    this.time = 0;
    this.intensity = 1.0;
    this.shootingStarChance = 0.001;
    this.lastCameraOffset = new Vector2(0, 0);
    
    this.initializeLayers();
    this.initializeNebula();
  }
  
  initializeLayers() {
    // Create multiple parallax layers of stars
    const layerConfigs = [
      { count: 80, speed: 0.1, size: 0.5, alpha: 0.3 },   // Far stars
      { count: 60, speed: 0.3, size: 1.0, alpha: 0.5 },   // Mid stars
      { count: 40, speed: 0.5, size: 1.5, alpha: 0.7 },   // Near stars
      { count: 20, speed: 0.8, size: 2.0, alpha: 0.9 }    // Closest stars
    ];
    
    // Get proper screen dimensions with buffer for wrap-around
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const bufferZone = 200; // Extra space around screen for seamless wrap
    
    layerConfigs.forEach((config, layerIndex) => {
      const layer = {
        stars: [],
        speed: config.speed,
        baseAlpha: config.alpha
      };
      
      for (let i = 0; i < config.count; i++) {
        layer.stars.push({
          position: new Vector2(
            (Math.random() - 0.5) * (screenWidth + bufferZone * 2) + screenWidth / 2,
            (Math.random() - 0.5) * (screenHeight + bufferZone * 2) + screenHeight / 2
          ),
          size: config.size + Math.random() * config.size,
          color: this.getRandomStarColor(),
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.5 + Math.random() * 2
        });
      }
      
      this.layers.push(layer);
    });
  }
  
  initializeNebula() {
    // Create nebula clouds with better distribution
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const bufferZone = 400; // Larger buffer for nebula clouds
    
    for (let i = 0; i < 12; i++) {
      this.nebulaClouds.push({
        position: new Vector2(
          (Math.random() - 0.5) * (screenWidth + bufferZone * 2) + screenWidth / 2,
          (Math.random() - 0.5) * (screenHeight + bufferZone * 2) + screenHeight / 2
        ),
        size: 200 + Math.random() * 400,
        color: this.getRandomNebulaColor(),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.001,
        opacity: 0.08 + Math.random() * 0.15,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.001 + Math.random() * 0.002
      });
    }
  }
  
  getRandomStarColor() {
    const colors = [
      'rgba(255, 255, 255, 1)',
      'rgba(255, 200, 255, 1)',   // Pink
      'rgba(200, 255, 255, 1)',   // Cyan
      'rgba(255, 255, 200, 1)',   // Yellow
      'rgba(200, 255, 200, 1)',   // Green
      'rgba(255, 200, 200, 1)'    // Red
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  getRandomNebulaColor() {
    const colors = [
      'rgba(255, 0, 255, 1)',     // Magenta
      'rgba(0, 255, 255, 1)',     // Cyan
      'rgba(255, 255, 0, 1)',     // Yellow
      'rgba(0, 255, 0, 1)',       // Green
      'rgba(255, 100, 0, 1)',     // Orange
      'rgba(100, 0, 255, 1)'      // Purple
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  addShootingStar() {
    if (this.shootingStars.length < 3 && Math.random() < this.shootingStarChance) {
      const side = Math.floor(Math.random() * 4);
      let startPos, endPos;
      
      switch (side) {
        case 0: // Top
          startPos = new Vector2(Math.random() * window.innerWidth, -50);
          endPos = new Vector2(
            startPos.x + (Math.random() - 0.5) * 400,
            window.innerHeight + 50
          );
          break;
        case 1: // Right
          startPos = new Vector2(window.innerWidth + 50, Math.random() * window.innerHeight);
          endPos = new Vector2(
            -50,
            startPos.y + (Math.random() - 0.5) * 400
          );
          break;
        case 2: // Bottom
          startPos = new Vector2(Math.random() * window.innerWidth, window.innerHeight + 50);
          endPos = new Vector2(
            startPos.x + (Math.random() - 0.5) * 400,
            -50
          );
          break;
        case 3: // Left
          startPos = new Vector2(-50, Math.random() * window.innerHeight);
          endPos = new Vector2(
            window.innerWidth + 50,
            startPos.y + (Math.random() - 0.5) * 400
          );
          break;
      }
      
      this.shootingStars.push({
        position: startPos.clone(),
        startPos: startPos,
        endPos: endPos,
        progress: 0,
        speed: 0.02 + Math.random() * 0.03,
        color: this.getRandomStarColor(),
        size: 2 + Math.random() * 3,
        trail: []
      });
    }
  }
  
  update(deltaTime, cameraOffset = new Vector2(0, 0)) {
    this.time += deltaTime;
    
    // Calculate camera movement delta for this frame
    const deltaX = cameraOffset.x - (this.lastCameraOffset?.x || 0);
    const deltaY = cameraOffset.y - (this.lastCameraOffset?.y || 0);
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const bufferZone = 200;
    
    // Update parallax layers
    this.layers.forEach(layer => {
      layer.stars.forEach(star => {
        // Apply parallax movement based on camera delta, not absolute position
        star.position.x -= deltaX * layer.speed;
        star.position.y -= deltaY * layer.speed;
        
        // Improved wrap around with proper buffer zones
        const leftBound = -bufferZone;
        const rightBound = screenWidth + bufferZone;
        const topBound = -bufferZone;
        const bottomBound = screenHeight + bufferZone;
        
        if (star.position.x < leftBound) {
          star.position.x = rightBound;
        } else if (star.position.x > rightBound) {
          star.position.x = leftBound;
        }
        
        if (star.position.y < topBound) {
          star.position.y = bottomBound;
        } else if (star.position.y > bottomBound) {
          star.position.y = topBound;
        }
        
        // Update twinkling
        star.twinklePhase += star.twinkleSpeed * deltaTime * 0.001;
      });
    });
    
    // Update nebula clouds
    const nebulaBufferZone = 400;
    this.nebulaClouds.forEach(cloud => {
      // Apply parallax movement (slower than stars)
      cloud.position.x -= deltaX * 0.05;
      cloud.position.y -= deltaY * 0.05;
      
      // Improved wrap around for nebula
      const leftBound = -nebulaBufferZone;
      const rightBound = screenWidth + nebulaBufferZone;
      const topBound = -nebulaBufferZone;
      const bottomBound = screenHeight + nebulaBufferZone;
      
      if (cloud.position.x < leftBound) {
        cloud.position.x = rightBound;
      } else if (cloud.position.x > rightBound) {
        cloud.position.x = leftBound;
      }
      
      if (cloud.position.y < topBound) {
        cloud.position.y = bottomBound;
      } else if (cloud.position.y > bottomBound) {
        cloud.position.y = topBound;
      }
      
      // Update rotation and pulsing
      cloud.rotation += cloud.rotationSpeed * deltaTime;
      cloud.pulsePhase += cloud.pulseSpeed * deltaTime;
    });
    
    // Store camera offset for next frame delta calculation
    this.lastCameraOffset = cameraOffset.clone();
    
    // Add shooting stars
    this.addShootingStar();
    
    // Update shooting stars
    this.shootingStars = this.shootingStars.filter(star => {
      star.progress += star.speed * deltaTime * 0.001;
      
      // Update position
      star.position.x = star.startPos.x + (star.endPos.x - star.startPos.x) * star.progress;
      star.position.y = star.startPos.y + (star.endPos.y - star.startPos.y) * star.progress;
      
      // Add to trail
      star.trail.push({
        position: star.position.clone(),
        alpha: 1.0
      });
      
      // Limit trail length and fade
      if (star.trail.length > 20) {
        star.trail.shift();
      }
      
      star.trail.forEach((point, index) => {
        point.alpha = (index / star.trail.length) * 0.8;
      });
      
      return star.progress < 1.0;
    });
  }
  
  render(ctx) {
    // Render nebula clouds first (background)
    this.renderNebula(ctx);
    
    // Render star layers
    this.renderStars(ctx);
    
    // Render shooting stars
    this.renderShootingStars(ctx);
  }
  
  renderNebula(ctx) {
    ctx.save();
    
    this.nebulaClouds.forEach(cloud => {
      const pulseScale = 1 + Math.sin(cloud.pulsePhase) * 0.1;
      const alpha = cloud.opacity * (0.8 + Math.sin(cloud.pulsePhase * 2) * 0.2);
      
      ctx.save();
      ctx.translate(cloud.position.x, cloud.position.y);
      ctx.rotate(cloud.rotation);
      ctx.scale(pulseScale, pulseScale);
      
      // Create radial gradient for nebula effect
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cloud.size);
      const color = cloud.color.replace('1)', `${alpha})`);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color.replace(`${alpha})`, `${alpha * 0.5})`));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(-cloud.size, -cloud.size, cloud.size * 2, cloud.size * 2);
      
      ctx.restore();
    });
    
    ctx.restore();
  }
  
  renderStars(ctx) {
    this.layers.forEach(layer => {
      layer.stars.forEach(star => {
        const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;
        const alpha = layer.baseAlpha * twinkle;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        
        // Add glow effect for larger stars
        if (star.size > 1) {
          ctx.shadowColor = star.color;
          ctx.shadowBlur = star.size * 2;
        }
        
        ctx.beginPath();
        ctx.arc(star.position.x, star.position.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });
    });
  }
  
  renderShootingStars(ctx) {
    this.shootingStars.forEach(star => {
      // Render trail
      ctx.save();
      ctx.strokeStyle = star.color;
      ctx.lineWidth = star.size;
      ctx.lineCap = 'round';
      
      if (star.trail.length > 1) {
        for (let i = 1; i < star.trail.length; i++) {
          const prev = star.trail[i - 1];
          const curr = star.trail[i];
          
          ctx.globalAlpha = curr.alpha;
          ctx.beginPath();
          ctx.moveTo(prev.position.x, prev.position.y);
          ctx.lineTo(curr.position.x, curr.position.y);
          ctx.stroke();
        }
      }
      
      // Render star head
      ctx.globalAlpha = 1.0;
      ctx.shadowColor = star.color;
      ctx.shadowBlur = star.size * 3;
      ctx.fillStyle = star.color;
      
      ctx.beginPath();
      ctx.arc(star.position.x, star.position.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }
  
  resize(width, height) {
    // Better redistribution when screen size changes
    const bufferZone = 200;
    const nebulaBufferZone = 400;
    
    this.layers.forEach(layer => {
      layer.stars.forEach(star => {
        // Keep stars within new bounds with buffer
        if (star.position.x > width + bufferZone) {
          star.position.x = (Math.random() - 0.5) * (width + bufferZone * 2) + width / 2;
        }
        if (star.position.y > height + bufferZone) {
          star.position.y = (Math.random() - 0.5) * (height + bufferZone * 2) + height / 2;
        }
        if (star.position.x < -bufferZone) {
          star.position.x = (Math.random() - 0.5) * (width + bufferZone * 2) + width / 2;
        }
        if (star.position.y < -bufferZone) {
          star.position.y = (Math.random() - 0.5) * (height + bufferZone * 2) + height / 2;
        }
      });
    });
    
    this.nebulaClouds.forEach(cloud => {
      // Keep nebula clouds within new bounds with larger buffer
      if (cloud.position.x > width + nebulaBufferZone) {
        cloud.position.x = (Math.random() - 0.5) * (width + nebulaBufferZone * 2) + width / 2;
      }
      if (cloud.position.y > height + nebulaBufferZone) {
        cloud.position.y = (Math.random() - 0.5) * (height + nebulaBufferZone * 2) + height / 2;
      }
      if (cloud.position.x < -nebulaBufferZone) {
        cloud.position.x = (Math.random() - 0.5) * (width + nebulaBufferZone * 2) + width / 2;
      }
      if (cloud.position.y < -nebulaBufferZone) {
        cloud.position.y = (Math.random() - 0.5) * (height + nebulaBufferZone * 2) + height / 2;
      }
    });
  }
  
  setupLevel(level) {
    // Adjust background intensity based on level
    this.intensity = Math.min(1.0 + (level - 1) * 0.1, 2.0);
    
    // Add more nebula clouds for higher levels with better distribution
    if (level > 1 && this.nebulaClouds.length < 16) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const bufferZone = 400;
      
      for (let i = 0; i < Math.min(level - 1, 4); i++) {
        this.nebulaClouds.push({
          position: new Vector2(
            (Math.random() - 0.5) * (screenWidth + bufferZone * 2) + screenWidth / 2,
            (Math.random() - 0.5) * (screenHeight + bufferZone * 2) + screenHeight / 2
          ),
          size: 150 + Math.random() * 300,
          color: this.getRandomNebulaColor(),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.002,
          opacity: 0.08 + Math.random() * 0.12,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.002 + Math.random() * 0.003
        });
      }
    }
    
    // Increase shooting star frequency for higher levels
    this.shootingStarChance = 0.001 + (level - 1) * 0.0005;
    
    console.log(`🌌 Background setup for level ${level}`);
  }
}
