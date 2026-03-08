import { isMac, isIOS, isAndroid, isWindows } from 'perry-styling';

// Platform-specific font families
export const systemFontFamily = isMac || isIOS ? '.AppleSystemUIFont' :
                                 isWindows     ? 'Segoe UI' :
                                 isAndroid     ? 'Roboto' :
                                                 'Ubuntu';

export const monoFontFamily = isMac || isIOS ? 'SF Mono' :
                               isWindows     ? 'Cascadia Code' :
                               isAndroid     ? 'Roboto Mono' :
                                               'JetBrains Mono';

// Font sizes
export const FONT_XS = 11;
export const FONT_SM = 12;
export const FONT_BASE = 14;
export const FONT_MD = 16;
export const FONT_LG = 20;
export const FONT_XL = 24;

export const Typography = {
  fontFamily: systemFontFamily,
  monoFontFamily: monoFontFamily,
  sizes: {
    xs: FONT_XS,
    sm: FONT_SM,
    base: FONT_BASE,
    md: FONT_MD,
    lg: FONT_LG,
    xl: FONT_XL,
    xxl: 32,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
