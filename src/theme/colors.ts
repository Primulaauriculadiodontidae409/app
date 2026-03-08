// RGBA color with channels in [0, 1]
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function hex(color: string): RGBA {
  const c = color.startsWith('#') ? color.slice(1) : color;
  return {
    r: parseInt(c.slice(0, 2), 16) / 255,
    g: parseInt(c.slice(2, 4), 16) / 255,
    b: parseInt(c.slice(4, 6), 16) / 255,
    a: 1.0,
  };
}

function rgba(r: number, g: number, b: number, a: number): RGBA {
  return { r, g, b, a };
}

// Mango brand colors as RGBA
export const MangoOrange = hex('FF9F1C');
export const MangoYellow = hex('FFBF69');
export const MangoRed = hex('E8572A');
export const TropicalGreen = hex('2EC4B6');

// Light theme colors
export const LightBg = hex('FFF8F0');
export const LightSurface = hex('FFFFFF');
export const LightText = hex('2B2D42');
export const LightTextSecondary = hex('6B7194');
export const LightTextMuted = hex('8D99AE');
export const LightBorder = hex('E8E9ED');
export const LightSidebarBg = hex('F0F0F3');

// Dark theme colors
export const DarkBg = hex('2B2D42');
export const DarkSurface = hex('3A3D56');
export const DarkText = hex('E8E9ED');
export const DarkTextSecondary = hex('8D99AE');
export const DarkTextMuted = hex('6B7194');
export const DarkBorder = hex('4A4D6A');
export const DarkSidebarBg = hex('232538');

// --- Hex-based color system for theme configuration ---

export const Colors = {
  primary: '#FF9F1C',
  secondary: '#FFBF69',
  deep: '#E8572A',
  success: '#2EC4B6',
  charcoal: '#2B2D42',
  cream: '#FFF8F0',
  slate: '#8D99AE',
  get error() { return this.deep; },
  get warning() { return this.primary; },
};

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderFocused: string;
  accent: string;
  accentHover: string;
  destructive: string;
  success: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarItemHover: string;
  sidebarItemActive: string;
  editorBg: string;
  editorText: string;
  editorLineNumber: string;
  toolbarBg: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonSecondaryBg: string;
  buttonSecondaryText: string;
  buttonDestructiveBg: string;
  buttonDestructiveText: string;
  statusConnected: string;
  statusDisconnected: string;
}

export const LightTheme: ThemeColors = {
  background: Colors.cream,
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F0F3',
  text: Colors.charcoal,
  textSecondary: '#6B7194',
  textMuted: Colors.slate,
  border: '#E8E9ED',
  borderFocused: Colors.primary,
  accent: Colors.primary,
  accentHover: '#E88E19',
  destructive: Colors.deep,
  success: Colors.success,
  sidebarBg: '#F0F0F3',
  sidebarText: Colors.charcoal,
  sidebarItemHover: '#E8E9ED',
  sidebarItemActive: '#FFE8C8',
  editorBg: '#FFFFFF',
  editorText: Colors.charcoal,
  editorLineNumber: Colors.slate,
  toolbarBg: '#F0F0F3',
  inputBg: '#FFFFFF',
  inputBorder: '#E8E9ED',
  inputText: Colors.charcoal,
  inputPlaceholder: Colors.slate,
  buttonPrimaryBg: Colors.primary,
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#E8E9ED',
  buttonSecondaryText: Colors.charcoal,
  buttonDestructiveBg: Colors.deep,
  buttonDestructiveText: '#FFFFFF',
  statusConnected: Colors.success,
  statusDisconnected: Colors.slate,
};

export const DarkTheme: ThemeColors = {
  background: Colors.charcoal,
  surface: '#3A3D56',
  surfaceSecondary: '#323550',
  text: '#E8E9ED',
  textSecondary: Colors.slate,
  textMuted: '#6B7194',
  border: '#4A4D6A',
  borderFocused: Colors.primary,
  accent: Colors.primary,
  accentHover: '#FFB34D',
  destructive: Colors.deep,
  success: Colors.success,
  sidebarBg: '#232538',
  sidebarText: '#E8E9ED',
  sidebarItemHover: '#3A3D56',
  sidebarItemActive: '#4A3A1C',
  editorBg: '#2B2D42',
  editorText: '#E8E9ED',
  editorLineNumber: '#6B7194',
  toolbarBg: '#232538',
  inputBg: '#3A3D56',
  inputBorder: '#4A4D6A',
  inputText: '#E8E9ED',
  inputPlaceholder: '#6B7194',
  buttonPrimaryBg: Colors.primary,
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#3A3D56',
  buttonSecondaryText: '#E8E9ED',
  buttonDestructiveBg: Colors.deep,
  buttonDestructiveText: '#FFFFFF',
  statusConnected: Colors.success,
  statusDisconnected: Colors.slate,
};
