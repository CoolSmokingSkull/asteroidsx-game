// Game - Main game engine with psychedelic effects
import { Player } from '../entities/Player.js';
import { Asteroid } from '../entities/Asteroid.js';
import { Bullet } from '../entities/Bullet.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { Background } from '../effects/Background.js';
import { ShipCustomizer } from './ShipCustomizer.js';
import { GameSettings } from './GameSettings.js';
import { GameStats } from './GameStats.js';
import { Vector2 } from '../utils/Vector2.js';
import { DeviceDetector } from '../utils/DeviceDetector.js';

export class Game {
  constructor(canvas, audioManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioManager = audioManager;
    this.deviceDetector = new DeviceDetector();
    
    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.gameTime = 0;
    this.deltaTime = 0;
    this.lastTime = 0;
    
    // Game objects
    this.player = null;
    this.asteroids = [];
    this.bullets = [];
    this.particles = new ParticleSystem();
    this.background = new Background();
    this.shipCustomizer = new ShipCustomizer();
    this.settings = new GameSettings();
    this.stats = new GameStats();
    
    // Game stats
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.asteroidsDestroyed = 0;
    
    // Input state
    this.input = {
      left: false,
      right: false,
      thrust: false,
      fire: false,
      fireTimer: 0
    };
    
    // Performance settings
    this.performanceProfile = this.deviceDetector.getPerformanceProfile();
    
    // Visual effects
    this.screenShake = 0;
    this.flashEffect = 0;
    this.warpEffect = 0;
    
    // Camera system
    this.cameraOffset = new Vector2(0, 0);
    this.targetCameraOffset = new Vector2(0, 0);
    
    this.init();
  }

  init() {
    // Initialize audio on first user interaction
    document.addEventListener('click', () => {
      if (!this.audioManager.isInitialized) {
        this.audioManager.initialize();
      }
    }, { once: true });

    console.log('🎮 Game engine initialized');
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.gameTime = 0;
    this.lastTime = performance.now();
    
    // Reset game state
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.asteroidsDestroyed = 0;
    
    // Initialize stats tracking
    this.stats.startGame();
    
    // Initialize game objects
    this.setupLevel();
    
    // Start game loop
    this.gameLoop();
    
    // Start ambient audio
    this.ambientAudio = this.audioManager.playSound('ambient', { 
      loop: true, 
      volume: 0.1 
    });
    
    console.log('🚀 Game started!');
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    
    // Stop ambient audio
    if (this.ambientAudio) {
      this.ambientAudio.source.stop();
      this.ambientAudio = null;
    }
    
    console.log('⏹️ Game stopped');
  }

  pause() {
    if (!this.isRunning) return;
    this.isPaused = true;
    this.audioManager.suspend();
  }

  resume() {
    if (!this.isRunning) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.audioManager.resume();
  }

  restart() {
    this.stop();
    setTimeout(() => this.start(), 100);
  }

  setupLevel() {
    // Create player at screen center
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    this.player = new Player(centerX, centerY, this.shipCustomizer);
    
    // Clear existing objects
    this.asteroids = [];
    this.bullets = [];
    this.particles.clear();
    
    // Create asteroids for current level - more reasonable progression
    const asteroidCount = Math.min(2 + Math.floor(this.level / 2), 8);
    
    for (let i = 0; i < asteroidCount; i++) {
      this.createRandomAsteroid();
    }
    
    // Initialize background for this level
    this.background.setupLevel(this.level);
    
    console.log(`🪨 Level ${this.level} setup with ${asteroidCount} asteroids`);
  }

  createRandomAsteroid() {
    let x, y;
    const playerSafeZone = 100;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Ensure asteroids don't spawn too close to player
    do {
      x = Math.random() * screenWidth;
      y = Math.random() * screenHeight;
    } while (
      this.player && 
      Vector2.distance({x, y}, this.player.position) < playerSafeZone
    );
    
    const asteroid = new Asteroid(x, y, 'large');
    this.asteroids.push(asteroid);
  }

  gameLoop() {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    if (!this.isPaused) {
      this.update();
    }
    
    this.render();
    
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    this.gameTime += this.deltaTime;
    
    // Update input timers
    if (this.input.fireTimer > 0) {
      this.input.fireTimer -= this.deltaTime;
    }
    
    // Update game objects
    if (this.player && this.player.isAlive) {
      this.player.update(this.deltaTime, this.input);
      
      // Camera follows player - keep player centered
      this.updateCamera();
      
      // Apply radial gravity toward center (classic Asteroids behavior)
      this.applyRadialGravity();
      
      // Player doesn't wrap - they can move freely in space
      // this.wrapPosition(this.player);
    }
    
    // Update asteroids
    this.asteroids.forEach(asteroid => {
      asteroid.update(this.deltaTime);
      this.wrapPosition(asteroid); // Keep asteroids contained in play area
    });
    
    // Update bullets
    this.bullets = this.bullets.filter(bullet => {
      bullet.update(this.deltaTime);
      
      // Bullets don't wrap - they disappear when off-screen
      // Remove bullets that are too far off-screen (account for camera offset)
      const screenMargin = 200; // Increased margin for safety
      
      // Calculate visible world bounds based on camera position
      const worldLeft = -this.cameraOffset.x - screenMargin;
      const worldRight = -this.cameraOffset.x + window.innerWidth + screenMargin;
      const worldTop = -this.cameraOffset.y - screenMargin;
      const worldBottom = -this.cameraOffset.y + window.innerHeight + screenMargin;
      
      const isOffScreen = bullet.position.x < worldLeft || 
                         bullet.position.x > worldRight ||
                         bullet.position.y < worldTop || 
                         bullet.position.y > worldBottom;
      
      return bullet.isAlive && !isOffScreen;
    });
    
    // Update particles
    this.particles.update(this.deltaTime);
    
    // Update background with camera offset for proper parallax
    this.background.update(this.deltaTime, this.cameraOffset);
    
    // Handle collisions
    this.checkCollisions();
    
    // Handle shooting
    this.handleShooting();
    
    // Check level completion
    this.checkLevelComplete();
    
    // Update visual effects
    this.updateEffects();
    
    // Update stats
    this.stats.updateTime();
  }

  handleShooting() {
    if (this.input.fire && this.input.fireTimer <= 0 && this.player && this.player.isAlive) {
      // Create bullet
      const bulletDirection = Vector2.fromAngle(this.player.rotation);
      
      // Spawn bullet from ship's nose (about 15 pixels forward from center)
      const noseOffset = 15;
      const bulletX = this.player.position.x + bulletDirection.x * noseOffset;
      const bulletY = this.player.position.y + bulletDirection.y * noseOffset;
      
      const bulletVelocity = bulletDirection.scaled(400); // Bullet speed
      
      const bullet = new Bullet(bulletX, bulletY, bulletVelocity);
      
      this.bullets.push(bullet);
      
      // Play laser sound
      this.audioManager.playSound('laser', { 
        volume: 0.3,
        playbackRate: 0.8 + Math.random() * 0.4 
      });
      
      // Create muzzle flash particles at bullet spawn position
      this.particles.createMuzzleFlash(bulletX, bulletY, this.player.rotation);
      
      // Reset fire timer
      this.input.fireTimer = 0.15;
      
      // Track shot fired
      this.stats.shotFired();
    }
  }

  checkCollisions() {
    if (!this.player || !this.player.isAlive) return;
    
    // Player vs Asteroids
    this.asteroids.forEach(asteroid => {
      if (this.checkCircleCollision(this.player, asteroid)) {
        this.playerHit();
      }
    });
    
    // Bullets vs Asteroids
    this.bullets.forEach(bullet => {
      this.asteroids.forEach(asteroid => {
        if (this.checkCircleCollision(bullet, asteroid)) {
          this.destroyAsteroid(asteroid, bullet);
          bullet.isAlive = false;
        }
      });
    });
  }

  checkCircleCollision(obj1, obj2) {
    const distance = Vector2.distance(obj1.position, obj2.position);
    return distance < (obj1.radius + obj2.radius);
  }

  destroyAsteroid(asteroid, bullet) {
    const index = this.asteroids.indexOf(asteroid);
    if (index > -1) {
      this.asteroids.splice(index, 1);
    }
    
    // Add score
    const scoreValues = { large: 20, medium: 50, small: 100 };
    this.score += scoreValues[asteroid.size];
    
    // Create explosion particles
    this.particles.createExplosion(
      asteroid.position.x,
      asteroid.position.y,
      asteroid.size === 'large' ? 50 : asteroid.size === 'medium' ? 30 : 20
    );
    
    // Screen shake effect
    this.screenShake = asteroid.size === 'large' ? 10 : 5;
    
    // Play explosion sound
    this.audioManager.playSound('explosion', { 
      volume: asteroid.size === 'large' ? 0.4 : 0.3,
      playbackRate: asteroid.size === 'large' ? 0.8 : 1.2
    });
    
    // Break asteroid into smaller pieces
    if (asteroid.size === 'large') {
      this.createChildAsteroids(asteroid, 'medium', 2);
    } else if (asteroid.size === 'medium') {
      this.createChildAsteroids(asteroid, 'small', 2);
    }
    
    this.asteroidsDestroyed++;
    this.updateUI();
    
    // Track asteroid destroyed
    this.stats.asteroidDestroyed();
    this.stats.addScore(scoreValues[asteroid.size]);
  }

  createChildAsteroids(parentAsteroid, size, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const distance = 30;
      
      const x = parentAsteroid.position.x + Math.cos(angle) * distance;
      const y = parentAsteroid.position.y + Math.sin(angle) * distance;
      
      const childAsteroid = new Asteroid(x, y, size);
      
      // Give it some velocity away from explosion
      childAsteroid.velocity.x = Math.cos(angle) * 50;
      childAsteroid.velocity.y = Math.sin(angle) * 50;
      
      this.asteroids.push(childAsteroid);
    }
  }

  playerHit() {
    if (!this.player.isAlive) return;
    
    this.player.destroy();
    this.lives--;
    
    // Create massive explosion
    this.particles.createExplosion(
      this.player.position.x,
      this.player.position.y,
      80
    );
    
    // Screen effects
    this.screenShake = 20;
    this.flashEffect = 1.0;
    
    // Play explosion sound
    this.audioManager.playSound('explosion', { volume: 0.6 });
    
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      // Respawn after delay
      setTimeout(() => {
        if (this.isRunning) {
          this.respawnPlayer();
        }
      }, 2000);
    }
    
    this.updateUI();
  }

  respawnPlayer() {
    // Check if spawn area is clear
    const spawnX = window.innerWidth / 2;
    const spawnY = window.innerHeight / 2;
    const safeZone = 100;
    
    const isSafe = !this.asteroids.some(asteroid => 
      Vector2.distance({x: spawnX, y: spawnY}, asteroid.position) < safeZone
    );
    
    if (isSafe) {
      this.player = new Player(spawnX, spawnY, this.shipCustomizer);
      this.flashEffect = 0.5; // Spawn flash
    } else {
      // Try again in a bit
      setTimeout(() => this.respawnPlayer(), 500);
    }
  }

  checkLevelComplete() {
    if (this.asteroids.length === 0) {
      this.level++;
      this.stats.levelUp();
      this.warpEffect = 1.0;
      
      // Check for ship unlocks
      const newUnlocks = this.shipCustomizer.checkUnlocks({
        highScore: this.stats.lifetime.highScore,
        maxLevel: this.stats.session.level,
        totalAsteroids: this.stats.lifetime.totalAsteroids
      });
      
      if (newUnlocks.length > 0) {
        this.showUnlockNotification(newUnlocks);
      }
      
      setTimeout(() => {
        this.setupLevel();
      }, 1000);
    }
  }

  gameOver() {
    this.stats.endGame();
    const summary = this.stats.getGameSummary();
    
    console.log(`💀 Game Over! Final Score: ${this.score}`);
    
    // Show game over screen
    this.showGameOverScreen(summary);
    
    // Stop the game
    this.stop();
  }
  
  showGameOverScreen(summary) {
    const gameOverElement = document.getElementById('game-over');
    if (gameOverElement) {
      // Update game over stats
      document.getElementById('final-score').textContent = summary.score;
      document.getElementById('final-level').textContent = summary.level;
      document.getElementById('final-asteroids').textContent = summary.asteroids;
      document.getElementById('final-accuracy').textContent = `${summary.accuracy}%`;
      document.getElementById('final-time').textContent = summary.timeAlive;
      
      // Show new records
      if (summary.newHighScore) {
        document.getElementById('new-high-score').style.display = 'block';
      }
      if (summary.newMaxLevel) {
        document.getElementById('new-max-level').style.display = 'block';
      }
      
      this.showScreen('game-over');
    }
  }
  
  showUnlockNotification(unlocks) {
    unlocks.forEach(styleKey => {
      const style = this.shipCustomizer.shipStyles[styleKey];
      if (style) {
        const notification = document.createElement('div');
        notification.className = 'unlock-notification';
        notification.innerHTML = `
          <div class="unlock-content">
            <h3>🚀 Ship Unlocked!</h3>
            <p>${style.name}</p>
            <small>${style.description}</small>
          </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }
    });
  }
  
  showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }
  }

  updateEffects() {
    // Decay screen shake
    this.screenShake *= 0.9;
    if (this.screenShake < 0.1) this.screenShake = 0;
    
    // Decay flash effect
    this.flashEffect *= 0.95;
    if (this.flashEffect < 0.01) this.flashEffect = 0;
    
    // Decay warp effect
    this.warpEffect *= 0.98;
    if (this.warpEffect < 0.01) this.warpEffect = 0;
  }

  wrapPosition(object) {
    const margin = object.radius || 0;
    // Use logical screen dimensions, not canvas buffer dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    if (object.position.x < -margin) {
      object.position.x = screenWidth + margin;
    } else if (object.position.x > screenWidth + margin) {
      object.position.x = -margin;
    }
    
    if (object.position.y < -margin) {
      object.position.y = screenHeight + margin;
    } else if (object.position.y > screenHeight + margin) {
      object.position.y = -margin;
    }
  }

  render() {
    const ctx = this.ctx;
    
    // Apply screen shake
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }
    
    // Apply camera transform for world rendering
    ctx.translate(this.cameraOffset.x, this.cameraOffset.y);
    
    // Clear canvas with fade effect for trails
    ctx.fillStyle = `rgba(0, 0, 17, ${0.1 + this.warpEffect * 0.9})`;
    ctx.fillRect(-this.cameraOffset.x, -this.cameraOffset.y, window.innerWidth, window.innerHeight);
    
    // Render background
    this.background.render(ctx, window.innerWidth, window.innerHeight);
    
    // Render particles (behind objects)
    this.particles.render(ctx);
    
    // Render game objects
    this.asteroids.forEach(asteroid => asteroid.render(ctx));
    this.bullets.forEach(bullet => bullet.render(ctx));
    
    if (this.player && this.player.isAlive) {
      this.player.render(ctx);
    }
    
    // Reset camera transform for UI elements
    ctx.translate(-this.cameraOffset.x, -this.cameraOffset.y);
    
    // Apply flash effect
    if (this.flashEffect > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashEffect * 0.3})`;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }
    
    ctx.restore();
  }

  updateUI() {
    // Update HUD elements
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const levelElement = document.getElementById('level');
    
    if (scoreElement) scoreElement.textContent = this.score;
    if (livesElement) livesElement.textContent = this.lives;
    if (levelElement) levelElement.textContent = this.level;
  }

  handleResize() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * devicePixelRatio;
    this.canvas.height = window.innerHeight * devicePixelRatio;
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Update background for new dimensions
    this.background.resize(window.innerWidth, window.innerHeight);
  }

  // Input handlers
  handleKeyDown(event) {
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.input.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.input.right = true;
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.input.thrust = true;
        break;
      case 'Space':
      case 'KeyX':
        event.preventDefault();
        this.input.fire = true;
        break;
    }
  }

  handleKeyUp(event) {
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.input.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.input.right = false;
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.input.thrust = false;
        break;
      case 'Space':
      case 'KeyX':
        this.input.fire = false;
        break;
    }
  }

  handleMobileInput(action, isPressed) {
    switch (action) {
      case 'left':
        this.input.left = isPressed;
        break;
      case 'right':
        this.input.right = isPressed;
        break;
      case 'thrust':
        this.input.thrust = isPressed;
        break;
      case 'fire':
        this.input.fire = isPressed;
        break;
    }
  }

  updateCamera() {
    if (!this.player) return;
    
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    
    // Smoothly move camera to keep player centered
    const lerpFactor = 0.05; // Even smoother camera following
    this.targetCameraOffset.x = screenCenterX - this.player.position.x;
    this.targetCameraOffset.y = screenCenterY - this.player.position.y;
    
    // Smooth interpolation to target camera position
    this.cameraOffset.x += (this.targetCameraOffset.x - this.cameraOffset.x) * lerpFactor;
    this.cameraOffset.y += (this.targetCameraOffset.y - this.cameraOffset.y) * lerpFactor;
  }

  applyRadialGravity() {
    // Temporarily disabled - let player move naturally
    // Classic Asteroids doesn't actually have radial gravity
    // The wrapping screen edges provide the boundary effect
    return;
  }
}
