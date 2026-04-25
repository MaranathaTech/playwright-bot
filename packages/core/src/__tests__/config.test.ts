import { describe, it, expect } from 'vitest';
import { defineConfig, defaultConfig } from '../config.js';

describe('defineConfig', () => {
  it('should return defaults when called with empty object', () => {
    const config = defineConfig({});
    expect(config.ai.provider).toBe('anthropic');
    expect(config.explore.depth).toBe(1);
    expect(config.explore.maxPages).toBe(20);
    expect(config.browser.headed).toBe(false);
    expect(config.output.dir).toBe('./tests/generated');
  });

  it('should override top-level properties', () => {
    const config = defineConfig({ baseUrl: 'https://test.com' });
    expect(config.baseUrl).toBe('https://test.com');
  });

  it('should deep-merge ai settings', () => {
    const config = defineConfig({
      ai: { provider: 'openai', model: 'gpt-4o' },
    });
    expect(config.ai.provider).toBe('openai');
    expect(config.ai.model).toBe('gpt-4o');
  });

  it('should deep-merge explore settings', () => {
    const config = defineConfig({
      explore: { depth: 2, maxPages: 50 },
    });
    expect(config.explore.depth).toBe(2);
    expect(config.explore.maxPages).toBe(50);
    expect(config.explore.strategy).toBe('bfs'); // default preserved
  });

  it('should deep-merge browser settings', () => {
    const config = defineConfig({
      browser: { headed: true },
    });
    expect(config.browser.headed).toBe(true);
    expect(config.browser.viewportWidth).toBe(1280); // default preserved
  });

  it('should deep-merge output settings', () => {
    const config = defineConfig({
      output: { dir: './custom-dir' },
    });
    expect(config.output.dir).toBe('./custom-dir');
    expect(config.output.saveReport).toBe(true); // default preserved
  });
});

describe('defaultConfig', () => {
  it('should have sane defaults', () => {
    expect(defaultConfig.ai.provider).toBe('anthropic');
    expect(defaultConfig.explore.depth).toBe(1);
    expect(defaultConfig.explore.maxPages).toBe(20);
    expect(defaultConfig.explore.maxStepsPerFlow).toBe(10);
    expect(defaultConfig.explore.strategy).toBe('bfs');
    expect(defaultConfig.browser.headed).toBe(false);
    expect(defaultConfig.browser.viewportWidth).toBe(1280);
    expect(defaultConfig.browser.viewportHeight).toBe(720);
    expect(defaultConfig.browser.timeout).toBe(30_000);
    expect(defaultConfig.output.dir).toBe('./tests/generated');
    expect(defaultConfig.output.saveReport).toBe(true);
  });
});
