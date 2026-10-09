// 波普糖果色系 (高饱和): 蔚蓝 #3B82F6 · 亮黄 #FBBF24 · 粉白 #FFFAF5
// 点缀: 鲜珊瑚 #EF6C4A · 翠绿 #10B981 · 紫水晶 #8B5CF6

export const COLOR_SCHEME = {
  name: '波普糖果',
  id: 'pop-candy',
  background: '#FFFAF5',
  backgroundEnd: '#FFF3E8',
  primary: '#3B82F6',
  secondary: '#FBBF24',
  accent: '#10B981',
  pink: '#EF6C4A',
  gold: '#FBBF24',
  danger: '#EF4444',
  text: '#374151',
  textSecondary: '#6B7280',
  textLight: '#FFFFFF',
  border: 'rgba(59, 130, 246, 0.15)',
  borderActive: 'rgba(251, 191, 36, 0.45)',
  borderSubtle: 'rgba(59, 130, 246, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.08)',
  cardBg: 'rgba(255, 255, 255, 0.94)',
  cardBgSolid: '#FFFFFF',
  buttonPrimary: '#F97316',
  buttonPrimaryEnd: '#FB923C',
  buttonSecondary: '#FB923C',
  buttonSuccess: '#10B981',
  buttonDanger: '#EF4444',
  numberColors: [
    '#3B82F6', '#EF4444', '#10B981', '#FBBF24', '#8B5CF6',
    '#F97316', '#3B82F6', '#EF4444', '#10B981', '#8B5CF6'
  ],
  polygonColors: [
    'rgba(59, 130, 246, 0.06)', 'rgba(251, 191, 36, 0.06)',
    'rgba(20, 184, 166, 0.06)', 'rgba(239, 68, 68, 0.06)',
    'rgba(139, 92, 246, 0.06)', 'rgba(249, 115, 22, 0.06)',
    'rgba(59, 130, 246, 0.06)', 'rgba(251, 191, 36, 0.06)',
    'rgba(20, 184, 166, 0.06)', 'rgba(239, 68, 68, 0.06)',
    'rgba(139, 92, 246, 0.06)', 'rgba(249, 115, 22, 0.06)',
    'rgba(59, 130, 246, 0.06)', 'rgba(251, 191, 36, 0.06)',
    'rgba(20, 184, 166, 0.06)'
  ],
  gradientStart: '#F97316',
  gradientEnd: '#FB923C',
  glowPrimary: 'rgba(59, 130, 246, 0.25)',
  glowAccent: 'rgba(251, 191, 36, 0.25)',
  glassBg: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(59, 130, 246, 0.1)'
};

export function getColorScheme() {
  return COLOR_SCHEME;
}

export const COLORS = {
  get NUMBER_COLORS() {
    return COLOR_SCHEME.numberColors;
  },

  get STATE_COLORS() {
    return {
      default: COLOR_SCHEME.cardBg,
      clicked: COLOR_SCHEME.buttonSuccess,
      highlighted: COLOR_SCHEME.accent,
      error: COLOR_SCHEME.danger,
      border: COLOR_SCHEME.border,
      textClicked: COLOR_SCHEME.textLight,
      textDefault: COLOR_SCHEME.text
    };
  },

  get POLYGON_COLORS() {
    return COLOR_SCHEME.polygonColors;
  },

  get SCHEME() {
    return COLOR_SCHEME;
  }
};

export const BRUTALISM_STYLES = {
  borderWidth: 0,
  shadowOffset: 0,
  borderRadius: 18,
  fontSize: {
    title: 48,
    subtitle: 24,
    button: 20,
    body: 16
  },
  fontWeight: {
    title: '800',
    subtitle: '700',
    button: '600',
    body: '400'
  }
};
