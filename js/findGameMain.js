import { SCREEN_WIDTH, SCREEN_HEIGHT, getContext, getCanvas, SAFE_AREA } from './render';
import GameManager from './gameManager';
import UI from './ui';
import SoundManager from './soundManager';

import VibrationManager from './vibrationManager';
import AchievementManager from './achievementManager';
import CoinManager from './coinManager';
import ItemManager from './itemManager';
import ShopManager from './shopManager';
import SkillManager from './skillManager';
import EggManager from './eggManager';
import RewardManager from './rewardManager';
import ShareManager from './shareManager';
import ScoreManager from './scoreManager';
import { CacheManager } from './cacheManager';
import { getColorScheme } from './constants/colors';
import platform from './platform';

// 性能监控工具 - 兼容微信小程序环境
class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastFpsTime = this.now();
    this.fps = 60;
    this.frameTime = 16.67;
    this.lastFrameTime = this.now();
    this.enabled = false;
    this.isSupported = this.checkSupport();
  }

  checkSupport() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function';
  }

  now() {
    if (this.isSupported) {
      return performance.now();
    }
    return Date.now();
  }

  start() {
    this.enabled = true;
  }

  stop() {
    this.enabled = false;
  }

  update() {
    if (!this.enabled || !this.isSupported) return;

    const now = this.now();
    this.frameCount++;
    this.frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  }

  getStats() {
    return {
      fps: this.fps,
      frameTime: this.frameTime.toFixed(2),
      memory: (this.isSupported && performance.memory) ? {
        used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
        total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2)
      } : null
    };
  }
}

const perfMonitor = new PerformanceMonitor();

let canvas;
let ctx;

export default class FindGameMain {
  constructor() {
    canvas = getCanvas();
    ctx = getContext();

    if (!canvas || !ctx) {
      return;
    }

    this.gameManager = new GameManager(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ui = new UI(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.soundManager = new SoundManager();

    this.vibrationManager = new VibrationManager();
    this.achievementManager = new AchievementManager();
    this.coinManager = new CoinManager();
    this.itemManager = new ItemManager();
    this.shopManager = new ShopManager();
    this.skillManager = new SkillManager();
    this.eggManager = new EggManager();
    this.rewardManager = new RewardManager();
    this.shareManager = new ShareManager();
    this.scoreManager = new ScoreManager();
    this.aniId = 0;

    // 情绪化计时器视觉效果
    this.vignetteIntensity = 0;       // 当前暗角强度 (0~1)，平滑过渡
    this.calmFlowPhase = 0;           // 安心流动相位

    this.soundManager.init();
    this.scoreManager.init();
    CacheManager.init();
    this.shareManager.init();

    this.vibrationManager.checkSupport();
    this.achievementManager.loadProgress();
    this.coinManager.init();
    this.itemManager.init();
    this.shopManager.init(this.coinManager, this.itemManager);
    this.eggManager.init();

    this.gameManager.setItemManager(this.itemManager);
    this.gameManager.setSkillManager(this.skillManager);
    this.gameManager.setCoinManager(this.coinManager);
    this.gameManager.setEggManager(this.eggManager);
    this.gameManager.setRewardManager(this.rewardManager);
    this.rewardManager.setSkillManager(this.skillManager);
    this.skillManager.setCoinManager(this.coinManager);
    this.achievementManager.setCoinManager(this.coinManager);
    this.achievementManager.setSoundManager(this.soundManager);
    this.eggManager.setCoinManager(this.coinManager);
    this.eggManager.setAchievementManager(this.achievementManager);
    this.ui.setSoundManager(this.soundManager);

    this.loadGameProgress();

    const savedMode = this.loadGameMode();
    this.ui.setGameMode(savedMode);
    this.gameManager.setGameMode(savedMode);

    this.ui.setCoins(this.coinManager.getCoins());

    this.setupEventListeners();
    this.setupUICallbacks();
    this.setupLifecycleListeners();

    this.ui.initMenu();

    this.loop = this.loop.bind(this);
    this.startLoop();
  }

  setupLifecycleListeners() {
    platform.onHide(() => {
      if (this.gameManager.gameState === 'playing') {
        this.gameManager.pauseTimer();
        this.saveGameState();
      }
    });

    platform.onShow(() => {
      if (this.gameManager.isTimerPaused()) {
        this.showResumeDialog();
      }
    });
  }

  saveGameState() {
    try {
      const state = {
        gameState: this.gameManager.gameState,
        timeLeft: this.gameManager.timeLeft,
        currentNumber: this.gameManager.currentNumber,
        totalNumbers: this.gameManager.totalNumbers,
        currentLevel: this.gameManager.currentLevel,
        gameMode: this.gameManager.gameMode,
        pausedAt: Date.now()
      };
      platform.setStorageSync('savedGameState', JSON.stringify(state));
    } catch (e) {
      // Silent fail
    }
  }

  loadGameState() {
    try {
      const saved = platform.getStorageSync('savedGameState');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Silent fail
    }
    return null;
  }

  clearSavedGameState() {
    platform.removeStorageSync('savedGameState');
  }

  showResumeDialog() {
    this.ui.showModalDialog(
      'resume',
      '游戏暂停',
      '是否继续上次的游戏？',
      [
        {
          id: 'resume',
          text: '继续游戏',
          action: () => {
            this.ui.hideModalImmediate();
            this.gameManager.resumeTimer();
          }
        },
        {
          id: 'restart',
          text: '重新开始',
          action: () => {
            this.ui.hideModalImmediate();
            this.clearSavedGameState();
            this.resetGame();
          }
        }
      ]
    );
  }

  setupEventListeners() {
    let touchStartPos = null;
    let touchMoved = false;

    const isScrollable = () => this.ui.showSkills || this.ui.showShop || this.ui.showAchievements || this.ui.showScoreHistory;

    const handleTouchStart = (res) => {
      try {
        if (!res.touches || res.touches.length === 0) return;

        const touch = res.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        touchStartPos = { x, y };
        touchMoved = false;

        this.ui.updateMousePosition(x, y);

        if (this.ui.showSkills) {
          this.ui.handleSkillsTouchStart(y);
        } else if (this.ui.showShop) {
          this.ui.handleShopTouchStart(y);
        } else if (this.ui.showScoreHistory) {
          this.ui.handleScoreHistoryTouchStart(y);
        } else {
          this.ui.handleTouchStart(y);
          // 非滚动场景立即响应点击
          this.handleInput(x, y);
        }
      } catch (error) {
        // 静默处理错误
      }
    };

    const handleTouchMove = (res) => {
      try {
        if (!res.touches || res.touches.length === 0) return;

        const touch = res.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        if (touchStartPos) {
          const dx = x - touchStartPos.x;
          const dy = y - touchStartPos.y;
          if (Math.sqrt(dx * dx + dy * dy) > 10) {
            touchMoved = true;
          }
        }

        this.ui.updateMousePosition(x, y);

        if (this.ui.showSkills) {
          this.ui.handleSkillsTouchMove(y);
        } else if (this.ui.showShop) {
          this.ui.handleShopTouchMove(y);
        } else if (this.ui.showScoreHistory) {
          this.ui.handleScoreHistoryTouchMove(y);
        } else {
          this.ui.handleTouchMove(y);
        }
      } catch (error) {
        // 静默处理错误
      }
    };

    const handleTouchEnd = (res) => {
      try {
        // 滚动面板场景：touchend 时判断是否为点击
        if (isScrollable() && touchStartPos && !touchMoved) {
          this.handleInput(touchStartPos.x, touchStartPos.y);
        }
        touchStartPos = null;

        if (this.ui.showSkills) {
          this.ui.handleSkillsTouchEnd();
        } else if (this.ui.showShop) {
          this.ui.handleShopTouchEnd();
        } else if (this.ui.showScoreHistory) {
          this.ui.handleScoreHistoryTouchEnd();
        } else {
          this.ui.handleTouchEnd();
        }
      } catch (error) {
        // 静默处理错误
      }
    };
    
    if (platform.type !== 'browser') {
      platform.onTouchStart(handleTouchStart);
      platform.onTouchMove(handleTouchMove);
      platform.onTouchEnd(handleTouchEnd);
    } else {
      if (!canvas || typeof canvas.addEventListener !== 'function') return;
      
      const handleTouch = (e) => {
        try {
          e.preventDefault();
          e.stopPropagation();

          if (!e.touches || e.touches.length === 0) return;

          const touch = e.touches[0];
          const rect = canvas.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;

          touchStartPos = { x, y };
          touchMoved = false;

          this.ui.updateMousePosition(x, y);

          if (this.ui.showSkills) {
            this.ui.handleSkillsTouchStart(y);
          } else if (this.ui.showShop) {
            this.ui.handleShopTouchStart(y);
          } else if (this.ui.showScoreHistory) {
            this.ui.handleScoreHistoryTouchStart(y);
          } else {
            this.ui.handleTouchStart(y);
            // 非滚动场景立即响应点击
            this.handleInput(x, y);
          }
        } catch (error) {
          // 静默处理错误
        }
      };

      const handleTouchMoveEvent = (e) => {
        try {
          e.preventDefault();
          e.stopPropagation();
          if (e.touches && e.touches.length > 0) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            if (touchStartPos) {
              const dx = x - touchStartPos.x;
              const dy = y - touchStartPos.y;
              if (Math.sqrt(dx * dx + dy * dy) > 10) {
                touchMoved = true;
              }
            }

            this.ui.updateMousePosition(x, y);

            if (this.ui.showSkills) {
              this.ui.handleSkillsTouchMove(y);
            } else if (this.ui.showScoreHistory) {
              this.ui.handleScoreHistoryTouchMove(y);
            } else {
              this.ui.handleTouchMove(y);
            }
          }
        } catch (error) {
          // 静默处理错误
        }
      };

      const handleTouchEndEvent = (e) => {
        try {
          // 滚动面板场景：touchend 时判断是否为点击
          if (isScrollable() && touchStartPos && !touchMoved) {
            this.handleInput(touchStartPos.x, touchStartPos.y);
          }
          touchStartPos = null;

          if (this.ui.showSkills) {
            this.ui.handleSkillsTouchEnd();
          } else if (this.ui.showScoreHistory) {
            this.ui.handleScoreHistoryTouchEnd();
          } else {
            this.ui.handleTouchEnd();
          }
        } catch (error) {
          // 静默处理错误
        }
      };
      
      const handleMouse = (e) => {
        try {
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          this.ui.updateMousePosition(x, y);
          
          if (e.type === 'click') {
            this.handleInput(x, y);
          }
        } catch (error) {
          // 静默处理错误
        }
      };
      
      const handleWheel = (e) => {
        try {
          if (this.ui.showShop) {
            e.preventDefault();
            this.ui.handleShopScroll(e.deltaY);
          } else if (this.ui.showSkills) {
            e.preventDefault();
            this.ui.handleSkillsScroll(e.deltaY);
          } else if (this.ui.showAchievements) {
            e.preventDefault();
            this.ui.handleAchievementsScroll(e.deltaY);
          } else if (this.ui.showScoreHistory) {
            e.preventDefault();
            this.ui.handleScoreHistoryScroll(e.deltaY);
          }
        } catch (error) {
        }
      };
      
      canvas.addEventListener('touchstart', handleTouch, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMoveEvent, { passive: false });
      canvas.addEventListener('touchend', handleTouchEndEvent, { passive: false });
      canvas.addEventListener('mousemove', handleMouse);
      canvas.addEventListener('click', handleMouse);
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    }
  }

  setupUICallbacks() {
    this.ui.onGameStart = (count, level, gameMode) => {
      this.startGame(count, level, gameMode);
    };

    this.ui.onGameReset = () => {
      this.resetGame();
    };

    this.ui.onBackToMenu = () => {
      this.backToMenu();
    };
    
    this.ui.onNextLevel = (level) => {
      this.startNextLevel(level);
    };

    this.ui.onPlayClickSound = () => {
      this.soundManager.playUiClick();
    };



    this.ui.onAchievementsOpen = () => {
      this.openAchievements();
    };

    this.ui.onAchievementsClose = () => {
      this.closeAchievements();
    };
    
    this.ui.onModeChange = (mode) => {
      this.saveGameMode(mode);
    };
    
    this.ui.onOpenShop = () => {
      this.openShop();
    };
    
    this.ui.onShopBuy = (product) => {
      this.handleShopBuy(product);
    };
    
    this.ui.onOpenSkills = () => {
      this.openSkills();
    };
    
    this.ui.onSkillUnlock = (skillId) => {
      this.handleSkillUnlock(skillId);
    };
    
    this.ui.onTogglePause = () => {
      const paused = this.gameManager.togglePause();
      this.ui.isPaused = paused;
    };

    this.ui.onRefreshGame = () => {
      this.resetGame();
    };

    this.ui.onShare = () => {
      this.shareManager.shareAppMessage();
    };

    this.coinManager.onCoinChanged = (coins, amount, type) => {
      this.ui.setCoins(coins);
    };
    
    this.itemManager.onItemChanged = (itemId, count, type) => {
      if (itemId === 'hint' && this.gameManager) {
        this.gameManager.hintCount = count;
        this.ui.setHintCount(count);
      }
    };
    
    this.gameManager.onGameComplete = (time) => {
      this.handleGameComplete(time);
    };
    
    this.gameManager.onGameFailed = () => {
      this.handleGameFailed();
    };
    
    this.gameManager.onError = (center, penalty) => {
      this.soundManager.playError();
      this.vibrationManager.vibrateError();
      if (this.gameManager.isTimedMode()) {
        if (penalty > 0) {
          this.ui.showFloatingText(center.x, center.y, `-${penalty}秒`, '#EF4444');
        } else {
          this.ui.showFloatingText(center.x, center.y, '错误', '#EF4444');
        }
      } else {
        this.ui.showFloatingText(center.x, center.y, '错误', '#EF4444');
      }
    };
    
    this.gameManager.onCorrectClick = (center, comboLevel, timeReward) => {
      const comboCount = this.gameManager.getComboCount();
      this.soundManager.playClick(comboCount);
      this.vibrationManager.vibrateCorrect();

      if (comboLevel) {
        this.vibrationManager.vibrateCombo(comboLevel.vibration);
      }

      if (this.gameManager.isTimedMode()) {
        if (timeReward > 0) {
          this.ui.showFloatingText(center.x, center.y, `+${timeReward}秒`, '#FBBF24');
        }
      } else {
        if (comboCount > 3) {
          this.ui.showFloatingText(center.x, center.y, `正确 ${comboCount}连击`, '#FBBF24');
        } else {
          this.ui.showFloatingText(center.x, center.y, '正确', '#FBBF24');
        }
      }
    };
    
    this.gameManager.onComboUpdate = (count, level, coinBonus, center) => {
      this.ui.updateCombo(count, level, center);

      if (coinBonus > 0 && count > 3) {
        this.ui.coins = this.gameManager.coinManager.getCoins();
        this.ui.showCoinFlyEffect(coinBonus, center);
        this.soundManager.playCoin();
      }

      const comboThresholds = [5, 10, 20];
      if (comboThresholds.includes(count) && this.gameManager.currentLevel === 2) {
        const unlockedAchievements = this.achievementManager.checkAchievement('combo', {
          count: count,
          level: this.gameManager.currentLevel
        });

        if (unlockedAchievements.length > 0) {
          this.ui.showAchievementNotification(unlockedAchievements);
          for (const a of unlockedAchievements) {
            if (a.reward && a.reward.type === 'coins' && a.reward.amount > 0) {
              this.ui.showCoinFlyEffect(a.reward.amount, center);
              this.soundManager.playCoin();
            }
          }
        }
        // 清除 pendingNotifications，避免后续重复提示
        this.achievementManager.getPendingNotifications();
      }
    };

    this.gameManager.onComboLevelUp = (level, count, center) => {
      this.ui.onComboLevelUp(level, count, center);
      this.vibrationManager.vibrateCombo(level.vibration);
    };
    
    this.gameManager.onComboBreak = (count, level) => {
      this.ui.onComboBreak(count, level);
    };

    this.gameManager.onEggTriggered = (egg) => {
      this.handleEggTriggered(egg);
    };

    this.gameManager.onRewardTriggered = (reward) => {
      this.ui.showRewardNotification(reward);
      this.soundManager.playUiClick();
    };

    this.gameManager.onMilestone = (milestone) => {
      this.ui.showMilestoneEffect(milestone);
      this.soundManager.playUiClick();
    };

    this.ui.onUseHint = () => {
      this.useHint();
    };

    this.ui.onOpenScoreHistory = () => {
      this.openScoreHistory();
    };

    this.scoreManager.onHighScore = (level, newScore, previousBest) => {
      this.handleHighScore(level, newScore, previousBest);
    };

    this.gameManager.onHintUsed = (count) => {
      this.ui.setHintCount(count);
      this.ui.triggerHintButtonAnimation();
    };
  }

  handleResetGame() {
    this.achievementManager.reset();
    this.coinManager.reset();
    this.skillManager.reset();
    this.itemManager.reset();
    this.scoreManager.reset();

    platform.removeStorageSync('gameProgress');
    platform.removeStorageSync('gameMode');
    platform.removeStorageSync('triggered_eggs');

    this.eggManager.reset();

    this.ui.setCoins(this.coinManager.getCoins());
    this.ui.setSkillsData(this.skillManager.getSkillProgress());
    this.ui.setHintCount(this.itemManager.getItemCount('hint'));
    this.ui.achievementsData = this.achievementManager.getAllAchievements();
    this.ui.initMenu();
  }

  handleEggTriggered(egg) {
    this.soundManager.playUiClick();
    this.vibrationManager.vibrateCorrect();
    this.ui.triggerEggEffect();
    this.ui.showFloatingText(this.ui.width / 2, this.ui.height / 2, `+${egg.reward.amount} 💰`, '#10B981');

    this.ui.achievementsData = this.achievementManager.getAllAchievements();

    if (this.achievementManager.hasPendingNotifications()) {
      const unlockedAchievements = this.achievementManager.getPendingNotifications();
      this.ui.showAchievementNotification(unlockedAchievements);
      for (const a of unlockedAchievements) {
        if (a.reward && a.reward.type === 'coins' && a.reward.amount > 0) {
          this.ui.showCoinFlyEffect(a.reward.amount, { x: this.ui.width / 2, y: this.ui.height / 2 });
          this.soundManager.playCoin();
        }
      }
    }
  }

  handleInput(x, y) {
    if (this.ui.showModal) {
      if (this.ui.handleClick(x, y)) return;
      return;
    }

    if (this.ui.handleClick(x, y)) return;

    if (this.gameManager.gameState === 'playing') {
      this.gameManager.handleClick(x, y);
    }
  }

  startGame(count, level, gameMode = null) {
    this.ui.currentLevel = level;
    const mode = gameMode || this.ui.getGameMode();
    this.gameManager.initGame(count, level, mode);
    this.ui.setHintCount(this.gameManager.getHintCount());
    this.ui.initGame();
  }

  startNextLevel(level) {
    this.ui.currentLevel = level;
    const mode = this.ui.getGameMode();
    this.startGame(this.ui.levelConfig[level].count, level, mode);
  }

  resetGame() {
    const count = this.gameManager.polygonCount;
    const level = this.gameManager.currentLevel;
    const mode = this.ui.getGameMode();
    this.vignetteIntensity = 0;
    this.gameManager.initGame(count, level, mode);
  }

  backToMenu() {
    this.gameManager.reset();
    this.ui.initMenu();
  }

  handleGameComplete(time) {
    this.saveGameProgress(time);

    const level = this.gameManager.currentLevel;
    const numbersFound = this.gameManager.totalNumbers;
    const scoreResult = this.scoreManager.recordScore(level, numbersFound, time);

    const hasNextLevel = this.gameManager.hasNextLevel();

    const achievementData = {
      level: this.gameManager.currentLevel,
      time: time,
      errors: this.gameManager.getErrorCount(),
      totalNumbers: this.gameManager.totalNumbers,
      mode: this.gameManager.getGameMode()
    };

    const unlockedAchievements = [
      ...this.achievementManager.checkAchievement('level_complete', achievementData),
      ...this.achievementManager.checkAchievement('game_complete', achievementData)
    ];

    if (unlockedAchievements.length > 0) {
      this.ui.showAchievementNotification(unlockedAchievements);
      for (const a of unlockedAchievements) {
        if (a.reward && a.reward.type === 'coins' && a.reward.amount > 0) {
          this.ui.showCoinFlyEffect(a.reward.amount, { x: this.ui.width / 2, y: this.ui.height / 2 });
          this.soundManager.playCoin();
        }
      }
    }

    // 清除 pendingNotifications，避免后续重复提示
    this.achievementManager.getPendingNotifications();

    const message = `找到: ${numbersFound}\n完成时间: ${time.toFixed(1)}秒` +
      (scoreResult.isNewHighScore ? '\n🎉 新纪录！' : '');
    
    const buttons = [
      {
        id: 'playAgain',
        text: '再玩一次',
        action: () => {
          this.ui.hideModalImmediate();
          const level = this.gameManager.currentLevel;
          const count = this.ui.levelConfig[level].count;
          this.startGame(count, level);
        }
      },
      {
        id: 'menu',
        text: '返回首页',
        action: () => {
          this.ui.hideModalImmediate();
          this.backToMenu();
        }
      }
    ];

    if (hasNextLevel) {
      buttons.unshift({
        id: 'nextLevel',
        text: '下一关',
        action: () => {
          this.ui.hideModalImmediate();
          this.startNextLevel(2);
        }
      });
    }

    this.ui.showModalDialog(
      'gameComplete',
      '恭喜通关！',
      message,
      buttons
    );
  }

  handleGameFailed() {
    this.soundManager.playFail();
    const progress = this.gameManager.getProgress();
    const time = this.gameManager.getCompletionTime();
    const level = this.gameManager.currentLevel;
    const scoreResult = this.scoreManager.recordScore(level, progress, time);

    this.achievementManager.checkAchievement('game_fail', {
      level: this.gameManager.currentLevel,
      progress: progress,
      total: this.gameManager.getTotalProgress()
    });

    const failMessage = `找到: ${progress}\n完成进度: ${progress}/${this.gameManager.getTotalProgress()}\n用时: ${time.toFixed(1)}秒` +
      (scoreResult.isNewHighScore ? '\n🎉 新纪录！' : '');
    
    this.ui.showModalDialog(
      'gameFailed',
      '再接再厉！',
      failMessage,
      [
        {
          id: 'tryAgain',
          text: '再试一次',
          action: () => {
            this.ui.hideModalImmediate();
            this.resetGame();
          }
        },
        {
          id: 'menu',
          text: '返回首页',
          action: () => {
            this.ui.hideModalImmediate();
            this.backToMenu();
          }
        }
      ]
    );
  }

  update(deltaTime) {
    this.gameManager.update(deltaTime);
    this.ui.updateModalAnimation(deltaTime);
  }

  renderGameBackground(ctx) {
    const bgState = this.ui.getBackgroundState();
    const intensity = bgState.comboIntensity;

    if (intensity < 0.1) {
      // Static background
      const gradient = ctx.createLinearGradient(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      gradient.addColorStop(0, '#FFFAF5');
      gradient.addColorStop(0.5, '#FFF3E8');
      gradient.addColorStop(1, '#FFF7F0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      return;
    }

    const phase = bgState.phase;
    const t = Date.now() / 1000;

    // Flowing gradient based on combo intensity
    const baseColors = ['#FFFAF5', '#FFF3E8', '#FFF7F0'];
    const warmColors = ['#FFF3E8', '#FFE8D6', '#FFF0E0'];
    const hotColors = ['#FFE4CC', '#FFD4B8', '#FFE0C8'];

    const blendFactor = Math.min(1, (intensity - 0.5) / 1.0);

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    }

    function rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
    }

    function lerpColor(c1, c2, t) {
      const [r1, g1, b1] = hexToRgb(c1);
      const [r2, g2, b2] = hexToRgb(c2);
      return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
    }

    const colors = baseColors.map((base, i) => {
      const warm = lerpColor(base, warmColors[i], blendFactor);
      return lerpColor(warm, hotColors[i], blendFactor * blendFactor);
    });

    // Animated gradient angle
    const angleShift = Math.sin(phase) * 0.3;
    const gx = SCREEN_WIDTH * 0.5 + Math.cos(angleShift) * SCREEN_WIDTH * 0.5;
    const gy = SCREEN_HEIGHT * 0.5 + Math.sin(angleShift) * SCREEN_HEIGHT * 0.5;

    const gradient = ctx.createLinearGradient(0, 0, gx, gy);
    // Shift color stops with phase
    const stopShift = Math.sin(phase * 0.7) * 0.15;
    gradient.addColorStop(Math.max(0, 0 + stopShift), colors[0]);
    gradient.addColorStop(Math.max(0, 0.5 + stopShift), colors[1]);
    gradient.addColorStop(Math.min(1, 1), colors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Subtle radial pulse at high combo
    if (intensity >= 1) {
      const pulseAlpha = (intensity - 1) * 0.08 * (0.7 + Math.sin(t * 3) * 0.3);
      const comboColor = bgState.comboLevel ? bgState.comboLevel.color : '#FBBF24';
      const [pr, pg, pb] = hexToRgb(comboColor);
      const radial = ctx.createRadialGradient(
        SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 0,
        SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.6
      );
      radial.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, ${pulseAlpha})`);
      radial.addColorStop(1, `rgba(${pr}, ${pg}, ${pb}, 0)`);
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    // Background particles
    const particles = bgState.particles;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderEmotionalTimerEffects(ctx, deltaTime) {
    const gm = this.gameManager;
    if (gm.gameState !== 'playing') {
      // 非游戏中：快速消退暗角
      this.vignetteIntensity = Math.max(0, this.vignetteIntensity - deltaTime * 3);
      if (this.vignetteIntensity < 0.01) {
        this.vignetteIntensity = 0;
        return;
      }
    } else if (gm.gameMode !== 'timed') {
      return;
    }

    if (gm.gameState === 'playing' && gm.gameMode === 'timed') {
      const timeLeft = gm.timeLeft;

      // --- 危险暗角 ---
      if (timeLeft < 5) {
        const ratio = timeLeft / 5;  // 1→0
        const target = Math.pow(1 - ratio, 0.6);  // 非线性：5秒→0, 4秒→0.38, 3秒→0.54, 0秒→1
        this.vignetteIntensity += (target - this.vignetteIntensity) * Math.min(1, deltaTime * 6);
      } else {
        this.vignetteIntensity = Math.max(0, this.vignetteIntensity - deltaTime * 2);
      }

      // --- 安心流动 ---
      if (timeLeft > 10) {
        this.calmFlowPhase += deltaTime * 0.8;
      }
    }

    // 绘制危险暗角
    if (this.vignetteIntensity > 0.01) {
      const alpha = this.vignetteIntensity * 0.85;
      const cx = SCREEN_WIDTH / 2;
      const cy = SCREEN_HEIGHT / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy);

      const vignette = ctx.createRadialGradient(cx, cy, maxR * 0.2, cx, cy, maxR);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.4, `rgba(0, 0, 0, ${alpha * 0.2})`);
      vignette.addColorStop(0.7, `rgba(0, 0, 0, ${alpha * 0.5})`);
      vignette.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      // 低时间时加一层红色叠加
      if (this.vignetteIntensity > 0.3) {
        const redAlpha = (this.vignetteIntensity - 0.3) * 0.25;
        ctx.fillStyle = `rgba(220, 38, 38, ${redAlpha})`;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      }
    }

    // 绘制安心流动
    if (gm.gameState === 'playing' && gm.gameMode === 'timed' && gm.timeLeft > 10) {
      const phase = this.calmFlowPhase;
      const breathAlpha = 0.025 + Math.sin(phase) * 0.015;
      const cx = SCREEN_WIDTH / 2;
      const cy = SCREEN_HEIGHT / 2;
      const r = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.7;

      const calm = ctx.createRadialGradient(
        cx + Math.sin(phase * 0.6) * 40,
        cy + Math.cos(phase * 0.4) * 30,
        0,
        cx, cy, r
      );
      calm.addColorStop(0, `rgba(134, 239, 172, ${breathAlpha})`);
      calm.addColorStop(0.5, `rgba(253, 230, 138, ${breathAlpha * 0.6})`);
      calm.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = calm;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }
  }

  renderGameAreaBorder(ctx) {
    if (this.gameManager.gameState !== 'playing' && 
        this.gameManager.gameState !== 'completed' && 
        this.gameManager.gameState !== 'failed') {
      return;
    }

    const isMobile = SCREEN_WIDTH < 768;
    const safeArea = SAFE_AREA || { top: 0, bottom: 0, left: 0, right: 0 };
    const topSafeArea = Math.max(safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(safeArea.bottom, isMobile ? 34 : 0);
    const headerHeight = isMobile ? Math.max(100, topSafeArea + 54) : 116;
    const footerHeight = isMobile ? Math.max(80, bottomSafeArea + 44) : 56;
    
    const borderPadding = 10;
    const borderX = borderPadding - 4;
    const borderY = headerHeight + borderPadding - 4;
    const borderWidth = SCREEN_WIDTH - borderPadding * 2 + 8;
    const borderHeight = SCREEN_HEIGHT - headerHeight - footerHeight - borderPadding * 2 + 8;
    const borderRadius = 18;
    
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.drawRoundedRect(ctx, borderX, borderY, borderWidth, borderHeight, borderRadius);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.drawRoundedRect(ctx, borderX + 4, borderY + 4, borderWidth - 8, borderHeight - 8, 14);
    ctx.stroke();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  render(deltaTime = 0.016) {
    this.renderGameBackground(ctx);

    if (this.gameManager.gameState === 'playing' || this.gameManager.gameState === 'completed' || this.gameManager.gameState === 'failed') {
      this.gameManager.render(ctx);
      this.renderGameAreaBorder(ctx);
    }

    this.ui.render(
      ctx,
      this.gameManager.gameState,
      this.gameManager.currentNumber,
      this.gameManager.totalNumbers,
      this.gameManager.getTimeLeft(),
      deltaTime
    );

    this.renderEmotionalTimerEffects(ctx, deltaTime);
  }

  loop() {
    const now = Date.now();
    const deltaTime = this.lastFrameTime ? (now - this.lastFrameTime) / 1000 : 0.016;
    this.lastFrameTime = now;
    
    // 更新性能监控
    perfMonitor.update();
    
    this.update(deltaTime);
    this.render(deltaTime);
    this.aniId = requestAnimationFrame(this.loop);
  }

  startLoop() {
    this.lastFrameTime = Date.now();
    this.aniId = requestAnimationFrame(this.loop);
  }

  saveGameProgress(time) {
    try {
      const progress = {
        bestTime: time,
        level: this.gameManager.currentLevel,
        polygonCount: this.gameManager.polygonCount,
        timestamp: Date.now()
      };

      const savedProgress = platform.getStorageSync('gameProgress') || {};
      const key = `level_${this.gameManager.currentLevel}`;

      if (!savedProgress[key] || time < savedProgress[key].bestTime) {
        savedProgress[key] = progress;
        platform.setStorageSync('gameProgress', savedProgress);
      }
    } catch (e) {
      // 静默处理错误
    }
  }

  loadGameProgress() {
    try {
      const savedProgress = platform.getStorageSync('gameProgress');
      // 加载进度但不打印日志
    } catch (e) {
      // 静默处理错误
    }
  }

  saveGameMode(mode) {
    platform.setStorageSync('gameMode', mode);
  }

  loadGameMode() {
    try {
      const savedMode = platform.getStorageSync('gameMode');
      if (savedMode && (savedMode === 'timed' || savedMode === 'untimed')) {
        return savedMode;
      }
    } catch (e) {
      // 静默处理错误
    }

    return 'timed';
  }


  openAchievements() {
    this.ui.achievementsData = this.achievementManager.getAllAchievements();
  }

  closeAchievements() {
    this.ui.showAchievements = false;
  }

  useHint() {
    this.gameManager.useHint();
  }

  openShop() {
    this.ui.shopProducts = this.shopManager.getAllProducts();
    this.ui.showShop = true;
  }

  handleShopBuy(product) {
    if (product.id === 'reset_game') {
      if (this.coinManager.getCoins() < product.price) {
        this.soundManager.playError();
        this.ui.showFloatingText(this.ui.width / 2, this.ui.height / 2, '金币不足!', '#EF4444');
        return;
      }
      this.ui.showModalDialog(
        'resetConfirm',
        '⚠ 时光倒流',
        '此操作将清除所有游戏数据：\n\n• 金币归零\n• 技能归零\n• 道具归零\n• 成就归零\n• 游戏进度清空\n\n此操作不可恢复，确定要继续吗？',
        [
          {
            id: 'cancel',
            text: '取消',
            action: () => {
              this.ui.hideModal();
            }
          },
          {
            id: 'confirm',
            text: '确认重置',
            color: '#EF4444',
            action: () => {
              this.ui.hideModalImmediate();
              this.handleResetGame();
            }
          }
        ]
      );
      return;
    }

    const result = this.shopManager.buy(product.id);

    if (result.success) {
      this.ui.showFloatingText(this.ui.width / 2, this.ui.height / 2, `+${result.itemsAdded} 💡`, '#10B981');
    } else {
      this.soundManager.playError();
      if (result.reason === 'not_enough_coins') {
        this.ui.showFloatingText(this.ui.width / 2, this.ui.height / 2, '金币不足!', '#EF4444');
      }
    }
  }

  openSkills() {
    this.ui.skillsData = this.skillManager.getSkillProgress();
    this.ui.shopProducts = this.shopManager.getAllProducts();
    this.ui.skillScrollOffset = 0;
    this.ui.skillScrollVelocity = 0;
    this.ui.skillIsTouching = false;
    this.ui.showSkills = true;
  }

  openScoreHistory() {
    this.ui.scoreHistoryData = {
      1: this.scoreManager.getTopScores(1),
      2: this.scoreManager.getTopScores(2)
    };
    this.ui.showScoreHistory = true;
    this.ui.scoreHistoryTab = 1;
    this.ui.scoreHistoryScrollOffset = 0;
    this.ui.scoreHistoryScrollVelocity = 0;
    this.ui.scoreHistoryIsTouching = false;
  }

  handleHighScore(level, newScore, previousBest) {
    this.vibrationManager.vibrateCombo(2);
    this.soundManager.playUiClick();
    this.ui.showHighScoreCelebration(newScore, previousBest, level);
  }

  handleSkillUnlock(skillId) {
    const skill = this.skillManager.getSkill(skillId);
    if (!skill) return;

    const result = this.skillManager.unlockSkill(skillId);

    if (result) {
      this.soundManager.playUiClick();
      this.ui.showFloatingText(this.ui.width / 2, this.ui.height / 2, `解锁 ${skill.name}!`, '#10B981', 'skills');
      this.ui.skillsData = this.skillManager.getSkillProgress();
    } else {
      this.soundManager.playError();
      this.ui.showFloatingText(this.ui.width / 2, this.ui.height / 2, '金币不足!', '#EF4444', 'skills');
    }
  }

  getBestTime(difficulty, count) {
    try {
      const savedProgress = platform.getStorageSync('gameProgress');
      if (savedProgress) {
        const key = `${difficulty}_${count}`;
        return savedProgress[key] ? savedProgress[key].bestTime : null;
      }
    } catch (e) {
      // 静默处理错误
    }
    return null;
  }
}
