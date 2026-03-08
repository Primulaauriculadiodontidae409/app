import { describe, it, expect } from 'bun:test';
import { Colors, LightTheme, DarkTheme, ThemeColors } from '../src/theme/colors';
import { Typography } from '../src/theme/typography';

describe('Colors', () => {
  it('should have all primary palette colors', () => {
    expect(Colors.primary).toBe('#FF9F1C');
    expect(Colors.secondary).toBe('#FFBF69');
    expect(Colors.deep).toBe('#E8572A');
    expect(Colors.success).toBe('#2EC4B6');
  });

  it('should have all neutral colors', () => {
    expect(Colors.charcoal).toBe('#2B2D42');
    expect(Colors.cream).toBe('#FFF8F0');
    expect(Colors.slate).toBe('#8D99AE');
  });

  it('should map error to deep', () => {
    expect(Colors.error).toBe(Colors.deep);
  });

  it('should map warning to primary', () => {
    expect(Colors.warning).toBe(Colors.primary);
  });
});

function validateTheme(theme: ThemeColors, name: string) {
  describe(`${name} theme`, () => {
    it('should have all required color keys', () => {
      const requiredKeys: (keyof ThemeColors)[] = [
        'background', 'surface', 'surfaceSecondary',
        'text', 'textSecondary', 'textMuted',
        'border', 'borderFocused',
        'accent', 'accentHover', 'destructive', 'success',
        'sidebarBg', 'sidebarText', 'sidebarItemHover', 'sidebarItemActive',
        'editorBg', 'editorText', 'editorLineNumber',
        'toolbarBg',
        'inputBg', 'inputBorder', 'inputText', 'inputPlaceholder',
        'buttonPrimaryBg', 'buttonPrimaryText',
        'buttonSecondaryBg', 'buttonSecondaryText',
        'buttonDestructiveBg', 'buttonDestructiveText',
        'statusConnected', 'statusDisconnected',
      ];

      for (const key of requiredKeys) {
        expect(theme[key]).toBeDefined();
        expect(typeof theme[key]).toBe('string');
        expect(theme[key].length).toBeGreaterThan(0);
      }
    });

    it('should use Mango orange as accent', () => {
      expect(theme.accent).toBe(Colors.primary);
    });

    it('should use deep red as destructive', () => {
      expect(theme.destructive).toBe(Colors.deep);
    });

    it('should use tropical green as success', () => {
      expect(theme.success).toBe(Colors.success);
    });

    it('should have valid hex colors for main properties', () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;
      expect(theme.background).toMatch(hexPattern);
      expect(theme.surface).toMatch(hexPattern);
      expect(theme.text).toMatch(hexPattern);
      expect(theme.accent).toMatch(hexPattern);
    });
  });
}

validateTheme(LightTheme, 'Light');
validateTheme(DarkTheme, 'Dark');

describe('LightTheme specifics', () => {
  it('should use cream as background', () => {
    expect(LightTheme.background).toBe(Colors.cream);
  });

  it('should use charcoal as text', () => {
    expect(LightTheme.text).toBe(Colors.charcoal);
  });
});

describe('DarkTheme specifics', () => {
  it('should use charcoal as background', () => {
    expect(DarkTheme.background).toBe(Colors.charcoal);
  });

  it('should have lighter text than background', () => {
    // Dark theme text should be light-colored
    expect(DarkTheme.text).not.toBe(DarkTheme.background);
  });
});

describe('Typography', () => {
  it('should have font families defined', () => {
    expect(typeof Typography.fontFamily).toBe('string');
    expect(Typography.fontFamily.length).toBeGreaterThan(0);
    expect(typeof Typography.monoFontFamily).toBe('string');
    expect(Typography.monoFontFamily.length).toBeGreaterThan(0);
  });

  it('should have all size tiers', () => {
    expect(Typography.sizes.xs).toBeLessThan(Typography.sizes.sm);
    expect(Typography.sizes.sm).toBeLessThan(Typography.sizes.base);
    expect(Typography.sizes.base).toBeLessThan(Typography.sizes.md);
    expect(Typography.sizes.md).toBeLessThan(Typography.sizes.lg);
    expect(Typography.sizes.lg).toBeLessThan(Typography.sizes.xl);
    expect(Typography.sizes.xl).toBeLessThan(Typography.sizes.xxl);
  });

  it('should have all weight tiers', () => {
    expect(parseInt(Typography.weights.regular)).toBeLessThan(parseInt(Typography.weights.medium));
    expect(parseInt(Typography.weights.medium)).toBeLessThan(parseInt(Typography.weights.semibold));
    expect(parseInt(Typography.weights.semibold)).toBeLessThan(parseInt(Typography.weights.bold));
  });

  it('should have line height tiers', () => {
    expect(Typography.lineHeights.tight).toBeLessThan(Typography.lineHeights.normal);
    expect(Typography.lineHeights.normal).toBeLessThan(Typography.lineHeights.relaxed);
  });
});
