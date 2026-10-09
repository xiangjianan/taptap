import BubbleGenerator from './bubbleGenerator.js';
import { SAFE_AREA } from './render';
import ComboManager from './comboManager';
import EggManager from './eggManager';
import TapEffects from './tapEffects.js';

export default class GameManager {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.generator = new BubbleGenerator(width, height, { safeArea: SAFE_AREA });
    this.comboManager = new ComboManager();
    this.eggManager = new EggManager();
    this.polygons = [];
    this.tapEffects = new TapEffects();
    this.currentNumber = 1;
    this.totalNumbers = 0;
    this.gameState = 'menu';
    this.startTime = 0;
    this.endTime = 0;
    this.totalPausedDuration = 0;
    this.currentLevel = 1;
    this.polygonCount = 10;
    this.onGameComplete = null;
    this.onError = null;
    this.onCorrectClick = null;
    this.onNeutralTap = null;
    this.onComboUpdate = null;
    this.onComboLevelUp = null;
    this.onComboBreak = null;
    this.onEggTriggered = null;

    this.timeLeft = 10.0;
    this.initialTime = 10.0;
    this.timeBonus = 5.0;
    this.timerInterval = null;
    this.clickCount = 0;
    this.errorCount = 0;
    this.gameMode = 'timed';
    
    this.hintCount = 0;
    this.hintedPolygon = null;
    this.onHintUsed = null;
    this.itemManager = null;
    this.skillManager = null;
    this.coinManager = null;
    this.rewardManager = null;
    this.eagleEyeTimeoutId = null;
    this.onRewardTriggered = null;
    this.onMilestone = null;

    this.setupComboCallbacks();
    this.eggManager.init();
  }

  setupComboCallbacks() {
    this.comboManager.onComboUpdate = (count, level) => {
      if (this.gameMode === 'timed' && count > 3) {
        const timeReward = this.getTimeReward(count);
        this.timeLeft += timeReward;
      }

      const coinBonus = this.skillManager ? this.skillManager.getComboCoinBonus() : 0;
      if (coinBonus > 0 && count > 3) {
        this.coinManager.addCoins(coinBonus, 'combo');
      }

      if (this.onComboUpdate) {
        this.onComboUpdate(count, level, coinBonus, this._lastClickCenter);
      }
    };

    this.comboManager.onComboLevelUp = (level, count) => {
      if (this.onComboLevelUp) {
        this.onComboLevelUp(level, count, this._lastClickCenter);
      }
    };
    
    this.comboManager.onComboBreak = (count, level) => {
      if (this.onComboBreak) {
        this.onComboBreak(count, level);
      }
    };
  }

  initGame(count, level = 1, gameMode = 'timed') {
    this.polygonCount = count;
    this.currentLevel = level;
    this.gameMode = gameMode;
    this.isPaused = false;
    this.pauseStartTime = 0;
    this.polygons = this.generator.generatePolygons(count, 'normal');
    this.currentNumber = 1;
    // 以实际返回的格子数为准（生成器对极端 count 有容量钳制）
    this.tapEffects.reset();
    this.totalNumbers = this.polygons.length;
    this.gameState = 'playing';
    this.startTime = Date.now();
    this.totalPausedDuration = 0;
    this.timeLeft = this.initialTime + (this.skillManager ? this.skillManager.getInitialTimeBonus() : 0);
    this.clickCount = 0;
    this.errorCount = 0;
    this.hintCount = this.itemManager ? this.itemManager.getItemCount('hint') : 0;
    this.hintedPolygon = null;
    
    this.comboManager.breakCombo();

    // 鹰眼技能：游戏开始时为第一个数字启动3秒定时器
    if (this.skillManager && this.skillManager.isUnlocked('eagle_eye')) {
      const firstPolygon = this.polygons.find(p => p.number === 1);
      if (firstPolygon) {
        if (this.eagleEyeTimeoutId) {
          clearTimeout(this.eagleEyeTimeoutId);
          this.eagleEyeTimeoutId = null;
        }
        this.eagleEyeTimeoutId = setTimeout(() => {
          firstPolygon.setEagleEyeHighlight(true);
          this.eagleEyeTimeoutId = null;
        }, 3000);
      }
    }

    if (this.gameMode === 'timed') {
      this.startTimer();
    }
  }

  handleClick(x, y) {
    if (this.gameState !== 'playing' || this.isPaused) return;

    // Match the board's camera transform during impact shake.
    x -= this.tapEffects.offset.x;
    y -= this.tapEffects.offset.y;
    for (const polygon of this.polygons) {
      if (polygon.containsPoint({ x, y })) {
        if (polygon.isClicked) {
          this.tapEffects.emitContact({ x, y }, 'repeat');
          if (this.onNeutralTap) this.onNeutralTap();
          return;
        }
        if (polygon.number === this.currentNumber) {
          this.handleCorrectClick(polygon, { x, y });
        } else {
          this.handleWrongClick(polygon, { x, y });
        }

        const triggeredEgg = this.eggManager.checkClick(
          polygon.number,
          this.gameMode,
          this.currentLevel,
          this.totalNumbers
        );

        if (triggeredEgg) {
          if (this.onEggTriggered) {
            this.onEggTriggered(triggeredEgg);
          }
        }

        return;
      }
    }
    const bounds = this.getBoardBounds();
    if (x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
      this.tapEffects.emitContact({ x, y });
    }
  }

  handleCorrectClick(polygon, point = polygon.getCenter()) {
    // 如果当前多边形有鹰眼高亮，立即取消并清除定时器
    if (polygon.isEagleEyeHighlighted) {
      polygon.setEagleEyeHighlight(false);
      if (this.eagleEyeTimeoutId) {
        clearTimeout(this.eagleEyeTimeoutId);
        this.eagleEyeTimeoutId = null;
      }
    }

    polygon.isClicked = true;
    // The dt-driven success impulse owns the whole visual lifecycle.
    polygon.resetHighlight();

    if (this.hintedPolygon === polygon) {
      this.clearHint();
    }

    this.currentNumber++;
    this.clickCount++;

    // 里程碑检测已移除

    // 鹰眼技能：3秒后高亮下一个数字

    // 鹰眼技能：3秒后高亮下一个数字
    if (this.skillManager && this.skillManager.isUnlocked('eagle_eye') && this.currentNumber <= this.totalNumbers) {
      const nextPolygon = this.polygons.find(p => p.number === this.currentNumber);
      if (nextPolygon) {
        // 清除之前的定时器
        if (this.eagleEyeTimeoutId) {
          clearTimeout(this.eagleEyeTimeoutId);
          this.eagleEyeTimeoutId = null;
        }

        // 3秒后高亮下一个数字
        this.eagleEyeTimeoutId = setTimeout(() => {
          nextPolygon.setEagleEyeHighlight(true);
          this.eagleEyeTimeoutId = null;
        }, 3000);
      }
    }

    const center = polygon.getCenter();
    this._lastClickCenter = center;

    const comboLevel = this.comboManager.onCorrectClick();
    const comboCount = this.comboManager.getComboCount();
    polygon.playSuccess(comboCount);
    this.tapEffects.emit(point, comboCount);

    // 计算实际加时秒数
    let timeReward = 0;
    if (this.gameMode === 'timed') {
      if (comboCount > 3) {
        // 连击时不再加基础时间，时间奖励由 onComboUpdate 处理
        timeReward = this.getTimeReward(comboCount);
      } else {
        const timeBonusSkill = this.skillManager ? this.skillManager.getTimeBonusPerClick() : 0;
        timeReward = this.timeBonus + timeBonusSkill;
        this.timeLeft += timeReward;
      }
    }

    if (this.onCorrectClick) {
      this.onCorrectClick(center, comboLevel, timeReward);
    }

    // 检查奖励触发
    if (this.rewardManager && this.gameMode === 'timed') {
      const reward = this.rewardManager.checkReward({
        itemManager: this.itemManager,
        coinManager: this.coinManager,
        gameManager: this
      });
      
      if (reward && this.onRewardTriggered) {
        this.onRewardTriggered(reward);
      }
    }

    if (this.currentNumber > this.totalNumbers) {
      setTimeout(() => {
        this.handleGameComplete();
      }, 300);
    }
  }

  handleWrongClick(polygon, point = polygon.getCenter()) {
    polygon.shake();
    this.tapEffects.emit(point, 0, true);
    this.errorCount++;
    this.clickCount++;
    
    this.comboManager.onWrongClick();
    
    let penalty = 0;
    if (this.gameMode === 'timed') {
      const customPenalty = this.skillManager ? this.skillManager.getErrorTimePenalty() : null;
      penalty = customPenalty !== null ? customPenalty : this.timeBonus;
      this.timeLeft -= penalty;
      if (this.timeLeft < 0) {
        this.timeLeft = 0;
      }
    }
    
    if (this.onError) {
      const center = polygon.getCenter();
      this.onError(center, penalty);
    }
  }

  handleGameComplete() {
    this.stopTimer();
    this.gameState = 'completed';
    this.endTime = Date.now();
    const paused = this.totalPausedDuration + (this.isPaused ? this.endTime - this.pauseStartTime : 0);
    const completionTime = (this.endTime - this.startTime - paused) / 1000;

    if (this.onGameComplete) {
      this.onGameComplete(completionTime);
    }
  }

  hasNextLevel() {
    return this.currentLevel < 2;
  }

  reset() {
    this.tapEffects.reset();
    this.stopTimer();
    this.polygons = [];
    this.currentNumber = 1;
    this.gameState = 'menu';
    this.startTime = 0;
    this.endTime = 0;
    this.totalPausedDuration = 0;
    this.timeLeft = this.initialTime;
    this.clickCount = 0;
    this.errorCount = 0;
    this.comboManager.reset();
    this.eggManager.resetSequence();
    this.hintCount = this.itemManager ? this.itemManager.getItemCount('hint') : 0;
    this.hintedPolygon = null;
  }

  getComboCount() {
    return this.comboManager.getComboCount();
  }

  getTimeReward(comboCount) {
    const comboBonus = this.skillManager ? this.skillManager.getComboBonus() : 0;
    const timeBonusSkill = this.skillManager ? this.skillManager.getTimeBonusPerClick() : 0;
    return 5 + timeBonusSkill + comboBonus * (comboCount - 3);
  }

  getComboMultiplier() {
    return this.comboManager.getMultiplier();
  }

  getMaxCombo() {
    return this.comboManager.getMaxCombo();
  }

  getComboLevel() {
    return this.comboManager.getCurrentComboLevel();
  }

  setItemManager(itemManager) {
    this.itemManager = itemManager;
  }

  setSkillManager(skillManager) {
    this.skillManager = skillManager;
  }

  setCoinManager(coinManager) {
    this.coinManager = coinManager;
  }

  setEggManager(eggManager) {
    this.eggManager = eggManager;
  }

  update(deltaTime = 0.016) {
    if (this.isPaused) return;
    if (this.gameState === 'menu') this.tapEffects.reset();
    this.tapEffects.update(deltaTime);
    for (const polygon of this.polygons) {
      polygon.update(deltaTime);
    }
    
    // 注意：倒计时由 setInterval 在 updateTimer() 中管理
    // 不在此处重复扣减，避免双倍计时问题
    // 仅检查是否超时（用于处理边界情况）
    if (this.gameMode === 'timed' && this.gameState === 'playing' && !this.isPaused) {
      if (this.timeLeft <= 0 && this.gameState !== 'failed') {
        this.handleTimeUp();
      }
    }
  }

  handleTimeUp() {
    this.stopTimer();
    this.gameState = 'failed';
    if (this.onGameFailed) {
      this.onGameFailed();
    }
  }

  getBoardBounds() {
    const safeArea = this.generator.safeArea;
    const isMobile = this.width < 768;
    const topSafeArea = Math.max(safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(safeArea.bottom, isMobile ? 34 : 0);
    const headerHeight = isMobile ? Math.max(100, topSafeArea + 56) : 130;
    const footerHeight = isMobile ? Math.max(80, bottomSafeArea + 46) : 60;
    const borderPadding = 12;
    const clipX = borderPadding;
    const clipY = headerHeight + borderPadding;
    const clipW = this.width - borderPadding * 2;
    const clipH = this.height - headerHeight - footerHeight - borderPadding * 2;
    const clipRadius = 10;

    return { x: clipX, y: clipY, width: clipW, height: clipH, radius: clipRadius };
  }

  render(ctx) {
    const { x: clipX, y: clipY, width: clipW, height: clipH, radius: clipRadius } = this.getBoardBounds();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(clipX + clipRadius, clipY);
    ctx.lineTo(clipX + clipW - clipRadius, clipY);
    ctx.quadraticCurveTo(clipX + clipW, clipY, clipX + clipW, clipY + clipRadius);
    ctx.lineTo(clipX + clipW, clipY + clipH - clipRadius);
    ctx.quadraticCurveTo(clipX + clipW, clipY + clipH, clipX + clipW - clipRadius, clipY + clipH);
    ctx.lineTo(clipX + clipRadius, clipY + clipH);
    ctx.quadraticCurveTo(clipX, clipY + clipH, clipX, clipY + clipH - clipRadius);
    ctx.lineTo(clipX, clipY + clipRadius);
    ctx.quadraticCurveTo(clipX, clipY, clipX + clipRadius, clipY);
    ctx.closePath();
    ctx.clip();

    // Restore the original warm, opaque number board.
    ctx.fillStyle = '#FFFAF5';
    ctx.fillRect(clipX, clipY, clipW, clipH);

    ctx.save();
    ctx.translate(this.tapEffects.offset.x, this.tapEffects.offset.y);
    // 先绘制所有多边形的形状（底层）
    for (const polygon of this.polygons) {
      if (polygon.successTime <= 0) polygon.renderShape(ctx);
    }
    // Active rubber edges must remain visible over neighboring cell fills.
    for (const polygon of this.polygons) {
      if (polygon.successTime > 0) polygon.renderShape(ctx);
    }
    this.tapEffects.render(ctx);
    // 再绘制所有文字（顶层），确保文字不被其他图形的线条遮挡
    for (const polygon of this.polygons) {
      polygon.renderText(ctx);
    }
    ctx.restore();
    this.tapEffects.renderAccents(ctx, { x: clipX, y: clipY, width: clipW, height: clipH });

    ctx.restore();
  }

  getCompletionTime() {
    if (this.startTime === 0) return 0;
    const endTime = this.gameState === 'completed' ? this.endTime : Date.now();
    const paused = this.totalPausedDuration + (this.isPaused ? Date.now() - this.pauseStartTime : 0);
    return (endTime - this.startTime - paused) / 1000;
  }

  getProgress() {
    return this.currentNumber - 1;
  }

  checkMilestone() {
    if (!this.onMilestone || this.totalNumbers <= 10) return;

    const progress = this.currentNumber - 1;
    const pct = progress / this.totalNumbers;

    const milestones = [
      { pct: 0.25, label: '25%', color: '#3B82F6' },
      { pct: 0.5,  label: '半程', color: '#F97316' },
      { pct: 0.75, label: '75%', color: '#8B5CF6' }
    ];

    for (const m of milestones) {
      const target = Math.round(m.pct * this.totalNumbers);
      if (progress === target) {
        this.onMilestone(m);
        break;
      }
    }
  }

  getTotalProgress() {
    return this.totalNumbers;
  }

  startTimer() {
    if (this.gameMode !== 'timed') return;
    this.stopTimer();
    this.timerStartTime = Date.now();
    this.timerLastUpdate = this.timerStartTime;
    this.isPaused = false;
    
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 100);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimer() {
    const now = Date.now();
    const elapsed = (now - this.timerLastUpdate) / 1000;
    this.timerLastUpdate = now;
    
    this.timeLeft = Math.max(0, this.timeLeft - elapsed);
    
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.stopTimer();
      this.gameState = 'failed';
      
      if (this.onGameFailed) {
        this.onGameFailed();
      }
    }
  }

  pauseTimer() {
    if (this.gameState !== 'playing' || this.isPaused) return false;
    this.isPaused = true;
    this.pauseStartTime = Date.now();
    if (this.gameMode === 'timed') {
      this.stopTimer();
    }
    return true;
  }

  resumeTimer() {
    if (!this.isPaused) return false;
    this.isPaused = false;
    this.totalPausedDuration += Date.now() - this.pauseStartTime;
    if (this.gameMode === 'timed') {
      this.timerLastUpdate = Date.now();
      this.startTimer();
    }
    return true;
  }

  togglePause() {
    if (this.isPaused) {
      return this.resumeTimer();
    } else {
      return this.pauseTimer();
    }
  }

  isTimerPaused() {
    return this.isPaused;
  }

  getTimeLeft() {
    return this.timeLeft;
  }

  getClickCount() {
    return this.clickCount;
  }

  getErrorCount() {
    return this.errorCount;
  }

  getGameMode() {
    return this.gameMode;
  }

  setGameMode(mode) {
    this.gameMode = mode;
  }

  isTimedMode() {
    return this.gameMode === 'timed';
  }

  setItemManager(itemManager) {
    this.itemManager = itemManager;
  }

  setCoinManager(coinManager) {
    this.coinManager = coinManager;
  }

  setRewardManager(rewardManager) {
    this.rewardManager = rewardManager;
  }

  addTime(seconds) {
    this.timeLeft += seconds;
  }

  useHint() {
    if (this.gameState !== 'playing') return false;
    if (this.currentNumber > this.totalNumbers) return false;

    // 如果已有提示高亮的目标，不消耗提示次数
    if (this.hintedPolygon) {
      // 已有提示，检查目标是否仍是当前数字
      if (this.hintedPolygon.number === this.currentNumber && !this.hintedPolygon.isClicked) {
        // 目标未变，不消耗提示
        return true;
      }
      // 目标已失效，清除旧提示
      this.clearHint();
    }

    if (!this.itemManager || !this.itemManager.hasItem('hint', 1)) return false;

    const targetPolygon = this.polygons.find(p => p.number === this.currentNumber && !p.isClicked);
    if (!targetPolygon) return false;

    this.itemManager.useItem('hint', 1);
    this.hintCount = this.itemManager.getItemCount('hint');
    this.hintedPolygon = targetPolygon;
    targetPolygon.setHintHighlight(true);

    if (this.onHintUsed) {
      this.onHintUsed(this.hintCount);
    }

    return true;
  }

  clearHint() {
    if (this.hintedPolygon) {
      this.hintedPolygon.setHintHighlight(false);
      this.hintedPolygon = null;
    }
  }

  getHintCount() {
    return this.hintCount;
  }
}
