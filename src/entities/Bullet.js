// Bullet - High-energy laser projectiles
import { Vector2 } from '../utils/Vector2.js';

export class Bullet {
  constructor(x, y, velocity) {
    this.position = new Vector2(x, y);
    this.velocity = velocity.clone();
    this.radius = 3;
    this.isAlive = true;
    this.lifetime = 2.0; // Bullets last 2 seconds
    this.age = 0;
    
    // Visual properties
    this.hue = 180 + Math.random() * 60; // Cyan to blue range
    this.intensity = 1.0;
    this.trailPoints = [];
    this.maxTrailLength = 8;
    
    // Energy pulse effect
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = 15;
  }

  update(deltaTime) {
    this.age += deltaTime;
    this.pulsePhase += deltaTime * this.pulseSpeed;
    
    // Check if bullet should expire
    if (this.age >= this.lifetime) {
      this.isAlive = false;
      return;
    }
    
    // Fade out near end of life
    this.intensity = Math.max(0, 1 - (this.age / this.lifetime) * 0.5);
    
    // Update position
    this.position.add(this.velocity.scaled(deltaTime));
    
    // Add trail point
    this.trailPoints.push({
      x: this.position.x,
      y: this.position.y,
      life: 1.0,
      time: this.age
    });
    
    // Update trail
    this.trailPoints = this.trailPoints.filter(point => {
      point.life -= deltaTime * 3;
      return point.life > 0;
    });
    
    // Limit trail length
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.shift();
    }
  }

  render(ctx) {
    if (!this.isAlive) return;
    
    ctx.save();
    
    // Render trail first
    this.renderTrail(ctx);
    
    // Main bullet energy core
    const pulse = Math.sin(this.pulsePhase) * 0.4 + 0.6;
    const currentHue = (this.hue + this.age * 60) % 360;
    const alpha = this.intensity * pulse;
    
    // Outer glow
    const glowSize = 15 * pulse * this.intensity;
    const glowGradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, glowSize
    );
    glowGradient.addColorStop(0, `hsla(${currentHue}, 100%, 80%, ${alpha})`);
    glowGradient.addColorStop(0.4, `hsla(${currentHue + 30}, 100%, 60%, ${alpha * 0.6})`);
    glowGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(
      this.position.x - glowSize,
      this.position.y - glowSize,
      glowSize * 2,
      glowSize * 2
    );
    
    // Core energy
    ctx.fillStyle = `hsla(${currentHue}, 100%, 90%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner core
    ctx.fillStyle = `hsla(${currentHue + 60}, 100%, 95%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius * 0.5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Energy sparks
    this.renderSparks(ctx, currentHue, alpha);
    
    ctx.restore();
  }

  renderTrail(ctx) {
    if (this.trailPoints.length < 2) return;
    
    ctx.lineCap = 'round';
    
    for (let i = 0; i < this.trailPoints.length - 1; i++) {
      const point = this.trailPoints[i];
      const nextPoint = this.trailPoints[i + 1];
      
      const progress = i / (this.trailPoints.length - 1);
      const alpha = point.life * this.intensity * (1 - progress * 0.5);
      const hue = (this.hue + i * 10) % 360;
      const width = (this.radius * 2) * point.life * (1 - progress * 0.7);
      
      // Trail segment
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
      ctx.lineWidth = width;
      
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
      ctx.stroke();
      
      // Inner bright core of trail
      ctx.strokeStyle = `hsla(${hue + 60}, 100%, 90%, ${alpha * 0.8})`;
      ctx.lineWidth = width * 0.3;
      
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
      ctx.stroke();
    }
  }

  renderSparks(ctx, hue, alpha) {
    const sparkCount = 4;
    const sparkDistance = 8;
    
    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 / sparkCount) * i + this.pulsePhase;
      const distance = sparkDistance * Math.sin(this.pulsePhase * 2 + i);
      const x = this.position.x + Math.cos(angle) * distance;
      const y = this.position.y + Math.sin(angle) * distance;
      const size = 1 + Math.sin(this.pulsePhase + i) * 0.5;
      
      ctx.fillStyle = `hsla(${hue + i * 30}, 100%, 80%, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Create impact effect when bullet hits something
  createImpactEffect() {
    return {
      position: this.position.clone(),
      particles: this.generateImpactParticles()
    };
  }

  generateImpactParticles() {
    const particles = [];
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100;
      
      particles.push({
        position: this.position.clone(),
        velocity: new Vector2(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        ),
        life: 0.5 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        hue: this.hue + Math.random() * 60 - 30,
        decay: 2 + Math.random()
      });
    }
    
    return particles;
  }

  destroy() {
    this.isAlive = false;
  }
}
