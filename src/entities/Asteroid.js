// Asteroid - Procedurally generated psychedelic space rocks
import { Vector2 } from '../utils/Vector2.js';

export class Asteroid {
  constructor(x, y, size = 'large') {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    );
    this.rotation = Math.random() * Math.PI * 2;
    this.angularVelocity = (Math.random() - 0.5) * 3;
    this.size = size;
    
    // Set radius based on size
    const sizeMap = { large: 40, medium: 25, small: 15 };
    this.radius = sizeMap[size];
    
    // Generate unique shape
    this.vertices = this.generateShape();
    
    // Visual properties
    this.hue = Math.random() * 360;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.glowIntensity = 0.3 + Math.random() * 0.4;
    
    // Fractal details
    this.detailLevel = size === 'large' ? 3 : size === 'medium' ? 2 : 1;
    this.crackPattern = this.generateCracks();
  }

  generateShape() {
    const vertices = [];
    const vertexCount = 8 + Math.floor(Math.random() * 4); // 8-11 vertices
    
    for (let i = 0; i < vertexCount; i++) {
      const angle = (Math.PI * 2 / vertexCount) * i;
      const baseRadius = this.radius * 0.7;
      const variation = this.radius * 0.3;
      const radius = baseRadius + (Math.random() - 0.5) * variation;
      
      vertices.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }
    
    return vertices;
  }

  generateCracks() {
    const cracks = [];
    const crackCount = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < crackCount; i++) {
      const startAngle = Math.random() * Math.PI * 2;
      const startRadius = this.radius * 0.3;
      const endRadius = this.radius * (0.7 + Math.random() * 0.3);
      
      const crack = {
        start: {
          x: Math.cos(startAngle) * startRadius,
          y: Math.sin(startAngle) * startRadius
        },
        end: {
          x: Math.cos(startAngle) * endRadius,
          y: Math.sin(startAngle) * endRadius
        },
        width: 0.5 + Math.random() * 1.5
      };
      
      cracks.push(crack);
    }
    
    return cracks;
  }

  update(deltaTime) {
    // Update position
    this.position.add(this.velocity.scaled(deltaTime));
    
    // Update rotation
    this.rotation += this.angularVelocity * deltaTime;
    
    // Update visual effects
    this.pulsePhase += deltaTime * 2;
    this.hue += deltaTime * 10; // Slow color shift
  }

  render(ctx) {
    ctx.save();
    
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    
    // Psychedelic glow effect
    const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
    const glowSize = this.radius * 1.5 * pulse;
    const currentHue = (this.hue % 360);
    
    // Outer glow
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    glowGradient.addColorStop(0, `hsla(${currentHue}, 80%, 40%, ${this.glowIntensity * pulse})`);
    glowGradient.addColorStop(0.7, `hsla(${currentHue + 60}, 90%, 50%, ${this.glowIntensity * 0.3})`);
    glowGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
    
    // Main asteroid body
    this.renderAsteroidBody(ctx, pulse, currentHue);
    
    // Render cracks and details
    this.renderDetails(ctx, pulse, currentHue);
    
    ctx.restore();
  }

  renderAsteroidBody(ctx, pulse, hue) {
    // Main outline with gradient fill
    const fillGradient = ctx.createRadialGradient(
      -this.radius * 0.3, -this.radius * 0.3, 0,
      0, 0, this.radius
    );
    fillGradient.addColorStop(0, `hsla(${hue + 30}, 60%, 20%, 0.8)`);
    fillGradient.addColorStop(0.6, `hsla(${hue}, 70%, 15%, 0.6)`);
    fillGradient.addColorStop(1, `hsla(${hue - 30}, 80%, 10%, 0.4)`);
    
    ctx.fillStyle = fillGradient;
    ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw main shape
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Inner highlight
    ctx.strokeStyle = `hsla(${hue + 120}, 100%, 70%, ${pulse * 0.6})`;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    for (let i = 0; i < this.vertices.length; i += 2) {
      const vertex = this.vertices[i];
      const innerX = vertex.x * 0.7;
      const innerY = vertex.y * 0.7;
      
      if (i === 0) {
        ctx.moveTo(innerX, innerY);
      } else {
        ctx.lineTo(innerX, innerY);
      }
    }
    ctx.stroke();
  }

  renderDetails(ctx, pulse, hue) {
    // Render cracks
    ctx.strokeStyle = `hsla(${hue + 180}, 100%, 60%, ${pulse * 0.8})`;
    ctx.lineWidth = 1;
    
    this.crackPattern.forEach(crack => {
      ctx.lineWidth = crack.width;
      ctx.beginPath();
      ctx.moveTo(crack.start.x, crack.start.y);
      ctx.lineTo(crack.end.x, crack.end.y);
      ctx.stroke();
    });
    
    // Add some sparkle points
    const sparkleCount = this.detailLevel * 2;
    ctx.fillStyle = `hsla(${hue + 240}, 100%, 80%, ${pulse})`;
    
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (Math.PI * 2 / sparkleCount) * i + this.rotation * 0.5;
      const distance = this.radius * (0.4 + Math.random() * 0.4);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const size = 1 + Math.random() * 2;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Core glow
    if (this.size === 'large') {
      const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 0.4);
      coreGradient.addColorStop(0, `hsla(${hue + 90}, 100%, 60%, ${pulse * 0.4})`);
      coreGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Check if a point is inside the asteroid (for collision detection)
  containsPoint(x, y) {
    const localX = x - this.position.x;
    const localY = y - this.position.y;
    
    // Rotate point to asteroid's local space
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);
    const rotatedX = localX * cos - localY * sin;
    const rotatedY = localX * sin + localY * cos;
    
    // Simple distance check (could be improved with polygon collision)
    const distance = Math.sqrt(rotatedX * rotatedX + rotatedY * rotatedY);
    return distance <= this.radius;
  }

  // Get velocity for fragment creation
  getFragmentVelocity(direction) {
    const baseSpeed = 50;
    const randomFactor = 0.5;
    
    return new Vector2(
      direction.x * baseSpeed + (Math.random() - 0.5) * baseSpeed * randomFactor,
      direction.y * baseSpeed + (Math.random() - 0.5) * baseSpeed * randomFactor
    );
  }
}
