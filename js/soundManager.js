import { AudioGenerator } from './audioGenerator';
import platform from './platform';

export default class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.5;
    this.useGeneratedAudio = false;
  }

  init() {
    this.useGeneratedAudio = true;
    
    let first = null;
    try {
      first = platform.createInnerAudioContext();
    } catch (e) {
      return;
    }
    if (!first) return;
    
    try {
      this.sounds.click = first;
      this.sounds.click.src = 'audio/click.wav';
      this.sounds.click.volume = this.volume * 0.5;
      this.sounds.click.onError(() => {
        this.useGeneratedAudio = true;
      });

      this.sounds.uiClick = platform.createInnerAudioContext();
      this.sounds.uiClick.src = 'audio/click-ui.mp3';
      this.sounds.uiClick.volume = this.volume * 0.4;
      this.sounds.uiClick.obeyMuteSwitch = false;
      this.sounds.uiClick.onError(() => {
        this.sounds.uiClick = null;
      });
      
      this.sounds.error = platform.createInnerAudioContext();
      this.sounds.error.src = 'audio/error.wav';
      this.sounds.error.onError(() => {
        this.useGeneratedAudio = true;
      });
      
      this.sounds.complete = platform.createInnerAudioContext();
      this.sounds.complete.src = 'audio/highscore.mp3';
      this.sounds.complete.onError(() => {
        this.useGeneratedAudio = true;
      });
      
      this.sounds.coin = platform.createInnerAudioContext();
      this.sounds.coin.src = 'audio/coin.wav';
      this.sounds.coin.volume = this.volume * 0.6;
      this.sounds.coin.onError(() => {
        this.sounds.coin = null;
      });

      this.sounds.egg = platform.createInnerAudioContext();
      this.sounds.egg.src = 'audio/egg.wav';
      this.sounds.egg.onError(() => {
        console.log('Egg audio load error, will use fallback');
      });
      this.sounds.egg.onCanplay(() => {
        console.log('Egg audio ready to play');
      });

      this.sounds.fail = platform.createInnerAudioContext();
      this.sounds.fail.src = 'audio/fail.wav';
      this.sounds.fail.volume = this.volume * 0.35;
      this.sounds.fail.onError(() => {
        this.useGeneratedAudio = true;
      });
    } catch (e) {
      this.useGeneratedAudio = true;
    }
  }

  playClick(comboCount = 0) {
    if (!this.enabled) return;

    if (this.useGeneratedAudio) {
      try {
        AudioGenerator.generateClickSound(comboCount);
      } catch (e) {}
      return;
    }

    if (!this.sounds.click) return;
    try {
      this.sounds.click.stop();
      // 连击越高，播放速率越快（频率越高）
      const rate = Math.min(1 + comboCount * 0.06, 2.5);
      if (this.sounds.click.playbackRate !== undefined) {
        this.sounds.click.playbackRate = rate;
      }
      this.sounds.click.play();
    } catch (e) {}
  }

  playUiClick() {
    if (!this.enabled) return;

    if (this.sounds.uiClick) {
      try {
        this.sounds.uiClick.stop();
        this.sounds.uiClick.play();
        return;
      } catch (e) {
        this.sounds.uiClick = null;
      }
    }

    try {
      AudioGenerator.generateClickSound();
    } catch (e) {}
  }

  playError() {
    if (!this.enabled) return;
    
    if (this.useGeneratedAudio) {
      try {
        AudioGenerator.generateErrorSound();
      } catch (e) {}
      return;
    }
    
    if (!this.sounds.error) return;
    try {
      this.sounds.error.stop();
      this.sounds.error.play();
    } catch (e) {}
  }

  playComplete() {
    if (!this.enabled) return;
    
    if (this.useGeneratedAudio) {
      try {
        AudioGenerator.generateCompleteSound();
      } catch (e) {}
      return;
    }
    
    if (!this.sounds.complete) return;
    try {
      this.sounds.complete.stop();
      this.sounds.complete.play();
    } catch (e) {}
  }

  playCoin() {
    if (!this.enabled) return;

    if (this.sounds.coin) {
      try {
        this.sounds.coin.stop();
        this.sounds.coin.play();
        return;
      } catch (e) {}
    }

    try {
      AudioGenerator.generateClickSound();
    } catch (e) {}
  }

  playEgg() {
    if (!this.enabled) return;

    if (this.useGeneratedAudio) {
      try {
        AudioGenerator.generateEggSound();
      } catch (e) {}
      return;
    }

    if (!this.sounds.egg) {
      console.log('Egg sound not initialized');
      return;
    }
    try {
      this.sounds.egg.stop();
      this.sounds.egg.play();
      console.log('Playing egg sound');
    } catch (e) {
      console.log('Error playing egg sound:', e);
    }
  }

  playFail() {
    if (!this.enabled) return;

    if (this.useGeneratedAudio) {
      try {
        AudioGenerator.generateFailSound();
      } catch (e) {}
      return;
    }

    if (!this.sounds.fail) return;
    try {
      this.sounds.fail.stop();
      this.sounds.fail.play();
    } catch (e) {}
  }

  playBackground() {
  }

  stopBackground() {
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    for (const key in this.sounds) {
      if (this.sounds[key]) {
        this.sounds[key].volume = this.volume;
      }
    }
  }

  destroy() {
    for (const key in this.sounds) {
      if (this.sounds[key]) {
        try {
          this.sounds[key].destroy();
        } catch (e) {}
      }
    }
    this.sounds = {};
  }
}
