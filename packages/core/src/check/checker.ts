import type { PlaywrightBotConfig } from '../config.js';
import { ManifestManager } from '../codegen/manifest.js';
import { BrowserManager } from '../browser/browser-manager.js';
import { PageCapture } from '../browser/page-capture.js';
import { AuthHandler } from '../explorer/auth-handler.js';
import { compareAriaSnapshots } from './aria-diff.js';

export interface CheckOptions {
  threshold?: number;
}

export interface CheckResult {
  url: string;
  filePath: string;
  status: 'fresh' | 'stale' | 'missing' | 'error';
  similarity: number;
  changeSummary?: string;
  error?: string;
}

export class StalenessChecker {
  private manifest: ManifestManager;
  private threshold: number;

  constructor(
    private config: PlaywrightBotConfig,
    options?: CheckOptions,
  ) {
    this.manifest = new ManifestManager(config.output.dir);
    this.threshold = options?.threshold ?? 0.9;
  }

  async checkUrl(url: string): Promise<CheckResult> {
    const entry = await this.manifest.findByUrl(url);
    if (!entry) {
      return { url, filePath: '', status: 'missing', similarity: 0 };
    }

    const browserManager = new BrowserManager({
      headed: this.config.browser.headed,
      viewportWidth: this.config.browser.viewportWidth,
      viewportHeight: this.config.browser.viewportHeight,
      storageState: this.config.auth?.storageState,
    });

    try {
      const context = await browserManager.launch();
      const authHandler = new AuthHandler(this.config.auth);
      await authHandler.setup(context);

      const page = await context.newPage();
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.browser.timeout,
      });

      const capture = new PageCapture();
      const captured = await capture.capture(page);
      await page.close();

      const diff = compareAriaSnapshots(entry.ariaSnapshot, captured.ariaSnapshot);

      return {
        url,
        filePath: entry.filePath,
        status: diff.similarity >= this.threshold ? 'fresh' : 'stale',
        similarity: diff.similarity,
        changeSummary: diff.changeSummary,
      };
    } catch (err) {
      return {
        url,
        filePath: entry.filePath,
        status: 'error',
        similarity: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      await browserManager.close();
    }
  }

  async checkAll(): Promise<CheckResult[]> {
    const entries = await this.manifest.allEntries();
    const pageEntries = entries.filter((e) => e.source === 'page');

    if (pageEntries.length === 0) return [];

    const browserManager = new BrowserManager({
      headed: this.config.browser.headed,
      viewportWidth: this.config.browser.viewportWidth,
      viewportHeight: this.config.browser.viewportHeight,
      storageState: this.config.auth?.storageState,
    });

    const results: CheckResult[] = [];

    try {
      const context = await browserManager.launch();
      const authHandler = new AuthHandler(this.config.auth);
      await authHandler.setup(context);

      const capture = new PageCapture();

      for (const entry of pageEntries) {
        try {
          const page = await context.newPage();
          await page.goto(entry.url, {
            waitUntil: 'domcontentloaded',
            timeout: this.config.browser.timeout,
          });

          const captured = await capture.capture(page);
          await page.close();

          const diff = compareAriaSnapshots(entry.ariaSnapshot, captured.ariaSnapshot);

          results.push({
            url: entry.url,
            filePath: entry.filePath,
            status: diff.similarity >= this.threshold ? 'fresh' : 'stale',
            similarity: diff.similarity,
            changeSummary: diff.changeSummary,
          });
        } catch (err) {
          results.push({
            url: entry.url,
            filePath: entry.filePath,
            status: 'error',
            similarity: 0,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } finally {
      await browserManager.close();
    }

    return results;
  }
}
