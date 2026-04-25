import type { Page } from 'playwright-core';
import { PageCapture } from '../browser/page-capture.js';
import type { AIProvider, PageAnalysis } from '../ai/provider.js';

export class PageAnalyzer {
  private capture: PageCapture;

  constructor(private provider: AIProvider) {
    this.capture = new PageCapture();
  }

  async analyze(page: Page): Promise<PageAnalysis> {
    const captured = await this.capture.capture(page);

    const elementAnalysis = await this.provider.analyzePageElements(
      captured.screenshot,
      captured.ariaSnapshot,
      captured.url,
    );

    return {
      url: captured.url,
      title: captured.title,
      elementAnalysis,
      screenshot: captured.screenshot,
      ariaSnapshot: captured.ariaSnapshot,
      timestamp: Date.now(),
    };
  }
}
