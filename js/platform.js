// js/platform.js
// 跨平台适配层：抖音小游戏(tt) / 微信小游戏(wx) / 浏览器
// 检测顺序关键：抖音环境可能注入 wx 对象，必须先检测 tt！

/**
 * 检测运行平台
 * @param {object} env 宿主环境（默认 globalThis，测试时注入 mock）
 * @returns {'douyin'|'wechat'|'browser'}
 */
export function detectPlatform(env = globalThis) {
  if (typeof env.tt !== 'undefined' && typeof env.tt.getSystemInfoSync === 'function') {
    return 'douyin';
  }
  if (typeof env.wx !== 'undefined' && typeof env.wx.getSystemInfoSync === 'function') {
    return 'wechat';
  }
  return 'browser';
}

/** 将 wx/tt 系统信息的 safeArea 归一化为四边内缩尺寸 */
function normalizeSafeArea(info) {
  if (!info || !info.safeArea) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  return {
    top: info.safeArea.top || 0,
    bottom: info.screenHeight - (info.safeArea.bottom || info.screenHeight),
    left: info.safeArea.left || 0,
    right: info.screenWidth - (info.safeArea.right || info.screenWidth)
  };
}

function browserSafeArea(env) {
  try {
    const style = env.window.getComputedStyle(env.document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0'),
      bottom: parseInt(style.getPropertyValue('--sab') || '0'),
      left: parseInt(style.getPropertyValue('--sal') || '0'),
      right: parseInt(style.getPropertyValue('--sar') || '0')
    };
  } catch (e) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
}

/**
 * 创建平台适配实例
 * @param {object} env 宿主环境（默认 globalThis）
 */
export function createPlatform(env = globalThis) {
  const type = detectPlatform(env);
  const api = type === 'douyin' ? env.tt : type === 'wechat' ? env.wx : null;

  return {
    type,

    // ── Canvas ──
    createCanvas() {
      if (type === 'browser') {
        const c = env.document.createElement('canvas');
        c.id = 'gameCanvas';
        env.document.body.appendChild(c);
        return c;
      }
      const c = api.createCanvas();
      if (typeof env.GameGlobal !== 'undefined') {
        env.GameGlobal.canvas = c;
      }
      return c;
    },

    // ── 系统信息（归一化：screenWidth/screenHeight/pixelRatio/safeArea）──
    getWindowInfo() {
      if (type === 'wechat' && typeof api.getWindowInfo === 'function') {
        const info = api.getWindowInfo();
        return {
          screenWidth: info.screenWidth,
          screenHeight: info.screenHeight,
          pixelRatio: info.pixelRatio || 1,
          safeArea: normalizeSafeArea(info)
        };
      }
      if (api) {
        const info = api.getSystemInfoSync();
        return {
          screenWidth: info.screenWidth,
          screenHeight: info.screenHeight,
          pixelRatio: info.pixelRatio || 1,
          safeArea: normalizeSafeArea(info)
        };
      }
      return {
        screenWidth: env.window.innerWidth,
        screenHeight: env.window.innerHeight,
        pixelRatio: env.window.devicePixelRatio || 1,
        safeArea: browserSafeArea(env)
      };
    },

    // ── 本地存储（浏览器 no-op；错误在适配层内吞掉，调用方无需 try/catch API 本身）──
    setStorageSync(key, value) {
      if (api && api.setStorageSync) {
        try { api.setStorageSync(key, value); } catch (e) {}
      }
    },
    getStorageSync(key) {
      if (api && api.getStorageSync) {
        try { return api.getStorageSync(key); } catch (e) {}
      }
      return '';
    },
    removeStorageSync(key) {
      if (api && api.removeStorageSync) {
        try { api.removeStorageSync(key); } catch (e) {}
      }
    },

    // ── 音频 ──
    createInnerAudioContext() {
      return api && api.createInnerAudioContext ? api.createInnerAudioContext() : null;
    },

    // ── 震动 ──
    supportsVibration() {
      if (api && (typeof api.vibrateShort === 'function' || typeof api.vibrateLong === 'function')) {
        return true;
      }
      return !!(env.navigator && typeof env.navigator.vibrate === 'function');
    },
    /** 原生短震（wx/tt），type: 'light'|'medium'|'heavy' */
    vibrateShort(kind = 'light') {
      if (api && typeof api.vibrateShort === 'function') {
        try { api.vibrateShort({ type: kind }); } catch (e) {}
      }
    },
    /** 原生长震（wx/tt） */
    vibrateLong() {
      if (api && typeof api.vibrateLong === 'function') {
        try { api.vibrateLong({}); } catch (e) {}
      }
    },
    /** 浏览器 Web Vibration API */
    vibrateBrowser(pattern) {
      if (env.navigator && typeof env.navigator.vibrate === 'function') {
        try { return env.navigator.vibrate(pattern); } catch (e) {}
      }
      return false;
    },

    // ── 触摸事件 ──
    onTouchStart(cb) { if (api && api.onTouchStart) api.onTouchStart(cb); },
    onTouchMove(cb) { if (api && api.onTouchMove) api.onTouchMove(cb); },
    onTouchEnd(cb) { if (api && api.onTouchEnd) api.onTouchEnd(cb); },
    onTouchCancel(cb) { if (api && api.onTouchCancel) api.onTouchCancel(cb); },

    // ── 前后台生命周期 ──
    onShow(cb) { if (api && api.onShow) api.onShow(cb); },
    onHide(cb) { if (api && api.onHide) api.onHide(cb); },

    // ── 分享 ──
    showShareMenu() {
      if (type !== 'wechat' || !api.showShareMenu) return;
      api.showShareMenu({
        menus: ['shareAppMessage', 'shareTimeline'],
        success: () => {},
        fail: () => {}
      });
    },
    onShareAppMessage(cb) {
      if (api && api.onShareAppMessage) api.onShareAppMessage(cb);
    },
    /** 朋友圈分享仅微信支持，抖音/浏览器 no-op */
    onShareTimeline(cb) {
      if (type === 'wechat' && api && api.onShareTimeline) api.onShareTimeline(cb);
    },
    shareAppMessage(opts) {
      if (api && api.shareAppMessage) api.shareAppMessage(opts);
    },

    // ── 抖音特有能力（第二阶段接入侧边栏/录屏时使用，先留钩子）──
    checkScene(opts) {
      if (type === 'douyin' && api.checkScene) api.checkScene(opts);
    },
    navigateToScene(opts) {
      if (type === 'douyin' && api.navigateToScene) api.navigateToScene(opts);
    },
    getGameRecorderManager() {
      return type === 'douyin' && api.getGameRecorderManager ? api.getGameRecorderManager() : null;
    }
  };
}

const platform = createPlatform();
export default platform;
