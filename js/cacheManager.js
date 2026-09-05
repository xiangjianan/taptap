import platform from './platform';

export class CacheManager {
  static CACHE_KEY = 'find100wx_cache';
  static CACHE_VERSION = '1.0.0';
  
  static init() {
    try {
      const cache = platform.getStorageSync(this.CACHE_KEY);
      if (!cache || cache.version !== this.CACHE_VERSION) {
        platform.removeStorageSync(this.CACHE_KEY);
        platform.setStorageSync(this.CACHE_KEY, {
          version: this.CACHE_VERSION, 
          timestamp: Date.now() 
        });
      }
    } catch (e) {
    }
  }
}
