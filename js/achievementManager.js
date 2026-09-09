import platform from './platform';

export default class AchievementManager {
  constructor() {
    this.achievements = new Map();
    this.unlockedAchievements = new Set();
    this.progress = new Map();
    this.pendingNotifications = [];
    this.coinManager = null;
    this.soundManager = null;
    this.saveTimeout = null;
    this.pendingSave = false;
    this.initAchievements();
    this.loadProgress();
  }

  initAchievements() {
    const achievements = [
      {
        id: 'A002',
        name: '入门选手',
        description: '完成10次游戏',
        category: 'beginner',
        condition: { type: 'games_completed', count: 10 },
        reward: { type: 'coins', amount: 200 },
        icon: '🎮'
      },
      {
        id: 'A201',
        name: '第二关挑战',
        description: '完成第二关',
        category: 'progress',
        condition: { type: 'level_complete', level: 2 },
        reward: { type: 'coins', amount: 500 },
        icon: '🏆'
      },
      {
        id: 'A004',
        name: '轻松搞定',
        description: '5秒内完成第一关',
        category: 'speed',
        condition: { type: 'fast_complete', level: 1, maxTime: 5 },
        reward: { type: 'coins', amount: 500 },
        icon: '🎯'
      },
      {
        id: 'A005',
        name: '闪电侠',
        description: '3秒内完成第一关',
        category: 'speed',
        condition: { type: 'fast_complete', level: 1, maxTime: 3 },
        reward: { type: 'coins', amount: 1000 },
        icon: '⚡'
      },
      {
        id: 'A006',
        name: '速度达人',
        description: '300秒内完成第二关',
        category: 'speed',
        condition: { type: 'fast_complete', level: 2, maxTime: 300 },
        reward: { type: 'coins', amount: 1000 },
        icon: '💨'
      },
      {
        id: 'A007',
        name: '超凡速度',
        description: '250秒内完成第二关',
        category: 'speed',
        condition: { type: 'fast_complete', level: 2, maxTime: 250 },
        reward: { type: 'coins', amount: 2000 },
        icon: '🚀'
      },
      {
        id: 'A302',
        name: '自由探索',
        description: '在自由模式下完成关卡',
        category: 'mode',
        condition: { type: 'mode_complete', mode: 'untimed' },
        reward: { type: 'coins', amount: 200 },
        icon: '🦅'
      },
      {
        id: 'A401',
        name: '坚持不懈',
        description: '累计游戏20次',
        category: 'persistence',
        condition: { type: 'games_completed', count: 20 },
        reward: { type: 'coins', amount: 400 },
        icon: '💪'
      },
      {
        id: 'A402',
        name: '游戏达人',
        description: '累计游戏50次',
        category: 'persistence',
        condition: { type: 'games_completed', count: 50 },
        reward: { type: 'coins', amount: 800 },
        icon: '🌟'
      },
      {
        id: 'A403',
        name: '数一数噻大师',
        description: '累计游戏100次',
        category: 'persistence',
        condition: { type: 'games_completed', count: 100 },
        reward: { type: 'coins', amount: 2000 },
        icon: '👑'
      },
      {
        id: 'A102',
        name: '完美主义者',
        description: '累计3次零错误完成第二关',
        category: 'perfect',
        condition: { type: 'total_perfect_games', count: 3, level: 2 },
        reward: { type: 'coins', amount: 1000 },
        icon: '💎'
      },
      {
        id: 'A501',
        name: '连击新星',
        description: '在第二关达成5连击',
        category: 'combo',
        condition: { type: 'combo', count: 5, level: 2 },
        reward: { type: 'coins', amount: 500 },
        icon: '⭐'
      },
      {
        id: 'A502',
        name: '连击大师',
        description: '在第二关达成10连击',
        category: 'combo',
        condition: { type: 'combo', count: 10, level: 2 },
        reward: { type: 'coins', amount: 1000 },
        icon: '🌟'
      },
      {
        id: 'A503',
        name: '连击狂魔',
        description: '在第二关达成20连击',
        category: 'combo',
        condition: { type: 'combo', count: 20, level: 2 },
        reward: { type: 'coins', amount: 3000 },
        icon: '🔥'
      },
      {
        id: 'A601',
        name: '夜猫子',
        description: '凌晨0-5点完成一局游戏',
        category: 'fun',
        condition: { type: 'late_night_gaming' },
        reward: { type: 'coins', amount: 500 },
        icon: '🦉'
      },
      {
        id: 'EGG001',
        name: '倒序之王',
        description: '”谢谢你玩我的游戏”',
        category: 'hidden',
        condition: { type: 'egg_triggered', eggId: 'reverse_king' },
        reward: { type: 'coins', amount: 10000 },
        icon: '🔄',
        hidden: true
      }
    ];

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  checkAchievement(eventType, data) {
    this.updateProgress(eventType, data);
    const newlyUnlocked = [];

    for (const [id, achievement] of this.achievements) {
      if (this.unlockedAchievements.has(id)) continue;

      if (this.checkCondition(achievement.condition, eventType, data, id)) {
        this.unlockAchievement(id);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  updateProgress(eventType, data) {
    switch (eventType) {
      case 'game_complete':
        const gamesCompleted = this.progress.get('games_completed') || 0;
        this.progress.set('games_completed', gamesCompleted + 1);
        
        const consecutiveGames = this.progress.get('consecutive_games') || 0;
        this.progress.set('consecutive_games', consecutiveGames + 1);
        this.saveProgress();
        break;

      case 'game_fail':
        this.progress.set('consecutive_games', 0);
        this.saveProgress();
        break;

      case 'level_complete':
        if (data.errors === 0) {
          const targetLevel = data.level;
          const consecutiveKey = `consecutive_perfect_level${targetLevel}`;
          const consecutiveCurrent = this.progress.get(consecutiveKey) || 0;
          this.progress.set(consecutiveKey, consecutiveCurrent + 1);
          
          const totalKey = `total_perfect_games_level${targetLevel}`;
          const totalCurrent = this.progress.get(totalKey) || 0;
          this.progress.set(totalKey, totalCurrent + 1);
        } else {
          const targetLevel = data.level;
          const consecutiveKey = `consecutive_perfect_level${targetLevel}`;
          this.progress.set(consecutiveKey, 0);
        }

        const totalNumbers = this.progress.get('total_numbers_found') || 0;
        this.progress.set('total_numbers_found', totalNumbers + (data.totalNumbers || 0));
        this.saveProgress();
        break;
    }
  }

  checkCondition(condition, eventType, data, achievementId) {
    switch (condition.type) {
      case 'level_complete':
        return eventType === 'level_complete' && data.level >= condition.level;

      case 'games_completed':
        if (eventType === 'game_complete') {
          const current = this.progress.get('games_completed') || 0;
          return current >= condition.count;
        }
        return false;

      case 'consecutive_games':
        if (eventType === 'game_complete') {
          const current = this.progress.get('consecutive_games') || 0;
          return current >= condition.count;
        }
        return false;

      case 'fast_complete':
        return eventType === 'level_complete' &&
               data.level === condition.level &&
               data.time <= condition.maxTime;

      case 'perfect_game':
        return eventType === 'level_complete' && 
               data.errors === 0 && 
               data.level === (condition.level || 1);

      case 'consecutive_perfect':
        if (eventType === 'level_complete') {
          const targetLevel = condition.level || 1;
          if (data.level !== targetLevel) return false;
          const key = `consecutive_perfect_level${targetLevel}`;
          const current = this.progress.get(key) || 0;
          return current >= condition.count;
        }
        return false;

      case 'total_perfect_games':
        if (eventType === 'level_complete') {
          const targetLevel = condition.level || 1;
          if (data.level !== targetLevel) return false;
          const key = `total_perfect_games_level${targetLevel}`;
          const current = this.progress.get(key) || 0;
          return current >= condition.count;
        }
        return false;

      case 'total_numbers_found':
        if (eventType === 'level_complete') {
          const current = this.progress.get('total_numbers_found') || 0;
          return current >= condition.count;
        }
        return false;

      case 'combo':
        if (eventType === 'combo' && data.level === condition.level) {
          return data.count >= condition.count;
        }
        return false;

      case 'mode_complete':
        return eventType === 'level_complete' && data.mode === condition.mode;

      case 'late_night_gaming':
        if (eventType === 'game_complete') {
          const hour = new Date().getHours();
          return hour >= 0 && hour < 5;
        }
        return false;

      default:
        return false;
    }
  }

  unlockAchievement(id) {
    const achievement = this.achievements.get(id);
    if (!achievement || this.unlockedAchievements.has(id)) return;

    this.unlockedAchievements.add(id);
    this.pendingNotifications.push(achievement);

    if (this.soundManager) {
      this.soundManager.playComplete();
    }

    if (achievement.reward && achievement.reward.type === 'coins' && this.coinManager) {
      this.coinManager.addCoins(achievement.reward.amount);
    }

    this.saveProgress();
  }

  unlockHiddenAchievement(id, name, description, icon, reward, hidden) {
    const achievement = this.achievements.get(id);

    if (!achievement) {
      this.achievements.set(id, {
        id: id,
        name: name,
        description: description,
        category: 'hidden',
        condition: { type: 'egg_triggered', eggId: id },
        reward: reward,
        icon: icon,
        hidden: hidden
      });
    }

    if (this.unlockedAchievements.has(id)) return;

    this.unlockedAchievements.add(id);
    this.pendingNotifications.push(this.achievements.get(id));

    if (this.soundManager) {
      this.soundManager.playEgg();
    }

    if (reward && reward.type === 'coins' && this.coinManager) {
      this.coinManager.addCoins(reward.amount);
    }

    this.saveProgress();
  }

  getPendingNotifications() {
    const notifications = [...this.pendingNotifications];
    this.pendingNotifications = [];
    return notifications;
  }

  hasPendingNotifications() {
    return this.pendingNotifications.length > 0;
  }

  saveProgress() {
    // 防抖：如果已有待保存的定时器，直接返回
    if (this.pendingSave) return;
    
    this.pendingSave = true;
    
    // 延迟保存，批量处理
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.pendingSave = false;
      try {
        const data = {
          unlockedAchievements: Array.from(this.unlockedAchievements),
          progress: Array.from(this.progress.entries())
        };
        platform.setStorageSync('achievement_progress', JSON.stringify(data));
      } catch (error) {
        // 静默处理错误
      }
    }, 500); // 500ms防抖延迟
  }

  // 立即保存（用于游戏退出等关键时机）
  saveProgressImmediate() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.pendingSave = false;

    try {
      const data = {
        unlockedAchievements: Array.from(this.unlockedAchievements),
        progress: Array.from(this.progress.entries())
      };
      platform.setStorageSync('achievement_progress', JSON.stringify(data));
    } catch (error) {
      // 静默处理错误
    }
  }

  loadProgress() {
    try {
      const data = platform.getStorageSync('achievement_progress');
      if (data) {
        const parsed = JSON.parse(data);
        this.unlockedAchievements = new Set(parsed.unlockedAchievements || []);
        this.progress = new Map(parsed.progress || []);
      }
    } catch (error) {
      // 静默处理错误
    }
  }

  getAchievementProgress(id) {
    const achievement = this.achievements.get(id);
    if (!achievement) return null;

    return {
      achievement,
      unlocked: this.unlockedAchievements.has(id),
      progress: this.getProgressValue(achievement.condition),
      target: this.getProgressTarget(achievement.condition)
    };
  }

  getProgressValue(condition) {
    switch (condition.type) {
      case 'games_completed':
      case 'consecutive_games':
      case 'consecutive_perfect':
      case 'total_perfect_games':
      case 'total_numbers_found':
        return this.progress.get(condition.type) || 0;
      default:
        return this.unlockedAchievements.has(
          this.findAchievementByCondition(condition)
        ) ? 1 : 0;
    }
  }

  getProgressTarget(condition) {
    return condition.count || condition.level || 1;
  }

  findAchievementByCondition(condition) {
    for (const [id, achievement] of this.achievements) {
      if (JSON.stringify(achievement.condition) === JSON.stringify(condition)) {
        return id;
      }
    }
    return null;
  }

  getUnlockedCount() {
    return this.unlockedAchievements.size;
  }

  getTotalCount() {
    return this.achievements.size;
  }

  getAllAchievements() {
    return Array.from(this.achievements.values()).map(achievement => ({
      ...achievement,
      unlocked: this.unlockedAchievements.has(achievement.id),
      progress: this.getProgressValue(achievement.condition),
      target: this.getProgressTarget(achievement.condition),
      hidden: achievement.hidden || false
    }));
  }

  getAchievementsByCategory(category) {
    return this.getAllAchievements().filter(a => a.category === category);
  }

  getCategories() {
    const categories = new Map();
    categories.set('beginner', { name: '新手入门', icon: '🎮' });
    categories.set('speed', { name: '速度恶魔', icon: '⚡' });
    categories.set('perfect', { name: '完美主义', icon: '✨' });
    categories.set('progress', { name: '进度达人', icon: '🏆' });
    categories.set('mode', { name: '模式探索', icon: '🎮' });
    categories.set('persistence', { name: '坚持不懈', icon: '💪' });
    categories.set('combo', { name: '连击大师', icon: '⭐' });
    return categories;
  }

  setCoinManager(coinManager) {
    this.coinManager = coinManager;
  }

  setSoundManager(soundManager) {
    this.soundManager = soundManager;
  }

  reset() {
    this.unlockedAchievements = new Set();
    this.progress = new Map();
    this.pendingNotifications = [];
    this.saveProgress();
  }
}
