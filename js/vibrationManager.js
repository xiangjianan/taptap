import platform from './platform';

export default class VibrationManager {
  constructor() {
    this.enabled = true;
    this.supported = false;
    this.checkSupport();
  }

  checkSupport() {
    this.supported = platform.supportsVibration();
  }

  vibrateShort() {
    if (!this.enabled || !this.supported) return;
    if (platform.type === 'browser') {
      platform.vibrateBrowser(15);
    } else {
      platform.vibrateShort('light');
    }
  }

  vibrateMedium() {
    if (!this.enabled || !this.supported) return;
    if (platform.type === 'browser') {
      platform.vibrateBrowser(30);
    } else {
      platform.vibrateShort('medium');
    }
  }

  vibrateLong() {
    if (!this.enabled || !this.supported) return;
    if (platform.type === 'browser') {
      platform.vibrateBrowser(100);
    } else {
      platform.vibrateLong();
    }
  }

  vibratePattern(pattern) {
    if (!this.enabled || !this.supported) return;
    if (platform.type === 'browser') {
      platform.vibrateBrowser(pattern);
    } else {
      this.playPatternNative(pattern);
    }
  }

  /** 原生端按 [等待,震动] 序列拆成 setTimeout（原 playPatternOnWx，逻辑不变） */
  playPatternNative(pattern) {
    let delay = 0;
    for (let i = 0; i < pattern.length; i += 2) {
      const wait = pattern[i] || 0;
      const vibrate = pattern[i + 1] || 0;
      delay += wait;

      setTimeout(() => {
        if (vibrate <= 15) {
          this.vibrateShort();
        } else if (vibrate <= 50) {
          this.vibrateMedium();
        } else {
          this.vibrateLong();
        }
      }, delay);

      delay += vibrate;
    }
  }

  vibrateCorrect() {
    if (!this.enabled || !this.supported) return;
    if (platform.type === 'browser') {
      platform.vibrateBrowser([20]);
    } else {
      platform.vibrateShort('light');
    }
  }

  vibrateError() {
    if (!this.enabled || !this.supported) return;
    if (platform.type === 'browser') {
      platform.vibrateBrowser([40, 40, 40]);
      return;
    }
    platform.vibrateShort('heavy');
    setTimeout(() => {
      if (this.enabled) {
        platform.vibrateShort('heavy');
      }
    }, 80);
  }

  vibrateCombo(intensity) {
    if (!this.enabled || !this.supported) return;

    if (platform.type === 'browser') {
      if (intensity === 'light') {
        platform.vibrateBrowser(20);
      } else if (intensity === 'medium') {
        platform.vibrateBrowser([30, 30, 30]);
      } else if (intensity === 'heavy') {
        platform.vibrateBrowser([50, 30, 50, 30, 50]);
      } else {
        this.vibrateShort();
      }
      return;
    }

    if (intensity === 'light') {
      platform.vibrateShort('light');
    } else if (intensity === 'medium') {
      platform.vibrateShort('medium');
      setTimeout(() => {
        if (this.enabled) {
          platform.vibrateShort('medium');
        }
      }, 50);
    } else if (intensity === 'heavy') {
      platform.vibrateLong();
    } else {
      this.vibrateShort();
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  isSupported() {
    return this.supported;
  }
}
