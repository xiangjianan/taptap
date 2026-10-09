import { COLORS, getColorScheme, BRUTALISM_STYLES } from './constants/colors';
import { SAFE_AREA } from './render';
import TapEffects from './tapEffects.js';
import { prefersReducedMotion } from './visualTheme.js';

export default class UI {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.safeArea = SAFE_AREA || { top: 0, bottom: 0, left: 0, right: 0 };
    this.buttons = [];
    this.showInstructions = false;
    this.showCompletion = false;
    this.completionTime = 0;
    this.currentLevel = 1;
    this.totalLevels = 2;
    this.levelConfig = {
      1: { count: 10, name: '第一关' },
      2: { count: 100, name: '第二关' }
    };
    
    this.showModal = false;
    this.modalType = null;
    this.modalTitle = '';
    this.modalMessage = '';
    this.modalButtons = [];
    this.modalAnimation = 0;
    this.modalTargetAnimation = 1;
    this.modalSoundPlayed = false;
    
    this.mouseX = 0;
    this.mouseY = 0;
    this.hoveredButton = null;
    this.clickedButton = null;
    this.clickAnimation = 0;
    this.onPlayClickSound = null;
    
    this.floatingTexts = [];
    this.tapFeedback = new TapEffects();
    this.feedbackPoint = null;
    this.feedbackTriggered = false;
    this.homePress = null;
    this.coinFlyAnimations = [];
    this.coinBoxBounce = 0;
    this.flashAlpha = 0;
    this.flashTargetAlpha = 0;
    this.milestoneFlash = null;
    this.shakeOffset = { x: 0, y: 0 };
    this.shakeTime = 0;

    this.eggTriggered = false;
    this.eggTriggerTime = 0;
    this.eggTriggerDuration = 5.0;
    this.eggCloseButton = null;

    this.gameState = 'menu';

    this.menuAnimation = 0;
    this.menuTargetAnimation = 1;
    this.particleOffset = 0;
    
    this.gameMode = 'timed';
    this.showModeSelector = false;
    this.instructionsData = null;
    this.headerButtons = null;
    this.onShare = null;

    this.modeSwitcher = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      animation: 0,
      targetAnimation: 1,
      hoveredSegment: null,
      clickedSegment: null
    };
    
    this.achievementNotifications = [];
    this.achievementNotificationDuration = 3000;
    
    // 奖励通知
    this.rewardNotifications = [];
    this.rewardNotificationDuration = 2000;
    
    this.showAchievements = false;
    this.achievementsData = null;
    this.achievementScrollOffset = 0;
    this.touchStartY = 0;
    this.lastTouchY = 0;
    this.isTouching = false;
    
    this.scrollVelocity = 0;
    this.scrollFriction = 0.95;
    this.scrollMinVelocity = 0.5;
    this.lastScrollDelta = 0;
    this.lastScrollTime = 0;
    
    this.comboData = {
      count: 0,
      level: null,
      animation: 0,
      scale: 1,
      glowIntensity: 0,
      breakAnimation: 0
    };
    this.comboParticles = [];
    
    this.hintCount = 0;
    this.onUseHint = null;
    this.hintButtonAnimation = 0;
    
    this.showSkills = false;
    this.skillsData = null;
    this.onOpenSkills = null;
    this.skillScrollOffset = 0;
    this.skillTouchStartY = 0;
    this.skillLastTouchY = 0;
    this.skillIsTouching = false;
    this.skillScrollVelocity = 0;
    this.skillScrollFriction = 0.95;
    this.skillScrollMinVelocity = 0.5;
    this.skillLastScrollDelta = 0;
    this.skillLastScrollTime = 0;
    
    this.coins = 0;
    this.onOpenShop = null;
    this.onTogglePause = null;
    this.isPaused = false;
    
    this.showShop = false;
    this.shopScrollOffset = 0;
    this.shopTouchStartY = 0;
    this.shopLastTouchY = 0;
    this.shopIsTouching = false;
    this.shopScrollVelocity = 0;
    this.shopScrollFriction = 0.95;
    this.shopScrollMinVelocity = 0.5;
    this.shopLastScrollDelta = 0;
    this.shopLastScrollTime = 0;
    this.shopProducts = null;

    this.shimmerTime = 0;

    // Score history
    this.showScoreHistory = false;
    this.scoreHistoryData = { 1: [], 2: [] };
    this.scoreHistoryTab = 1;
    this.scoreHistoryScrollOffset = 0;
    this.scoreHistoryTouchStartY = 0;
    this.scoreHistoryLastTouchY = 0;
    this.scoreHistoryIsTouching = false;
    this.scoreHistoryScrollVelocity = 0;
    this.scoreHistoryLastScrollDelta = 0;
    this.scoreHistoryLastScrollTime = 0;
    this.onOpenScoreHistory = null;

    // High score celebration
    this.highScoreCelebration = null;

    // Dynamic background state
    this.bgPhase = 0;
    this.reducedMotion = prefersReducedMotion();
    this.bgParticles = [];
    this.bgComboIntensity = 0;
  }

  getScheme() {
    return getColorScheme();
  }

  roundRect(ctx, x, y, width, height, radius) {
    if (radius === 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.closePath();
    } else {
      ctx.beginPath();
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
  }

  drawBrutalismRect(ctx, x, y, width, height, fillColor, options = {}) {
    const scheme = this.getScheme();
    const radius = options.radius !== undefined ? options.radius : 18;

    if (options.shadowOffset > 0) {
      ctx.shadowColor = scheme.shadow;
      ctx.shadowBlur = options.shadowOffset * 2;
      ctx.shadowOffsetY = options.shadowOffset;
    }

    ctx.fillStyle = fillColor;
    this.roundRect(ctx, x, y, width, height, radius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = 'transparent';

    if (options.borderWidth > 0) {
      ctx.strokeStyle = scheme.glassBorder;
      ctx.lineWidth = options.borderWidth;
      this.roundRect(ctx, x, y, width, height, radius);
      ctx.stroke();
    }
  }

  drawBrutalismButton(ctx, button, isHovered, isClicked, alpha = 1) {
    if (button.type === 'card') {
      this.drawCardButton(ctx, button, isHovered, isClicked, alpha);
    } else {
      this.drawPrimaryButton(ctx, button, isHovered, isClicked, alpha);
    }
  }

  drawPrimaryButton(ctx, button, isHovered, isClicked, alpha = 1) {
    const isMobile = this.width < 768;

    let scale = 1;
    if (isClicked) scale = 0.97;
    else if (isHovered) scale = 1.01;

    scale = this.tapFeedback.getButtonScale(button.id) ?? scale;

    const centerX = button.x + button.width / 2;
    const centerY = button.y + button.height / 2;
    const scaledWidth = button.width * scale;
    const scaledHeight = button.height * scale;
    const scaledX = centerX - scaledWidth / 2;
    const scaledY = centerY - scaledHeight / 2;
    const radius = 28;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Vibrant glow shadow
    ctx.shadowColor = isHovered ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.25)';
    ctx.shadowBlur = isHovered ? 32 : 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = isHovered ? 8 : 4;

    // Vibrant gradient
    const gradient = ctx.createLinearGradient(scaledX, scaledY, scaledX + scaledWidth, scaledY + scaledHeight);
    gradient.addColorStop(0, button.color || '#F97316');
    gradient.addColorStop(1, button.colorEnd || '#60A5FA');
    ctx.fillStyle = gradient;
    this.roundRect(ctx, scaledX, scaledY, scaledWidth, scaledHeight, radius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowColor = 'transparent';

    // Top gloss (clipped to rounded shape)
    ctx.save();
    this.roundRect(ctx, scaledX, scaledY, scaledWidth, scaledHeight, radius);
    ctx.clip();
    const shineGradient = ctx.createLinearGradient(scaledX, scaledY, scaledX, scaledY + scaledHeight * 0.5);
    shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
    shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shineGradient;
    ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight * 0.55);

    // Bottom edge glow
    const bottomShine = ctx.createLinearGradient(scaledX, scaledY + scaledHeight * 0.7, scaledX, scaledY + scaledHeight);
    bottomShine.addColorStop(0, 'rgba(255, 255, 255, 0)');
    bottomShine.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    ctx.fillStyle = bottomShine;
    ctx.fillRect(scaledX, scaledY + scaledHeight * 0.7, scaledWidth, scaledHeight * 0.3);
    ctx.restore();

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${isMobile ? 18 : 20}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (button.icon === 'play') {
      const textWidth = ctx.measureText(button.text).width;
      const textX = centerX - 12;
      const iconX = centerX + textWidth / 2 + 10;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1;

      ctx.fillText(button.text, textX, centerY);

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowColor = 'transparent';

      ctx.beginPath();
      ctx.moveTo(iconX, centerY - 8);
      ctx.lineTo(iconX + 13, centerY);
      ctx.lineTo(iconX, centerY + 8);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
    } else {
      ctx.fillText(button.text, centerX, centerY);
    }

    ctx.restore();
  }

  drawCardButton(ctx, button, isHovered, isClicked, alpha = 1) {
    const isMobile = this.width < 768;
    const isWideCard = button.width > button.height * 2;

    let scale = 1;
    if (isClicked) scale = 0.97;
    else if (isHovered) scale = 1.02;

    scale = this.tapFeedback.getButtonScale(button.id) ?? scale;
    const scaledWidth = button.width * scale;
    const scaledHeight = button.height * scale;
    const scaledX = button.x + (button.width - scaledWidth) / 2;
    const scaledY = button.y + (button.height - scaledHeight) / 2;
    const radius = 26;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Card shadow with theme-colored glow on hover
    if (isHovered) {
      ctx.shadowColor = button.cardHoverGlow || 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
    }

    // Card background
    ctx.fillStyle = button.cardBg || 'rgba(255, 255, 255, 0.9)';
    this.roundRect(ctx, scaledX, scaledY, scaledWidth, scaledHeight, radius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = 'transparent';

    // Gloss effect - subtle top shine (clipped to rounded shape)
    ctx.save();
    this.roundRect(ctx, scaledX, scaledY, scaledWidth, scaledHeight, radius);
    ctx.clip();
    const cardShine = ctx.createLinearGradient(scaledX, scaledY, scaledX, scaledY + scaledHeight * 0.4);
    cardShine.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    cardShine.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    cardShine.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = cardShine;
    ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight * 0.4);
    ctx.restore();

    // Colored border
    ctx.strokeStyle = button.cardBorder || 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, scaledX, scaledY, scaledWidth, scaledHeight, radius);
    ctx.stroke();

    // Wide card: horizontal layout (icon left, text center)
    if (isWideCard) {
      const iconSize = isMobile ? 32 : 36;
      const iconX = scaledX + (isMobile ? 14 : 18);
      const iconY = scaledY + (scaledHeight - iconSize) / 2;

      ctx.fillStyle = button.iconBg || '#FFF3E8';
      this.roundRect(ctx, iconX, iconY, iconSize, iconSize, iconSize / 2);
      ctx.fill();

      ctx.fillStyle = button.iconColor || '#3B82F6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const iconCenterX = iconX + iconSize / 2;
      const iconCenterY = iconY + iconSize / 2;

      this._drawIcon(ctx, button.icon, iconCenterX, iconCenterY, isMobile, button.iconColor);

      ctx.fillStyle = '#374151';
      ctx.font = `600 ${isMobile ? 15 : 17}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(button.text, scaledX + scaledWidth / 2 + iconSize / 4, scaledY + scaledHeight / 2);

      ctx.restore();
      return;
    }

    // Square card: vertical layout (icon top, text bottom)
    const iconSize = isMobile ? 40 : 48;
    const iconX = scaledX + (scaledWidth - iconSize) / 2;
    const iconY = scaledY + (isMobile ? 16 : 18);

    ctx.fillStyle = button.iconBg || '#FFF3E8';
    this.roundRect(ctx, iconX, iconY, iconSize, iconSize, iconSize / 2);
    ctx.fill();

    // Draw icon
    ctx.fillStyle = button.iconColor || '#3B82F6';
    ctx.font = `bold ${isMobile ? 20 : 24}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const iconCenterX = iconX + iconSize / 2;
    const iconCenterY = iconY + iconSize / 2;

    this._drawIcon(ctx, button.icon, iconCenterX, iconCenterY, isMobile, button.iconColor);

    // Title - centered below icon (square card vertical layout)
    const textY = iconY + iconSize + (isMobile ? 14 : 16);
    ctx.fillStyle = '#374151';
    ctx.font = `600 ${isMobile ? 14 : 16}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(button.text, scaledX + scaledWidth / 2, textY);

    // Subtitle - centered below title
    if (button.subtitle) {
      ctx.fillStyle = '#6B7280';
      ctx.font = `${isMobile ? 11 : 12}px Arial, sans-serif`;
      ctx.fillText(button.subtitle, scaledX + scaledWidth / 2, textY + (isMobile ? 16 : 18));
    }

    ctx.restore();
  }

  _drawIcon(ctx, icon, iconCenterX, iconCenterY, isMobile, iconColor) {
    const s = isMobile ? 10 : 12;
    ctx.lineWidth = isMobile ? 1.5 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (icon === 'book') {
      ctx.strokeStyle = iconColor || '#3B82F6';
      // 左页
      ctx.beginPath();
      ctx.moveTo(iconCenterX, iconCenterY - s * 0.8);
      ctx.quadraticCurveTo(iconCenterX - s * 0.2, iconCenterY - s * 0.6, iconCenterX - s, iconCenterY - s * 0.5);
      ctx.lineTo(iconCenterX - s, iconCenterY + s * 0.7);
      ctx.quadraticCurveTo(iconCenterX - s * 0.2, iconCenterY + s * 0.5, iconCenterX, iconCenterY + s * 0.8);
      ctx.stroke();
      // 右页
      ctx.beginPath();
      ctx.moveTo(iconCenterX, iconCenterY - s * 0.8);
      ctx.quadraticCurveTo(iconCenterX + s * 0.2, iconCenterY - s * 0.6, iconCenterX + s, iconCenterY - s * 0.5);
      ctx.lineTo(iconCenterX + s, iconCenterY + s * 0.7);
      ctx.quadraticCurveTo(iconCenterX + s * 0.2, iconCenterY + s * 0.5, iconCenterX, iconCenterY + s * 0.8);
      ctx.stroke();
      // 中线
      ctx.beginPath();
      ctx.moveTo(iconCenterX, iconCenterY - s * 0.8);
      ctx.lineTo(iconCenterX, iconCenterY + s * 0.8);
      ctx.stroke();
    } else if (icon === 'cart') {
      ctx.strokeStyle = iconColor || '#FBBF24';
      // 袋身
      ctx.beginPath();
      ctx.moveTo(iconCenterX - s * 0.7, iconCenterY - s * 0.1);
      ctx.quadraticCurveTo(iconCenterX - s * 0.7, iconCenterY + s, iconCenterX, iconCenterY + s);
      ctx.quadraticCurveTo(iconCenterX + s * 0.7, iconCenterY + s, iconCenterX + s * 0.7, iconCenterY - s * 0.1);
      ctx.lineTo(iconCenterX + s * 0.5, iconCenterY - s * 0.1);
      ctx.lineTo(iconCenterX - s * 0.5, iconCenterY - s * 0.1);
      ctx.closePath();
      ctx.stroke();
      // 提手
      ctx.beginPath();
      ctx.arc(iconCenterX, iconCenterY - s * 0.35, s * 0.4, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else if (icon === 'lightning') {
      ctx.strokeStyle = iconColor || '#FBBF24';
      ctx.beginPath();
      ctx.moveTo(iconCenterX + s * 0.1, iconCenterY - s);
      ctx.lineTo(iconCenterX - s * 0.3, iconCenterY - s * 0.05);
      ctx.lineTo(iconCenterX + s * 0.15, iconCenterY + s * 0.05);
      ctx.lineTo(iconCenterX - s * 0.1, iconCenterY + s);
      ctx.lineTo(iconCenterX + s * 0.35, iconCenterY - s * 0.05);
      ctx.lineTo(iconCenterX - s * 0.1, iconCenterY + s * 0.05);
      ctx.stroke();
    } else if (icon === 'trophy') {
      ctx.strokeStyle = iconColor || '#3B82F6';
      // 杯身
      ctx.beginPath();
      ctx.moveTo(iconCenterX - s * 0.55, iconCenterY - s * 0.7);
      ctx.lineTo(iconCenterX + s * 0.55, iconCenterY - s * 0.7);
      ctx.lineTo(iconCenterX + s * 0.45, iconCenterY + s * 0.1);
      ctx.quadraticCurveTo(iconCenterX, iconCenterY + s * 0.4, iconCenterX - s * 0.45, iconCenterY + s * 0.1);
      ctx.closePath();
      ctx.stroke();
      // 左手柄
      ctx.beginPath();
      ctx.moveTo(iconCenterX - s * 0.55, iconCenterY - s * 0.55);
      ctx.quadraticCurveTo(iconCenterX - s, iconCenterY - s * 0.3, iconCenterX - s * 0.55, iconCenterY);
      ctx.stroke();
      // 右手柄
      ctx.beginPath();
      ctx.moveTo(iconCenterX + s * 0.55, iconCenterY - s * 0.55);
      ctx.quadraticCurveTo(iconCenterX + s, iconCenterY - s * 0.3, iconCenterX + s * 0.55, iconCenterY);
      ctx.stroke();
      // 底座
      ctx.beginPath();
      ctx.moveTo(iconCenterX - s * 0.15, iconCenterY + s * 0.3);
      ctx.lineTo(iconCenterX + s * 0.15, iconCenterY + s * 0.3);
      ctx.moveTo(iconCenterX, iconCenterY + s * 0.3);
      ctx.lineTo(iconCenterX, iconCenterY + s * 0.55);
      ctx.moveTo(iconCenterX - s * 0.35, iconCenterY + s * 0.55);
      ctx.lineTo(iconCenterX + s * 0.35, iconCenterY + s * 0.55);
      ctx.stroke();
      // 星星装饰
      ctx.beginPath();
      ctx.arc(iconCenterX, iconCenterY - s * 0.25, s * 0.12, 0, Math.PI * 2);
      ctx.stroke();
    } else if (icon === 'medal') {
      ctx.strokeStyle = iconColor || '#3B82F6';
      // 奖牌圆形外框
      ctx.beginPath();
      ctx.arc(iconCenterX, iconCenterY - s * 0.05, s * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      // 顶部挂环
      ctx.beginPath();
      ctx.arc(iconCenterX, iconCenterY - s * 0.8, s * 0.18, Math.PI, 0);
      ctx.stroke();
      // 星星装饰
      ctx.beginPath();
      ctx.arc(iconCenterX, iconCenterY - s * 0.05, s * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      // 底部丝带
      ctx.beginPath();
      ctx.moveTo(iconCenterX - s * 0.5, iconCenterY + s * 0.5);
      ctx.lineTo(iconCenterX - s * 0.15, iconCenterY + s * 0.15);
      ctx.lineTo(iconCenterX - s * 0.3, iconCenterY + s * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(iconCenterX + s * 0.5, iconCenterY + s * 0.5);
      ctx.lineTo(iconCenterX + s * 0.15, iconCenterY + s * 0.15);
      ctx.lineTo(iconCenterX + s * 0.3, iconCenterY + s * 0.8);
      ctx.stroke();
    } else if (icon === 'rank') {
      ctx.strokeStyle = iconColor || '#8B5CF6';
      // 皇冠底座弧线
      ctx.beginPath();
      ctx.moveTo(iconCenterX - s * 0.8, iconCenterY + s * 0.4);
      ctx.quadraticCurveTo(iconCenterX, iconCenterY + s * 0.8, iconCenterX + s * 0.8, iconCenterY + s * 0.4);
      ctx.stroke();
      // 皇冠主体
      ctx.beginPath();
      ctx.moveTo(iconCenterX - s * 0.8, iconCenterY + s * 0.4);
      ctx.lineTo(iconCenterX - s * 0.75, iconCenterY - s * 0.15);
      ctx.lineTo(iconCenterX - s * 0.4, iconCenterY + s * 0.15);
      ctx.lineTo(iconCenterX, iconCenterY - s * 0.7);
      ctx.lineTo(iconCenterX + s * 0.4, iconCenterY + s * 0.15);
      ctx.lineTo(iconCenterX + s * 0.75, iconCenterY - s * 0.15);
      ctx.lineTo(iconCenterX + s * 0.8, iconCenterY + s * 0.4);
      ctx.stroke();
      // 三颗宝珠
      ctx.beginPath();
      ctx.arc(iconCenterX - s * 0.75, iconCenterY - s * 0.15, s * 0.08, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(iconCenterX, iconCenterY - s * 0.7, s * 0.08, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(iconCenterX + s * 0.75, iconCenterY - s * 0.15, s * 0.08, 0, Math.PI * 2);
      ctx.stroke();
    } else if (icon === 'star') {
      ctx.strokeStyle = iconColor || '#8B5CF6';
      // 五角星
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI / 5);
        const outerX = iconCenterX + Math.cos(angle) * s * 0.8;
        const outerY = iconCenterY + Math.sin(angle) * s * 0.8;
        if (i === 0) {
          ctx.moveTo(outerX, outerY);
        } else {
          ctx.lineTo(outerX, outerY);
        }
        const innerAngle = angle + Math.PI / 5;
        const innerX = iconCenterX + Math.cos(innerAngle) * s * 0.35;
        const innerY = iconCenterY + Math.sin(innerAngle) * s * 0.35;
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (icon === 'share') {
      ctx.strokeStyle = iconColor || '#3B82F6';
      // 三个节点
      ctx.beginPath();
      ctx.arc(iconCenterX - s * 0.55, iconCenterY + s * 0.3, s * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(iconCenterX + s * 0.4, iconCenterY - s * 0.5, s * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(iconCenterX + s * 0.4, iconCenterY + s * 0.3, s * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      // 连线
      ctx.beginPath();
      ctx.moveTo(iconCenterX - s * 0.38, iconCenterY + s * 0.2);
      ctx.lineTo(iconCenterX + s * 0.24, iconCenterY - s * 0.38);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(iconCenterX - s * 0.38, iconCenterY + s * 0.35);
      ctx.lineTo(iconCenterX + s * 0.24, iconCenterY + s * 0.28);
      ctx.stroke();
    }
  }

  darkenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.floor(255 * amount));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.floor(255 * amount));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.floor(255 * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  drawModeSwitcher(ctx, x, y, width, height) {
    const scheme = this.getScheme();
    const isMobile = this.width < 768;

    this.modeSwitcher.x = x;
    this.modeSwitcher.y = y;
    this.modeSwitcher.width = width;
    this.modeSwitcher.height = height;

    const segmentWidth = width / 2;
    const radius = height / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, x, y, width, height, radius);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, width, height, radius);
    ctx.stroke();

    const isTimedActive = this.gameMode === 'timed';
    const isTimedClicked = this.modeSwitcher.clickedSegment === 'timed';
    const isUntimedClicked = this.modeSwitcher.clickedSegment === 'untimed';

    const activeX = isTimedActive ? x : x + segmentWidth;
    let offsetX = 0;
    let offsetY = 0;
    if ((isTimedActive && isTimedClicked) || (!isTimedActive && isUntimedClicked)) {
      offsetX = 1;
      offsetY = 1;
    }

    ctx.save();
    ctx.shadowColor = isTimedActive ? 'rgba(59, 130, 246, 0.18)' : 'rgba(16, 185, 129, 0.18)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;

    const activeGradient = ctx.createLinearGradient(activeX, y, activeX + segmentWidth, y + height);
    if (isTimedActive) {
      activeGradient.addColorStop(0, '#F97316');
      activeGradient.addColorStop(1, '#FB923C');
    } else {
      activeGradient.addColorStop(0, '#10B981');
      activeGradient.addColorStop(1, '#34D399');
    }
    ctx.fillStyle = activeGradient;
    this.roundRect(ctx, activeX + 3 + offsetX, y + 3 + offsetY, segmentWidth - 6, height - 6, radius - 3);
    ctx.fill();
    ctx.restore();

    const fontSize = isMobile ? 13 : 15;
    ctx.font = `600 ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = isTimedActive ? '#FFFFFF' : '#6B7280';
    ctx.fillText('限时模式', x + segmentWidth / 2, y + height / 2);

    ctx.fillStyle = !isTimedActive ? '#FFFFFF' : '#6B7280';
    ctx.fillText('自由模式', x + segmentWidth + segmentWidth / 2, y + height / 2);
  }

  isPointInModeSwitcher(x, y) {
    const ms = this.modeSwitcher;
    if (ms.width === 0) return null;
    
    if (x >= ms.x && x <= ms.x + ms.width && y >= ms.y && y <= ms.y + ms.height) {
      const segmentWidth = ms.width / 2;
      if (x < ms.x + segmentWidth) {
        return 'timed';
      } else {
        return 'untimed';
      }
    }
    return null;
  }

  handleModeSwitcherClick(x, y) {
    const segment = this.isPointInModeSwitcher(x, y);
    if (segment && segment === this.gameMode) {
      this.playClickFeedback();
      return true;
    }
    if (segment && segment !== this.gameMode) {
      this.modeSwitcher.clickedSegment = segment;
      this.playClickFeedback();
      setTimeout(() => {
        this.modeSwitcher.clickedSegment = null;
        this.onSelectMode(segment);
      }, 100);
      return true;
    }
    return false;
  }

  updateModeSwitcherHover(x, y) {
    this.modeSwitcher.hoveredSegment = this.isPointInModeSwitcher(x, y);
  }

  showFloatingText(x, y, text, color, source = null) {
    // Tap feedback stays compact and bounded during fast play.
    if (source === 'tap') {
      const tapTexts = this.floatingTexts.filter(ft => ft.source === 'tap');
      if (tapTexts.length >= 6) {
        this.floatingTexts.splice(this.floatingTexts.indexOf(tapTexts[0]), 1);
      }
    }
    this.floatingTexts.push({
      x, y, text, color,
      alpha: 1,
      offsetY: 0,
      life: 1.0,
      source
    });
  }

  triggerFlash() {
    this.flashAlpha = 0.5;
  }

  triggerShake() {
    this.shakeTime = 0;
    this.shakeOffset = { x: 0, y: 0 };
  }

  triggerEggEffect() {
    this.eggTriggered = true;
    this.eggTriggerTime = 0;
  }

  showAchievementNotification(achievements) {
    if (!achievements) return;
    for (const achievement of achievements) {
      this.achievementNotifications.push({ achievement, age: 0, animation: 0 });
    }
  }

  hasForegroundPanel() {
    return this.showShop || this.showSkills || this.showAchievements || this.showScoreHistory || this.showInstructions || this.showModal;
  }

  updateAchievementNotifications(deltaTime) {
    const notification = this.achievementNotifications[0];
    // Keep celebrations queued while players are finding numbers or reading panels.
    if (!notification || this.gameState === 'playing' || this.hasForegroundPanel()) return;
    notification.age += deltaTime;
    const duration = this.achievementNotificationDuration / 1000;
    notification.animation = Math.max(0, Math.min(1, notification.age / 0.18, (duration - notification.age) / 0.18));
    if (notification.age >= duration) this.achievementNotifications.shift();
  }

  renderAchievementNotifications(ctx) {
    if (this.gameState === 'playing' || this.hasForegroundPanel()) return;
    const scheme = this.getScheme();
    const isMobile = this.width < 768;
    
    for (const notification of this.achievementNotifications) {
      if (notification.animation <= 0) continue;
      
      const achievement = notification.achievement;
      const alpha = notification.animation;
      
      const notificationWidth = isMobile ? 280 : 320;
      const notificationHeight = isMobile ? 80 : 90;
      const notificationX = (this.width - notificationWidth) / 2;
      const notificationY = isMobile ? 100 : 120;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      const slideOffset = (1 - notification.animation) * 50;
      const actualY = notificationY - slideOffset;
      
      this.drawBrutalismRect(ctx, notificationX, actualY, notificationWidth, notificationHeight, scheme.buttonSuccess, {
        shadowOffset: 8,
        borderWidth: 1
      });
      
      ctx.fillStyle = scheme.textLight;
      ctx.font = `bold ${isMobile ? 14 : 16}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('成就解锁!', this.width / 2, actualY + (isMobile ? 20 : 25));
      
      ctx.font = `bold ${isMobile ? 28 : 32}px Arial, sans-serif`;
      ctx.fillText(achievement.icon, this.width / 2, actualY + (isMobile ? 50 : 55));
      
      ctx.font = `bold ${isMobile ? 16 : 18}px "Arial Black", Arial, sans-serif`;
      ctx.fillText(achievement.name, this.width / 2, actualY + notificationHeight - (isMobile ? 15 : 18));
      
      ctx.restore();
    }
  }

  showRewardNotification(reward) {
    if (!reward) return;
    
    this.rewardNotifications.push({
      reward,
      startTime: Date.now(),
      animation: 0,
      targetAnimation: 1,
      offsetY: 0
    });
  }

  updateRewardNotifications(deltaTime) {
    const now = Date.now();
    
    for (let i = this.rewardNotifications.length - 1; i >= 0; i--) {
      const notification = this.rewardNotifications[i];
      const elapsed = now - notification.startTime;
      
      // 入场动画
      if (elapsed < 200) {
        notification.animation = Math.min(1, notification.animation + deltaTime * 8);
      } else if (elapsed > this.rewardNotificationDuration - 300) {
        notification.animation = Math.max(0, notification.animation - deltaTime * 5);
      }
      
      // 向上飘动
      notification.offsetY -= deltaTime * 50;
      
      if (elapsed > this.rewardNotificationDuration) {
        this.rewardNotifications.splice(i, 1);
      }
    }
  }

  renderRewardNotifications(ctx) {
    const scheme = this.getScheme();
    const isMobile = this.width < 768;
    const headerHeight = isMobile ? Math.max(100, Math.max(this.safeArea.top, 44) + 56) : 120;

    for (const notification of this.rewardNotifications) {
      if (notification.animation <= 0) continue;

      const reward = notification.reward;
      const alpha = notification.animation;

      // 初始位置在顶部标题栏下方，向上飘出屏幕
      const baseY = headerHeight + 8;
      const notificationY = baseY + notification.offsetY;

      ctx.save();
      ctx.globalAlpha = alpha * 0.75;

      // 绘制奖励背景（紧凑尺寸）
      const notificationWidth = isMobile ? 140 : 170;
      const notificationHeight = isMobile ? 32 : 38;
      const notificationX = (this.width - notificationWidth) / 2;

      // 根据奖励类型选择颜色
      let bgColor = scheme.accent;
      if (reward.type === 'hint') {
        bgColor = '#FBBF24';
      } else if (reward.type === 'coin') {
        bgColor = '#3B82F6';
      } else if (reward.type === 'time') {
        bgColor = '#60A5FA';
      }

      this.drawBrutalismRect(ctx, notificationX, notificationY, notificationWidth, notificationHeight, bgColor, {
        shadowOffset: 4,
        borderWidth: 1
      });

      // 绘制奖励文字
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${isMobile ? 14 : 16}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const text = `${reward.icon} ${reward.name} +${reward.amount}`;
      ctx.fillText(text, this.width / 2, notificationY + notificationHeight / 2);

      ctx.restore();
    }
  }

  updateEffects(deltaTime) {
    this.tapFeedback.update(deltaTime);
    this.shimmerTime += deltaTime;
    this.updateComboEffects(deltaTime);
    this.updateCoinFlyAnimations(deltaTime);
    this.updateMilestoneFlash(deltaTime);
    this.updateScrollInertia(deltaTime);
    this.updateHintButtonAnimation(deltaTime);
    this.updateSkillsScrollInertia(deltaTime);
    this.updateScoreHistoryScrollInertia(deltaTime);
    this.updateEggEffect(deltaTime);
    this.updateRewardNotifications(deltaTime);
    this.updateDynamicBackground(deltaTime);

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= deltaTime * 1.5;
      ft.offsetY -= deltaTime * 100;
      ft.alpha = Math.max(0, ft.life);

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha -= deltaTime * 3;
      if (this.flashAlpha < 0) {
        this.flashAlpha = 0;
      }
    }

    this.shakeTime = 0;
    this.shakeOffset.x = 0;
    this.shakeOffset.y = 0;
  }

  updateEggEffect(deltaTime) {
    if (!this.eggTriggered) return;

    this.eggTriggerTime += deltaTime;
    // 不再自动关闭，等用户点击关闭
  }

  updateDynamicBackground(deltaTime) {
    if (this.reducedMotion) { this.bgParticles = []; return; }
    const comboCount = this.comboData.count || 0;
    const targetIntensity = comboCount >= 15 ? 2 : (comboCount >= 8 ? 1 : 0);

    // Smooth transition
    if (this.bgComboIntensity < targetIntensity) {
      this.bgComboIntensity = Math.min(targetIntensity, this.bgComboIntensity + deltaTime * 3);
    } else if (this.bgComboIntensity > targetIntensity) {
      this.bgComboIntensity = Math.max(targetIntensity, this.bgComboIntensity - deltaTime * 2);
    }

    // Phase offset for flowing gradient
    if (this.bgComboIntensity > 0.5) {
      this.bgPhase += deltaTime * this.bgComboIntensity * 0.8;
    }

    // Background particles for extreme combo
    if (this.bgComboIntensity >= 1.5) {
      // Spawn particles
      const spawnRate = this.bgComboIntensity >= 2 ? 3 : 1;
      for (let i = 0; i < spawnRate; i++) {
        if (this.bgParticles.length < 40 && Math.random() < deltaTime * 10) {
          const comboLevel = this.comboData.level;
          const colors = comboLevel
            ? [comboLevel.color, '#FBBF24', '#3B82F6']
            : ['#FBBF24', '#3B82F6', '#10B981'];
          this.bgParticles.push({
            x: Math.random() * this.width,
            y: this.height + 10,
            vx: (Math.random() - 0.5) * 30,
            vy: -(80 + Math.random() * 120),
            size: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 0.4 + Math.random() * 0.3,
            life: 1
          });
        }
      }
    }

    // Update particles
    for (let i = this.bgParticles.length - 1; i >= 0; i--) {
      const p = this.bgParticles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime * 0.5;
      p.alpha = Math.max(0, p.life * 0.5);

      if (p.life <= 0 || p.y < -20) {
        this.bgParticles.splice(i, 1);
      }
    }
  }

  getBackgroundState() {
    return {
      comboIntensity: this.bgComboIntensity,
      phase: this.bgPhase,
      particles: this.bgParticles,
      comboLevel: this.comboData.level
    };
  }

  renderEffects(ctx) {
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 32px "Arial Black", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ft.text, ft.x, ft.y + ft.offsetY);
      ctx.restore();
    }

    if (this.eggTriggered) {
      this.renderEggEffect(ctx);
    }

    this.renderRewardNotifications(ctx);
  }

  renderEggEffect(ctx) {
    const scheme = this.getScheme();
    const isMobile = this.width < 768;
    const t = this.eggTriggerTime;

    // 仅淡入
    let alpha = Math.min(1, this.eggTriggerTime / 0.3);

    ctx.save();
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 柔和的全屏光晕，使用游戏主题色
    const glowAlpha = alpha * 0.25 * (0.8 + Math.sin(t * 3) * 0.2);
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(this.width, this.height) * 0.6);
    gradient.addColorStop(0, `rgba(99, 102, 241, ${glowAlpha})`);
    gradient.addColorStop(0.4, `rgba(139, 92, 246, ${glowAlpha * 0.5})`);
    gradient.addColorStop(1, `rgba(99, 102, 241, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // 环绕粒子：从中心向外扩散，使用主题色
    const particleCount = 16;
    for (let i = 0; i < particleCount; i++) {
      const baseAngle = (i / particleCount) * Math.PI * 2;
      const angle = baseAngle + t * 0.8;
      const expandPhase = Math.min(1, this.eggTriggerTime / 0.3);
      const radius = 30 + expandPhase * (60 + i * 3) + Math.sin(t * 2 + i) * 15;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const size = (2 + Math.sin(t * 4 + i * 1.5) * 1) * alpha;
      const particleAlpha = alpha * (0.5 + Math.sin(t * 3 + i) * 0.3);

      ctx.globalAlpha = particleAlpha;
      ctx.fillStyle = i % 3 === 0 ? scheme.accent : (i % 3 === 1 ? scheme.secondary : scheme.primary);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2);
      ctx.fill();
    }

    // 中央卡片式提示
    ctx.globalAlpha = alpha;
    const cardWidth = isMobile ? 260 : 320;
    const cardHeight = isMobile ? 170 : 190;
    const cardX = centerX - cardWidth / 2;
    const cardY = centerY - cardHeight / 2;

    // 卡片背景
    this.drawBrutalismRect(ctx, cardX, cardY, cardWidth, cardHeight, scheme.cardBg, {
      shadowOffset: 6,
      borderWidth: 3
    });

    // 顶部彩色条
    const barColors = [scheme.primary, scheme.secondary, scheme.accent];
    const barWidth = cardWidth / 3;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = barColors[i];
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillRect(cardX + 3 + i * barWidth, cardY + 3, barWidth, 4);
    }

    ctx.globalAlpha = alpha;

    // 标题
    ctx.fillStyle = scheme.primary;
    ctx.font = `bold ${isMobile ? 16 : 20}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('你发现了隐藏彩蛋！', centerX, cardY + cardHeight * 0.16);

    // 正文
    ctx.fillStyle = scheme.text;
    ctx.font = `${isMobile ? 11 : 13}px Arial, sans-serif`;
    ctx.fillText('感谢你花时间游玩这个小游戏', centerX, cardY + cardHeight * 0.34);

    // 开发者署名
    ctx.fillStyle = scheme.textSecondary;
    ctx.font = `${isMobile ? 10 : 12}px Arial, sans-serif`;
    ctx.fillText('—— xiangjianan', centerX, cardY + cardHeight * 0.50);

    // 奖励
    ctx.fillStyle = scheme.buttonSuccess;
    ctx.font = `bold ${isMobile ? 14 : 18}px "Arial Black", Arial, sans-serif`;
    ctx.fillText('+10,000 coins', centerX, cardY + cardHeight * 0.65);

    // 关闭按钮
    const closeBtnWidth = isMobile ? 120 : 140;
    const closeBtnHeight = isMobile ? 32 : 36;
    const closeBtnX = centerX - closeBtnWidth / 2;
    const closeBtnY = cardY + cardHeight - closeBtnHeight - 12;
    this.drawBrutalismRect(ctx, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, scheme.primary, {
      shadowOffset: 3,
      borderWidth: 2
    });
    this.eggCloseButton = { x: closeBtnX, y: closeBtnY, width: closeBtnWidth, height: closeBtnHeight };
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${isMobile ? 13 : 15}px Arial, sans-serif`;
    ctx.fillText('我知道了', centerX, closeBtnY + closeBtnHeight / 2);

    ctx.restore();
  }

  initMenu() {
    this.cancelHomePress();
    this.floatingTexts = this.floatingTexts.filter(text => text.source !== 'tap');
    this.isPaused = false;
    this.comboParticles = [];
    this.bgComboIntensity = 0;
    this.bgParticles = [];
    this.showCompletion = false;
    this.showFailure = false;
    this.showModal = false;
    this.modalAnimation = 0;
    this.modalTargetAnimation = 0;
    this.menuAnimation = 0;
    this.menuTargetAnimation = 1;
    this.showAchievements = false;
    this.showShop = false;
    this.showSkills = false;
    this.showScoreHistory = false;

    this.buttons = this._buildMenuButtons();
  }

  _buildMenuButtons() {
    const isMobile = this.width < 768;
    const margin = isMobile ? 24 : 48;

    // 开始游戏按钮 - 全宽大按钮，更高更醒目
    const startButtonWidth = this.width - margin * 2;
    const startButtonHeight = isMobile ? 58 : 66;

    // 功能卡片网格 - 2x2布局
    const cardGap = isMobile ? 12 : 14;
    const cardWidth = (this.width - margin * 2 - cardGap) / 2;
    const cardHeight = isMobile ? 100 : 110;

    // 计算模式切换器底部位置（与renderMenu中的计算一致）
    const titleY = isMobile ? this.height * 0.2 : this.height * 0.18;
    const sloganY = titleY + (isMobile ? 85 : 108);
    const switcherHeight = isMobile ? 42 : 48;
    const switcherOffset = isMobile ? 16 : 20;
    const switcherBottom = sloganY + (isMobile ? 50 : 56) + switcherOffset + switcherHeight;

    // 卡片区域保持原位（基于0.48起始）
    const origStartY = this.height * 0.48;
    const cardRow1Y = origStartY + startButtonHeight + 18;

    // 开始按钮到模式切换器和到游戏规则的距离相等
    const gap = (cardRow1Y - switcherBottom - startButtonHeight) / 2;
    const startY = switcherBottom + gap;

    const cardRow2Y = cardRow1Y + cardHeight + cardGap;

    const buttons = [
      // 开始游戏 - 渐变色醒目按钮
      {
        id: 'start',
        text: '开始游戏',
        type: 'primary',
        x: margin,
        y: startY,
        width: startButtonWidth,
        height: startButtonHeight,
        color: '#F97316',
        colorEnd: '#FB923C',
        glowColor: 'rgba(249, 115, 22, 0.35)',
        icon: 'play',
        action: () => this.onStartGame()
      },
      // 游戏规则 - 琥珀色卡片
      {
        id: 'instructions',
        text: '游戏规则',
        type: 'card',
        x: margin,
        y: cardRow1Y,
        width: cardWidth,
        height: cardHeight,
        icon: 'book',
        iconBg: '#EBF3FC',
        iconColor: '#3B82F6',
        cardBg: 'rgba(255, 255, 255, 0.95)',
        cardBorder: 'rgba(59, 130, 246, 0.18)',
        cardHoverGlow: 'rgba(59, 130, 246, 0.12)',
        action: () => this.onShowInstructions()
      },
      // 技能 - 薄荷卡片（合并原商店内容）
      {
        id: 'skills',
        text: '技能',
        type: 'card',
        x: margin + cardWidth + cardGap,
        y: cardRow1Y,
        width: cardWidth,
        height: cardHeight,
        icon: 'lightning',
        iconBg: '#ECFDF5',
        iconColor: '#10B981',
        cardBg: 'rgba(255, 255, 255, 0.95)',
        cardBorder: 'rgba(16, 185, 129, 0.2)',
        cardHoverGlow: 'rgba(16, 185, 129, 0.12)',
        action: () => this.onOpenSkills()
      },
      // 历史最高分 - 紫色卡片
      {
        id: 'scoreHistory',
        text: '历史最高分',
        type: 'card',
        x: margin,
        y: cardRow2Y,
        width: cardWidth,
        height: cardHeight,
        icon: 'star',
        iconBg: '#F3E8FF',
        iconColor: '#8B5CF6',
        cardBg: 'rgba(255, 255, 255, 0.95)',
        cardBorder: 'rgba(139, 92, 246, 0.2)',
        cardHoverGlow: 'rgba(139, 92, 246, 0.12)',
        action: () => this.onOpenScoreHistory()
      },
      // 成就 - 珊瑚卡片
      {
        id: 'achievements',
        text: '成就',
        type: 'card',
        x: margin + cardWidth + cardGap,
        y: cardRow2Y,
        width: cardWidth,
        height: cardHeight,
        icon: 'trophy',
        iconBg: '#FDECE8',
        iconColor: '#EF4444',
        cardBg: 'rgba(255, 255, 255, 0.95)',
        cardBorder: 'rgba(232, 114, 90, 0.2)',
        cardHoverGlow: 'rgba(232, 114, 90, 0.12)',
        action: () => this.onOpenAchievements()
      }
    ];

    return buttons;
  }

  lightenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.floor(255 * amount));
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.floor(255 * amount));
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.floor(255 * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  initGame() {
    this.cancelHomePress();
    this.isPaused = false;
    this.bgComboIntensity = 0;
    this.bgParticles = [];
    this.showCompletion = false;
    this.showFailure = false;
    this.buttons = [];
    this.modeSwitcher.x = 0;
    this.modeSwitcher.y = 0;
    this.modeSwitcher.width = 0;
    this.modeSwitcher.height = 0;
    this.hintButtonAnimation = 0;
    this.comboData = {
      count: 0,
      level: null,
      animation: 0,
      scale: 1,
      glowIntensity: 0,
      breakAnimation: 0
    };
    this.comboParticles = [];
  }

  initCompletion(time) {
    this.showCompletion = true;
    this.completionTime = time;
    this.showFailure = false;
    
    const isMobile = this.width < 768;
    const hasNextLevel = this.currentLevel < this.totalLevels;
    const buttonWidth = isMobile ? 120 : 140;
    const buttonHeight = isMobile ? 50 : 60;
    const buttonSpacing = isMobile ? 16 : 20;
    
    let buttonCount = hasNextLevel ? 3 : 2;
    const totalWidth = buttonWidth * buttonCount + buttonSpacing * (buttonCount - 1);
    const startX = (this.width - totalWidth) / 2;
    const buttonY = this.height / 2 + 80;
    
    this.buttons = [
      {
        id: 'playAgain',
        text: '再来',
        x: startX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        color: this.getScheme().buttonPrimary,
        hoverColor: this.lightenColor(this.getScheme().buttonPrimary, 0.15),
        action: () => this.onPlayAgain()
      }
    ];
    
    if (hasNextLevel) {
      this.buttons.push({
        id: 'nextLevel',
        text: '下一关',
        x: startX + buttonWidth + buttonSpacing,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        color: this.getScheme().buttonSuccess,
        hoverColor: this.lightenColor(this.getScheme().buttonSuccess, 0.15),
        action: () => this.onNextLevel()
      });
    }
    
    this.buttons.push({
      id: 'menu',
      text: '菜单',
      x: startX + buttonWidth * (hasNextLevel ? 2 : 1) + buttonSpacing * (hasNextLevel ? 2 : 1),
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      color: this.getScheme().cardBg,
      hoverColor: this.getScheme().accent,
      action: () => this.onBackToMenu()
    });
  }

  shouldAutoAdvance() {
    return this.currentLevel === 1;
  }

  initFailure(progress, total, time) {
    this.showCompletion = true;
    this.showFailure = true;
    this.failureProgress = progress;
    this.failureTotal = total;
    this.failureTime = time;
    
    const isMobile = this.width < 768;
    const buttonWidth = isMobile ? 160 : 180;
    const buttonHeight = isMobile ? 50 : 60;
    const buttonSpacing = isMobile ? 16 : 20;
    
    this.buttons = [
      {
        id: 'tryAgain',
        text: '再试一次',
        x: this.width / 2 - buttonWidth / 2,
        y: this.height / 2 + 50,
        width: buttonWidth,
        height: buttonHeight,
        color: this.getScheme().buttonPrimary,
        hoverColor: this.lightenColor(this.getScheme().buttonPrimary, 0.15),
        action: () => this.onPlayAgain()
      },
      {
        id: 'menu',
        text: '返回菜单',
        x: this.width / 2 - buttonWidth / 2,
        y: this.height / 2 + 50 + buttonHeight + buttonSpacing,
        width: buttonWidth,
        height: buttonHeight,
        color: this.getScheme().cardBg,
        hoverColor: this.getScheme().accent,
        action: () => this.onBackToMenu()
      }
    ];
  }

  beginHomePress(x, y) {
    if (this.gameState !== 'menu' || this.hasForegroundPanel() || this.eggTriggered || this.clickedButton) return false;
    const button = this.buttons.find(button => this.isPointInButton(x, y, button));
    const segment = this.isPointInModeSwitcher(x, y);
    this.homePress = { button, segment };
    this.modeSwitcher.clickedSegment = segment;
    return true;
  }

  releaseHomePress(x, y) {
    if (!this.homePress) return false;
    const { button, segment } = this.homePress;
    this.cancelHomePress();
    if (this.gameState !== 'menu' || this.hasForegroundPanel()) return true;
    if ((button && this.buttons.includes(button) && this.isPointInButton(x, y, button)) ||
        (segment && this.isPointInModeSwitcher(x, y) === segment)) this.handleClick(x, y);
    return true;
  }

  cancelHomePress() {
    this.homePress = null;
    this.modeSwitcher.clickedSegment = null;
  }

  playClickFeedback(playSound = true) {
    if (this.feedbackPoint && !this.feedbackTriggered) {
      this.tapFeedback.emitContact(this.feedbackPoint, 'ui', this.clickedButton);
      this.feedbackTriggered = true;
    }
    if (playSound && this.onPlayClickSound) this.onPlayClickSound();
  }

  handleClick(x, y) {
    // Consume pending UI actions so a second tap cannot fall through to the board.
    if (this.clickedButton) return true;
    this.feedbackPoint = { x, y };
    this.feedbackTriggered = false;
    try {
      const handled = this.handleClickAction(x, y);
      if (handled && this.clickedButton && !this.feedbackTriggered) this.playClickFeedback();
      return handled;
    } finally {
      this.feedbackPoint = null;
    }
  }

  handleClickAction(x, y) {
    if (this.clickedButton) return false;

    // 彩蛋弹框关闭按钮
    if (this.eggTriggered && this.eggCloseButton) {
      const btn = this.eggCloseButton;
      if (x >= btn.x && x <= btn.x + btn.width &&
          y >= btn.y && y <= btn.y + btn.height) {
        if (this.onPlayClickSound) this.onPlayClickSound();
        this.eggTriggered = false;
        this.eggTriggerTime = 0;
        this.eggCloseButton = null;
        return true;
      }
      // 点击卡片其他区域不做任何事
      return true;
    }


    if (this.showModal) {
      return this.handleModalClick(x, y);
    }

    if (this.showShop) {
      return this.handleShopClick(x, y);
    }

    if (this.showSkills) {
      return this.handleSkillsClick(x, y);
    }

    if (this.showAchievements) {
      const isMobile = this.width < 768;
      const buttonWidth = isMobile ? 180 : 220;
      const buttonHeight = isMobile ? 48 : 56;
      const modalWidth = isMobile ? this.width - 20 : Math.min(500, this.width - 40);
      const modalHeight = isMobile ? this.height - 80 : this.height - 100;
      const modalY = (this.height - modalHeight) / 2;
      const buttonX = (this.width - buttonWidth) / 2;
      const buttonY = modalY + modalHeight - (isMobile ? 70 : 80);

      if (x >= buttonX && x <= buttonX + buttonWidth &&
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.clickedButton = 'achievements_close';
        this.clickAnimation = 1;
        this.playClickFeedback();
        setTimeout(() => {
          this.clickedButton = null;
          this.clickAnimation = 0;
          this.onCloseAchievements();
          this.hoveredButton = null;
        }, 150);
        return true;
      }
      return true;
    }

    if (this.showScoreHistory) {
      const isMobile = this.width < 768;
      const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
      const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
      const modalWidth = isMobile ? this.width - 20 : Math.min(500, this.width - 40);
      const modalHeight = isMobile ? this.height - topSafeArea - bottomSafeArea - 20 : this.height - 80;
      const modalX = (this.width - modalWidth) / 2;
      const modalY = isMobile ? topSafeArea + 10 : (this.height - modalHeight) / 2;

      // Tab clicks
      const tabY = modalY + (isMobile ? 75 : 90);
      const tabGap = isMobile ? 10 : 12;
      const tabWidth = (modalWidth - (isMobile ? 30 : 40)) / 2;
      const tabHeight = isMobile ? 38 : 44;
      const tabStartX = modalX + (isMobile ? 15 : 20);

      for (let i = 1; i <= 2; i++) {
        const tX = tabStartX + (i - 1) * (tabWidth + tabGap);
        if (x >= tX && x <= tX + tabWidth &&
            y >= tabY && y <= tabY + tabHeight) {
          if (this.scoreHistoryTab !== i) {
            this.scoreHistoryTab = i;
            this.scoreHistoryScrollOffset = 0;
            if (this.onPlayClickSound) this.onPlayClickSound();
          }
          return true;
        }
      }

      // Close button
      const buttonWidth = isMobile ? 180 : 220;
      const buttonHeight = isMobile ? 48 : 56;
      const buttonX = (this.width - buttonWidth) / 2;
      const buttonY = modalY + modalHeight - (isMobile ? 70 : 80);

      if (x >= buttonX && x <= buttonX + buttonWidth &&
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.clickedButton = 'scoreHistory_close';
        this.clickAnimation = 1;
        if (this.onPlayClickSound) this.onPlayClickSound();
        setTimeout(() => {
          this.clickedButton = null;
          this.clickAnimation = 0;
          this.showScoreHistory = false;
          this.hoveredButton = null;
        }, 150);
        return true;
      }
      return true;
    }

    if (this.showInstructions) {
      const isMobile = this.width < 768;
      const buttonWidth = isMobile ? 180 : 220;
      const buttonHeight = isMobile ? 48 : 56;
      const modalWidth = isMobile ? Math.min(360, this.width - 40) : 480;
      const modalHeight = isMobile ? 420 : 480;
      const modalX = (this.width - modalWidth) / 2;
      const modalY = (this.height - modalHeight) / 2;
      const buttonX = (this.width - buttonWidth) / 2;
      const buttonY = modalY + modalHeight - (isMobile ? 80 : 90);

      if (x >= buttonX && x <= buttonX + buttonWidth &&
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.clickedButton = 'instructions_ok';
        this.clickAnimation = 1;
        this.playClickFeedback();
        setTimeout(() => {
          this.clickedButton = null;
          this.clickAnimation = 0;
          this.showInstructions = false;
          this.hoveredButton = null;
        }, 150);
        return true;
      }
      return true;
    }
    
    if (this.showModal && this.modalButtons.length > 0) {
      const alpha = this.modalAnimation;
      const scale = 0.85 + 0.15 * alpha;
      const localX = (x - this.width / 2) / scale + this.width / 2;
      const localY = (y - this.height / 2) / scale + this.height / 2;
      
      for (const button of this.modalButtons) {
        if (button.x !== undefined && 
            localX >= button.x && localX <= button.x + button.width &&
            localY >= button.y && localY <= button.y + button.height) {
          this.clickedButton = button.id;
          this.clickAnimation = 1;
          this.playClickFeedback();
          setTimeout(() => {
            this.clickedButton = null;
            this.clickAnimation = 0;
            if (button.action) {
              button.action();
            }
          }, 150);
          return true;
        }
      }
    }
    
    if (this.handleModeSwitcherClick(x, y)) {
      return true;
    }
    
    const allButtons = [...this.buttons];
    if (this.headerButtons && this.gameState !== 'menu') {
      allButtons.push(...this.headerButtons);
    }
    
    for (const button of allButtons) {
      if (this.isPointInButton(x, y, button)) {
        if (button.id === 'hint') {
          if (this.hintCount <= 0) return true;
          this.clickedButton = button.id;
          this.clickAnimation = 1;
          this.playClickFeedback();
          setTimeout(() => {
            this.clickedButton = null;
            this.clickAnimation = 0;
            if (this.onUseHint) {
              this.onUseHint();
            }
          }, 150);
          return true;
        }
        
        this.clickedButton = button.id;
        this.clickAnimation = 1;
        this.playClickFeedback();
        setTimeout(() => {
          this.clickedButton = null;
          this.clickAnimation = 0;
          if (button.action) {
            button.action();
          }
        }, 150);
        return true;
      }
    }
    
    return false;
  }

  onStartGame() {
    this.currentLevel = 1;
    if (this.onGameStart) {
      this.onGameStart(this.levelConfig[this.currentLevel].count, this.currentLevel, this.gameMode);
    }
  }



  onBackToMenu() {
    this.showCompletion = false;
    if (this.onBackToMenu) {
      this.onBackToMenu();
    }
  }

  onShowInstructions() {
    this.showInstructions = true;
  }

  onChangeLevel() {
    this.currentLevel = (this.currentLevel % this.totalLevels) + 1;
  }

  onPlayAgain() {
    this.showCompletion = false;
    if (this.onGameStart) {
      this.onGameStart(this.levelConfig[this.currentLevel].count, this.currentLevel, this.gameMode);
    }
  }

  onNextLevel() {
    this.showCompletion = false;
    this.currentLevel++;
    if (this.onNextLevel) {
      this.onNextLevel(this.currentLevel);
    }
  }


  onOpenAchievements() {
    this.showAchievements = true;
    this.achievementScrollOffset = 0;
    if (this.onAchievementsOpen) {
      this.onAchievementsOpen();
    }
  }
  
  onCloseAchievements() {
    this.showAchievements = false;
    if (this.onAchievementsClose) {
      this.onAchievementsClose();
    }
  }

  onSelectMode(mode) {
    this.gameMode = mode;
    this.instructionsData = null;
    this.refreshMenuButtons();
    if (this.onModeChange) {
      this.onModeChange(mode);
    }
  }

  refreshMenuButtons() {
    this.buttons = this._buildMenuButtons();
  }

  onToggleMode() {
    const newMode = this.gameMode === 'timed' ? 'untimed' : 'timed';
    this.onSelectMode(newMode);
  }

  setGameMode(mode) {
    this.gameMode = mode;
    this.instructionsData = null;
  }

  getGameMode() {
    return this.gameMode;
  }

  setHintCount(count) {
    this.hintCount = count;
  }

  setCoins(coins) {
    this.coins = coins;
  }

  setSkillsData(skillsData) {
    this.skillsData = skillsData;
  }

  setSoundManager(soundManager) {
    this.soundManager = soundManager;
  }

  updateHintButtonAnimation(deltaTime) {
    if (this.hintButtonAnimation > 0) {
      this.hintButtonAnimation = Math.max(0, this.hintButtonAnimation - deltaTime * 5);
    }
  }

  triggerHintButtonAnimation() {
    this.hintButtonAnimation = 1;
  }


  showModalDialog(type, title, message, buttons) {
    this.modalType = type;
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalButtons = buttons;
    this.showModal = true;
    this.modalAnimation = 0;
    this.modalTargetAnimation = 1;
    this.modalSoundPlayed = false;
  }

  hideModal() {
    this.modalTargetAnimation = 0;
  }

  hideModalImmediate() {
    this.showModal = false;
    this.modalAnimation = 0;
    this.modalTargetAnimation = 0;
  }

  updateModalAnimation(deltaTime) {
    if (this.showModal) {
      if (this.modalAnimation < this.modalTargetAnimation) {
        this.modalAnimation += deltaTime * 5;
        if (this.modalAnimation > this.modalTargetAnimation) {
          this.modalAnimation = this.modalTargetAnimation;
        }
      } else if (this.modalAnimation > this.modalTargetAnimation) {
        this.modalAnimation -= deltaTime * 5;
        if (this.modalAnimation < this.modalTargetAnimation) {
          this.modalAnimation = this.modalTargetAnimation;
        }
      }
      
      if (this.modalAnimation <= 0 && this.modalTargetAnimation === 0) {
        this.showModal = false;
      }
    }
  }

  renderModal(ctx) {
    const scheme = this.getScheme();
    const isMobile = this.width < 768;
    const alpha = this.modalAnimation;
    const scale = 0.85 + 0.15 * alpha;
    
    ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    const modalWidth = isMobile ? Math.min(340, this.width - 48) : 420;
    const hasScoreInMessage = this.modalMessage && this.modalMessage.includes('得分');
    const buttonCount = this.modalButtons ? this.modalButtons.length : 0;
    const extraButtonHeight = Math.max(0, buttonCount - 2) * (isMobile ? 62 : 74);
    let modalHeight;

    if (this.modalType === 'gameComplete') {
      modalHeight = (isMobile ? 400 : 460) + extraButtonHeight;
    } else if (this.modalType === 'gameFailed') {
      modalHeight = (hasScoreInMessage ? (isMobile ? 480 : 540) : (isMobile ? 380 : 420)) + extraButtonHeight;
    } else if (this.modalType === 'resetConfirm') {
      modalHeight = isMobile ? 580 : 650;
    } else {
      modalHeight = (isMobile ? 280 : 310) + extraButtonHeight;
    }

    const maxModalHeight = this.height - 40;
    if (modalHeight > maxModalHeight) modalHeight = maxModalHeight;

    const modalX = (this.width - modalWidth) / 2;
    const modalY = (this.height - modalHeight) / 2;

    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-this.width / 2, -this.height / 2);

    this.drawBrutalismRect(ctx, modalX, modalY, modalWidth, modalHeight, scheme.cardBg, {
      shadowOffset: 8,
      borderWidth: 0
    });

    if (this.modalType === 'gameComplete') {
      this.renderCompletionContent(ctx, modalX, modalY, modalWidth, modalHeight, isMobile);
    } else if (this.modalType === 'gameFailed') {
      this.renderFailureContent(ctx, modalX, modalY, modalWidth, modalHeight, isMobile);
    } else if (this.modalType === 'resetConfirm') {
      this.renderResetConfirmContent(ctx, modalX, modalY, modalWidth, modalHeight, isMobile);
    } else {
      this.renderDefaultModalContent(ctx, modalX, modalY, modalWidth, modalHeight, isMobile);
    }

    ctx.restore();
  }

  renderCompletionContent(ctx, x, y, width, height, isMobile) {
    if (!this.modalSoundPlayed && this.soundManager) {
      this.soundManager.playComplete();
      this.modalSoundPlayed = true;
    }
    const scheme = this.getScheme();
    const centerX = x + width / 2;
    
    ctx.fillStyle = scheme.buttonSuccess;
    ctx.font = `bold ${isMobile ? 48 : 56}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', centerX, y + (isMobile ? 50 : 60));
    
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 32 : 40}px "Arial Black", Arial, sans-serif`;
    ctx.fillText('通关成功!', centerX, y + (isMobile ? 110 : 130));

    const messageLines = this.modalMessage.split('\n');
    let timeValue = '';
    let foundValue = '';

    messageLines.forEach(line => {
      if (line.includes('完成时间')) {
        timeValue = line.replace('完成时间:', '').trim();
      }
      if (line.includes('找到')) {
        foundValue = line.replace(/.*找到:/, '').trim();
      }
    });

    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 16 : 18}px Arial, sans-serif`;
    if (foundValue) {
      ctx.fillText(`找到 ${foundValue} 个`, centerX, y + (isMobile ? 170 : 200));
      ctx.fillText('完成时间', centerX, y + (isMobile ? 200 : 238));
    } else {
      ctx.fillText('完成时间', centerX, y + (isMobile ? 175 : 210));
    }
    
    const timeBoxWidth = isMobile ? 160 : 200;
    const timeBoxHeight = isMobile ? 40 : 48;
    const timeBoxX = centerX - timeBoxWidth / 2;
    const timeBoxY = foundValue
      ? (y + (isMobile ? 220 : 258))
      : (y + (isMobile ? 195 : 230));
    
    this.drawBrutalismRect(ctx, timeBoxX, timeBoxY, timeBoxWidth, timeBoxHeight, scheme.buttonPrimary, {
      shadowOffset: 4,
      borderWidth: 3
    });
    
    ctx.fillStyle = scheme.textLight;
    ctx.font = `bold ${isMobile ? 20 : 24}px "Arial Black", Arial, sans-serif`;
    ctx.fillText(timeValue || '0.00秒', centerX, timeBoxY + timeBoxHeight / 2);

    const btnCount = this.modalButtons ? this.modalButtons.length : 0;
    const extraBtnH = Math.max(0, btnCount - 2) * (isMobile ? 62 : 74);
    this.renderModalButtons(ctx, x, y + height - (isMobile ? 130 : 150) - extraBtnH, width, isMobile);
  }

  renderFailureContent(ctx, x, y, width, height, isMobile) {
    const scheme = this.getScheme();
    const centerX = x + width / 2;
    
    ctx.fillStyle = scheme.danger;
    ctx.font = `bold ${isMobile ? 40 : 48}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('😅', centerX, y + (isMobile ? 40 : 50));
    
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 28 : 34}px "Arial Black", Arial, sans-serif`;
    ctx.fillText('再接再厉!', centerX, y + (isMobile ? 95 : 115));
    
    const messageLines = this.modalMessage.split('\n');
    let progressText = '';
    let timeText = '';
    let foundText = '';
    let scoreText = '';

    messageLines.forEach(line => {
      if (line.includes('完成进度')) {
        progressText = line;
      }
      if (line.includes('用时')) {
        timeText = line;
      }
      if (line.includes('找到:')) {
        foundText = line.replace(/.*找到:/, '').trim();
      }
      if (line.includes('得分')) {
        scoreText = line.replace('得分:', '').trim();
      }
    });

    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 16 : 18}px Arial, sans-serif`;

    let textY = y + (isMobile ? 140 : 165);
    if (foundText) {
      ctx.fillText(`找到 ${foundText} 个`, centerX, textY);
      textY += isMobile ? 28 : 32;
    }
    if (progressText) {
      ctx.fillText(progressText, centerX, textY);
      textY += isMobile ? 28 : 32;
    }
    if (timeText) {
      ctx.fillText(timeText, centerX, textY);
      textY += isMobile ? 28 : 32;
    }
    
    if (scoreText) {
      ctx.fillText('得分', centerX, textY);
      textY += isMobile ? 25 : 30;
      
      const scoreBoxWidth = isMobile ? 120 : 150;
      const scoreBoxHeight = isMobile ? 36 : 44;
      const scoreBoxX = centerX - scoreBoxWidth / 2;
      const scoreBoxY = textY;
      
      this.drawBrutalismRect(ctx, scoreBoxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, scheme.accent, {
        shadowOffset: 4,
        borderWidth: 1
      });
      
      ctx.fillStyle = scheme.textLight;
      ctx.font = `bold ${isMobile ? 18 : 22}px "Arial Black", Arial, sans-serif`;
      ctx.fillText(scoreText, centerX, scoreBoxY + scoreBoxHeight / 2);
      
      textY += scoreBoxHeight + (isMobile ? 15 : 20);
    }
    
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 16 : 18}px Arial, sans-serif`;
    ctx.fillText('别放弃，再试一次!', centerX, textY + (isMobile ? 10 : 15));

    const failBtnCount = this.modalButtons ? this.modalButtons.length : 0;
    const failExtraH = Math.max(0, failBtnCount - 2) * (isMobile ? 62 : 74);
    this.renderModalButtons(ctx, x, y + height - (isMobile ? 130 : 150) - failExtraH, width, isMobile);
  }

  renderResetConfirmContent(ctx, x, y, width, height, isMobile) {
    const scheme = this.getScheme();
    const centerX = x + width / 2;

    ctx.fillStyle = '#EF4444';
    ctx.font = `bold ${isMobile ? 48 : 56}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠', centerX, y + (isMobile ? 50 : 60));

    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 32 : 40}px "Arial Black", Arial, sans-serif`;
    ctx.fillText('重置游戏数据', centerX, y + (isMobile ? 110 : 130));

    const messageLines = this.modalMessage.split('\n');
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 16 : 18}px Arial, sans-serif`;
    const lineHeight = isMobile ? 26 : 30;
    const messageY = y + (isMobile ? 170 : 200);

    messageLines.forEach((line, index) => {
      ctx.fillText(line, centerX, messageY + index * lineHeight);
    });

    const buttonsY = messageY + messageLines.length * lineHeight + (isMobile ? 40 : 50);
    this.renderModalButtons(ctx, x, buttonsY, width, isMobile);
  }

  renderDefaultModalContent(ctx, x, y, width, height, isMobile) {
    const scheme = this.getScheme();
    const centerX = x + width / 2;
    
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 24 : 28}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.modalTitle, centerX, y + (isMobile ? 50 : 60));
    
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 16 : 18}px Arial, sans-serif`;
    
    const messageLines = this.modalMessage.split('\n');
    const lineHeight = isMobile ? 26 : 30;
    const messageY = y + (isMobile ? 100 : 110);
    
    messageLines.forEach((line, index) => {
      ctx.fillText(line, centerX, messageY + index * lineHeight);
    });
    
    const defBtnCount = this.modalButtons ? this.modalButtons.length : 0;
    const defExtraH = Math.max(0, defBtnCount - 2) * (isMobile ? 62 : 74);
    this.renderModalButtons(ctx, x, y + height - (isMobile ? 130 : 150) - defExtraH, width, isMobile);
  }

  renderModalButtons(ctx, x, y, width, isMobile) {
    const scheme = this.getScheme();
    const buttonWidth = isMobile ? 190 : 230;
    const buttonHeight = isMobile ? 46 : 52;
    const buttonSpacing = isMobile ? 12 : 16;
    const centerX = x + width / 2;

    this.modalButtons.forEach((button, index) => {
      const buttonY = y + index * (buttonHeight + buttonSpacing);
      const buttonX = centerX - buttonWidth / 2;

      button.x = buttonX;
      button.y = buttonY;
      button.width = buttonWidth;
      button.height = buttonHeight;

      const isHovered = this.hoveredButton === button.id;
      const isClicked = this.clickedButton === button.id || (this.homePress?.button === button && this.isPointInButton(this.mouseX, this.mouseY, button));

      let fillColor;
      if (button.id === 'nextLevel' || button.id === 'restart') {
        fillColor = scheme.buttonSuccess;
      } else if (button.id === 'playAgain' || button.id === 'tryAgain' || button.id === 'resume') {
        fillColor = scheme.buttonPrimary;
      } else if (button.id === 'confirm') {
        fillColor = button.color || '#EF4444';
      } else if (button.id === 'cancel') {
        fillColor = '#6B7280';
      } else {
        fillColor = scheme.cardBg;
      }

      if (isHovered) {
        fillColor = this.lightenColor(fillColor, 0.15);
      }

      let scale = 1;
      if (isHovered) scale = 1.02;
      if (isClicked) scale = 0.95;

      const scaledWidth = buttonWidth * scale;
      const scaledHeight = buttonHeight * scale;
      const scaledX = centerX - scaledWidth / 2;
      const scaledY = buttonY + (buttonHeight - scaledHeight) / 2;

      const shadowOffset = isClicked ? 2 : (isHovered ? 6 : 4);
      this.drawBrutalismRect(ctx, scaledX, scaledY, scaledWidth, scaledHeight, fillColor, {
        shadowOffset: shadowOffset,
        borderWidth: 0
      });

      ctx.fillStyle = button.id === 'menu' ? scheme.text : scheme.textLight;
      ctx.font = `bold ${isMobile ? 18 : 20}px "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(button.text, centerX, scaledY + scaledHeight / 2);
    });
  }

  handleModalClick(x, y) {
    if (this.clickedButton) return false;
    if (!this.modalButtons || this.modalButtons.length === 0) {
      return false;
    }

    for (const button of this.modalButtons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        this.clickedButton = button.id;
        this.clickAnimation = 1;
        this.playClickFeedback();
        setTimeout(() => {
          this.clickedButton = null;
          this.clickAnimation = 0;
          if (button.action) {
            button.action();
          }
        }, 150);
        return true;
      }
    }

    return false;
  }

  render(ctx, ...args) {
    this.renderContent(ctx, ...args);
    // UI feedback stays visible above shop, help and confirmation overlays.
    this.tapFeedback.render(ctx);
  }

  renderContent(ctx, gameState, currentNumber, totalNumbers, timeLeft = 5.0, deltaTime = 0.016) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    this.gameState = gameState;
    
    this.updateEffects(deltaTime);
    this.updateMenuAnimation(deltaTime);
    this.updateAchievementNotifications(deltaTime);
    this.updateShopScrollInertia(deltaTime);

    if (this.showShop) {
      this.renderMenu(ctx);
      this.renderShop(ctx);
      this.renderEffects(ctx);
      this.renderAchievementNotifications(ctx);
      if (this.showModal) {
        this.renderModal(ctx);
      }
      return;
    }

    if (this.showSkills) {
      this.renderMenu(ctx);
      this.renderSkills(ctx);
      this.renderEffects(ctx);
      this.renderAchievementNotifications(ctx);
      if (this.showModal) {
        this.renderModal(ctx);
      }
      return;
    }

    if (this.showAchievements) {
      this.renderMenu(ctx);
      this.renderAchievements(ctx);
      this.renderEffects(ctx);
      this.renderAchievementNotifications(ctx);
      if (this.showModal) {
        this.renderModal(ctx);
      }
      return;
    }

    if (this.showScoreHistory) {
      this.renderMenu(ctx);
      this.renderScoreHistory(ctx);
      this.renderEffects(ctx);
      this.renderAchievementNotifications(ctx);
      if (this.showModal) {
        this.renderModal(ctx);
      }
      return;
    }


    if (this.showInstructions) {
      this.renderInstructions(ctx);
      this.renderEffects(ctx);
      this.renderAchievementNotifications(ctx);
      if (this.showModal) {
        this.renderModal(ctx);
      }
      return;
    }

    if (gameState !== 'menu') {
      this.hoveredButton = null;
    }

    if (gameState === 'menu') {
      this.renderMenu(ctx);
    } else if (gameState === 'playing' || gameState === 'completed' || gameState === 'failed') {
      this.renderGameUI(ctx, gameState, currentNumber, totalNumbers, timeLeft);
    }

    this.renderButtons(ctx);
    
    if (gameState === 'playing') {
      this.renderComboDisplay(ctx);
    }
    
    if (this.showModal) {
      this.renderModal(ctx);
    }

    this.renderEffects(ctx);
    this.renderCoinFlyAnimations(ctx);
    this.renderMilestoneFlash(ctx);
    this.renderAchievementNotifications(ctx);
    this.renderHighScoreCelebration(ctx);
  }

  updateMenuAnimation(deltaTime) {
    if (this.menuAnimation < this.menuTargetAnimation) {
      this.menuAnimation += deltaTime * 4;
      if (this.menuAnimation > this.menuTargetAnimation) {
        this.menuAnimation = this.menuTargetAnimation;
      }
    } else if (this.menuAnimation > this.menuTargetAnimation) {
      this.menuAnimation -= deltaTime * 4;
      if (this.menuAnimation < this.menuTargetAnimation) {
        this.menuAnimation = this.menuTargetAnimation;
      }
    }
  }

  renderMenu(ctx) {
    const scheme = this.getScheme();
    const isMobile = this.width < 768;

    this.renderModernBackground(ctx);

    const titleY = isMobile ? this.height * 0.2 : this.height * 0.18;
    const titleSize = isMobile ? 56 : 72;
    const subtitleSize = isMobile ? 14 : 16;

    ctx.save();
    ctx.globalAlpha = Math.min(1, this.menuAnimation * 1.5);

    this.renderModernTitle(ctx, this.width / 2, titleY, titleSize);

    const sloganY = titleY + (isMobile ? 85 : 108);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const sloganBefore = '找回消失的专注，从找到第一个 ';
    const sloganHighlight = '1';
    const sloganAfter = ' 开始';
    const sloganFont = `${subtitleSize}px Arial, sans-serif`;
    const highlightFont = `bold ${subtitleSize + 4}px Arial, sans-serif`;

    ctx.font = sloganFont;
    ctx.fillStyle = scheme.textSecondary;
    const wBefore = ctx.measureText(sloganBefore).width;
    ctx.font = highlightFont;
    const wHighlight = ctx.measureText(sloganHighlight).width;
    ctx.font = sloganFont;
    const wAfter = ctx.measureText(sloganAfter).width;
    const totalW = wBefore + wHighlight + wAfter;
    const sloganStartX = this.width / 2 - totalW / 2;

    ctx.textAlign = 'left';
    ctx.font = sloganFont;
    ctx.fillText(sloganBefore, sloganStartX, sloganY);

    ctx.fillStyle = '#FBBF24';
    ctx.font = highlightFont;
    ctx.fillText(sloganHighlight, sloganStartX + wBefore, sloganY);

    ctx.fillStyle = scheme.textSecondary;
    ctx.font = sloganFont;
    ctx.fillText(sloganAfter, sloganStartX + wBefore + wHighlight, sloganY);

    ctx.restore();

    const switcherWidth = isMobile ? 240 : 280;
    const switcherHeight = isMobile ? 42 : 48;
    const switcherX = (this.width - switcherWidth) / 2;
    const switcherOffset = isMobile ? 16 : 20;
    const switcherY = sloganY + (isMobile ? 50 : 56) + switcherOffset;

    ctx.save();
    ctx.globalAlpha = Math.min(1, this.menuAnimation * 2);
    this.drawModeSwitcher(ctx, switcherX, switcherY, switcherWidth, switcherHeight);
    ctx.restore();

    this.renderCoinsDisplay(ctx);

    const badgeY = this.height - (isMobile ? 30 : 40);
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.menuAnimation * 2) * 0.3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${isMobile ? 10 : 11}px Arial, sans-serif`;
    ctx.fillStyle = scheme.textSecondary;
    ctx.fillText('Inspired by xiangjianan · 🤖 · 100% AI Developed', this.width / 2, badgeY);
    ctx.restore();
  }

  renderModernBackground(ctx) {
    const scheme = this.getScheme();

    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#FFFAF5');
    gradient.addColorStop(0.5, '#FFF3E8');
    gradient.addColorStop(1, '#FFF7F0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    this.renderFloatingOrbs(ctx);
  }

  renderFloatingOrbs(ctx) {
    const t = Date.now() / 1000;
    const orbs = [
      { x: this.width * 0.1, y: this.height * 0.15, r: 140, color: 'rgba(59, 130, 246, 0.08)' },
      { x: this.width * 0.9, y: this.height * 0.25, r: 180, color: 'rgba(251, 191, 36, 0.08)' },
      { x: this.width * 0.5, y: this.height * 0.55, r: 160, color: 'rgba(239, 68, 68, 0.06)' },
      { x: this.width * 0.15, y: this.height * 0.75, r: 120, color: 'rgba(20, 184, 166, 0.06)' },
      { x: this.width * 0.8, y: this.height * 0.7, r: 150, color: 'rgba(139, 92, 246, 0.06)' }
    ];

    orbs.forEach((orb, i) => {
      const offsetX = Math.sin(t * 0.4 + i * 1.5) * 20;
      const offsetY = Math.cos(t * 0.25 + i * 1.0) * 15;
      const cx = orb.x + offsetX;
      const cy = orb.y + offsetY;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb.r);
      gradient.addColorStop(0, orb.color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, orb.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  renderModernTitle(ctx, x, y, size) {
    size = Math.min(size, (this.width - 32) / 6.92);
    const scheme = this.getScheme();
    const chars = ['数', '一', '数', '噻'];
    const tileColors = [
      { start: '#3B82F6', end: '#60A5FA' },
      { start: '#EF4444', end: '#F09A88' },
      { start: '#10B981', end: '#6EE7B7' },
      { start: '#FBBF24', end: '#FCD34D' }
    ];
    const tileNumbers = ['1', '2', '3', '4'];

    const tilePaddingX = size * 0.32;
    const tilePaddingY = size * 0.28;
    const tileGap = size * 0.12;
    const tileRadius = size * 0.36;

    ctx.save();
    ctx.font = `800 ${size}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const charWidths = chars.map(c => ctx.measureText(c).width);
    const tileWidth = Math.max(...charWidths) + tilePaddingX * 2;
    const tileHeight = size + tilePaddingY * 2;
    const totalWidth = tileWidth * chars.length + tileGap * (chars.length - 1);
    const startX = x - totalWidth / 2;

    const t = Date.now() / 1000;

    for (let i = 0; i < chars.length; i++) {
      const tx = startX + i * (tileWidth + tileGap);
      const ty = y - tileHeight / 2;
      const bounceOffset = Math.sin(t * 1.8 + i * 0.9) * 3;

      ctx.save();

      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4 + bounceOffset * 0.5;

      const grad = ctx.createLinearGradient(tx, ty + bounceOffset, tx + tileWidth, ty + tileHeight + bounceOffset);
      grad.addColorStop(0, tileColors[i].start);
      grad.addColorStop(1, tileColors[i].end);
      ctx.fillStyle = grad;
      this.roundRect(ctx, tx, ty + bounceOffset, tileWidth, tileHeight, tileRadius);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowColor = 'transparent';

      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      this.roundRect(ctx, tx, ty + bounceOffset, tileWidth, tileHeight * 0.45, tileRadius);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(chars[i], tx + tileWidth / 2, y + 2 + bounceOffset);

      const numSize = Math.round(size * 0.22);
      ctx.font = `bold ${numSize}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillText(tileNumbers[i], tx + tileWidth - numSize * 0.6, ty + bounceOffset + numSize * 0.8);

      ctx.font = `800 ${size}px "Arial Black", Arial, sans-serif`;
      ctx.restore();
    }

    const decorNumbers = ['1', '2', '3', '5', '8', '13'];
    const decorPositions = [
      { px: -0.42, py: -0.7, s: 0.18 },
      { px: 0.38, py: -0.65, s: 0.15 },
      { px: -0.5, py: 0.6, s: 0.14 },
      { px: 0.48, py: 0.55, s: 0.17 },
      { px: -0.15, py: -0.78, s: 0.12 },
      { px: 0.2, py: 0.72, s: 0.13 }
    ];
    const decorColors = ['rgba(99,102,241,0.15)', 'rgba(236,72,153,0.12)', 'rgba(16,185,129,0.12)', 'rgba(245,158,11,0.12)', 'rgba(59,130,246,0.10)', 'rgba(139,92,246,0.10)'];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    decorPositions.forEach((pos, i) => {
      const dx = x + totalWidth * pos.px;
      const dy = y + tileHeight * pos.py;
      const drift = Math.sin(t * 0.8 + i * 1.2) * 4;
      const fontSize = Math.round(size * pos.s);
      ctx.font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`;
      ctx.fillStyle = decorColors[i];
      ctx.fillText(decorNumbers[i], dx, dy + drift);
    });

    ctx.restore();
  }

  renderGameUI(ctx, gameState, currentNumber, totalNumbers, timeLeft) {
    const isMobile = this.width < 768;
    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
    const headerHeight = isMobile ? Math.max(100, topSafeArea + 54) : 116;
    const footerHeight = isMobile ? Math.max(80, bottomSafeArea + 44) : 56;
    
    this.renderHeader(ctx, headerHeight, topSafeArea, isMobile, timeLeft, currentNumber, totalNumbers);
    
    this.renderFooter(ctx, footerHeight, bottomSafeArea, isMobile, currentNumber, totalNumbers);
  }

  renderHeader(ctx, headerHeight, topSafeArea, isMobile, timeLeft, currentNumber, totalNumbers) {
    const scheme = this.getScheme();
    
    // 半透明背景，让连击背景流动效果透出来
    ctx.fillStyle = 'rgba(255, 250, 245, 0.85)';
    ctx.fillRect(0, 0, this.width, headerHeight);
    
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.fillRect(0, headerHeight - 4, this.width, 4);

    const buttonSize = isMobile ? 46 : 52;
    const buttonSpacing = isMobile ? 12 : 16;
    const contentStartY = topSafeArea;
    const contentHeight = headerHeight - topSafeArea;
    const buttonY = contentStartY + (contentHeight - buttonSize) / 2 - 6;
    const buttonStartX = isMobile ? 18 : 26;

    this.headerButtons = [
      {
        id: 'menu',
        text: '←',
        x: buttonStartX,
        y: buttonY,
        width: buttonSize,
        height: buttonSize,
        color: scheme.cardBg,
        hoverColor: scheme.buttonSecondary,
        action: () => this.onBackToMenu()
      },
      {
        id: 'refresh',
        text: '↻',
        x: buttonStartX + buttonSize + buttonSpacing,
        y: buttonY,
        width: buttonSize,
        height: buttonSize,
        color: scheme.cardBg,
        hoverColor: scheme.buttonPrimary,
        action: () => this.onRefreshGame()
      }
    ];

    ctx.font = `bold ${isMobile ? 20 : 24}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    this.headerButtons.forEach(button => {
      const isHovered = this.isPointInButton(this.mouseX, this.mouseY, button);
      const isClicked = this.clickedButton === button.id || (this.homePress?.button === button && this.isPointInButton(this.mouseX, this.mouseY, button));
      
      let scale = 1;
      if (isHovered) scale = 1.05;
      if (isClicked) scale = 0.95;
      
      const scaledSize = (buttonSize * scale) | 0;
      const scaledX = (button.x + (buttonSize - scaledSize) / 2) | 0;
      const scaledY = (button.y + (buttonSize - scaledSize) / 2) | 0;
      
      let fillColor = button.color;
      if (isHovered) fillColor = button.hoverColor;
      
      const shadowOffset = isClicked ? 2 : (isHovered ? 6 : 4);
      this.drawBrutalismRect(ctx, scaledX, scaledY, scaledSize, scaledSize, fillColor, {
        shadowOffset: shadowOffset,
        borderWidth: 0
      });
      
      ctx.fillStyle = isHovered ? scheme.textLight : scheme.text;
      ctx.fillText(button.text, scaledX + (scaledSize / 2) | 0, scaledY + (scaledSize / 2) | 0);
    });

    if (this.gameMode === 'timed') {
      const centerX = this.width / 2;
      const timerY = buttonY + buttonSize / 2;
      const timerFontSize = isMobile ? 28 : 36;

      let timerColor;
      let timerBgColor;
      if (timeLeft <= 5.0) {
        timerColor = scheme.textLight;
        timerBgColor = scheme.danger;
      } else if (timeLeft <= 10.0) {
        timerColor = scheme.textLight;
        timerBgColor = scheme.buttonPrimary;
      } else {
        timerColor = scheme.textLight;
        timerBgColor = scheme.accent;
      }

      const timerWidth = isMobile ? 100 : 120;
      const timerHeight = isMobile ? 44 : 52;
      const timerX = centerX - timerWidth / 2;
      const timerBoxY = timerY - timerHeight / 2;

      this.drawBrutalismRect(ctx, timerX, timerBoxY, timerWidth, timerHeight, timerBgColor, {
        shadowOffset: 4,
        borderWidth: 1
      });

      ctx.font = `bold ${timerFontSize}px "Arial Black", Arial, sans-serif`;
      ctx.fillStyle = timerColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayTime = Math.max(0, timeLeft).toFixed(1);
      ctx.fillText(`${displayTime}s`, centerX, timerY);
    }

    // 金币显示 - 右上角
    const coinBoxWidth = isMobile ? 80 : 100;
    const coinBoxHeight = isMobile ? 36 : 42;
    const coinBoxX = this.width - coinBoxWidth - (isMobile ? 16 : 24);
    const coinBoxY = buttonY + (buttonSize - coinBoxHeight) / 2;
    const coinRadius = coinBoxHeight / 2;

    // 金币盒子弹跳效果
    const coinBounce = this.coinBoxBounce;
    const coinBoxCenterX = coinBoxX + coinBoxWidth / 2;
    const coinBoxCenterY = coinBoxY + coinBoxHeight / 2;
    const coinBoxScale = 1 + coinBounce * 0.15;

    ctx.save();
    if (coinBounce > 0) {
      ctx.translate(coinBoxCenterX, coinBoxCenterY);
      ctx.scale(coinBoxScale, coinBoxScale);
      ctx.translate(-coinBoxCenterX, -coinBoxCenterY);
      ctx.shadowColor = 'rgba(245, 197, 66, 0.4)';
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    }
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = scheme.cardBg;
    this.roundRect(ctx, coinBoxX, coinBoxY, coinBoxWidth, coinBoxHeight, coinRadius);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = scheme.border;
    ctx.lineWidth = 1;
    this.roundRect(ctx, coinBoxX, coinBoxY, coinBoxWidth, coinBoxHeight, coinRadius);
    ctx.stroke();

    const coinIconSize = isMobile ? 20 : 24;
    const coinIconX = coinBoxX + (isMobile ? 10 : 12);
    const coinIconY = coinBoxY + (coinBoxHeight - coinIconSize) / 2;

    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(coinIconX + coinIconSize / 2, coinIconY + coinIconSize / 2, coinIconSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#374151';
    ctx.font = `bold ${isMobile ? 11 : 13}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¥', coinIconX + coinIconSize / 2, coinIconY + coinIconSize / 2 + 1);

    ctx.fillStyle = scheme.text;
    ctx.font = `600 ${isMobile ? 14 : 16}px Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.coins}`, coinBoxX + coinBoxWidth - (isMobile ? 10 : 14), coinBoxY + coinBoxHeight / 2);
  }

  renderFooter(ctx, footerHeight, bottomSafeArea, isMobile, currentNumber, totalNumbers) {
    const scheme = this.getScheme();
    const footerY = this.height - footerHeight;
    const centerX = this.width / 2;
    
    // 半透明背景，让连击背景流动效果透出来
    ctx.fillStyle = 'rgba(255, 250, 245, 0.85)';
    ctx.fillRect(0, footerY, this.width, footerHeight);
    
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.fillRect(0, footerY, this.width, 4);
    
    const progressBarWidth = isMobile ? 220 : 300;
    const progressBarHeight = isMobile ? 28 : 34;
    const progressBarY = footerY + (footerHeight - progressBarHeight) / 2;
    const progress = (currentNumber - 1) / totalNumbers;

    this.drawBrutalismRect(ctx, centerX - progressBarWidth / 2, progressBarY, progressBarWidth, progressBarHeight, scheme.cardBg, {
      shadowOffset: 4,
      borderWidth: 3
    });

    const fillWidth = (progressBarWidth * progress) | 0;
    if (fillWidth > 0) {
      const fillX = centerX - progressBarWidth / 2 + 3;
      const fillY = progressBarY + 3;
      const fillH = progressBarHeight - 6;
      const fillRadius = Math.max(0, Math.min(fillH / 2, (fillWidth - 6) / 2));
      ctx.fillStyle = scheme.buttonPrimary;
      ctx.beginPath();
      ctx.moveTo(fillX + fillRadius, fillY);
      ctx.lineTo(fillX + fillWidth - 6 - fillRadius, fillY);
      ctx.arcTo(fillX + fillWidth - 6, fillY, fillX + fillWidth - 6, fillY + fillRadius, fillRadius);
      ctx.lineTo(fillX + fillWidth - 6, fillY + fillH - fillRadius);
      ctx.arcTo(fillX + fillWidth - 6, fillY + fillH, fillX + fillWidth - 6 - fillRadius, fillY + fillH, fillRadius);
      ctx.lineTo(fillX + fillRadius, fillY + fillH);
      ctx.arcTo(fillX, fillY + fillH, fillX, fillY + fillH - fillRadius, fillRadius);
      ctx.lineTo(fillX, fillY + fillRadius);
      ctx.arcTo(fillX, fillY, fillX + fillRadius, fillY, fillRadius);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.font = `bold ${isMobile ? 14 : 16}px "Arial Black", Arial, sans-serif`;
    ctx.fillStyle = scheme.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${currentNumber - 1}/${totalNumbers}`, centerX, progressBarY + progressBarHeight / 2);
    
    this.renderHintButton(ctx, footerY, footerHeight, bottomSafeArea, isMobile);
  }

  renderHintButton(ctx, footerY, footerHeight, bottomSafeArea, isMobile) {
    const scheme = this.getScheme();
    const buttonSize = isMobile ? 40 : 64;
    const paddingX = isMobile ? 16 : 20;

    const buttonX = paddingX;
    const buttonY = footerY + (footerHeight - buttonSize) / 2;
    
    const isHintHovered = this.mouseX >= buttonX && this.mouseX <= buttonX + buttonSize &&
                          this.mouseY >= buttonY && this.mouseY <= buttonY + buttonSize;
    const isHintClicked = this.clickedButton === 'hint';
    const hasHints = this.hintCount > 0;

    let hintScale = 1;
    if (isHintHovered && hasHints) hintScale = 1.05;
    if (isHintClicked) hintScale = 0.95;
    if (this.hintButtonAnimation > 0) {
      hintScale = 1 + this.hintButtonAnimation * 0.1;
    }

    const hintScaledSize = (buttonSize * hintScale) | 0;
    const hintScaledX = (buttonX + (buttonSize - hintScaledSize) / 2) | 0;
    const hintScaledY = (buttonY + (buttonSize - hintScaledSize) / 2) | 0;

    let hintFillColor = hasHints ? scheme.accent : scheme.cardBg;
    if (isHintHovered && hasHints) {
      hintFillColor = this.lightenColor(scheme.accent, 0.15);
    }

    const hintShadowOffset = isHintClicked ? 2 : (isHintHovered && hasHints ? 6 : 4);
    this.drawBrutalismRect(ctx, hintScaledX, hintScaledY, hintScaledSize, hintScaledSize, hintFillColor, {
      shadowOffset: hintShadowOffset,
      borderWidth: 3
    });

    ctx.font = `bold ${isMobile ? 18 : 28}px Arial, sans-serif`;
    ctx.fillStyle = hasHints ? scheme.textLight : scheme.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💡', hintScaledX + (hintScaledSize / 2) | 0, hintScaledY + (hintScaledSize / 2) | 0);

    ctx.font = `bold ${isMobile ? 10 : 14}px "Arial Black", Arial, sans-serif`;
    ctx.fillStyle = hasHints ? scheme.textLight : scheme.text;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${this.hintCount}`, hintScaledX + hintScaledSize - (isMobile ? 4 : 6), hintScaledY + hintScaledSize - (isMobile ? 4 : 6));

    this.headerButtons.push({
      id: 'hint',
      x: hintScaledX,
      y: hintScaledY,
      width: hintScaledSize,
      height: hintScaledSize
    });
  }

  renderInstructions(ctx) {
    const scheme = this.getScheme();
    const isMobile = this.width < 768;

    ctx.fillStyle = `rgba(0, 0, 0, 0.7)`;
    ctx.fillRect(0, 0, this.width, this.height);

    const modalWidth = isMobile ? Math.min(360, this.width - 40) : 480;
    const modalHeight = isMobile ? 380 : 420;
    const modalX = (this.width - modalWidth) / 2;
    const modalY = (this.height - modalHeight) / 2;

    this.drawBrutalismRect(ctx, modalX, modalY, modalWidth, modalHeight, scheme.cardBg, {
      shadowOffset: 8,
      borderWidth: 0
    });

    const titleY = modalY + (isMobile ? 50 : 60);
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 28 : 34}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏规则', this.width / 2, titleY);

    const titleWidth = ctx.measureText('游戏规则').width;
    ctx.strokeStyle = scheme.buttonPrimary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.width / 2 - titleWidth / 2 - 20, titleY + 25);
    ctx.lineTo(this.width / 2 + titleWidth / 2 + 20, titleY + 25);
    ctx.stroke();

    const instructions = this.instructionsData || this.getInstructionsData();
    if (!this.instructionsData) {
      this.instructionsData = instructions;
    }

    this.renderInstructionsContent(ctx, instructions, modalX, modalY, modalHeight, isMobile);
  }

  getInstructionsData() {
    const scheme = this.getScheme();
    return {
      common: {
        text: '从数字 1 开始，按顺序点击屏幕上的所有图形'
      },
      timed: {
        title: '限时模式',
        color: scheme.buttonPrimary,
        desc: '点对加时5s，点错减时-5s'
      },
      free: {
        title: '自由模式',
        color: scheme.accent,
        desc: '无时间限制，自由探索'
      }
    };
  }

  renderInstructionsContent(ctx, instructions, modalX, modalY, modalHeight, isMobile) {
    const scheme = this.getScheme();

    const commonY = modalY + (isMobile ? 100 : 120);
    ctx.font = `bold ${isMobile ? 16 : 18}px Arial, sans-serif`;
    ctx.fillStyle = scheme.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(instructions.common.text, this.width / 2, commonY);

    const modeY = commonY + (isMobile ? 60 : 80);
    const modeGap = isMobile ? 12 : 16;
    const modePadding = isMobile ? 16 : 24;
    const modalWidth = isMobile ? Math.min(360, this.width - 40) : 480;
    const modeWidth = (modalWidth - modePadding * 2 - modeGap) / 2;
    const modeHeight = isMobile ? 80 : 100;
    const leftModeX = modalX + modePadding;
    const rightModeX = leftModeX + modeWidth + modeGap;

    const modes = [
      { key: 'timed', x: leftModeX },
      { key: 'free', x: rightModeX }
    ];

    modes.forEach(mode => {
      const modeData = instructions[mode.key];

      this.drawBrutalismRect(ctx, mode.x, modeY, modeWidth, modeHeight, modeData.color, {
        shadowOffset: 4,
        borderWidth: 1
      });

      ctx.font = `bold ${isMobile ? 20 : 24}px "Arial Black", Arial, sans-serif`;
      ctx.fillStyle = scheme.textLight;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(modeData.title, mode.x + modeWidth / 2, modeY + modeHeight * 0.4);

      ctx.font = `bold ${isMobile ? 12 : 14}px Arial, sans-serif`;
      ctx.fillStyle = scheme.textLight;
      ctx.fillText(modeData.desc, mode.x + modeWidth / 2, modeY + modeHeight * 0.7);
    });

    const buttonWidth = isMobile ? 180 : 220;
    const buttonHeight = isMobile ? 48 : 56;
    const buttonX = (this.width - buttonWidth) / 2;
    const buttonY = modalY + modalHeight - (isMobile ? 80 : 90);

    const isHovered = this.hoveredButton === 'instructions_ok';
    const isClicked = this.clickedButton === 'instructions_ok';

    let fillColor = scheme.buttonPrimary;
    if (isHovered) {
      fillColor = this.lightenColor(scheme.buttonPrimary, 0.15);
    }

    let scale = 1;
    if (isHovered) scale = 1.02;
    if (isClicked) scale = 0.95;

    const scaledWidth = buttonWidth * scale;
    const scaledHeight = buttonHeight * scale;
    const scaledX = (this.width - scaledWidth) / 2;
    const scaledY = buttonY + (buttonHeight - scaledHeight) / 2;

    const shadowOffset = isClicked ? 2 : (isHovered ? 8 : 6);
    this.drawBrutalismRect(ctx, scaledX, scaledY, scaledWidth, scaledHeight, fillColor, {
      shadowOffset: shadowOffset,
      borderWidth: 4
    });

    ctx.fillStyle = scheme.textLight;
    ctx.font = `bold ${isMobile ? 18 : 20}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('知道了', this.width / 2, scaledY + scaledHeight / 2);
  }

  renderAchievements(ctx) {
    const scheme = this.getScheme();
    const isMobile = this.width < 768;

    ctx.fillStyle = `rgba(0, 0, 0, 0.8)`;
    ctx.fillRect(0, 0, this.width, this.height);

    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
    const modalWidth = isMobile ? this.width - 20 : Math.min(500, this.width - 40);
    const modalHeight = isMobile ? this.height - topSafeArea - bottomSafeArea - 20 : this.height - 80;
    const modalX = (this.width - modalWidth) / 2;
    const modalY = isMobile ? topSafeArea + 10 : (this.height - modalHeight) / 2;

    this.drawBrutalismRect(ctx, modalX, modalY, modalWidth, modalHeight, scheme.cardBg, {
      shadowOffset: 8,
      borderWidth: 0
    });

    const titleY = modalY + (isMobile ? 40 : 50);
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 28 : 34}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('成就', this.width / 2, titleY);

    const titleWidth = ctx.measureText('成就').width;
    ctx.strokeStyle = scheme.buttonSuccess;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.width / 2 - titleWidth / 2 - 20, titleY + 25);
    ctx.lineTo(this.width / 2 + titleWidth / 2 + 20, titleY + 25);
    ctx.stroke();

    if (this.achievementsData) {
      this.renderAchievementsList(ctx, modalX, modalY, modalWidth, modalHeight, isMobile);
    }

    const buttonWidth = isMobile ? 180 : 220;
    const buttonHeight = isMobile ? 48 : 56;
    const buttonX = (this.width - buttonWidth) / 2;
    const buttonY = modalY + modalHeight - (isMobile ? 70 : 80);

    const isHovered = this.hoveredButton === 'achievements_close';
    const isClicked = this.clickedButton === 'achievements_close';

    let fillColor = scheme.buttonPrimary;
    if (isHovered) {
      fillColor = this.lightenColor(scheme.buttonPrimary, 0.15);
    }

    let scale = 1;
    if (isHovered) scale = 1.02;
    if (isClicked) scale = 0.95;

    const scaledWidth = buttonWidth * scale;
    const scaledHeight = buttonHeight * scale;
    const scaledX = (this.width - scaledWidth) / 2;
    const scaledY = buttonY + (buttonHeight - scaledHeight) / 2;

    const shadowOffset = isClicked ? 2 : (isHovered ? 8 : 6);
    this.drawBrutalismRect(ctx, scaledX, scaledY, scaledWidth, scaledHeight, fillColor, {
      shadowOffset: shadowOffset,
      borderWidth: 4
    });

    ctx.fillStyle = scheme.textLight;
    ctx.font = `bold ${isMobile ? 18 : 20}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('返回', this.width / 2, scaledY + scaledHeight / 2);
  }

  renderAchievementsList(ctx, modalX, modalY, modalWidth, modalHeight, isMobile) {
    const scheme = this.getScheme();
    const achievements = this.achievementsData;

    if (!achievements || achievements.length === 0) return;

    const listStartY = modalY + (isMobile ? 90 : 110);
    const listEndY = modalY + modalHeight - (isMobile ? 90 : 100);
    const listHeight = listEndY - listStartY;
    const itemHeight = isMobile ? 70 : 80;
    const itemPadding = isMobile ? 8 : 10;
    const itemWidth = modalWidth - (isMobile ? 20 : 30);
    const itemX = modalX + (isMobile ? 10 : 15);

    ctx.save();
    ctx.beginPath();
    ctx.rect(modalX, listStartY - 10, modalWidth, listHeight + 10);
    ctx.clip();

    const totalHeight = achievements.length * (itemHeight + itemPadding);
    const maxScroll = Math.max(0, totalHeight - listHeight);
    this.achievementScrollOffset = Math.max(0, Math.min(this.achievementScrollOffset, maxScroll));

    achievements.forEach((achievement, index) => {
      const itemY = listStartY + index * (itemHeight + itemPadding) - this.achievementScrollOffset;

      if (itemY + itemHeight < listStartY || itemY > listEndY) return;

      const isHidden = achievement.hidden && !achievement.unlocked;
      const bgColor = achievement.unlocked ? scheme.buttonSuccess : scheme.cardBg;
      const alpha = achievement.unlocked ? 1 : 0.6;

      ctx.save();
      ctx.globalAlpha = alpha;

      this.drawBrutalismRect(ctx, itemX, itemY, itemWidth, itemHeight, bgColor, {
        shadowOffset: achievement.unlocked ? 4 : 2,
        borderWidth: achievement.unlocked ? 3 : 2
      });

      ctx.font = `bold ${isMobile ? 28 : 32}px Arial, sans-serif`;
      ctx.fillStyle = achievement.unlocked ? scheme.textLight : scheme.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(isHidden ? '❓' : achievement.icon, itemX + (isMobile ? 12 : 15), itemY + itemHeight / 2);

      ctx.font = `bold ${isMobile ? 16 : 18}px "Arial Black", Arial, sans-serif`;
      ctx.fillText(isHidden ? '？？？' : achievement.name, itemX + (isMobile ? 55 : 65), itemY + (isMobile ? 22 : 25));

      if (!isHidden) {
        ctx.font = `${isMobile ? 12 : 14}px Arial, sans-serif`;
        ctx.fillStyle = achievement.unlocked ? scheme.textLight : scheme.text;
        ctx.globalAlpha = achievement.unlocked ? 0.9 : 0.5;
        ctx.fillText(achievement.description, itemX + (isMobile ? 55 : 65), itemY + (isMobile ? 45 : 50));
      } else {
        ctx.font = `${isMobile ? 12 : 14}px Arial, sans-serif`;
        ctx.fillStyle = scheme.text;
        ctx.globalAlpha = 0.5;
        ctx.fillText('完成神秘挑战解锁', itemX + (isMobile ? 55 : 65), itemY + (isMobile ? 45 : 50));
      }

      if (!achievement.unlocked && achievement.progress !== undefined && achievement.target !== undefined && !isHidden) {
        const progressText = `${achievement.progress}/${achievement.target}`;
        ctx.font = `bold ${isMobile ? 12 : 14}px Arial, sans-serif`;
        ctx.fillStyle = scheme.accent;
        ctx.globalAlpha = 1;
        ctx.textAlign = 'right';
        ctx.fillText(progressText, itemX + itemWidth - (isMobile ? 12 : 15), itemY + (isMobile ? 45 : 50));
      }

      if (achievement.unlocked && achievement.reward) {
        const rewardText = `+${achievement.reward.amount}金币`;
        ctx.font = `bold ${isMobile ? 12 : 14}px Arial, sans-serif`;
        ctx.fillStyle = scheme.textLight;
        ctx.globalAlpha = 0.8;
        ctx.textAlign = 'right';
        ctx.fillText(rewardText, itemX + itemWidth - (isMobile ? 12 : 15), itemY + (isMobile ? 45 : 50));
      }

      ctx.restore();
    });

    ctx.restore();

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    const progressText = `已解锁: ${unlockedCount}/${totalCount}`;

    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 14 : 16}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(progressText, this.width / 2, modalY + (isMobile ? 70 : 85));
  }

  handleAchievementsScroll(deltaY) {
    if (!this.showAchievements) return;
    
    this.achievementScrollOffset += deltaY;
    this.scrollVelocity = deltaY;
    this.lastScrollTime = Date.now();
  }

  handleTouchStart(y) {
    if (this.showShop) {
      this.handleShopTouchStart(y);
      return;
    }
    if (!this.showAchievements) return;
    this.touchStartY = y;
    this.lastTouchY = y;
    this.isTouching = true;
    this.scrollVelocity = 0;
    this.lastScrollDelta = 0;
  }

  handleTouchMove(y) {
    if (this.showShop) {
      this.handleShopTouchMove(y);
      return;
    }
    if (!this.showAchievements || !this.isTouching) return;
    
    const now = Date.now();
    const deltaTime = now - this.lastScrollTime;
    const deltaY = this.lastTouchY - y;
    this.lastTouchY = y;
    this.lastScrollTime = now;
    
    const isMobile = this.width < 768;
    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
    const modalHeight = isMobile ? this.height - topSafeArea - bottomSafeArea - 20 : this.height - 80;
    const modalY = isMobile ? topSafeArea + 10 : (this.height - modalHeight) / 2;
    const listStartY = modalY + (isMobile ? 90 : 110);
    const listEndY = modalY + modalHeight - (isMobile ? 90 : 100);

    if (y >= listStartY && y <= listEndY) {
      this.achievementScrollOffset += deltaY;
      
      if (deltaTime > 0) {
        this.scrollVelocity = deltaY / deltaTime * 16;
      }
      this.lastScrollDelta = deltaY;
    }
  }

  handleTouchEnd() {
    if (this.showShop) {
      this.handleShopTouchEnd();
      return;
    }
    this.isTouching = false;
  }

  updateScrollInertia(deltaTime) {
    if (!this.showAchievements || this.isTouching) return;

    if (Math.abs(this.scrollVelocity) > this.scrollMinVelocity) {
      this.achievementScrollOffset += this.scrollVelocity;
      this.scrollVelocity *= this.scrollFriction;
    } else {
      this.scrollVelocity = 0;
    }
  }

  // ── Score History ──

  handleScoreHistoryScroll(deltaY) {
    if (!this.showScoreHistory) return;
    this.scoreHistoryScrollOffset += deltaY;
    this.scoreHistoryScrollVelocity = deltaY;
    this.scoreHistoryLastScrollTime = Date.now();
  }

  handleScoreHistoryTouchStart(y) {
    if (!this.showScoreHistory) return;
    this.scoreHistoryTouchStartY = y;
    this.scoreHistoryLastTouchY = y;
    this.scoreHistoryIsTouching = true;
    this.scoreHistoryScrollVelocity = 0;
    this.scoreHistoryLastScrollDelta = 0;
  }

  handleScoreHistoryTouchMove(y) {
    if (!this.showScoreHistory || !this.scoreHistoryIsTouching) return;

    const now = Date.now();
    const deltaY = this.scoreHistoryLastTouchY - y;
    this.scoreHistoryLastTouchY = y;

    const isMobile = this.width < 768;
    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
    const modalHeight = isMobile ? this.height - topSafeArea - bottomSafeArea - 20 : this.height - 80;
    const modalY = isMobile ? topSafeArea + 10 : (this.height - modalHeight) / 2;
    const listStartY = modalY + (isMobile ? 130 : 150);
    const listEndY = modalY + modalHeight - (isMobile ? 80 : 90);

    if (y >= listStartY && y <= listEndY) {
      this.scoreHistoryScrollOffset += deltaY;
      this.scoreHistoryScrollVelocity = deltaY;
      this.scoreHistoryLastScrollTime = now;
    }
  }

  handleScoreHistoryTouchEnd() {
    this.scoreHistoryIsTouching = false;
  }

  updateScoreHistoryScrollInertia(deltaTime) {
    if (!this.showScoreHistory || this.scoreHistoryIsTouching) return;

    if (Math.abs(this.scoreHistoryScrollVelocity) > 0.5) {
      this.scoreHistoryScrollOffset += this.scoreHistoryScrollVelocity;
      this.scoreHistoryScrollVelocity *= 0.95;
    } else {
      this.scoreHistoryScrollVelocity = 0;
    }
  }

  truncateText(text, max) {
    if (!text) return '';
    if (text.length <= max) return text;
    return text.substring(0, max) + '...';
  }

  renderScoreHistory(ctx) {
    const scheme = this.getScheme();
    const isMobile = this.width < 768;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.width, this.height);

    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
    const modalWidth = isMobile ? this.width - 20 : Math.min(500, this.width - 40);
    const modalHeight = isMobile ? this.height - topSafeArea - bottomSafeArea - 20 : this.height - 80;
    const modalX = (this.width - modalWidth) / 2;
    const modalY = isMobile ? topSafeArea + 10 : (this.height - modalHeight) / 2;

    this.drawBrutalismRect(ctx, modalX, modalY, modalWidth, modalHeight, scheme.cardBg, {
      shadowOffset: 8,
      borderWidth: 0
    });

    // Title
    const titleY = modalY + (isMobile ? 40 : 50);
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 28 : 34}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('历史最高分', this.width / 2, titleY);

    const titleWidth = ctx.measureText('历史最高分').width;
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.width / 2 - titleWidth / 2 - 20, titleY + 25);
    ctx.lineTo(this.width / 2 + titleWidth / 2 + 20, titleY + 25);
    ctx.stroke();

    // Tab switcher
    this.drawScoreHistoryTabs(ctx, modalX, modalY, modalWidth, isMobile);

    // Score list
    this.renderScoreHistoryList(ctx, modalX, modalY, modalWidth, modalHeight, isMobile);

    // Close button
    const buttonWidth = isMobile ? 180 : 220;
    const buttonHeight = isMobile ? 48 : 56;
    const buttonX = (this.width - buttonWidth) / 2;
    const buttonY = modalY + modalHeight - (isMobile ? 70 : 80);

    const isHovered = this.hoveredButton === 'scoreHistory_close';
    const isClicked = this.clickedButton === 'scoreHistory_close';

    let fillColor = scheme.buttonPrimary;
    if (isHovered) fillColor = this.lightenColor(scheme.buttonPrimary, 0.15);

    let scale = 1;
    if (isHovered) scale = 1.02;
    if (isClicked) scale = 0.95;

    const scaledWidth = buttonWidth * scale;
    const scaledHeight = buttonHeight * scale;
    const scaledX = (this.width - scaledWidth) / 2;
    const scaledY = buttonY + (buttonHeight - scaledHeight) / 2;

    this.drawBrutalismRect(ctx, scaledX, scaledY, scaledWidth, scaledHeight, fillColor, {
      shadowOffset: isClicked ? 2 : (isHovered ? 8 : 6),
      borderWidth: 4
    });

    ctx.fillStyle = scheme.textLight;
    ctx.font = `bold ${isMobile ? 18 : 20}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('返回', this.width / 2, scaledY + scaledHeight / 2);
  }

  drawScoreHistoryTabs(ctx, modalX, modalY, modalWidth, isMobile) {
    const scheme = this.getScheme();
    const tabY = modalY + (isMobile ? 75 : 90);
    const tabWidth = (modalWidth - (isMobile ? 30 : 40)) / 2;
    const tabHeight = isMobile ? 38 : 44;
    const tabGap = isMobile ? 10 : 12;
    const tabStartX = modalX + (isMobile ? 15 : 20);

    const tabs = [
      { id: 1, label: '第一关 Top10' },
      { id: 2, label: '第二关 Top10' }
    ];

    tabs.forEach((tab, index) => {
      const isActive = this.scoreHistoryTab === tab.id;
      const tabX = tabStartX + index * (tabWidth + tabGap);
      const isHovered = this.hoveredButton === `scoreTab_${tab.id}`;
      const isClicked = this.clickedButton === `scoreTab_${tab.id}`;

      let bgColor = isActive ? '#FBBF24' : scheme.cardBg;
      if (!isActive && isHovered) bgColor = 'rgba(91, 168, 143, 0.1)';

      let scale = 1;
      if (isClicked) scale = 0.95;

      const sw = tabWidth * scale;
      const sh = tabHeight * scale;
      const sx = tabX + (tabWidth - sw) / 2;
      const sy = tabY + (tabHeight - sh) / 2;

      this.drawBrutalismRect(ctx, sx, sy, sw, sh, bgColor, {
        shadowOffset: isActive ? 4 : 2,
        borderWidth: isActive ? 3 : 2,
        radius: 14
      });

      ctx.fillStyle = isActive ? '#FFFFFF' : scheme.text;
      ctx.font = `bold ${isMobile ? 14 : 16}px "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tab.label, tabX + tabWidth / 2, tabY + tabHeight / 2);
    });
  }

  renderScoreHistoryList(ctx, modalX, modalY, modalWidth, modalHeight, isMobile) {
    const scheme = this.getScheme();
    const scores = this.scoreHistoryData[this.scoreHistoryTab] || [];

    const listStartY = modalY + (isMobile ? 130 : 150);
    const listEndY = modalY + modalHeight - (isMobile ? 80 : 90);
    const listHeight = listEndY - listStartY;
    const itemHeight = isMobile ? 60 : 68;
    const itemPadding = isMobile ? 6 : 8;
    const itemWidth = modalWidth - (isMobile ? 20 : 30);
    const itemX = modalX + (isMobile ? 10 : 15);

    ctx.save();
    ctx.beginPath();
    ctx.rect(modalX, listStartY, modalWidth, listHeight);
    ctx.clip();

    const totalHeight = scores.length * (itemHeight + itemPadding);
    const maxScroll = Math.max(0, totalHeight - listHeight);
    this.scoreHistoryScrollOffset = Math.max(0, Math.min(this.scoreHistoryScrollOffset, maxScroll));

    if (scores.length === 0) {
      ctx.fillStyle = scheme.textSecondary;
      ctx.font = `${isMobile ? 16 : 18}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无记录，快去挑战吧！', this.width / 2, listStartY + listHeight / 2);
    }

    const medals = ['#FBBF24', '#3B82F6', '#10B981'];

    scores.forEach((score, index) => {
      const itemY = listStartY + index * (itemHeight + itemPadding) - this.scoreHistoryScrollOffset;

      if (itemY + itemHeight < listStartY || itemY > listEndY) return;

      const isTop3 = index < 3;
      const bgColor = isTop3 ? 'rgba(255, 252, 245, 0.95)' : scheme.cardBg;

      this.drawBrutalismRect(ctx, itemX, itemY, itemWidth, itemHeight, bgColor, {
        shadowOffset: isTop3 ? 4 : 2,
        borderWidth: isTop3 ? 3 : 2
      });

      // Rank number
      const rankX = itemX + (isMobile ? 14 : 18);
      const rankY = itemY + itemHeight / 2;

      if (isTop3) {
        ctx.beginPath();
        ctx.arc(rankX, rankY, isMobile ? 16 : 18, 0, Math.PI * 2);
        ctx.fillStyle = medals[index];
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
      } else {
        ctx.fillStyle = scheme.textSecondary;
      }
      ctx.font = `bold ${isMobile ? 14 : 16}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${index + 1}`, rankX, rankY);

      // Score
      const scoreValue = score.score !== undefined ? score.score : score.numbersFound;
      const infoX = itemX + (isMobile ? 40 : 48);
      ctx.textAlign = 'left';
      ctx.font = `${isMobile ? 16 : 18}px "Arial Black", Arial, sans-serif`;
      ctx.textBaseline = 'middle';
      const scoreLineY = itemY + (isMobile ? 20 : 22);

      // "找到 " + 数量高亮 + " 个"
      ctx.fillStyle = scheme.text;
      const foundPrefix = '找到 ';
      const foundPrefixW = ctx.measureText(foundPrefix).width;
      ctx.fillText(foundPrefix, infoX, scoreLineY);

      ctx.fillStyle = scheme.accent;
      ctx.font = `bold ${isMobile ? 18 : 20}px "Arial Black", Arial, sans-serif`;
      const scoreStr = `${scoreValue}`;
      const scoreW = ctx.measureText(scoreStr).width;
      ctx.fillText(scoreStr, infoX + foundPrefixW, scoreLineY);

      ctx.fillStyle = scheme.text;
      ctx.font = `${isMobile ? 16 : 18}px "Arial Black", Arial, sans-serif`;
      ctx.fillText(' 个', infoX + foundPrefixW + scoreW, scoreLineY);

      // Time spent: "用时 " + 时间高亮 + " 秒"
      const timeLineY = itemY + (isMobile ? 42 : 46);
      ctx.font = `${isMobile ? 12 : 14}px Arial, sans-serif`;
      ctx.fillStyle = scheme.textSecondary;
      const timePrefix = '用时 ';
      const timePrefixW = ctx.measureText(timePrefix).width;
      ctx.fillText(timePrefix, infoX, timeLineY);

      ctx.fillStyle = '#F97316';
      ctx.font = `bold ${isMobile ? 14 : 16}px Arial, sans-serif`;
      const timeStr = `${score.timeSpent.toFixed(1)}`;
      const timeW = ctx.measureText(timeStr).width;
      ctx.fillText(timeStr, infoX + timePrefixW, timeLineY);

      ctx.fillStyle = scheme.textSecondary;
      ctx.font = `${isMobile ? 12 : 14}px Arial, sans-serif`;
      ctx.fillText(' 秒', infoX + timePrefixW + timeW, timeLineY);

      // Date
      if (score.timestamp) {
        const date = new Date(score.timestamp);
        const dateStr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        ctx.fillStyle = scheme.textSecondary;
        ctx.font = `${isMobile ? 11 : 12}px Arial, sans-serif`;
        ctx.textAlign = 'right';
        ctx.globalAlpha = 0.6;
        ctx.fillText(dateStr, itemX + itemWidth - (isMobile ? 12 : 15), itemY + (isMobile ? 42 : 46));
        ctx.globalAlpha = 1;
      }
    });

    ctx.restore();
  }

  // ── High Score Celebration ──

  showHighScoreCelebration(newScore, previousBest, level) {
    this.highScoreCelebration = {
      newScore,
      previousBest,
      level,
      startTime: Date.now(),
      duration: 3000,
      particles: this._createCelebrationParticles()
    };
  }

  _createCelebrationParticles() {
    const particles = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: this.width / 2,
        y: this.height / 2 - 40,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 4,
        size: Math.random() * 6 + 3,
        color: ['#3B82F6', '#EF4444', '#10B981', '#FBBF24', '#8B5CF6', '#3B82F6'][Math.floor(Math.random() * 6)],
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
    return particles;
  }

  renderHighScoreCelebration(ctx) {
    if (!this.highScoreCelebration) return;

    const celeb = this.highScoreCelebration;
    const elapsed = Date.now() - celeb.startTime;

    if (elapsed > celeb.duration) {
      this.highScoreCelebration = null;
      return;
    }

    const progress = elapsed / celeb.duration;
    const fadeIn = Math.min(1, progress * 5);
    const fadeOut = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
    const alpha = fadeIn * fadeOut;

    const scheme = this.getScheme();
    const isMobile = this.width < 768;

    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    // Particles
    celeb.particles.forEach(p => {
      p.x += p.vx * (1 - progress);
      p.y += p.vy * (1 - progress) + 0.3;
      p.rotation += p.rotationSpeed;
      p.alpha = fadeOut;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    // Celebration card
    const cardWidth = isMobile ? this.width - 60 : 360;
    const cardHeight = isMobile ? 200 : 220;
    const cardX = (this.width - cardWidth) / 2;
    const cardY = (this.height - cardHeight) / 2 - 20;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Glow
    ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
    ctx.shadowBlur = 30;
    this.drawBrutalismRect(ctx, cardX, cardY, cardWidth, cardHeight, '#FFFAF5', {
      shadowOffset: 8,
      borderWidth: 4,
      radius: 24
    });
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Trophy text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${isMobile ? 40 : 48}px Arial, sans-serif`;
    ctx.fillStyle = '#FBBF24';
    ctx.fillText('🏆', this.width / 2, cardY + (isMobile ? 45 : 55));

    ctx.font = `bold ${isMobile ? 22 : 26}px "Arial Black", Arial, sans-serif`;
    ctx.fillStyle = '#374151';
    ctx.fillText('新纪录！', this.width / 2, cardY + (isMobile ? 90 : 105));

    ctx.font = `bold ${isMobile ? 16 : 18}px Arial, sans-serif`;
    ctx.fillStyle = '#6B7280';
    const newScoreValue = celeb.newScore.score !== undefined ? celeb.newScore.score : celeb.newScore.numbersFound;
    ctx.fillText(`找到 ${newScoreValue} 个 · 用时 ${celeb.newScore.timeSpent.toFixed(1)} 秒`, this.width / 2, cardY + (isMobile ? 125 : 140));

    if (celeb.previousBest) {
      ctx.font = `${isMobile ? 13 : 14}px Arial, sans-serif`;
      ctx.fillStyle = '#6B7280';
      ctx.globalAlpha = alpha * 0.7;
      const prevScoreValue = celeb.previousBest.score !== undefined ? celeb.previousBest.score : celeb.previousBest.numbersFound;
      ctx.fillText(
        `上次最佳: ${prevScoreValue} 个 · ${celeb.previousBest.timeSpent.toFixed(1)} 秒`,
        this.width / 2, cardY + (isMobile ? 155 : 170)
      );
    }

    const levelName = celeb.level === 1 ? '第一关' : '第二关';
    ctx.font = `${isMobile ? 12 : 13}px Arial, sans-serif`;
    ctx.fillStyle = '#6B7280';
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillText(levelName, this.width / 2, cardY + (isMobile ? 180 : 200));

    ctx.restore();
  }

  updateCombo(count, level, center) {
    const previousCount = this.comboData.count;
    const previousLevel = this.comboData.level;

    this.comboData.count = count;
    this.comboData.level = level;

    if (count > 0) {
      this.comboData.animation = Math.min(1, this.comboData.animation + 0.1);
      this.comboData.scale = 1.2;
      this.comboData.glowIntensity = level ? 1 : 0.5;

      if (count > 3 && count !== previousCount) {
        this.createComboParticles(level, count, center);
        this.comboData.scale = 1.4;
      }
    } else {
      this.comboData.animation = Math.max(0, this.comboData.animation - 0.1);
      this.comboData.glowIntensity = 0;
    }
    
    if (level && level !== previousLevel) {
      // 升级闪光由 onComboLevelUp 统一处理
    }
  }

  onComboLevelUp(level, count, center) {
    this.comboData.scale = 1.6;
    this.createComboParticles(level, count, center);
  }

  onComboBreak(count, level) {
    this.comboData.breakAnimation = 1;
    this.comboData.count = 0;
    this.comboData.level = null;
  }

  createComboParticles() {
    // Click and combo particle bursts are disabled.
    this.comboParticles = [];
  }

  showCoinFlyEffect(amount, center) {
    if (this.reducedMotion) return;
    const isMobile = this.width < 768;
    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);

    const startX = center ? center.x : this.width / 2;
    const startY = center ? center.y : (isMobile ? 200 : 250);

    // 目标：金币盒子位置
    const coinBoxWidth = isMobile ? 80 : 100;
    const coinBoxHeight = isMobile ? 36 : 42;
    const buttonSize = isMobile ? 40 : 46;
    const buttonY = topSafeArea + 6;
    const coinBoxY = buttonY + (buttonSize - coinBoxHeight) / 2;
    const endX = this.width - coinBoxWidth / 2 - (isMobile ? 16 : 24);
    const endY = coinBoxY + coinBoxHeight / 2;

    const particleCount = Math.min(amount / 5, 6);
    for (let i = 0; i < particleCount; i++) {
      this.coinFlyAnimations.push({
        startX: startX + (Math.random() - 0.5) * 30,
        startY: startY + (Math.random() - 0.5) * 30,
        endX: endX,
        endY: endY,
        progress: 0,
        delay: i * 0.08,
        amount: i === 0 ? amount : 0,
        scale: 1
      });
    }
  }

  updateCoinFlyAnimations(deltaTime) {
    for (let i = this.coinFlyAnimations.length - 1; i >= 0; i--) {
      const anim = this.coinFlyAnimations[i];
      if (anim.delay > 0) {
        anim.delay -= deltaTime;
        continue;
      }
      anim.progress += deltaTime * 2.5;

      const t = Math.min(1, anim.progress);
      anim.scale = t < 0.5 ? 1 + t * 0.6 : 1.3 * (1 - (t - 0.5) * 1.6);

      if (anim.progress >= 1) {
        this.coinBoxBounce = 1;
        this.coinFlyAnimations.splice(i, 1);
      }
    }

    if (this.coinBoxBounce > 0) {
      this.coinBoxBounce = Math.max(0, this.coinBoxBounce - deltaTime * 5);
    }
  }

  renderCoinFlyAnimations(ctx) {
    for (const anim of this.coinFlyAnimations) {
      if (anim.delay > 0) continue;

      const t = Math.min(1, anim.progress);
      // 缓动函数
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const x = anim.startX + (anim.endX - anim.startX) * ease;
      // 弧线：中间向上凸起
      const arcHeight = -80;
      const baseY = anim.startY + (anim.endY - anim.startY) * ease;
      const y = baseY + arcHeight * Math.sin(t * Math.PI);

      const scale = anim.scale;
      const alpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // 金币圆形
      const r = 10;
      ctx.shadowColor = 'rgba(245, 197, 66, 0.4)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 10px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0.5);

      ctx.restore();

      // 显示金额（只在第一个粒子上）
      if (anim.amount > 0 && t < 0.6) {
        ctx.save();
        ctx.globalAlpha = 1 - t / 0.6;
        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${anim.amount}`, anim.startX, anim.startY - 20 - t * 30);
        ctx.restore();
      }
    }
  }

  updateComboEffects(deltaTime) {
    if (this.comboData.scale > 1) {
      this.comboData.scale = Math.max(1, this.comboData.scale - deltaTime * 2);
    }
    
    if (this.comboData.breakAnimation > 0) {
      this.comboData.breakAnimation = Math.max(0, this.comboData.breakAnimation - deltaTime * 3);
    }
    
    for (let i = this.comboParticles.length - 1; i >= 0; i--) {
      const particle = this.comboParticles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3;
      particle.life -= deltaTime * 2;
      particle.alpha = particle.life;
      
      if (particle.life <= 0) {
        this.comboParticles.splice(i, 1);
      }
    }
  }

  renderComboDisplay(ctx) {
    if (this.comboData.count < 4) return;
    
    const scheme = this.getScheme();
    const isMobile = this.width < 768;
    const centerX = this.width / 2;
    // 放在标题栏底部边缘，不侵入游戏区域
    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
    const headerHeight = isMobile ? Math.max(100, topSafeArea + 56) : 120;
    const centerY = headerHeight + (isMobile ? 20 : 24);
    const level = this.comboData.level;
    const color = level ? level.color : scheme.accent;
    const scale = this.comboData.scale;

    ctx.save();
    ctx.globalAlpha = 0.85;

    if (this.comboData.glowIntensity > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12 * this.comboData.glowIntensity;
    }

    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    // 紧凑尺寸，嵌入标题栏内
    const boxWidth = isMobile ? 80 : 100;
    const boxHeight = isMobile ? 28 : 32;
    const boxX = centerX - boxWidth / 2;
    const boxY = centerY - boxHeight / 2;

    this.drawBrutalismRect(ctx, boxX, boxY, boxWidth, boxHeight, color, {
      shadowOffset: 3,
      borderWidth: 2
    });

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${isMobile ? 13 : 15}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (level) {
      ctx.fillText(`${this.comboData.count}连击·${level.name}`, centerX, centerY);
    } else {
      ctx.fillText(`${this.comboData.count}连击`, centerX, centerY);
    }
    
    ctx.restore();
    
    this.renderComboParticles(ctx);
    
    if (this.comboData.breakAnimation > 0) {
      this.renderComboBreakEffect(ctx);
    }
  }

  renderComboParticles(ctx) {
    for (const particle of this.comboParticles) {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderComboBreakEffect(ctx) {
    const alpha = this.comboData.breakAnimation;
    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  flashScreen(color, intensity) {
    this.flashAlpha = intensity;
    this.flashColor = color;
  }

  showMilestoneEffect(milestone) {
    this.milestoneFlash = {
      label: milestone.label,
      color: milestone.color,
      progress: 0,
      duration: 1.2
    };
  }

  updateMilestoneFlash(deltaTime) {
    if (!this.milestoneFlash) return;
    this.milestoneFlash.progress += deltaTime;
    if (this.milestoneFlash.progress >= this.milestoneFlash.duration) {
      this.milestoneFlash = null;
    }
  }

  renderMilestoneFlash(ctx) {
    if (!this.milestoneFlash) return;

    const m = this.milestoneFlash;
    const t = m.progress / m.duration;
    const isMobile = this.width < 768;

    // 背景闪烁：快速出现慢速消失
    const bgAlpha = t < 0.15 ? (t / 0.15) * 0.3 : 0.3 * (1 - (t - 0.15) / 0.85);
    ctx.save();
    ctx.globalAlpha = Math.max(0, bgAlpha);
    ctx.fillStyle = m.color;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    // 大号飘字：缩放 + 上飘 + 渐隐
    if (t < 0.8) {
      const textAlpha = t < 0.1 ? t / 0.1 : (1 - (t - 0.1) / 0.7);
      const scale = t < 0.1 ? 0.5 + (t / 0.1) * 0.5 : 1.0;
      const floatY = t * 60;

      const cx = this.width / 2;
      const cy = this.height / 2 - floatY;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, textAlpha));
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      // 文字阴影
      ctx.shadowColor = m.color;
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${isMobile ? 52 : 68}px "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.label, 0, 0);

      ctx.restore();
    }
  }

  renderButtons(ctx) {
    const isMobile = this.width < 768;
    
    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];
      const isHovered = this.hoveredButton === button.id;
      const isClicked = this.clickedButton === button.id || (this.homePress?.button === button && this.isPointInButton(this.mouseX, this.mouseY, button));
      
      const delay = i * 0.08;
      const alpha = Math.min(1, Math.max(0, (this.menuAnimation - delay) * 3));
      
      if (alpha <= 0) continue;
      
      this.drawBrutalismButton(ctx, button, isHovered, isClicked, alpha);
    }
  }

  updateMousePosition(x, y) {
    this.mouseX = x;
    this.mouseY = y;
    this.updateModeSwitcherHover(x, y);
    this.updateHoveredButton();
  }

  updateHoveredButton() {
    this.hoveredButton = null;

    if (this.showModal && this.modalButtons) {
      for (const button of this.modalButtons) {
        if (this.mouseX >= button.x && this.mouseX <= button.x + button.width &&
            this.mouseY >= button.y && this.mouseY <= button.y + button.height) {
          this.hoveredButton = button.id;
          return;
        }
      }
      return;
    }

    const allButtons = [...this.buttons];

    if (this.headerButtons && this.gameState !== 'menu') {
      allButtons.push(...this.headerButtons);
    }

    if (this.showShop) {
      const isMobile = this.width < 768;
      const modalWidth = isMobile ? this.width - 20 : Math.min(500, this.width - 40);
      const modalHeight = isMobile ? this.height - 80 : this.height - 100;
      const modalX = (this.width - modalWidth) / 2;
      const modalY = (this.height - modalHeight) / 2;

      const closeButtonWidth = isMobile ? 180 : 220;
      const closeButtonHeight = isMobile ? 48 : 56;
      const closeButtonX = (this.width - closeButtonWidth) / 2;
      const closeButtonY = modalY + modalHeight - (isMobile ? 70 : 80);

      if (this.mouseX >= closeButtonX && this.mouseX <= closeButtonX + closeButtonWidth &&
          this.mouseY >= closeButtonY && this.mouseY <= closeButtonY + closeButtonHeight) {
        this.hoveredButton = 'shop_close';
        return;
      }

      const listStartY = modalY + (isMobile ? 90 : 110);
      const listEndY = modalY + modalHeight - (isMobile ? 120 : 140);
      const itemHeight = isMobile ? 100 : 120;
      const itemPadding = isMobile ? 12 : 15;
      const itemWidth = modalWidth - (isMobile ? 20 : 30);
      const itemX = modalX + (isMobile ? 10 : 15);

      if (this.shopProducts && this.mouseY >= listStartY && this.mouseY <= listEndY) {
        for (let i = 0; i < this.shopProducts.length; i++) {
          const product = this.shopProducts[i];
          const itemY = listStartY + i * (itemHeight + itemPadding) - this.shopScrollOffset;

          if (itemY + itemHeight < listStartY || itemY > listEndY) continue;

          const buyButtonWidth = isMobile ? 60 : 80;
          const buyButtonHeight = isMobile ? 32 : 40;
          const buyButtonX = itemX + itemWidth - buyButtonWidth - (isMobile ? 10 : 15);
          const buyButtonY = itemY + (itemHeight - buyButtonHeight) / 2;

          if (this.mouseX >= buyButtonX && this.mouseX <= buyButtonX + buyButtonWidth &&
              this.mouseY >= buyButtonY && this.mouseY <= buyButtonY + buyButtonHeight) {
            if (this.coins >= product.price) {
              this.hoveredButton = `shop_buy_${product.id}`;
              return;
            }
          }
        }
      }
      return;
    }

    if (this.showSkills) {
      const isMobile = this.width < 768;
      const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
      const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
      const modalWidth = isMobile ? this.width - 20 : Math.min(500, this.width - 40);
      const modalHeight = isMobile ? this.height - topSafeArea - bottomSafeArea - 20 : this.height - 80;
      const modalX = (this.width - modalWidth) / 2;
      const modalY = isMobile ? topSafeArea + 10 : (this.height - modalHeight) / 2;

      const closeButtonWidth = isMobile ? 180 : 220;
      const closeButtonHeight = isMobile ? 48 : 56;
      const closeButtonX = (this.width - closeButtonWidth) / 2;
      const closeButtonY = modalY + modalHeight - (isMobile ? 70 : 80);

      if (this.mouseX >= closeButtonX && this.mouseX <= closeButtonX + closeButtonWidth &&
          this.mouseY >= closeButtonY && this.mouseY <= closeButtonY + closeButtonHeight) {
        this.hoveredButton = 'skills_close';
        return;
      }

      const listStartY = modalY + (isMobile ? 90 : 110);
      const listEndY = modalY + modalHeight - (isMobile ? 140 : 160);
      const itemHeight = isMobile ? 85 : 100;
      const itemPadding = isMobile ? 10 : 12;
      const itemWidth = modalWidth - (isMobile ? 30 : 40);
      const itemX = modalX + (isMobile ? 15 : 20);

      const categoryHeaderHeight = isMobile ? 35 : 45;
      const categorySpacing = isMobile ? 20 : 25;

      if (this.skillsData && this.mouseY >= listStartY && this.mouseY <= listEndY) {
        let currentY = listStartY + categoryHeaderHeight / 2 - this.skillScrollOffset;
        const buyBtnW = isMobile ? 50 : 70;
        const buyBtnH = isMobile ? 28 : 36;
        const unlockBtnW = isMobile ? 50 : 70;
        const unlockBtnH = isMobile ? 28 : 36;

        const consumableProducts = (this.shopProducts || []).filter(p => p.id !== 'reset_game');
        const resetProduct = (this.shopProducts || []).find(p => p.id === 'reset_game');

        // ── 一次性道具悬浮 ──
        if (consumableProducts.length > 0) {
          currentY += categoryHeaderHeight;
          for (const product of consumableProducts) {
            if (currentY > listEndY) break;
            if (currentY + itemHeight < listStartY) { currentY += itemHeight + itemPadding; continue; }

            const btnX = itemX + itemWidth - buyBtnW - (isMobile ? 10 : 15);
            const btnY = currentY + (itemHeight - buyBtnH) / 2;

            if (this.mouseX >= btnX && this.mouseX <= btnX + buyBtnW &&
                this.mouseY >= btnY && this.mouseY <= btnY + buyBtnH) {
              if (this.coins >= product.price) { this.hoveredButton = `shop_buy_${product.id}`; return; }
            }
            currentY += itemHeight + itemPadding;
          }
          currentY += categorySpacing;
        }

        // ── 技能悬浮 ──
        for (const [category, skills] of this.skillsData) {
          currentY += categoryHeaderHeight;
          for (const skill of skills) {
            if (currentY > listEndY) break;
            if (currentY + itemHeight < listStartY) { currentY += itemHeight + itemPadding; continue; }

            const btnX = itemX + itemWidth - unlockBtnW - (isMobile ? 10 : 15);
            const btnY = currentY + (itemHeight - unlockBtnH) / 2;

            if (this.mouseX >= btnX && this.mouseX <= btnX + unlockBtnW &&
                this.mouseY >= btnY && this.mouseY <= btnY + unlockBtnH) {
              if (skill.canUnlock && !skill.isUnlocked) { this.hoveredButton = `skill_unlock_${skill.id}`; return; }
            }
            currentY += itemHeight + itemPadding;
          }
          currentY += categorySpacing;
        }

        // ── 特殊（时光倒流）悬浮 ──
        if (resetProduct) {
          currentY += categoryHeaderHeight;
          if (currentY <= listEndY && currentY + itemHeight >= listStartY) {
            const btnX = itemX + itemWidth - buyBtnW - (isMobile ? 10 : 15);
            const btnY = currentY + (itemHeight - buyBtnH) / 2;
            if (this.mouseX >= btnX && this.mouseX <= btnX + buyBtnW &&
                this.mouseY >= btnY && this.mouseY <= btnY + buyBtnH) {
              if (this.coins >= resetProduct.price) { this.hoveredButton = `shop_buy_${resetProduct.id}`; return; }
            }
          }
        }
      }
      return;
    }

    if (this.showAchievements) {
      const isMobile = this.width < 768;
      const buttonWidth = isMobile ? 180 : 220;
      const buttonHeight = isMobile ? 48 : 56;
      const modalWidth = isMobile ? this.width - 20 : Math.min(500, this.width - 40);
      const modalHeight = isMobile ? this.height - 80 : this.height - 100;
      const modalY = (this.height - modalHeight) / 2;
      const buttonX = (this.width - buttonWidth) / 2;
      const buttonY = modalY + modalHeight - (isMobile ? 70 : 80);

      if (this.mouseX >= buttonX && this.mouseX <= buttonX + buttonWidth &&
          this.mouseY >= buttonY && this.mouseY <= buttonY + buttonHeight) {
        this.hoveredButton = 'achievements_close';
      }
      return;
    }
    
    if (this.showInstructions) {
      const isMobile = this.width < 768;
      const buttonWidth = isMobile ? 180 : 220;
      const buttonHeight = isMobile ? 48 : 56;
      const modalWidth = isMobile ? Math.min(360, this.width - 40) : 480;
      const modalHeight = isMobile ? 420 : 480;
      const modalX = (this.width - modalWidth) / 2;
      const modalY = (this.height - modalHeight) / 2;
      const buttonX = (this.width - buttonWidth) / 2;
      const buttonY = modalY + modalHeight - (isMobile ? 80 : 90);

      if (this.mouseX >= buttonX && this.mouseX <= buttonX + buttonWidth &&
          this.mouseY >= buttonY && this.mouseY <= buttonY + buttonHeight) {
        this.hoveredButton = 'instructions_ok';
      }
    }
    
    if (!this.hoveredButton) {
      for (const button of allButtons) {
        if (this.isPointInButton(this.mouseX, this.mouseY, button)) {
          this.hoveredButton = button.id;
          break;
        }
      }
    }
  }

  isPointInButton(x, y, button) {
    return x >= button.x && x <= button.x + button.width &&
           y >= button.y && y <= button.y + button.height;
  }

  renderCoinsDisplay(ctx) {
    const isMobile = this.width < 768;

    const boxWidth = isMobile ? 100 : 120;
    const boxHeight = isMobile ? 36 : 42;
    const boxX = this.width - boxWidth - (isMobile ? 16 : 24);
    const boxY = isMobile ? 24 : 36;
    const radius = boxHeight / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, boxX, boxY, boxWidth, boxHeight, radius);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, boxX, boxY, boxWidth, boxHeight, radius);
    ctx.stroke();

    const coinSize = isMobile ? 24 : 28;
    const coinX = boxX + (isMobile ? 10 : 12);
    const coinY = boxY + (boxHeight - coinSize) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(245, 158, 11, 0.3)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(coinX + coinSize / 2, coinY + coinSize / 2, coinSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${isMobile ? 13 : 15}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¥', coinX + coinSize / 2, coinY + coinSize / 2 + 1);

    ctx.fillStyle = '#374151';
    ctx.font = `600 ${isMobile ? 15 : 17}px Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.coins}`, boxX + boxWidth - (isMobile ? 12 : 14), boxY + boxHeight / 2);
  }

  openShop() {
    this.showShop = true;
    this.shopScrollOffset = 0;
    this.shopScrollVelocity = 0;
    if (this.onOpenShop) {
      this.onOpenShop();
    }
  }

  closeShop() {
    this.showShop = false;
    this.initMenu();
  }

  openSkills() {
    if (this.onOpenSkills) {
      this.onOpenSkills();
    }
  }

  closeSkills() {
    this.showSkills = false;
    this.skillsData = null;
    this.skillScrollOffset = 0;
    this.skillScrollVelocity = 0;
    this.skillIsTouching = false;
    this.initMenu();
    this.menuAnimation = 1;

    this.floatingTexts = this.floatingTexts.filter(ft => ft.source !== 'skills');
  }

  renderShop(ctx) {
    const scheme = this.getScheme();
    const isMobile = this.width < 768;

    ctx.fillStyle = `rgba(0, 0, 0, 0.8)`;
    ctx.fillRect(0, 0, this.width, this.height);

    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
    const modalWidth = isMobile ? this.width - 20 : Math.min(500, this.width - 40);
    const modalHeight = isMobile ? this.height - topSafeArea - bottomSafeArea - 20 : this.height - 100;
    const modalX = (this.width - modalWidth) / 2;
    const modalY = isMobile ? topSafeArea + 10 : (this.height - modalHeight) / 2;

    this.drawBrutalismRect(ctx, modalX, modalY, modalWidth, modalHeight, scheme.cardBg, {
      shadowOffset: 8,
      borderWidth: 0
    });

    const titleY = modalY + (isMobile ? 40 : 50);
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 28 : 34}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('商店', this.width / 2, titleY);

    const titleWidth = ctx.measureText('商店').width;
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.width / 2 - titleWidth / 2 - 20, titleY + 25);
    ctx.lineTo(this.width / 2 + titleWidth / 2 + 20, titleY + 25);
    ctx.stroke();

    if (this.shopProducts) {
      this.renderShopProducts(ctx, modalX, modalY, modalWidth, modalHeight, isMobile);
    }

    const buttonWidth = isMobile ? 180 : 220;
    const buttonHeight = isMobile ? 48 : 56;
    const buttonX = (this.width - buttonWidth) / 2;
    const buttonY = modalY + modalHeight - (isMobile ? 70 : 80);

    const isHovered = this.hoveredButton === 'shop_close';
    const isClicked = this.clickedButton === 'shop_close';

    let fillColor = scheme.buttonPrimary;
    if (isHovered) {
      fillColor = this.lightenColor(scheme.buttonPrimary, 0.15);
    }

    let scale = 1;
    if (isHovered) scale = 1.02;
    if (isClicked) scale = 0.95;

    const scaledWidth = buttonWidth * scale;
    const scaledHeight = buttonHeight * scale;
    const scaledX = (this.width - scaledWidth) / 2;
    const scaledY = buttonY + (buttonHeight - scaledHeight) / 2;

    const shadowOffset = isClicked ? 2 : (isHovered ? 8 : 6);
    this.drawBrutalismRect(ctx, scaledX, scaledY, scaledWidth, scaledHeight, fillColor, {
      shadowOffset: shadowOffset,
      borderWidth: 4
    });

    ctx.fillStyle = scheme.textLight;
    ctx.font = `bold ${isMobile ? 18 : 20}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('返回', this.width / 2, scaledY + scaledHeight / 2);

    const coinsY = buttonY - (isMobile ? 20 : 25);
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 16 : 18}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`💰 金币: ${this.coins}`, this.width / 2, coinsY);
  }

  renderShopProducts(ctx, modalX, modalY, modalWidth, modalHeight, isMobile) {
    const scheme = this.getScheme();
    const products = this.shopProducts;

    if (!products || products.length === 0) return;

    const listStartY = modalY + (isMobile ? 90 : 110);
    const listEndY = modalY + modalHeight - (isMobile ? 120 : 140);
    const listHeight = listEndY - listStartY;
    const itemHeight = isMobile ? 100 : 120;
    const itemPadding = isMobile ? 12 : 15;
    const itemWidth = modalWidth - (isMobile ? 20 : 30);
    const itemX = modalX + (isMobile ? 10 : 15);

    ctx.save();
    ctx.beginPath();
    ctx.rect(modalX, listStartY, modalWidth, listHeight);
    ctx.clip();

    const totalHeight = products.length * (itemHeight + itemPadding);
    const maxScroll = Math.max(0, totalHeight - listHeight);
    this.shopScrollOffset = Math.max(0, Math.min(this.shopScrollOffset, maxScroll));

    products.forEach((product, index) => {
      const itemY = listStartY + index * (itemHeight + itemPadding) - this.shopScrollOffset;

      if (itemY + itemHeight < listStartY || itemY > listEndY) return;

      const canBuy = this.coins >= product.price;
      const bgColor = scheme.cardBg;

      this.drawBrutalismRect(ctx, itemX, itemY, itemWidth, itemHeight, bgColor, {
        shadowOffset: 2,
        borderWidth: 1
      });

      ctx.font = `bold ${isMobile ? 36 : 44}px Arial, sans-serif`;
      ctx.fillStyle = scheme.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(product.icon, itemX + (isMobile ? 12 : 15), itemY + itemHeight / 2);

      ctx.font = `bold ${isMobile ? 18 : 20}px "Arial Black", Arial, sans-serif`;
      ctx.fillText(product.name, itemX + (isMobile ? 55 : 65), itemY + (isMobile ? 25 : 30));

      ctx.font = `${isMobile ? 12 : 14}px Arial, sans-serif`;
      ctx.fillStyle = scheme.text;
      ctx.fillText(product.description, itemX + (isMobile ? 55 : 65), itemY + (isMobile ? 50 : 55));

      const priceText = `💰 ${product.price}`;
      ctx.font = `bold ${isMobile ? 14 : 16}px "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(priceText, itemX + (isMobile ? 55 : 65), itemY + (isMobile ? 75 : 85));

      const buyButtonWidth = isMobile ? 60 : 80;
      const buyButtonHeight = isMobile ? 32 : 40;
      const buyButtonX = itemX + itemWidth - buyButtonWidth - (isMobile ? 10 : 15);
      const buyButtonY = itemY + (itemHeight - buyButtonHeight) / 2;

      const isBuyButtonHovered = this.hoveredButton === `shop_buy_${product.id}`;
      const isBuyButtonClicked = this.clickedButton === `shop_buy_${product.id}`;

      if (canBuy) {
        let buyButtonColor = scheme.buttonPrimary;
        if (isBuyButtonHovered) {
          buyButtonColor = this.lightenColor(scheme.buttonPrimary, 0.15);
        }

        let buyButtonScale = 1;
        if (isBuyButtonHovered) buyButtonScale = 1.02;
        if (isBuyButtonClicked) buyButtonScale = 0.95;

        const scaledBuyWidth = buyButtonWidth * buyButtonScale;
        const scaledBuyHeight = buyButtonHeight * buyButtonScale;
        const scaledBuyX = buyButtonX + (buyButtonWidth - scaledBuyWidth) / 2;
        const scaledBuyY = buyButtonY + (buyButtonHeight - scaledBuyHeight) / 2;

        const buyShadowOffset = isBuyButtonClicked ? 2 : (isBuyButtonHovered ? 6 : 4);
        this.drawBrutalismRect(ctx, scaledBuyX, scaledBuyY, scaledBuyWidth, scaledBuyHeight, buyButtonColor, {
          shadowOffset: buyShadowOffset,
          borderWidth: 1
        });

        ctx.fillStyle = scheme.textLight;
        ctx.font = `bold ${isMobile ? 14 : 16}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('购买', scaledBuyX + scaledBuyWidth / 2, scaledBuyY + scaledBuyHeight / 2);
      } else {
        this.drawBrutalismRect(ctx, buyButtonX, buyButtonY, buyButtonWidth, buyButtonHeight, '#6B7280', {
          shadowOffset: 2,
          borderWidth: 1
        });

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${isMobile ? 12 : 14}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('金币不足', buyButtonX + buyButtonWidth / 2, buyButtonY + buyButtonHeight / 2);
      }
    });

    ctx.restore();
  }

  renderSkills(ctx) {
    const scheme = this.getScheme();
    const isMobile = this.width < 768;

    if (!this.skillsData) {
      ctx.fillStyle = `rgba(0, 0, 0, 0.8)`;
      ctx.fillRect(0, 0, this.width, this.height);
      
      ctx.fillStyle = scheme.text;
      ctx.font = `bold ${isMobile ? 20 : 24}px "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('加载中...', this.width / 2, this.height / 2);
      return;
    }

    ctx.fillStyle = `rgba(0, 0, 0, 0.8)`;
    ctx.fillRect(0, 0, this.width, this.height);

    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
    const modalWidth = isMobile ? this.width - 20 : Math.min(500, this.width - 40);
    const modalHeight = isMobile ? this.height - topSafeArea - bottomSafeArea - 20 : this.height - 80;
    const modalX = (this.width - modalWidth) / 2;
    const modalY = isMobile ? topSafeArea + 10 : (this.height - modalHeight) / 2;

    this.drawBrutalismRect(ctx, modalX, modalY, modalWidth, modalHeight, scheme.cardBg, {
      shadowOffset: 8,
      borderWidth: 0
    });

    const titleY = modalY + (isMobile ? 40 : 50);
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 28 : 34}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('技能', this.width / 2, titleY);

    const titleWidth = ctx.measureText('技能').width;
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.width / 2 - titleWidth / 2 - 20, titleY + 25);
    ctx.lineTo(this.width / 2 + titleWidth / 2 + 20, titleY + 25);
    ctx.stroke();

    if (this.skillsData) {
      this.renderSkillsCategories(ctx, modalX, modalY, modalWidth, modalHeight, isMobile);
    }

    const buttonWidth = isMobile ? 180 : 220;
    const buttonHeight = isMobile ? 48 : 56;
    const buttonX = (this.width - buttonWidth) / 2;
    const buttonY = modalY + modalHeight - (isMobile ? 70 : 80);

    const isHovered = this.hoveredButton === 'skills_close';
    const isClicked = this.clickedButton === 'skills_close';

    let fillColor = scheme.buttonPrimary;
    if (isHovered) {
      fillColor = this.lightenColor(scheme.buttonPrimary, 0.15);
    }

    let scale = 1;
    if (isHovered) scale = 1.02;
    if (isClicked) scale = 0.95;

    const scaledWidth = buttonWidth * scale;
    const scaledHeight = buttonHeight * scale;
    const scaledX = (this.width - scaledWidth) / 2;
    const scaledY = buttonY + (buttonHeight - scaledHeight) / 2;

    const shadowOffset = isClicked ? 2 : (isHovered ? 8 : 6);
    this.drawBrutalismRect(ctx, scaledX, scaledY, scaledWidth, scaledHeight, fillColor, {
      shadowOffset: shadowOffset,
      borderWidth: 4
    });

    ctx.fillStyle = scheme.textLight;
    ctx.font = `bold ${isMobile ? 18 : 20}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('返回', this.width / 2, scaledY + scaledHeight / 2);

    const coinsY = buttonY - (isMobile ? 20 : 25);
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isMobile ? 16 : 18}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`💰 金币: ${this.coins}`, this.width / 2, coinsY);
  }

  renderSkillsCategories(ctx, modalX, modalY, modalWidth, modalHeight, isMobile) {
    const scheme = this.getScheme();
    const listStartY = modalY + (isMobile ? 90 : 110);
    const listEndY = modalY + modalHeight - (isMobile ? 140 : 160);
    const listHeight = listEndY - listStartY;

    const itemHeight = isMobile ? 85 : 100;
    const itemPadding = isMobile ? 10 : 12;
    const categoryHeaderHeight = isMobile ? 35 : 45;
    const categorySpacing = isMobile ? 20 : 25;

    // 裁剪列表区域，防止内容溢出
    ctx.save();
    ctx.beginPath();
    ctx.rect(modalX, listStartY, modalWidth, listHeight);
    ctx.clip();

    const categoryNames = {
      'time': '时间技能',
      'combo': '连击技能',
      'assist': '辅助技能'
    };

    let currentY = listStartY + categoryHeaderHeight / 2 - this.skillScrollOffset;

    // ── 一次性道具（非时光倒流的商店商品）──
    const consumableProducts = (this.shopProducts || []).filter(p => p.id !== 'reset_game');
    const resetProduct = (this.shopProducts || []).find(p => p.id === 'reset_game');

    if (consumableProducts.length > 0) {
      if (currentY + categoryHeaderHeight > listStartY && currentY < listEndY) {
        ctx.fillStyle = scheme.text;
        ctx.font = `bold ${isMobile ? 20 : 24}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('一次性道具', modalX + (isMobile ? 15 : 20), currentY);
      }
      currentY += categoryHeaderHeight;

      for (const product of consumableProducts) {
        if (currentY > listEndY) break;
        if (currentY + itemHeight < listStartY) {
          currentY += itemHeight + itemPadding;
          continue;
        }

        const itemWidth = modalWidth - (isMobile ? 30 : 40);
        const itemX = modalX + (isMobile ? 15 : 20);
        const canBuy = this.coins >= product.price;

        this.drawBrutalismRect(ctx, itemX, currentY, itemWidth, itemHeight, scheme.cardBg, {
          shadowOffset: 2, borderWidth: 1
        });

        ctx.font = `bold ${isMobile ? 32 : 40}px Arial, sans-serif`;
        ctx.fillStyle = scheme.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(product.icon, itemX + (isMobile ? 12 : 15), currentY + itemHeight / 2);

        ctx.font = `bold ${isMobile ? 16 : 18}px "Arial Black", Arial, sans-serif`;
        ctx.fillText(product.name, itemX + (isMobile ? 50 : 60), currentY + (isMobile ? 20 : 25));

        ctx.font = `${isMobile ? 11 : 13}px Arial, sans-serif`;
        ctx.fillText(product.description, itemX + (isMobile ? 50 : 60), currentY + (isMobile ? 45 : 50));

        const priceText = `💰 ${product.price}`;
        ctx.font = `bold ${isMobile ? 12 : 14}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(priceText, itemX + (isMobile ? 50 : 60), currentY + (isMobile ? 70 : 78));

        const buyButtonWidth = isMobile ? 50 : 70;
        const buyButtonHeight = isMobile ? 28 : 36;
        const buyButtonX = itemX + itemWidth - buyButtonWidth - (isMobile ? 10 : 15);
        const buyButtonY = currentY + (itemHeight - buyButtonHeight) / 2;

        const isBuyButtonHovered = this.hoveredButton === `shop_buy_${product.id}`;
        const isBuyButtonClicked = this.clickedButton === `shop_buy_${product.id}`;

        if (canBuy) {
          let buyButtonColor = '#F97316';
          if (isBuyButtonHovered) buyButtonColor = this.lightenColor('#F97316', 0.15);
          let buyButtonScale = 1;
          if (isBuyButtonHovered) buyButtonScale = 1.02;
          if (isBuyButtonClicked) buyButtonScale = 0.95;

          const scaledBuyWidth = buyButtonWidth * buyButtonScale;
          const scaledBuyHeight = buyButtonHeight * buyButtonScale;
          const scaledBuyX = buyButtonX + (buyButtonWidth - scaledBuyWidth) / 2;
          const scaledBuyY = buyButtonY + (buyButtonHeight - scaledBuyHeight) / 2;

          const buyShadowOffset = isBuyButtonClicked ? 2 : (isBuyButtonHovered ? 6 : 4);
          this.drawBrutalismRect(ctx, scaledBuyX, scaledBuyY, scaledBuyWidth, scaledBuyHeight, buyButtonColor, {
            shadowOffset: buyShadowOffset, borderWidth: 1
          });

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${isMobile ? 12 : 14}px "Arial Black", Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('购买', scaledBuyX + scaledBuyWidth / 2, scaledBuyY + scaledBuyHeight / 2);
        } else {
          this.drawBrutalismRect(ctx, buyButtonX, buyButtonY, buyButtonWidth, buyButtonHeight, '#6B7280', {
            shadowOffset: 2, borderWidth: 1
          });

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${isMobile ? 10 : 12}px "Arial Black", Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('金币不足', buyButtonX + buyButtonWidth / 2, buyButtonY + buyButtonHeight / 2);
        }

        currentY += itemHeight + itemPadding;
      }

      currentY += categorySpacing;
    }

    // ── 技能分类 ──
    for (const [category, skills] of this.skillsData) {

      if (currentY + categoryHeaderHeight > listStartY && currentY < listEndY) {
        ctx.fillStyle = scheme.text;
        ctx.font = `bold ${isMobile ? 20 : 24}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(categoryNames[category] || category, modalX + (isMobile ? 15 : 20), currentY);
      }

      currentY += categoryHeaderHeight;

      for (const skill of skills) {
        if (currentY > listEndY) break;

        if (currentY + itemHeight < listStartY) {
          currentY += itemHeight + itemPadding;
          continue;
        }

        const itemWidth = modalWidth - (isMobile ? 30 : 40);
        const itemX = modalX + (isMobile ? 15 : 20);

        this.drawBrutalismRect(ctx, itemX, currentY, itemWidth, itemHeight, scheme.cardBg, {
          shadowOffset: 2, borderWidth: 1
        });

        ctx.font = `bold ${isMobile ? 32 : 40}px Arial, sans-serif`;
        ctx.fillStyle = skill.isUnlocked ? '#FBBF24' : scheme.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(skill.icon || '⭐', itemX + (isMobile ? 12 : 15), currentY + itemHeight / 2);

        ctx.font = `bold ${isMobile ? 16 : 18}px "Arial Black", Arial, sans-serif`;
        ctx.fillStyle = scheme.text;
        ctx.fillText(skill.name, itemX + (isMobile ? 50 : 60), currentY + (isMobile ? 20 : 25));

        ctx.font = `${isMobile ? 11 : 13}px Arial, sans-serif`;
        ctx.fillText(skill.description, itemX + (isMobile ? 50 : 60), currentY + (isMobile ? 45 : 50));

        const costText = skill.isUnlocked ? '' : `💰 ${(skill.cost !== undefined && skill.cost !== null) ? skill.cost.toString() : '???'}`;
        ctx.font = `bold ${isMobile ? 12 : 14}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(costText, itemX + (isMobile ? 50 : 60), currentY + (isMobile ? 70 : 78));

        const unlockButtonWidth = isMobile ? 50 : 70;
        const unlockButtonHeight = isMobile ? 28 : 36;
        const unlockButtonX = itemX + itemWidth - unlockButtonWidth - (isMobile ? 10 : 15);
        const unlockButtonY = currentY + (itemHeight - unlockButtonHeight) / 2;

        const isUnlockButtonHovered = this.hoveredButton === `skill_unlock_${skill.id}`;
        const isUnlockButtonClicked = this.clickedButton === `skill_unlock_${skill.id}`;

        if (skill.isUnlocked) {
          ctx.fillStyle = '#FBBF24';
          ctx.font = `bold ${isMobile ? 12 : 14}px "Arial Black", Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('已解锁', unlockButtonX + unlockButtonWidth / 2, unlockButtonY + unlockButtonHeight / 2);
        } else if (skill.canUnlock) {
          let unlockButtonColor = '#F97316';
          if (isUnlockButtonHovered) unlockButtonColor = this.lightenColor('#F97316', 0.15);

          let unlockButtonScale = 1;
          if (isUnlockButtonHovered) unlockButtonScale = 1.02;
          if (isUnlockButtonClicked) unlockButtonScale = 0.95;

          const scaledUnlockWidth = unlockButtonWidth * unlockButtonScale;
          const scaledUnlockHeight = unlockButtonHeight * unlockButtonScale;
          const scaledUnlockX = unlockButtonX + (unlockButtonWidth - scaledUnlockWidth) / 2;
          const scaledUnlockY = unlockButtonY + (unlockButtonHeight - scaledUnlockHeight) / 2;

          const unlockShadowOffset = isUnlockButtonClicked ? 2 : (isUnlockButtonHovered ? 6 : 4);
          this.drawBrutalismRect(ctx, scaledUnlockX, scaledUnlockY, scaledUnlockWidth, scaledUnlockHeight, unlockButtonColor, {
            shadowOffset: unlockShadowOffset, borderWidth: 1
          });

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${isMobile ? 12 : 14}px "Arial Black", Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('解锁', scaledUnlockX + scaledUnlockWidth / 2, scaledUnlockY + scaledUnlockHeight / 2);
        } else {
          this.drawBrutalismRect(ctx, unlockButtonX, unlockButtonY, unlockButtonWidth, unlockButtonHeight, '#6B7280', {
            shadowOffset: 2, borderWidth: 1
          });

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${isMobile ? 10 : 12}px "Arial Black", Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          let unlockReason = '金币不足';
          if (skill.prerequisite) {
            const prerequisiteSkill = this.skillsData.get(skill.category)?.find(s => s.id === skill.prerequisite);
            if (prerequisiteSkill && !prerequisiteSkill.isUnlocked) {
              unlockReason = '需前置';
            }
          }
          ctx.fillText(unlockReason, unlockButtonX + unlockButtonWidth / 2, unlockButtonY + unlockButtonHeight / 2);
        }

        currentY += itemHeight + itemPadding;
      }

      currentY += categorySpacing;
    }

    // ── 特殊（时光倒流）──
    if (resetProduct) {
      if (currentY + categoryHeaderHeight > listStartY && currentY < listEndY) {
        ctx.fillStyle = scheme.text;
        ctx.font = `bold ${isMobile ? 20 : 24}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('特殊', modalX + (isMobile ? 15 : 20), currentY);
      }
      currentY += categoryHeaderHeight;

      const itemWidth = modalWidth - (isMobile ? 30 : 40);
      const itemX = modalX + (isMobile ? 15 : 20);
      const canBuy = this.coins >= resetProduct.price;

      this.drawBrutalismRect(ctx, itemX, currentY, itemWidth, itemHeight, scheme.cardBg, {
        shadowOffset: 2, borderWidth: 1
      });

      ctx.font = `bold ${isMobile ? 32 : 40}px Arial, sans-serif`;
      ctx.fillStyle = scheme.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(resetProduct.icon, itemX + (isMobile ? 12 : 15), currentY + itemHeight / 2);

      ctx.font = `bold ${isMobile ? 16 : 18}px "Arial Black", Arial, sans-serif`;
      ctx.fillText(resetProduct.name, itemX + (isMobile ? 50 : 60), currentY + (isMobile ? 20 : 25));

      ctx.font = `${isMobile ? 11 : 13}px Arial, sans-serif`;
      ctx.fillText(resetProduct.description, itemX + (isMobile ? 50 : 60), currentY + (isMobile ? 45 : 50));

      const priceText = `💰 ${resetProduct.price}`;
      ctx.font = `bold ${isMobile ? 12 : 14}px "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(priceText, itemX + (isMobile ? 50 : 60), currentY + (isMobile ? 70 : 78));

      const buyButtonWidth = isMobile ? 50 : 70;
      const buyButtonHeight = isMobile ? 28 : 36;
      const buyButtonX = itemX + itemWidth - buyButtonWidth - (isMobile ? 10 : 15);
      const buyButtonY = currentY + (itemHeight - buyButtonHeight) / 2;

      const isBuyButtonHovered = this.hoveredButton === `shop_buy_${resetProduct.id}`;
      const isBuyButtonClicked = this.clickedButton === `shop_buy_${resetProduct.id}`;

      if (canBuy) {
        let buyButtonColor = '#F97316';
        if (isBuyButtonHovered) buyButtonColor = this.lightenColor('#F97316', 0.15);
        let buyButtonScale = 1;
        if (isBuyButtonHovered) buyButtonScale = 1.02;
        if (isBuyButtonClicked) buyButtonScale = 0.95;

        const scaledBuyWidth = buyButtonWidth * buyButtonScale;
        const scaledBuyHeight = buyButtonHeight * buyButtonScale;
        const scaledBuyX = buyButtonX + (buyButtonWidth - scaledBuyWidth) / 2;
        const scaledBuyY = buyButtonY + (buyButtonHeight - scaledBuyHeight) / 2;

        const buyShadowOffset = isBuyButtonClicked ? 2 : (isBuyButtonHovered ? 6 : 4);
        this.drawBrutalismRect(ctx, scaledBuyX, scaledBuyY, scaledBuyWidth, scaledBuyHeight, buyButtonColor, {
          shadowOffset: buyShadowOffset, borderWidth: 1
        });

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${isMobile ? 12 : 14}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('购买', scaledBuyX + scaledBuyWidth / 2, scaledBuyY + scaledBuyHeight / 2);
      } else {
        this.drawBrutalismRect(ctx, buyButtonX, buyButtonY, buyButtonWidth, buyButtonHeight, '#6B7280', {
          shadowOffset: 2, borderWidth: 1
        });

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${isMobile ? 10 : 12}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('金币不足', buyButtonX + buyButtonWidth / 2, buyButtonY + buyButtonHeight / 2);
      }
    }

    ctx.restore();
  }

  handleSkillsScroll(deltaY) {
    if (!this.showSkills) return;

    this.skillScrollOffset += deltaY;
    this.skillScrollVelocity = deltaY;
    this.skillLastScrollTime = Date.now();
    this.limitSkillsScroll();
  }

  handleSkillsTouchStart(y) {
    if (!this.showSkills) return;

    this.skillTouchStartY = y;
    this.skillLastTouchY = y;
    this.skillIsTouching = true;
    this.skillScrollVelocity = 0;
    this.skillLastScrollDelta = 0;
  }

  handleSkillsTouchMove(y) {
    if (!this.showSkills || !this.skillIsTouching) return;

    const now = Date.now();
    const deltaTime = now - this.skillLastScrollTime;
    const deltaY = this.skillLastTouchY - y;
    this.skillLastTouchY = y;
    this.skillLastScrollTime = now;

    this.skillScrollOffset += deltaY;
    this.limitSkillsScroll();

    if (deltaTime > 0) {
      this.skillScrollVelocity = deltaY / deltaTime * 16;
    }
    this.skillLastScrollDelta = deltaY;
  }

  handleSkillsTouchEnd() {
    this.skillIsTouching = false;
  }

  updateSkillsScrollInertia(deltaTime) {
    if (!this.showSkills || this.skillIsTouching) return;
    
    if (Math.abs(this.skillScrollVelocity) > this.skillScrollMinVelocity) {
      this.skillScrollOffset += this.skillScrollVelocity;
      this.skillScrollVelocity *= this.skillScrollFriction;
    } else {
      this.skillScrollVelocity = 0;
    }
    
    this.limitSkillsScroll();
  }

  limitSkillsScroll() {
    if (!this.skillsData) return;

    const isMobile = this.width < 768;
    const itemHeight = isMobile ? 85 : 100;
    const categoryHeaderHeight = isMobile ? 35 : 45;
    const itemPadding = isMobile ? 10 : 12;
    const categorySpacing = isMobile ? 20 : 25;

    let totalHeight = 0;
    let sectionCount = 0;

    // 一次性道具（非时光倒流）
    const consumableProducts = (this.shopProducts || []).filter(p => p.id !== 'reset_game');
    const resetProduct = (this.shopProducts || []).find(p => p.id === 'reset_game');

    if (consumableProducts.length > 0) {
      totalHeight += categoryHeaderHeight;
      totalHeight += consumableProducts.length * (itemHeight + itemPadding);
      sectionCount++;
    }

    // 技能分类
    let skillCategoryCount = 0;
    for (const [category, skills] of this.skillsData) {
      totalHeight += categoryHeaderHeight;
      totalHeight += skills.length * (itemHeight + itemPadding);
      skillCategoryCount++;
    }
    if (skillCategoryCount > 1) {
      totalHeight += (skillCategoryCount - 1) * categorySpacing;
    }
    if (skillCategoryCount > 0) sectionCount += skillCategoryCount;

    // 特殊（时光倒流）
    if (resetProduct) {
      if (sectionCount > 0) totalHeight += categorySpacing;
      totalHeight += categoryHeaderHeight;
      totalHeight += 1 * (itemHeight + itemPadding);
      sectionCount++;
    }

    // 各 section 之间的间距
    if (sectionCount > 1 && consumableProducts.length > 0 && skillCategoryCount > 0) {
      totalHeight += categorySpacing;
    }

    const isMobile2 = this.width < 768;
    const topSafeArea2 = Math.max(this.safeArea.top, isMobile2 ? 44 : 0);
    const bottomSafeArea2 = Math.max(this.safeArea.bottom, isMobile2 ? 34 : 0);
    const modalHeight = isMobile2 ? this.height - topSafeArea2 - bottomSafeArea2 - 20 : this.height - 80;
    const modalY = isMobile2 ? topSafeArea2 + 10 : (this.height - modalHeight) / 2;
    const listStartY = modalY + (isMobile2 ? 100 : 120);
    const listEndY = modalY + modalHeight - (isMobile2 ? 130 : 150);
    const listHeight = listEndY - listStartY;
    const headerOffset = (isMobile2 ? 35 : 45) / 2;

    const maxScroll = Math.max(0, totalHeight + headerOffset - listHeight);
    this.skillScrollOffset = Math.max(0, Math.min(this.skillScrollOffset, maxScroll));
  }

  handleShopScroll(deltaY) {
    if (!this.showShop) return;
    
    this.shopScrollOffset += deltaY;
    this.shopScrollVelocity = deltaY;
    this.shopLastScrollTime = Date.now();
  }

  handleShopTouchStart(y) {
    if (!this.showShop) return;
    this.shopTouchStartY = y;
    this.shopLastTouchY = y;
    this.shopIsTouching = true;
    this.shopScrollVelocity = 0;
    this.shopLastScrollDelta = 0;
  }

  handleShopTouchMove(y) {
    if (!this.showShop || !this.shopIsTouching) return;
    
    const now = Date.now();
    const deltaTime = now - this.shopLastScrollTime;
    const deltaY = this.shopLastTouchY - y;
    this.shopLastTouchY = y;
    this.shopLastScrollTime = now;
    
    const isMobile = this.width < 768;
    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
    const modalHeight = isMobile ? this.height - topSafeArea - bottomSafeArea - 20 : this.height - 100;
    const modalY = isMobile ? topSafeArea + 10 : (this.height - modalHeight) / 2;
    const listStartY = modalY + (isMobile ? 90 : 110);
    const listEndY = modalY + modalHeight - (isMobile ? 120 : 140);

    if (y >= listStartY && y <= listEndY) {
      this.shopScrollOffset += deltaY;
      
      if (deltaTime > 0) {
        this.shopScrollVelocity = deltaY / deltaTime * 16;
      }
      this.shopLastScrollDelta = deltaY;
    }
  }

  handleShopTouchEnd() {
    this.shopIsTouching = false;
  }

  updateShopScrollInertia(deltaTime) {
    if (!this.showShop || this.shopIsTouching) return;
    
    if (Math.abs(this.shopScrollVelocity) > this.shopScrollMinVelocity) {
      this.shopScrollOffset += this.shopScrollVelocity;
      this.shopScrollVelocity *= this.shopScrollFriction;
    } else {
      this.shopScrollVelocity = 0;
    }
  }

  handleShopClick(x, y) {
    if (!this.showShop) return false;
    
    const isMobile = this.width < 768;
    const buttonWidth = isMobile ? 180 : 220;
    const buttonHeight = isMobile ? 48 : 56;
    const modalHeight = isMobile ? this.height - 80 : this.height - 100;
    const modalY = (this.height - modalHeight) / 2;
    const buttonX = (this.width - buttonWidth) / 2;
    const buttonY = modalY + modalHeight - (isMobile ? 70 : 80);

    if (x >= buttonX && x <= buttonX + buttonWidth &&
        y >= buttonY && y <= buttonY + buttonHeight) {
      this.clickedButton = 'shop_close';
      this.clickAnimation = 1;
      this.playClickFeedback();
      setTimeout(() => {
        this.clickedButton = null;
        this.clickAnimation = 0;
        this.closeShop();
        this.hoveredButton = null;
      }, 150);
      return true;
    }

    if (this.shopProducts) {
      const modalWidth = isMobile ? this.width - 20 : Math.min(500, this.width - 40);
      const modalX = (this.width - modalWidth) / 2;
      const listStartY = modalY + (isMobile ? 90 : 110);
      const listEndY = modalY + modalHeight - (isMobile ? 120 : 140);
      const itemHeight = isMobile ? 100 : 120;
      const itemPadding = isMobile ? 12 : 15;
      const itemWidth = modalWidth - (isMobile ? 20 : 30);
      const itemX = modalX + (isMobile ? 10 : 15);

      if (y >= listStartY && y <= listEndY) {
        for (let i = 0; i < this.shopProducts.length; i++) {
          const product = this.shopProducts[i];
          const itemY = listStartY + i * (itemHeight + itemPadding) - this.shopScrollOffset;

          if (itemY + itemHeight < listStartY || itemY > listEndY) continue;

          const buyButtonWidth = isMobile ? 60 : 80;
          const buyButtonHeight = isMobile ? 32 : 40;
          const buyButtonX = itemX + itemWidth - buyButtonWidth - (isMobile ? 10 : 15);
          const buyButtonY = itemY + (itemHeight - buyButtonHeight) / 2;

          if (y >= buyButtonY && y <= buyButtonY + buyButtonHeight &&
              x >= buyButtonX && x <= buyButtonX + buyButtonWidth) {
            if (this.coins >= product.price) {
              this.clickedButton = `shop_buy_${product.id}`;
              this.clickAnimation = 1;
              setTimeout(() => {
                this.clickedButton = null;
                this.clickAnimation = 0;
                if (this.onShopBuy) {
                  this.onShopBuy(product);
                }
              }, 150);
              return true;
            }
          }
        }
      }
    }

    return true;
  }

  handleSkillsClick(x, y) {
    if (!this.showSkills) return false;
    
    const isMobile = this.width < 768;
    const buttonWidth = isMobile ? 180 : 220;
    const buttonHeight = isMobile ? 48 : 56;
    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
    const modalHeight = isMobile ? this.height - topSafeArea - bottomSafeArea - 20 : this.height - 80;
    const modalY = isMobile ? topSafeArea + 10 : (this.height - modalHeight) / 2;
    const modalWidth = isMobile ? this.width - 20 : Math.min(500, this.width - 40);
    const modalX = (this.width - modalWidth) / 2;
    const buttonX = (this.width - buttonWidth) / 2;
    const buttonY = modalY + modalHeight - (isMobile ? 70 : 80);

    if (x >= buttonX && x <= buttonX + buttonWidth &&
        y >= buttonY && y <= buttonY + buttonHeight) {
      this.clickedButton = 'skills_close';
      this.clickAnimation = 1;
      this.playClickFeedback();
      setTimeout(() => {
        this.clickedButton = null;
        this.clickAnimation = 0;
        this.closeSkills();
        this.hoveredButton = null;
      }, 150);
      return true;
    }

    if (this.skillsData) {
      const listStartY = modalY + (isMobile ? 90 : 110);
      const listEndY = modalY + modalHeight - (isMobile ? 140 : 160);
      const categoryHeaderHeight = isMobile ? 35 : 45;
      const itemHeight = isMobile ? 85 : 100;
      const itemPadding = isMobile ? 10 : 12;
      const categorySpacing = isMobile ? 20 : 25;

      if (y >= listStartY && y <= listEndY) {
        let currentY = listStartY + categoryHeaderHeight / 2 - this.skillScrollOffset;
        const itemWidth = modalWidth - (isMobile ? 30 : 40);
        const itemX = modalX + (isMobile ? 15 : 20);
        const buyButtonWidth = isMobile ? 50 : 70;
        const buyButtonHeight = isMobile ? 28 : 36;
        const unlockButtonWidth = isMobile ? 50 : 70;
        const unlockButtonHeight = isMobile ? 28 : 36;

        const consumableProducts = (this.shopProducts || []).filter(p => p.id !== 'reset_game');
        const resetProduct = (this.shopProducts || []).find(p => p.id === 'reset_game');

        // ── 一次性道具点击 ──
        if (consumableProducts.length > 0) {
          currentY += categoryHeaderHeight;

          for (const product of consumableProducts) {
            if (currentY > listEndY) break;
            if (currentY + itemHeight < listStartY) {
              currentY += itemHeight + itemPadding;
              continue;
            }

            const btnX = itemX + itemWidth - buyButtonWidth - (isMobile ? 10 : 15);
            const btnY = currentY + (itemHeight - buyButtonHeight) / 2;

            if (y >= btnY && y <= btnY + buyButtonHeight &&
                x >= btnX && x <= btnX + buyButtonWidth) {
              if (this.coins >= product.price) {
                this.clickedButton = `shop_buy_${product.id}`;
                this.clickAnimation = 1;
                if (this.onPlayClickSound) this.onPlayClickSound();
                setTimeout(() => {
                  this.clickedButton = null;
                  this.clickAnimation = 0;
                  if (this.onShopBuy) this.onShopBuy(product);
                }, 150);
                return true;
              }
            }

            currentY += itemHeight + itemPadding;
          }

          currentY += categorySpacing;
        }

        // ── 技能点击 ──
        for (const [category, skills] of this.skillsData) {
          currentY += categoryHeaderHeight;

          for (const skill of skills) {
            if (currentY > listEndY) break;

            if (currentY + itemHeight < listStartY) {
              currentY += itemHeight + itemPadding;
              continue;
            }

            const btnX = itemX + itemWidth - unlockButtonWidth - (isMobile ? 10 : 15);
            const btnY = currentY + (itemHeight - unlockButtonHeight) / 2;

            if (y >= btnY && y <= btnY + unlockButtonHeight &&
                x >= btnX && x <= btnX + unlockButtonWidth) {
              if (skill.canUnlock && !skill.isUnlocked) {
                this.clickedButton = `skill_unlock_${skill.id}`;
                this.clickAnimation = 1;
                // Unlock result owns the audio; this immediate feedback is visual only.
                this.playClickFeedback(false);
                setTimeout(() => {
                  this.clickedButton = null;
                  this.clickAnimation = 0;
                  if (this.onSkillUnlock) this.onSkillUnlock(skill.id);
                }, 150);
                return true;
              }
            }

            currentY += itemHeight + itemPadding;
          }

          currentY += categorySpacing;
        }

        // ── 特殊（时光倒流）点击 ──
        if (resetProduct) {
          currentY += categoryHeaderHeight;

          if (currentY <= listEndY && currentY + itemHeight >= listStartY) {
            const btnX = itemX + itemWidth - buyButtonWidth - (isMobile ? 10 : 15);
            const btnY = currentY + (itemHeight - buyButtonHeight) / 2;

            if (y >= btnY && y <= btnY + buyButtonHeight &&
                x >= btnX && x <= btnX + buyButtonWidth) {
              if (this.coins >= resetProduct.price) {
                this.clickedButton = `shop_buy_${resetProduct.id}`;
                this.clickAnimation = 1;
                if (this.onPlayClickSound) this.onPlayClickSound();
                setTimeout(() => {
                  this.clickedButton = null;
                  this.clickAnimation = 0;
                  if (this.onShopBuy) this.onShopBuy(resetProduct);
                }, 150);
                return true;
              }
            }
          }
        }
      }
    }

    return true;
  }
}
