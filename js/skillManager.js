import platform from './platform';

export default class SkillManager {
  constructor() {
    this.skills = new Map();
    this.unlockedSkills = new Set();
    this.coinManager = null;
    this.initSkills();
    this.loadProgress();
  }

  initSkills() {
    this.skills.set('time_control_1', {
      id: 'time_control_1',
      name: '时间掌控 I',
      category: 'time',
      description: '初始时间+2秒',
      effect: { type: 'initial_time', value: 2 },
      maxLevel: 2,
      currentLevel: 0,
      cost: 1000,
      prerequisite: null,
      icon: '⏱'
    });

    this.skills.set('time_control_2', {
      id: 'time_control_2',
      name: '时间掌控 II',
      category: 'time',
      description: '初始时间+5秒',
      effect: { type: 'initial_time', value: 5 },
      maxLevel: 2,
      currentLevel: 0,
      cost: 2000,
      prerequisite: 'time_control_1',
      icon: '⏱'
    });

    this.skills.set('time_reward_1', {
      id: 'time_reward_1',
      name: '时间奖励 I',
      category: 'time',
      description: '正确点击+1秒',
      effect: { type: 'time_bonus', value: 1 },
      maxLevel: 2,
      currentLevel: 0,
      cost: 1000,
      prerequisite: null,
      icon: '⏰'
    });

    this.skills.set('time_reward_2', {
      id: 'time_reward_2',
      name: '时间奖励 II',
      category: 'time',
      description: '正确点击+2秒',
      effect: { type: 'time_bonus', value: 2 },
      maxLevel: 2,
      currentLevel: 0,
      cost: 2000,
      prerequisite: 'time_reward_1',
      icon: '⏰'
    });

    this.skills.set('combo_boost_1', {
      id: 'combo_boost_1',
      name: '连击增益 I',
      category: 'combo',
      description: '3连击后，每多一次连击额外+1秒（递增）',
      effect: { type: 'combo_bonus', value: 1 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 1000,
      prerequisite: null,
      icon: '🔥'
    });

    this.skills.set('combo_boost_2', {
      id: 'combo_boost_2',
      name: '连击增益 II',
      category: 'combo',
      description: '3连击后，每多一次连击额外+3秒（递增）',
      effect: { type: 'combo_bonus', value: 3 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 1500,
      prerequisite: 'combo_boost_1',
      icon: '🔥'
    });

    this.skills.set('combo_boost_3', {
      id: 'combo_boost_3',
      name: '连击增益 III',
      category: 'combo',
      description: '3连击后，每多一次连击额外+5秒（递增）',
      effect: { type: 'combo_bonus', value: 5 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 2500,
      prerequisite: 'combo_boost_2',
      icon: '🔥'
    });

    this.skills.set('combo_coin_1', {
      id: 'combo_coin_1',
      name: '连击金币 I',
      category: 'combo',
      description: '3连击后，每次连击获得10金币',
      effect: { type: 'combo_coin', value: 10 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 1000,
      prerequisite: null,
      icon: '💰'
    });

    this.skills.set('combo_coin_2', {
      id: 'combo_coin_2',
      name: '连击金币 II',
      category: 'combo',
      description: '3连击后，每次连击获得30金币',
      effect: { type: 'combo_coin', value: 30 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 1500,
      prerequisite: 'combo_coin_1',
      icon: '💰'
    });

    this.skills.set('combo_coin_3', {
      id: 'combo_coin_3',
      name: '连击金币 III',
      category: 'combo',
      description: '3连击后，每次连击获得50金币',
      effect: { type: 'combo_coin', value: 50 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 2500,
      prerequisite: 'combo_coin_2',
      icon: '💰'
    });

    this.skills.set('eagle_eye', {
      id: 'eagle_eye',
      name: '鹰眼',
      category: 'assist',
      description: '点击数字3秒后高亮下一个数字',
      effect: { type: 'eagle_eye', value: 1 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 10000,
      prerequisite: null,
      icon: '👁'
    });

    // 幸运之星技能
    this.skills.set('lucky_star_1', {
      id: 'lucky_star_1',
      name: '幸运之星 I',
      category: 'luck',
      description: '奖励触发概率+5%',
      effect: { type: 'lucky_bonus', value: 0.05 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 500,
      prerequisite: null,
      icon: '⭐'
    });

    this.skills.set('lucky_star_2', {
      id: 'lucky_star_2',
      name: '幸运之星 II',
      category: 'luck',
      description: '奖励触发概率+10%',
      effect: { type: 'lucky_bonus', value: 0.10 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 1000,
      prerequisite: 'lucky_star_1',
      icon: '⭐'
    });

    this.skills.set('lucky_star_3', {
      id: 'lucky_star_3',
      name: '幸运之星 III',
      category: 'luck',
      description: '奖励触发概率+20%',
      effect: { type: 'lucky_bonus', value: 0.20 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 2000,
      prerequisite: 'lucky_star_2',
      icon: '⭐'
    });

    this.skills.set('forgiveness_1', {
      id: 'forgiveness_1',
      name: '宽容之心 I',
      category: 'forgiveness',
      description: '点错扣除时间减少至3秒',
      effect: { type: 'error_penalty', value: 3 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 1500,
      prerequisite: null,
      icon: '🛡'
    });

    this.skills.set('forgiveness_2', {
      id: 'forgiveness_2',
      name: '宽容之心 II',
      category: 'forgiveness',
      description: '点错扣除时间减少至1秒',
      effect: { type: 'error_penalty', value: 1 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 3000,
      prerequisite: 'forgiveness_1',
      icon: '🛡'
    });

    this.skills.set('forgiveness_3', {
      id: 'forgiveness_3',
      name: '宽容之心 III',
      category: 'forgiveness',
      description: '点错不扣时间',
      effect: { type: 'error_penalty', value: 0 },
      maxLevel: 1,
      currentLevel: 0,
      cost: 5000,
      prerequisite: 'forgiveness_2',
      icon: '🛡'
    });
  }

  canUnlock(skillId) {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    if (this.unlockedSkills.has(skillId)) return false;
    if (skill.currentLevel >= skill.maxLevel) return false;
    if (!this.coinManager || !this.coinManager.hasEnoughCoins(skill.cost)) return false;
    if (skill.prerequisite && !this.unlockedSkills.has(skill.prerequisite)) return false;

    return true;
  }

  unlockSkill(skillId) {
    if (!this.canUnlock(skillId)) return false;

    const skill = this.skills.get(skillId);
    const spent = this.coinManager.spendCoins(skill.cost);
    if (!spent) return false;
    
    skill.currentLevel++;
    this.unlockedSkills.add(skillId);

    this.saveProgress();
    return true;
  }

  isUnlocked(skillId) {
    return this.unlockedSkills.has(skillId);
  }

  getSkill(skillId) {
    return this.skills.get(skillId);
  }

  getAllSkills() {
    return Array.from(this.skills.values());
  }

  getSkillsByCategory(category) {
    return this.getAllSkills().filter(skill => skill.category === category);
  }

  getSkillProgress() {
    const skillsByCategory = new Map();
    const categories = ['time', 'combo', 'assist', 'luck', 'forgiveness'];

    for (const category of categories) {
      const categorySkills = this.getSkillsByCategory(category).map(skill => {
        const skillData = this.skills.get(skill.id);
        return {
          id: skillData.id,
          name: skillData.name,
          category: skillData.category,
          description: skillData.description,
          effect: skillData.effect,
          maxLevel: skillData.maxLevel,
          currentLevel: skillData.currentLevel,
          cost: skillData.cost,
          prerequisite: skillData.prerequisite,
          icon: skillData.icon,
          canUnlock: this.canUnlock(skill.id),
          isUnlocked: this.isUnlocked(skill.id)
        };
      });
      skillsByCategory.set(category, categorySkills);
    }

    return skillsByCategory;
  }

  setCoinManager(coinManager) {
    this.coinManager = coinManager;
  }

  getSkillEffect(type) {
    let totalEffect = 0;

    for (const skillId of this.unlockedSkills) {
      const skill = this.skills.get(skillId);
      if (skill && skill.effect.type === type) {
        totalEffect = Math.max(totalEffect, skill.effect.value);
      }
    }

    return totalEffect;
  }

  getInitialTimeBonus() {
    return this.getSkillEffect('initial_time');
  }

  getTimeBonusPerClick() {
    return this.getSkillEffect('time_bonus');
  }

  getComboBonus() {
    return this.getSkillEffect('combo_bonus');
  }

  getComboCoinBonus() {
    return this.getSkillEffect('combo_coin');
  }

  getLuckyBonus() {
    return this.getSkillEffect('lucky_bonus');
  }

  getErrorTimePenalty() {
    let minPenalty = null;
    for (const skillId of this.unlockedSkills) {
      const skill = this.skills.get(skillId);
      if (skill && skill.effect.type === 'error_penalty') {
        if (minPenalty === null || skill.effect.value < minPenalty) {
          minPenalty = skill.effect.value;
        }
      }
    }
    return minPenalty;
  }

  saveProgress() {
    try {
      const data = {
        unlockedSkills: Array.from(this.unlockedSkills),
        skillLevels: Array.from(this.skills.entries()).map(([id, skill]) => ({
          id,
          currentLevel: skill.currentLevel
        }))
      };
      platform.setStorageSync('skill_progress', JSON.stringify(data));
    } catch (error) {
    }
  }

  loadProgress() {
    try {
      const data = platform.getStorageSync('skill_progress');
      if (data) {
        const parsed = JSON.parse(data);
        this.unlockedSkills = new Set(parsed.unlockedSkills || []);

        if (parsed.skillLevels) {
          for (const levelData of parsed.skillLevels) {
            const skill = this.skills.get(levelData.id);
            if (skill) {
              skill.currentLevel = levelData.currentLevel || 0;
            }
          }
        }
      }
    } catch (error) {
    }
  }

  reset() {
    this.unlockedSkills.clear();
    this.skills.forEach(skill => {
      skill.currentLevel = 0;
    });
    this.saveProgress();
  }
}
