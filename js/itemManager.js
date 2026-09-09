import platform from './platform';

export default class ItemManager {
  constructor() {
    this.items = new Map();
    this.onItemChanged = null;
    this.initItems();
    this.loadItems();
  }

  initItems() {
    this.items.set('hint', {
      id: 'hint',
      name: '提示道具',
      description: '高亮显示当前需要点击的数字',
      icon: '💡',
      defaultCount: 5,
      count: 5
    });
  }

  init() {
    this.loadItems();
  }

  addItem(itemId, amount = 1) {
    const item = this.items.get(itemId);
    if (!item) return false;

    item.count += amount;
    this.saveItems();
    
    if (this.onItemChanged) {
      this.onItemChanged(itemId, item.count, 'add');
    }
    
    return true;
  }

  useItem(itemId, amount = 1) {
    const item = this.items.get(itemId);
    if (!item) return false;
    if (item.count < amount) return false;

    item.count -= amount;
    this.saveItems();
    
    if (this.onItemChanged) {
      this.onItemChanged(itemId, item.count, 'use');
    }
    
    return true;
  }

  getItemCount(itemId) {
    const item = this.items.get(itemId);
    return item ? item.count : 0;
  }

  hasItem(itemId, amount = 1) {
    return this.getItemCount(itemId) >= amount;
  }

  getItem(itemId) {
    return this.items.get(itemId);
  }

  getAllItems() {
    return Array.from(this.items.values());
  }

  saveItems() {
    try {
      const itemsData = {};
      this.items.forEach((item, id) => {
        itemsData[id] = item.count;
      });
      platform.setStorageSync('items', JSON.stringify(itemsData));
    } catch (error) {
    }
  }

  loadItems() {
    try {
      const savedItems = platform.getStorageSync('items');
      if (savedItems) {
        const itemsData = JSON.parse(savedItems);
        this.items.forEach((item, id) => {
          if (itemsData[id] !== undefined) {
            item.count = itemsData[id];
          }
        });
      }
    } catch (error) {
    }
  }

  reset() {
    this.items.forEach((item, id) => {
      item.count = item.defaultCount;
    });
    this.saveItems();
    
    if (this.onItemChanged) {
      this.items.forEach((item, id) => {
        this.onItemChanged(id, item.count, 'reset');
      });
    }
  }
}
