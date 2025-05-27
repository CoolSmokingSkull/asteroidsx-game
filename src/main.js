// AsteroidsX - Psychedelic Space Shooter
import { Game } from './game/Game.js'
import { AudioManager } from './game/AudioManager.js'
import { DeviceDetector } from './utils/DeviceDetector.js'
import { ShipCustomizer } from './game/ShipCustomizer.js'

class AsteroidsX {
  constructor() {
    this.game = null;
    this.audioManager = new AudioManager();
    this.deviceDetector = new DeviceDetector();
    
    this.init();
  }

  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Initialize canvas
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
      console.error('Game canvas not found!');
      return;
    }

    // Set up canvas for high DPI displays
    this.setupCanvas(canvas);

    // Initialize game
    this.game = new Game(canvas, this.audioManager);

    // Setup UI event listeners
    this.setupUI();

    // Setup device-specific features
    this.setupDeviceFeatures();

    // Initialize PWA features
    this.initializePWA();

    console.log('🚀 AsteroidsX initialized successfully!');
  }

  // PWA Service Worker Registration and Update Handling
  async initializePWA() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('🔧 Service Worker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 New Service Worker found, installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log('✨ New update available!');
                this.showUpdateNotification();
              } else {
                // First time installation
                console.log('🎉 App cached for offline use!');
              }
            }
          });
        });

        // Handle controller changes (when new SW takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 New Service Worker took control, reloading...');
          window.location.reload();
        });

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  showUpdateNotification() {
    // Create update notification UI
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🚀</div>
        <div class="notification-text">
          <strong>Update Available!</strong>
          <small>A new version of AsteroidsX is ready</small>
        </div>
        <button class="notification-btn" onclick="asteroidsX.applyUpdate()">
          Update Now
        </button>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;

    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // Auto-hide after 10 seconds if not interacted with
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  async applyUpdate() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (error) {
      console.error('❌ Failed to apply update:', error);
      // Fallback: force reload
      window.location.reload();
    }
  }
  
  setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set the display size
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    
    // Set the actual size in memory
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    
    // Scale the canvas back down using CSS
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Handle resize
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      if (this.game) {
        this.game.handleResize();
      }
    });
  }

  setupUI() {
    // Menu buttons
    document.getElementById('start-game')?.addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('customize-ship')?.addEventListener('click', () => {
      this.showCustomization();
    });

    document.getElementById('options')?.addEventListener('click', () => {
      this.showOptions();
    });

    document.getElementById('fullscreen')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    document.getElementById('debug-unlock')?.addEventListener('click', () => {
      this.unlockAllShips();
      this.addTestStats();
    });

    // Pause menu
    document.getElementById('resume-game')?.addEventListener('click', () => {
      this.game?.resume();
      this.showScreen('game-ui');
    });

    document.getElementById('restart-game')?.addEventListener('click', () => {
      this.game?.restart();
      this.showScreen('game-ui');
    });

    document.getElementById('main-menu-btn')?.addEventListener('click', () => {
      this.game?.stop();
      this.showScreen('main-menu');
    });

    // Game over screen
    document.getElementById('play-again')?.addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('back-to-menu')?.addEventListener('click', () => {
      this.showScreen('main-menu');
    });

    // Ship customization screen
    document.getElementById('back-from-customization')?.addEventListener('click', () => {
      this.showScreen('main-menu');
    });

    // Options screen
    document.getElementById('back-from-options')?.addEventListener('click', () => {
      this.showScreen('main-menu');
    });

    document.getElementById('reset-settings')?.addEventListener('click', () => {
      if (confirm('Reset all settings to defaults? This cannot be undone.')) {
        this.game?.settings?.reset();
        this.populateOptionsMenu(); // Refresh the options display
      }
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (this.game) {
        this.game.handleKeyDown(e);
      }
      
      // Global shortcuts
      if (e.code === 'Escape') {
        if (this.game?.isRunning) {
          this.game.pause();
          this.showScreen('pause-menu');
        }
      }
      
      if (e.code === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (this.game) {
        this.game.handleKeyUp(e);
      }
    });
  }

  setupDeviceFeatures() {
    // Show mobile controls on touch devices
    if (this.deviceDetector.isMobile()) {
      document.getElementById('mobile-controls').style.display = 'flex';
      this.setupMobileControls();
    }

    // Enhanced mobile scroll prevention
    document.addEventListener('touchmove', (e) => {
      // Allow scrolling in specific UI areas
      const target = e.target;
      const allowScrolling = target.closest('.ship-gallery') || 
                           target.closest('.options-content') || 
                           target.closest('.game-stats');
      
      if (!allowScrolling) {
        e.preventDefault();
      }
    }, { passive: false });

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Handle orientation changes with improved timing
    let orientationTimer;
    window.addEventListener('orientationchange', () => {
      clearTimeout(orientationTimer);
      orientationTimer = setTimeout(() => {
        if (this.game) {
          this.game.handleResize();
        }
        // Force layout recalculation
        window.scrollTo(0, 0);
      }, 150);
    });

    // Handle window resize for desktop
    window.addEventListener('resize', () => {
      if (this.game) {
        this.game.handleResize();
      }
    });
  }

  setupMobileControls() {
    const controls = {
      'thrust-btn': 'thrust',
      'left-btn': 'left',
      'right-btn': 'right',
      'fire-btn': 'fire'
    };

    Object.entries(controls).forEach(([id, action]) => {
      const element = document.getElementById(id);
      if (element) {
        // Enhanced touch handling for better mobile experience
        let touchActive = false;
        
        // Touch start with haptic feedback
        element.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          touchActive = true;
          
          // Haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
          
          this.game?.handleMobileInput(action, true);
        });
        
        // Touch end
        element.addEventListener('touchend', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (touchActive) {
            touchActive = false;
            this.game?.handleMobileInput(action, false);
          }
        });
        
        // Touch cancel (when touch moves out of element)
        element.addEventListener('touchcancel', (e) => {
          e.preventDefault();
          if (touchActive) {
            touchActive = false;
            this.game?.handleMobileInput(action, false);
          }
        });
        
        // Prevent accidental clicks
        element.addEventListener('click', (e) => {
          e.preventDefault();
        });
        
        // Mouse events for testing on desktop
        element.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (!this.deviceDetector.isMobile()) {
            this.game?.handleMobileInput(action, true);
          }
        });
        
        element.addEventListener('mouseup', (e) => {
          e.preventDefault();
          if (!this.deviceDetector.isMobile()) {
            this.game?.handleMobileInput(action, false);
          }
        });
      }
    });
  }

  startGame() {
    if (this.game) {
      this.game.start();
      this.showScreen('game-ui');
    }
  }

  showCustomization() {
    console.log('🎨 Opening ship customization...');
    this.populateShipGallery();
    this.showScreen('ship-customization');
  }

  showOptions() {
    console.log('⚙️ Opening options menu...');
    this.populateOptionsMenu();
    this.showScreen('options-menu');
  }

  populateShipGallery() {
    console.log('🚀 Populating ship gallery...');
    const gallery = document.getElementById('ship-gallery');
    if (!gallery || !this.game?.shipCustomizer) {
      console.error('Gallery element or ship customizer not found');
      return;
    }

    gallery.innerHTML = '';
    const ships = this.game.shipCustomizer.getAllStyles();
    console.log('Available ships:', ships.length);

    ships.forEach(ship => {
      console.log(`Adding ship: ${ship.name} (${ship.unlocked ? 'unlocked' : 'locked'})`);
      const shipCard = document.createElement('div');
      shipCard.className = `ship-card ${ship.unlocked ? 'unlocked' : 'locked'} ${ship.key === this.game.shipCustomizer.currentStyle ? 'selected' : ''}`;
      
      shipCard.innerHTML = `
        <div class="ship-preview" id="ship-preview-${ship.key}">
          <canvas width="120" height="120"></canvas>
        </div>
        <div class="ship-info">
          <h3 class="ship-name">${ship.name}</h3>
          <p class="ship-description">${ship.description}</p>
          ${!ship.unlocked ? `<p class="ship-requirements">${ship.requirements?.description || 'Unknown requirement'}</p>` : ''}
        </div>
        <div class="ship-actions">
          ${ship.unlocked ? 
            `<button class="neon-button small ${ship.key === this.game.shipCustomizer.currentStyle ? 'selected' : ''}" 
                     onclick="asteroidsX.selectShip('${ship.key}')">${ship.key === this.game.shipCustomizer.currentStyle ? 'SELECTED' : 'SELECT'}</button>` :
            `<button class="neon-button small locked" disabled>LOCKED</button>`
          }
        </div>
      `;

      gallery.appendChild(shipCard);

      // Render ship preview
      if (ship.unlocked) {
        const canvas = shipCard.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 120, 120);
        
        // Set up preview rendering
        ctx.fillStyle = '#001122';
        ctx.fillRect(0, 0, 120, 120);
        
        try {
          // Create a temporary ship customizer with the specific style
          const tempCustomizer = new ShipCustomizer();
          tempCustomizer.currentStyle = ship.key;
          tempCustomizer.renderCustomizationPreview(ctx, 60, 60, 2);
        } catch (error) {
          console.error('Error rendering ship preview:', error);
        }
      }
    });
  }

  populateOptionsMenu() {
    const optionsContent = document.getElementById('options-content');
    if (!optionsContent || !this.game?.settings) return;

    optionsContent.innerHTML = '';
    const settingsData = this.game.settings.getSettingsForUI();

    Object.entries(settingsData).forEach(([categoryKey, category]) => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'options-category';
      
      categoryDiv.innerHTML = `
        <h3 class="category-title">${categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}</h3>
        <div class="category-controls" id="category-${categoryKey}">
        </div>
      `;

      const controlsContainer = categoryDiv.querySelector('.category-controls');

      Object.entries(category).forEach(([settingKey, setting]) => {
        const settingDiv = document.createElement('div');
        settingDiv.className = 'setting-control';

        let controlHTML = '';
        switch (setting.type) {
          case 'range':
            controlHTML = `
              <label for="${settingKey}">${setting.label}</label>
              <div class="range-container">
                <input type="range" 
                       id="${settingKey}" 
                       min="${setting.min}" 
                       max="${setting.max}" 
                       step="${setting.step}" 
                       value="${setting.value}"
                       oninput="asteroidsX.updateSetting('${settingKey}', this.value)">
                <span class="range-value" id="${settingKey}-value">${Math.round(setting.value * 100)}${setting.max <= 1 ? '%' : ''}</span>
              </div>
            `;
            break;

          case 'checkbox':
            controlHTML = `
              <label class="checkbox-label">
                <input type="checkbox" 
                       id="${settingKey}" 
                       ${setting.value ? 'checked' : ''}
                       onchange="asteroidsX.updateSetting('${settingKey}', this.checked)">
                <span class="checkmark"></span>
                ${setting.label}
              </label>
            `;
            break;

          case 'select':
            controlHTML = `
              <label for="${settingKey}">${setting.label}</label>
              <select id="${settingKey}" onchange="asteroidsX.updateSetting('${settingKey}', this.value)">
                ${setting.options.map(option => 
                  `<option value="${option}" ${option === setting.value ? 'selected' : ''}>${option.charAt(0).toUpperCase() + option.slice(1)}</option>`
                ).join('')}
              </select>
            `;
            break;
        }

        settingDiv.innerHTML = controlHTML;
        controlsContainer.appendChild(settingDiv);
      });

      optionsContent.appendChild(categoryDiv);
    });
  }

  selectShip(shipKey) {
    console.log(`🎯 Selecting ship: ${shipKey}`);
    if (this.game?.shipCustomizer?.setStyle(shipKey)) {
      console.log(`✅ Ship changed to: ${shipKey}`);
      this.populateShipGallery(); // Refresh to show new selection
    } else {
      console.error(`❌ Failed to select ship: ${shipKey}`);
    }
  }

  updateSetting(key, value) {
    console.log(`⚙️ Updating setting: ${key} = ${value}`);
    if (this.game?.settings) {
      // Convert string values to appropriate types
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      if (!isNaN(value) && value !== '') value = parseFloat(value);

      const success = this.game.settings.set(key, value);
      console.log(`${success ? '✅' : '❌'} Setting update result: ${success}`);

      // Update displayed value for range inputs
      const valueDisplay = document.getElementById(`${key}-value`);
      if (valueDisplay) {
        const setting = this.game.settings.getSettingsForUI();
        const found = Object.values(setting).find(cat => cat[key]);
        if (found && found[key]) {
          const max = found[key].max;
          valueDisplay.textContent = `${Math.round(value * 100)}${max <= 1 ? '%' : ''}`;
        }
      }
    }
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

  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen not supported:', err);
    }
  }

  // Debug method to unlock all ships for testing
  unlockAllShips() {
    if (this.game?.shipCustomizer) {
      const ships = Object.keys(this.game.shipCustomizer.shipStyles);
      ships.forEach(ship => {
        this.game.shipCustomizer.unlockStyle(ship);
      });
      console.log('🔓 All ships unlocked for testing');
      this.populateShipGallery(); // Refresh gallery
    }
  }

  // Debug method to add test stats
  addTestStats() {
    if (this.game?.stats) {
      this.game.stats.session.score = 10000;
      this.game.stats.session.level = 10;
      this.game.stats.session.asteroidsDestroyed = 200;
      this.game.stats.lifetime.highScore = 10000;
      this.game.stats.lifetime.maxLevel = 10;
      this.game.stats.lifetime.totalAsteroids = 200;
      console.log('📊 Test stats added');
    }
  }
}

// Initialize the game when the module loads
window.asteroidsX = new AsteroidsX();
