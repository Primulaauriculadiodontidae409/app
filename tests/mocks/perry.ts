// Mock for 'perry' — provides Platform and other top-level exports

export const Platform = {
  os: 'macos' as 'macos' | 'ios' | 'windows' | 'linux' | 'android',
  colorScheme: 'light' as 'light' | 'dark',
  locale: 'en-US',
  version: '1.0.0-mock',
};

export class Application {
  static run(_config: unknown): void {
    // no-op in tests
  }
}

export class Window {
  title: string = '';
  width: number = 800;
  height: number = 600;
}
