import type { Browser, BrowserContext, LaunchOptions } from 'playwright-core';

export interface BrowserManagerOptions {
  headed?: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
  storageState?: string;
}

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(private options: BrowserManagerOptions = {}) {}

  async launch(): Promise<BrowserContext> {
    const { chromium } = await import('playwright-core');

    const launchOptions: LaunchOptions = {
      headless: !this.options.headed,
    };

    this.browser = await chromium.launch(launchOptions);
    this.context = await this.browser.newContext({
      viewport: {
        width: this.options.viewportWidth ?? 1280,
        height: this.options.viewportHeight ?? 720,
      },
      storageState: this.options.storageState,
    });

    return this.context;
  }

  getContext(): BrowserContext {
    if (!this.context) throw new Error('Browser not launched. Call launch() first.');
    return this.context;
  }

  async close(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
    this.context = null;
    this.browser = null;
  }
}
