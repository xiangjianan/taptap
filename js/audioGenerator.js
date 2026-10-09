export class AudioGenerator {
  static isWxEnvironment() {
    return typeof wx !== 'undefined' && typeof wx.createInnerAudioContext === 'function';
  }

  static isBrowserEnvironment() {
    return typeof window !== 'undefined' && 
           (typeof window.AudioContext === 'function' || typeof window.webkitAudioContext === 'function');
  }

  static getAudioContext() {
    if (this.isWxEnvironment()) return null;
    if (!this.isBrowserEnvironment()) return null;
    
    if (!this.audioContext) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass();
        
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
      } catch (e) {
        return null;
      }
    }
    return this.audioContext;
  }

  static playWxSound(src, volume = 0.5, playbackRate = 1) {
    try {
      const audio = wx.createInnerAudioContext();
      audio.src = src;
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      audio.play();
    } catch (e) {
      // 静默处理错误
    }
  }

  static createTone(audioContext, frequency, type, duration, delay = 0) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    if (!oscillator || !gainNode) return;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    const startTime = audioContext.currentTime + delay;
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  static generateClickSound(comboCount = 0) {
    // 前3次连击保持基础音，第4次起频率递增
    const effectiveCombo = Math.max(0, comboCount - 3);

    if (this.isWxEnvironment()) {
      const rate = Math.min(1 + effectiveCombo * 0.06, 2.5);
      this.playWxSound('audio/click.wav', 0.18, rate);
      return;
    }

    const audioContext = this.getAudioContext();
    if (!audioContext || !audioContext.destination) return;

    try {
      // 连击频率递增：基础800Hz，第4次起每连击+60Hz，最高2000Hz
      const baseFreq = 800;
      const freqStep = 60;
      const maxFreq = 2000;
      const frequency = Math.min(baseFreq + effectiveCombo * freqStep, maxFreq);

      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      const oscillator = audioContext.createOscillator();
      oscillator.connect(gainNode);
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      const startTime = audioContext.currentTime;

      // 连击越高，音量略增、时值略短，营造紧张感
      const volume = Math.min(0.15 + effectiveCombo * 0.008, 0.35);
      const duration = Math.max(0.06, 0.1 - effectiveCombo * 0.002);
      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (e) {
      // 静默处理错误
    }
  }

  static generateErrorSound() {
    if (this.isWxEnvironment()) {
      this.playWxSound('audio/error.wav');
      return;
    }
    
    const audioContext = this.getAudioContext();
    if (!audioContext || !audioContext.destination) return;
    
    try {
      this.createTone(audioContext, 200, 'sawtooth', 0.3);
    } catch (e) {
      // 静默处理错误
    }
  }

  static generateCompleteSound() {
    if (this.isWxEnvironment()) {
      this.playWxSound('audio/highscore.mp3');
      return;
    }
    
    const audioContext = this.getAudioContext();
    if (!audioContext || !audioContext.destination) return;
    
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((frequency, index) => {
        this.createTone(audioContext, frequency, 'sine', 0.2, index * 0.15);
      });
    } catch (e) {
      // 静默处理错误
    }
  }

  static generateEggSound() {
    if (this.isWxEnvironment()) {
      this.playWxSound('audio/egg.wav');
      return;
    }

    const audioContext = this.getAudioContext();
    if (!audioContext || !audioContext.destination) return;

    try {
      const notes = [880, 1108.73, 1318.51, 1760];
      notes.forEach((frequency, index) => {
        this.createTone(audioContext, frequency, 'sine', 0.3, index * 0.1);
      });
    } catch (e) {
      // 静默处理错误
    }
  }

  static generateFailSound() {
    if (this.isWxEnvironment()) {
      this.playWxSound('audio/fail.wav');
      return;
    }

    const audioContext = this.getAudioContext();
    if (!audioContext || !audioContext.destination) return;

    try {
      const notes = [400, 350, 280];
      notes.forEach((frequency, index) => {
        this.createTone(audioContext, frequency, 'sawtooth', 0.3, index * 0.2);
      });
    } catch (e) {
      // 静默处理错误
    }
  }
}
