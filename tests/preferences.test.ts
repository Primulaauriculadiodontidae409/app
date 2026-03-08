import { describe, it, expect, beforeEach } from 'bun:test';
import { resetDatabase } from './mocks/reset-database';
import { PreferencesStore } from '../src/data/preferences';

describe('PreferencesStore', () => {
  let prefs: PreferencesStore;

  beforeEach(() => {
    resetDatabase();
    prefs = new PreferencesStore();
  });

  describe('defaults', () => {
    it('should return default theme as system', () => {
      expect(prefs.get('theme')).toBe('system');
    });

    it('should return default pageSize as 50', () => {
      expect(prefs.get('pageSize')).toBe(50);
    });

    it('should return default limit as 50', () => {
      expect(prefs.get('defaultLimit')).toBe(50);
    });

    it('should return default expandDocumentsByDefault as false', () => {
      expect(prefs.get('expandDocumentsByDefault')).toBe(false);
    });

    it('should return default showCollectionStats as true', () => {
      expect(prefs.get('showCollectionStats')).toBe(true);
    });

    it('should return default lastConnectionId as null', () => {
      expect(prefs.get('lastConnectionId')).toBeNull();
    });

    it('should return default sidebarWidth as 260', () => {
      expect(prefs.get('sidebarWidth')).toBe(260);
    });
  });

  describe('set and get', () => {
    it('should persist string values', () => {
      prefs.set('theme', 'dark');
      expect(prefs.get('theme')).toBe('dark');
    });

    it('should persist number values', () => {
      prefs.set('pageSize', 100);
      expect(prefs.get('pageSize')).toBe(100);
    });

    it('should persist boolean values', () => {
      prefs.set('expandDocumentsByDefault', true);
      expect(prefs.get('expandDocumentsByDefault')).toBe(true);
    });

    it('should persist nullable string values', () => {
      prefs.set('lastConnectionId', 'abc123');
      expect(prefs.get('lastConnectionId')).toBe('abc123');
    });

    it('should handle setting null', () => {
      prefs.set('lastConnectionId', 'abc123');
      prefs.set('lastConnectionId', null);
      expect(prefs.get('lastConnectionId')).toBeNull();
    });

    it('should overwrite previous values', () => {
      prefs.set('theme', 'dark');
      prefs.set('theme', 'light');
      expect(prefs.get('theme')).toBe('light');
    });
  });

  describe('getAll', () => {
    it('should return all preferences with defaults', () => {
      const all = prefs.getAll();

      expect(all.theme).toBe('system');
      expect(all.pageSize).toBe(50);
      expect(all.defaultLimit).toBe(50);
      expect(all.expandDocumentsByDefault).toBe(false);
      expect(all.showCollectionStats).toBe(true);
      expect(all.lastConnectionId).toBeNull();
      expect(all.sidebarWidth).toBe(260);
    });

    it('should reflect set values', () => {
      prefs.set('theme', 'dark');
      prefs.set('pageSize', 20);

      const all = prefs.getAll();
      expect(all.theme).toBe('dark');
      expect(all.pageSize).toBe(20);
    });
  });

  describe('resolveTheme', () => {
    it('should return light when explicitly set to light', () => {
      prefs.set('theme', 'light');
      expect(prefs.resolveTheme()).toBe('light');
    });

    it('should return dark when explicitly set to dark', () => {
      prefs.set('theme', 'dark');
      expect(prefs.resolveTheme()).toBe('dark');
    });

    it('should follow system when set to system', () => {
      prefs.set('theme', 'system');
      const resolved = prefs.resolveTheme();
      // Should be either 'light' or 'dark' based on Platform.colorScheme
      expect(['light', 'dark']).toContain(resolved);
    });
  });
});
