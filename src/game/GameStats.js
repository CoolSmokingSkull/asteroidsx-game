// GameStats - Player statistics and progression tracking
export class GameStats {
  constructor() {
    this.session = {
      score: 0,
      level: 1,
      lives: 3,
      asteroidsDestroyed: 0,
      shotsHired: 0,
      accuracy: 0,
      timeAlive: 0,
      gameStartTime: Date.now()
    };
    
    this.lifetime = {
      gamesPlayed: 0,
      totalScore: 0,
      highScore: 0,
      maxLevel: 1,
      totalAsteroids: 0,
      totalTimeAlive: 0,
      shipUnlocks: ['classic'],
      achievements: [],
      playTime: 0 // Total time spent playing
    };
    
    this.achievements = this.initializeAchievements();
    this.loadStats();
  }
  
  initializeAchievements() {
    return {
      'first_blood': {
        name: 'First Blood',
        description: 'Destroy your first asteroid',
        icon: '💥',
        unlocked: false,
        condition: (stats) => stats.totalAsteroids >= 1
      },
      
      'sharpshooter': {
        name: 'Sharpshooter',
        description: 'Achieve 80% accuracy in a game',
        icon: '🎯',
        unlocked: false,
        condition: (stats) => stats.session.accuracy >= 0.8 && stats.session.shotsFired >= 10
      },
      
      'survivor': {
        name: 'Survivor',
        description: 'Survive for 5 minutes in one game',
        icon: '⏰',
        unlocked: false,
        condition: (stats) => stats.session.timeAlive >= 300
      },
      
      'centurion': {
        name: 'Centurion',
        description: 'Destroy 100 asteroids in one game',
        icon: '⚡',
        unlocked: false,
        condition: (stats) => stats.session.asteroidsDestroyed >= 100
      },
      
      'speed_demon': {
        name: 'Speed Demon',
        description: 'Reach level 10',
        icon: '🚀',
        unlocked: false,
        condition: (stats) => stats.session.level >= 10
      },
      
      'pacifist': {
        name: 'Pacifist',
        description: 'Survive for 1 minute without shooting',
        icon: '☮️',
        unlocked: false,
        condition: (stats) => stats.session.timeAlive >= 60 && stats.session.shotsFired === 0
      },
      
      'veteran': {
        name: 'Veteran',
        description: 'Play 50 games',
        icon: '🎖️',
        unlocked: false,
        condition: (stats) => stats.lifetime.gamesPlayed >= 50
      },
      
      'legend': {
        name: 'Legend',
        description: 'Score 50,000 points',
        icon: '👑',
        unlocked: false,
        condition: (stats) => stats.lifetime.highScore >= 50000
      },
      
      'asteroid_hunter': {
        name: 'Asteroid Hunter',
        description: 'Destroy 1,000 asteroids total',
        icon: '🏹',
        unlocked: false,
        condition: (stats) => stats.lifetime.totalAsteroids >= 1000
      },
      
      'perfectionist': {
        name: 'Perfectionist',
        description: 'Complete a level without missing a shot',
        icon: '💯',
        unlocked: false,
        condition: (stats) => stats.session.perfectLevel === true
      }
    };
  }
  
  startGame() {
    this.session = {
      score: 0,
      level: 1,
      lives: 3,
      asteroidsDestroyed: 0,
      shotsFired: 0,
      shotsHit: 0,
      accuracy: 0,
      timeAlive: 0,
      gameStartTime: Date.now(),
      perfectLevel: true
    };
    
    this.lifetime.gamesPlayed++;
    console.log(`🎮 Game #${this.lifetime.gamesPlayed} started`);
  }
  
  endGame() {
    // Update lifetime stats
    this.lifetime.totalScore += this.session.score;
    this.lifetime.totalAsteroids += this.session.asteroidsDestroyed;
    this.lifetime.totalTimeAlive += this.session.timeAlive;
    this.lifetime.playTime += (Date.now() - this.session.gameStartTime) / 1000;
    
    // Update high score
    if (this.session.score > this.lifetime.highScore) {
      this.lifetime.highScore = this.session.score;
      console.log(`🏆 New high score: ${this.lifetime.highScore}`);
    }
    
    // Update max level
    if (this.session.level > this.lifetime.maxLevel) {
      this.lifetime.maxLevel = this.session.level;
      console.log(`📈 New max level: ${this.lifetime.maxLevel}`);
    }
    
    // Check for new achievements
    this.checkAchievements();
    
    this.saveStats();
  }
  
  addScore(points) {
    this.session.score += points;
  }
  
  levelUp() {
    this.session.level++;
    this.session.perfectLevel = true; // Reset perfect level tracker
  }
  
  asteroidDestroyed() {
    this.session.asteroidsDestroyed++;
    this.session.shotsHit++;
    this.updateAccuracy();
  }
  
  shotFired() {
    this.session.shotsFired++;
    this.updateAccuracy();
  }
  
  shotMissed() {
    this.session.perfectLevel = false;
    this.updateAccuracy();
  }
  
  updateAccuracy() {
    if (this.session.shotsFired > 0) {
      this.session.accuracy = this.session.shotsHit / this.session.shotsFired;
    }
  }
  
  updateTime() {
    this.session.timeAlive = (Date.now() - this.session.gameStartTime) / 1000;
  }
  
  checkAchievements() {
    const newAchievements = [];
    
    Object.entries(this.achievements).forEach(([key, achievement]) => {
      if (!achievement.unlocked && achievement.condition(this)) {
        achievement.unlocked = true;
        this.lifetime.achievements.push(key);
        newAchievements.push(achievement);
        console.log(`🏅 Achievement unlocked: ${achievement.name}`);
      }
    });
    
    return newAchievements;
  }
  
  getSessionStats() {
    return { ...this.session };
  }
  
  getLifetimeStats() {
    return { ...this.lifetime };
  }
  
  getAchievements() {
    return Object.entries(this.achievements).map(([key, achievement]) => ({
      key,
      ...achievement
    }));
  }
  
  getUnlockedAchievements() {
    return this.getAchievements().filter(a => a.unlocked);
  }
  
  getAchievementProgress() {
    const total = Object.keys(this.achievements).length;
    const unlocked = this.lifetime.achievements.length;
    return { unlocked, total, percentage: (unlocked / total) * 100 };
  }
  
  getGameSummary() {
    const sessionTime = this.session.timeAlive;
    const minutes = Math.floor(sessionTime / 60);
    const seconds = Math.floor(sessionTime % 60);
    
    return {
      score: this.session.score,
      level: this.session.level,
      asteroids: this.session.asteroidsDestroyed,
      accuracy: Math.round(this.session.accuracy * 100),
      timeAlive: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      newHighScore: this.session.score === this.lifetime.highScore,
      newMaxLevel: this.session.level === this.lifetime.maxLevel
    };
  }
  
  getLeaderboardEntry() {
    return {
      score: this.session.score,
      level: this.session.level,
      asteroids: this.session.asteroidsDestroyed,
      accuracy: this.session.accuracy,
      timeAlive: this.session.timeAlive,
      timestamp: Date.now()
    };
  }
  
  saveStats() {
    try {
      const data = {
        lifetime: this.lifetime,
        achievements: Object.fromEntries(
          Object.entries(this.achievements).map(([key, achievement]) => [
            key, 
            { unlocked: achievement.unlocked }
          ])
        )
      };
      
      localStorage.setItem('asteroidsX_stats', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save stats:', error);
    }
  }
  
  loadStats() {
    try {
      const saved = localStorage.getItem('asteroidsX_stats');
      if (saved) {
        const data = JSON.parse(saved);
        
        // Load lifetime stats
        if (data.lifetime) {
          this.lifetime = { ...this.lifetime, ...data.lifetime };
        }
        
        // Load achievement unlock status
        if (data.achievements) {
          Object.entries(data.achievements).forEach(([key, achData]) => {
            if (this.achievements[key]) {
              this.achievements[key].unlocked = achData.unlocked;
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load stats:', error);
    }
  }
  
  resetStats() {
    this.lifetime = {
      gamesPlayed: 0,
      totalScore: 0,
      highScore: 0,
      maxLevel: 1,
      totalAsteroids: 0,
      totalTimeAlive: 0,
      shipUnlocks: ['classic'],
      achievements: [],
      playTime: 0
    };
    
    Object.values(this.achievements).forEach(achievement => {
      achievement.unlocked = false;
    });
    
    this.saveStats();
    console.log('📊 Stats reset');
  }
  
  exportStats() {
    return JSON.stringify({
      lifetime: this.lifetime,
      achievements: this.getUnlockedAchievements()
    }, null, 2);
  }
}
