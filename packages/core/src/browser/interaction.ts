import type { Page, Locator } from 'playwright-core';

export type ActionType = 'click' | 'fill' | 'select' | 'hover' | 'press';

export interface ActionResult {
  success: boolean;
  error?: string;
  beforeUrl: string;
  afterUrl: string;
}

export class Interaction {
  constructor(private timeout = 10_000) {}

  async click(page: Page, selector: string): Promise<ActionResult> {
    return this.execute(page, async () => {
      await page.locator(selector).click({ timeout: this.timeout });
    });
  }

  async fill(page: Page, selector: string, value: string): Promise<ActionResult> {
    return this.execute(page, async () => {
      await page.locator(selector).fill(value, { timeout: this.timeout });
    });
  }

  async select(page: Page, selector: string, value: string): Promise<ActionResult> {
    return this.execute(page, async () => {
      await page.locator(selector).selectOption(value, { timeout: this.timeout });
    });
  }

  async hover(page: Page, selector: string): Promise<ActionResult> {
    return this.execute(page, async () => {
      await page.locator(selector).hover({ timeout: this.timeout });
    });
  }

  async press(page: Page, selector: string, key: string): Promise<ActionResult> {
    return this.execute(page, async () => {
      await page.locator(selector).press(key, { timeout: this.timeout });
    });
  }

  private async execute(page: Page, action: () => Promise<void>): Promise<ActionResult> {
    const beforeUrl = page.url();
    try {
      await action();
      // Brief wait for any navigation/state changes
      await page.waitForTimeout(500);
      return { success: true, beforeUrl, afterUrl: page.url() };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        beforeUrl,
        afterUrl: page.url(),
      };
    }
  }
}
