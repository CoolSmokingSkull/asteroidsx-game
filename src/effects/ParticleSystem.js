// ParticleSystem - Psychedelic particle effects
import { Vector2 } from '../utils/Vector2.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 1000;
  }

  clear() {
    this.particles = [];
  }

  update(deltaTime) {
    // Update all particles
    this.particles = this.particles.filter(particle => {
      particle.life -= deltaTime * particle.decay;
      
      if (particle.life <= 0) {
        return false;
      }
      
      // Update position
      particle.position.add(particle.velocity.scaled(deltaTime));
      
      // Apply drag
      particle.velocity.scale(particle.drag || 0.98);
      
      // Update visual properties
      if (particle.hueShift) {
        particle.hue += particle.hueShift * deltaTime;
      }
      
      if (particle.sizeDecay) {
        particle.size *= particle.sizeDecay;
      }
      
      return true;
    });
  }

  render(ctx) {
    ctx.save();
    
    this.particles.forEach(particle => {
      const alpha = particle.life * (particle.baseAlpha || 1);
      if (alpha <= 0) return;
      
      ctx.save();
      
      if (particle.type === 'spark') {
        this.renderSpark(ctx, particle, alpha);
      } else if (particle.type === 'explosion') {
        this.renderExplosion(ctx, particle, alpha);
      } else if (particle.type === 'thrust') {
        this.renderThrust(ctx, particle, alpha);
      } else if (particle.type === 'debris') {
        this.renderDebris(ctx, particle, alpha);
      } else {
        this.renderDefault(ctx, particle, alpha);
      }
      
      ctx.restore();
    });
    
    ctx.restore();
  }

  renderSpark(ctx, particle, alpha) {
    const size = particle.size * particle.life;
    const hue = particle.hue % 360;
    
    // Outer glow
    const glowSize = size * 3;
    const gradient = ctx.createRadialGradient(
      particle.position.x, particle.position.y, 0,
      particle.position.x, particle.position.y, glowSize
    );
    gradient.addColorStop(0, `hsla(${hue}, 100%, 80%, ${alpha})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      particle.position.x - glowSize,
      particle.position.y - glowSize,
      glowSize * 2,
      glowSize * 2
    );
    
    // Core
    ctx.fillStyle = `hsla(${hue}, 100%, 90%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(particle.position.x, particle.position.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  renderExplosion(ctx, particle, alpha) {
    const size = particle.size;
    const hue = particle.hue % 360;
    
    // Explosion fragment
    ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
    ctx.strokeStyle = `hsla(${hue + 60}, 100%, 80%, ${alpha * 0.8})`;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.arc(particle.position.x, particle.position.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Trail effect
    if (particle.velocity.length() > 10) {
      const trailLength = Math.min(particle.velocity.length() * 0.5, 20);
      const direction = particle.velocity.normalized();
      
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha * 0.5})`;
      ctx.lineWidth = size * 0.5;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(particle.position.x, particle.position.y);
      ctx.lineTo(
        particle.position.x - direction.x * trailLength,
        particle.position.y - direction.y * trailLength
      );
      ctx.stroke();
    }
  }

  renderThrust(ctx, particle, alpha) {
    const size = particle.size * (0.5 + Math.sin(particle.life * 10) * 0.5);
    const hue = (particle.hue + particle.life * 120) % 360;
    
    // Flame-like effect
    ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
    
    ctx.beginPath();
    ctx.arc(particle.position.x, particle.position.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  renderDebris(ctx, particle, alpha) {
    const size = particle.size;
    const hue = particle.hue % 360;
    
    ctx.save();
    ctx.translate(particle.position.x, particle.position.y);
    ctx.rotate(particle.rotation || 0);
    
    ctx.fillStyle = `hsla(${hue}, 80%, 40%, ${alpha})`;
    ctx.strokeStyle = `hsla(${hue + 60}, 100%, 60%, ${alpha * 0.8})`;
    ctx.lineWidth = 1;
    
    // Irregular debris shape
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(size * 0.3, size * 0.8);
    ctx.lineTo(-size * 0.7, size * 0.4);
    ctx.lineTo(-size, -size * 0.2);
    ctx.lineTo(-size * 0.2, -size);
    ctx.lineTo(size * 0.6, -size * 0.3);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  }

  renderDefault(ctx, particle, alpha) {
    const size = particle.size * particle.life;
    const hue = particle.hue % 360;
    
    ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(particle.position.x, particle.position.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  createExplosion(x, y, intensity = 50) {
    const particleCount = Math.min(intensity, this.maxParticles - this.particles.length);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
      const speed = 50 + Math.random() * 150;
      const size = 2 + Math.random() * 4;
      
      this.particles.push({
        type: 'explosion',
        position: new Vector2(x, y),
        velocity: new Vector2(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        ),
        life: 0.8 + Math.random() * 0.4,
        size: size,
        hue: 20 + Math.random() * 60, // Orange to yellow
        decay: 1.5 + Math.random() * 0.5,
        drag: 0.95,
        baseAlpha: 0.8
      });
    }
    
    // Add some debris
    const debrisCount = Math.min(8, this.maxParticles - this.particles.length);
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      
      this.particles.push({
        type: 'debris',
        position: new Vector2(x, y),
        velocity: new Vector2(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        ),
        life: 1.5 + Math.random() * 1.0,
        size: 3 + Math.random() * 5,
        hue: 30 + Math.random() * 40,
        decay: 0.8 + Math.random() * 0.4,
        drag: 0.98,
        rotation: Math.random() * Math.PI * 2,
        baseAlpha: 0.9
      });
    }
  }

  createMuzzleFlash(x, y, direction) {
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      const spread = 0.3;
      const angle = direction + (Math.random() - 0.5) * spread;
      const speed = 100 + Math.random() * 50;
      
      this.particles.push({
        type: 'spark',
        position: new Vector2(x, y),
        velocity: new Vector2(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        ),
        life: 0.1 + Math.random() * 0.1,
        size: 1 + Math.random() * 2,
        hue: 180 + Math.random() * 60, // Cyan range
        decay: 8,
        drag: 0.9,
        baseAlpha: 0.9
      });
    }
  }

  createThrustParticles(x, y, direction, intensity = 1) {
    const particleCount = Math.floor(5 * intensity);
    
    for (let i = 0; i < particleCount; i++) {
      const spread = 0.8;
      const angle = direction + Math.PI + (Math.random() - 0.5) * spread;
      const speed = 80 + Math.random() * 40;
      
      this.particles.push({
        type: 'thrust',
        position: new Vector2(x, y),
        velocity: new Vector2(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        ),
        life: 0.3 + Math.random() * 0.2,
        size: 2 + Math.random() * 3,
        hue: 60 + Math.random() * 30, // Yellow to orange
        hueShift: 60,
        decay: 3,
        drag: 0.95,
        baseAlpha: 0.7
      });
    }
  }

  createStarField(count, bounds) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'star',
        position: new Vector2(
          Math.random() * bounds.width,
          Math.random() * bounds.height
        ),
        velocity: new Vector2(0, 0),
        life: Infinity, // Stars don't decay
        size: 0.5 + Math.random() * 2,
        hue: 200 + Math.random() * 160,
        decay: 0,
        baseAlpha: 0.3 + Math.random() * 0.4
      });
    }
  }

  addParticle(particle) {
    if (this.particles.length < this.maxParticles) {
      this.particles.push(particle);
    }
  }

  getParticleCount() {
    return this.particles.length;
  }
}
