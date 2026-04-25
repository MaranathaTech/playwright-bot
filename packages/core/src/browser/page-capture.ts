import type { Page } from 'playwright-core';

export interface CaptureResult {
  screenshot: Buffer;
  ariaSnapshot: string;
  url: string;
  title: string;
  links: string[];
}

export class PageCapture {
  constructor(private maxScreenshotWidth = 1568) {}

  async capture(page: Page): Promise<CaptureResult> {
    // Wait for page stability
    await this.waitForStability(page);

    // Capture screenshot
    const rawScreenshot = await page.screenshot({ fullPage: true });

    // Resize screenshot if needed
    const screenshot = await this.resizeScreenshot(rawScreenshot);

    // Capture accessibility tree
    const ariaSnapshot = await page.locator('body').ariaSnapshot();

    // Extract same-origin links
    const links = await this.extractLinks(page);

    return {
      screenshot,
      ariaSnapshot,
      url: page.url(),
      title: await page.title(),
      links,
    };
  }

  private async waitForStability(page: Page): Promise<void> {
    try {
      await page.waitForLoadState('networkidle', { timeout: 10_000 });
    } catch {
      // Fallback for SPAs that never reach networkidle
      await page.waitForLoadState('domcontentloaded');
    }
  }

  private async resizeScreenshot(screenshot: Buffer): Promise<Buffer> {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(screenshot).metadata();

    if (!metadata.width || !metadata.height) return screenshot;

    const longestEdge = Math.max(metadata.width, metadata.height);
    if (longestEdge <= this.maxScreenshotWidth) return screenshot;

    const scale = this.maxScreenshotWidth / longestEdge;
    return sharp(screenshot)
      .resize(
        Math.round(metadata.width * scale),
        Math.round(metadata.height * scale),
      )
      .png()
      .toBuffer();
  }

  private async extractLinks(page: Page): Promise<string[]> {
    const baseOrigin = new URL(page.url()).origin;

    const hrefs = await page.$$eval('a[href]', (anchors) =>
      anchors
        .map((a) => (a as { href: string }).href)
        .filter((href) => href.startsWith('http')),
    );

    return [...new Set(hrefs.filter((href) => {
      try {
        return new URL(href).origin === baseOrigin;
      } catch {
        return false;
      }
    }))];
  }
}
