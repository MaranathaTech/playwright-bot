import type { BrowserContext, Page } from 'playwright-core';
import type { PlaywrightBotConfig } from '../config.js';

export class AuthHandler {
  constructor(private config: PlaywrightBotConfig['auth']) {}

  async setup(context: BrowserContext): Promise<void> {
    if (!this.config) return;

    // Storage state is handled at context creation in BrowserManager
    // Handle credential-based login
    if (this.config.credentials) {
      await this.loginWithCredentials(context);
    }

    // Handle custom setup script
    if (this.config.setupScript) {
      await this.runSetupScript(context);
    }
  }

  private async loginWithCredentials(context: BrowserContext): Promise<void> {
    const creds = this.config!.credentials!;
    const page = await context.newPage();

    try {
      await page.goto(creds.loginUrl, { waitUntil: 'domcontentloaded' });
      await page.locator(creds.usernameSelector).fill(creds.username);
      await page.locator(creds.passwordSelector).fill(creds.password);
      await page.locator(creds.submitSelector).click();

      // Wait for navigation after login
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {
        // Fallback if networkidle never fires
      });
    } finally {
      await page.close();
    }
  }

  private async runSetupScript(context: BrowserContext): Promise<void> {
    const scriptPath = this.config!.setupScript!;
    const setupModule = await import(scriptPath);
    if (typeof setupModule.default === 'function') {
      await setupModule.default(context);
    } else if (typeof setupModule.setup === 'function') {
      await setupModule.setup(context);
    }
  }
}
