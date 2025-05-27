// Player - Customizable psychedelic spaceship
import { Vector2 } from '../utils/Vector2.js';

export class Player {
  constructor(x, y, shipCustomizer = null) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.rotation = -Math.PI / 2; // Start pointing up (rotate ship design 90° counter-clockwise)
    this.angularVelocity = 0;
    this.radius = 12;
    this.isAlive = true;
    this.invulnerable = false;
    this.invulnerabilityTime = 0;
    
    // Thrust properties
    this.thrust = 0;
    this.maxThrust = 300;
    this.thrustDecay = 0.98;
    this.rotationSpeed = 4;
    
    // Visual properties
    this.trailPoints = [];
    this.maxTrailLength = 20;
    this.hue = 0;
    this.pulsePhase = 0;
    
    // Ship customization
    this.shipCustomizer = shipCustomizer;
    this.shipStyle = shipCustomizer ? shipCustomizer.getCurrentStyle() : this.getDefaultStyle();
    
    // Fallback if shipStyle is undefined
    if (!this.shipStyle) {
      console.warn('⚠️ shipStyle is undefined, using default');
      this.shipStyle = this.getDefaultStyle();
    }
    
    this.primaryColor = this.shipStyle.color;
    this.secondaryColor = this.shipStyle.glowColor;
    this.trailColor = this.shipStyle.color;
  }

  update(deltaTime, input) {
    if (!this.isAlive) return;
    
    this.pulsePhase += deltaTime * 5;
    this.hue += deltaTime * 60; // Color cycling
    
    // Handle rotation
    if (input.left) {
      this.angularVelocity = -this.rotationSpeed;
    } else if (input.right) {
      this.angularVelocity = this.rotationSpeed;
    } else {
      this.angularVelocity *= 0.9; // Damping
    }
    
    this.rotation += this.angularVelocity * deltaTime;
    
    // Handle thrust
    if (input.thrust) {
      this.thrust = Math.min(this.thrust + 200 * deltaTime, this.maxThrust);
      
      // Add thrust force
      const thrustVector = Vector2.fromAngle(this.rotation).scale(this.thrust * deltaTime);
      this.velocity.add(thrustVector);
      
      // Add trail point for thrust effect - behind the ship
      // Ship nose points in direction of rotation, so trail should be opposite
      const trailDirection = Vector2.fromAngle(this.rotation + Math.PI); // Opposite direction
      const trailPoint = {
        x: this.position.x + trailDirection.x * 15,
        y: this.position.y + trailDirection.y * 15,
        life: 1.0,
        size: 3 + Math.random() * 2
      };
      this.trailPoints.push(trailPoint);
    } else {
      this.thrust *= this.thrustDecay;
    }
    
    // Apply velocity with damping
    this.velocity.scale(0.995); // Space friction
    this.position.add(this.velocity.scaled(deltaTime));
    
    // Update trail
    this.updateTrail(deltaTime);
    
    // Update invulnerability
    if (this.invulnerable) {
      this.invulnerabilityTime -= deltaTime;
      if (this.invulnerabilityTime <= 0) {
        this.invulnerable = false;
      }
    }
  }

  updateTrail(deltaTime) {
    // Update existing trail points
    this.trailPoints = this.trailPoints.filter(point => {
      point.life -= deltaTime * 2;
      return point.life > 0;
    });
    
    // Add new trail point if moving
    if (this.velocity.length() > 10) {
      const trailPoint = {
        x: this.position.x,
        y: this.position.y,
        life: 1.0,
        size: 2
      };
      this.trailPoints.push(trailPoint);
    }
    
    // Limit trail length
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.shift();
    }
  }

  render(ctx) {
    if (!this.isAlive) return;
    
    ctx.save();
    
    // Render trail
    this.renderTrail(ctx);
    
    // Flicker if invulnerable
    if (this.invulnerable && Math.sin(this.invulnerabilityTime * 20) < 0) {
      ctx.restore();
      return;
    }
    
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    
    // Psychedelic color effects
    const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
    const hueShift = (this.hue % 360);
    
    // Ship glow effect
    const glowSize = 25 * pulse;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    gradient.addColorStop(0, `hsla(${hueShift}, 100%, 50%, 0.3)`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
    
    // Render ship based on style
    this.renderShip(ctx, pulse, hueShift);
    
    ctx.restore();
  }

  renderShip(ctx, pulse, hueShift) {
    if (!this.shipStyle || !this.shipStyle.points) {
      console.error('❌ renderShip - invalid shipStyle:', this.shipStyle);
      return;
    }
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Use ship style from customizer or fallback to classic
    const style = this.shipStyle;
    const points = style.points;
    
    // Main ship body
    ctx.strokeStyle = `hsla(${hueShift}, 100%, 50%, ${pulse})`;
    ctx.fillStyle = style.color + '40'; // Semi-transparent fill
    ctx.shadowColor = style.glowColor;
    ctx.shadowBlur = 8 * pulse;
    
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Add core glow
    ctx.shadowBlur = 4;
    ctx.fillStyle = style.glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, 2 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Add thrust effect if thrusting
    if (this.thrust > 50) {
      this.renderThrustEffect(ctx, pulse, hueShift);
    }
  }
  
  renderThrustEffect(ctx, pulse, hueShift) {
    const style = this.shipStyle;
    const thrustIntensity = this.thrust / this.maxThrust;
    
    // Calculate the ship's forward direction from nose position
    // Find the nose (furthest point from center)
    let nosePoint = style.points[0];
    let maxDistance = Math.sqrt(nosePoint[0] * nosePoint[0] + nosePoint[1] * nosePoint[1]);
    
    for (let i = 1; i < style.points.length; i++) {
      const point = style.points[i];
      const distance = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
      if (distance > maxDistance) {
        maxDistance = distance;
        nosePoint = point;
      }
    }
    
    // Calculate backwards direction from nose
    const noseLength = Math.sqrt(nosePoint[0] * nosePoint[0] + nosePoint[1] * nosePoint[1]);
    const backwardX = -nosePoint[0] / noseLength;
    const backwardY = -nosePoint[1] / noseLength;
    
    // Single or dual thrusters
    const thrusterPositions = style.dualThrusters || [style.thrusterOffset];
    
    thrusterPositions.forEach(thrusterPos => {
      ctx.save();
      ctx.translate(thrusterPos[0], thrusterPos[1]);
      
      // Thrust flame should point backwards from ship's nose direction
      const flameLength = 8 + thrustIntensity * 12;
      const flameWidth = 3 + thrustIntensity * 2;
      
      // Create gradient pointing backwards
      const gradient = ctx.createLinearGradient(
        0, 0, 
        backwardX * flameLength, backwardY * flameLength
      );
      gradient.addColorStop(0, `hsla(${hueShift + 40}, 100%, 70%, ${pulse})`);
      gradient.addColorStop(0.5, `hsla(${hueShift + 20}, 100%, 60%, ${pulse * 0.8})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      // Create flame triangle pointing backward
      const perpX = -backwardY; // Perpendicular to backward direction
      const perpY = backwardX;
      
      ctx.moveTo(perpX * flameWidth, perpY * flameWidth);           // One side
      ctx.lineTo(backwardX * flameLength, backwardY * flameLength); // Tip (backward)
      ctx.lineTo(-perpX * flameWidth, -perpY * flameWidth);         // Other side
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    });
  }
  
  getDefaultStyle() {
    return {
      name: 'Classic',
      points: [
        [0, -15],    // Nose
        [-8, 10],    // Left wing
        [0, 5],      // Center back
        [8, 10]      // Right wing
      ],
      thrusterOffset: [0, 8],
      color: '#00ffff',
      glowColor: '#00ffff'
    };
  }

  renderTrail(ctx) {
    if (this.trailPoints.length < 2) return;
    
    ctx.save();
    
    for (let i = 0; i < this.trailPoints.length - 1; i++) {
      const point = this.trailPoints[i];
      const nextPoint = this.trailPoints[i + 1];
      
      const alpha = point.life * 0.6;
      const hue = (this.hue + i * 10) % 360;
      
      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
      ctx.lineWidth = point.size * point.life;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  destroy() {
    this.isAlive = false;
  }

  makeInvulnerable(duration = 3) {
    this.invulnerable = true;
    this.invulnerabilityTime = duration;
  }

  setShipStyle(style) {
    this.shipStyle = style;
  }

  setColors(primary, secondary, trail) {
    this.primaryColor = primary;
    this.secondaryColor = secondary;
    this.trailColor = trail;
  }
}
