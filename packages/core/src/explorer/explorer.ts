import { EventEmitter } from 'events';
import type { BrowserContext, Page } from 'playwright-core';
import type { PlaywrightBotConfig } from '../config.js';
import type { AIProvider, PageAnalysis, UserFlow } from '../ai/provider.js';
import { createProvider } from '../ai/provider.js';
import { BrowserManager } from '../browser/browser-manager.js';
import { PageCapture } from '../browser/page-capture.js';
import { Crawler } from './crawler.js';
import { PageAnalyzer } from './page-analyzer.js';
import { FlowExplorer } from './flow-explorer.js';
import { AuthHandler } from './auth-handler.js';

export interface ExplorationResult {
  pages: PageAnalysis[];
  flows: UserFlow[];
  startUrl: string;
  duration: number;
  pagesExplored: number;
}

export interface ExplorerEvents {
  'page:start': (url: string, index: number) => void;
  'page:complete': (analysis: PageAnalysis, index: number) => void;
  'page:error': (url: string, error: Error) => void;
  'flow:start': (objective: string) => void;
  'flow:step': (step: number, action: string) => void;
  'flow:complete': (flow: UserFlow) => void;
  'progress': (visited: number, total: number) => void;
  'complete': (result: ExplorationResult) => void;
  'error': (error: Error) => void;
}

export class Explorer extends EventEmitter {
  private browserManager: BrowserManager;
  private provider: AIProvider | null = null;
  private isPaused = false;
  private isStopped = false;

  constructor(private config: PlaywrightBotConfig) {
    super();
    this.browserManager = new BrowserManager({
      headed: config.browser.headed,
      viewportWidth: config.browser.viewportWidth,
      viewportHeight: config.browser.viewportHeight,
      storageState: config.auth?.storageState,
    });
  }

  async explore(url?: string): Promise<ExplorationResult> {
    const startUrl = url ?? this.config.baseUrl;
    if (!startUrl) throw new Error('No URL provided. Set baseUrl in config or pass a URL.');

    const startTime = Date.now();
    this.provider = await createProvider(this.config.ai);

    const context = await this.browserManager.launch();
    const authHandler = new AuthHandler(this.config.auth);
    await authHandler.setup(context);

    const crawler = new Crawler({
      strategy: this.config.explore.strategy,
      maxPages: this.config.explore.maxPages,
      include: this.config.explore.include,
      exclude: this.config.explore.exclude,
    });
    crawler.seed(startUrl);

    const pageAnalyzer = new PageAnalyzer(this.provider);
    const flowExplorer = new FlowExplorer(this.provider, {
      maxSteps: this.config.explore.maxStepsPerFlow,
    });

    const pages: PageAnalysis[] = [];
    const flows: UserFlow[] = [];
    let pageIndex = 0;

    try {
      let nextUrl: string | null;
      while ((nextUrl = crawler.next()) !== null) {
        if (this.isStopped) break;
        while (this.isPaused) {
          await new Promise((r) => setTimeout(r, 500));
          if (this.isStopped) break;
        }
        if (this.isStopped) break;

        try {
          this.emit('page:start', nextUrl, pageIndex);
          const page = await context.newPage();

          await page.goto(nextUrl, {
            waitUntil: 'domcontentloaded',
            timeout: this.config.browser.timeout,
          });

          // Level 1: Page analysis
          const analysis = await pageAnalyzer.analyze(page);
          pages.push(analysis);

          // Add discovered links to crawler
          const capture = new PageCapture();
          const captured = await capture.capture(page);
          crawler.addLinks(captured.links);

          this.emit('page:complete', analysis, pageIndex);
          this.emit('progress', crawler.visitedCount, this.config.explore.maxPages);

          // Level 2: Flow exploration
          if (this.config.explore.depth >= 2 && analysis.elementAnalysis.testScenarios.length > 0) {
            for (const scenario of analysis.elementAnalysis.testScenarios) {
              if (this.isStopped) break;
              if (scenario.priority !== 'high') continue;

              this.emit('flow:start', scenario.name);

              // Navigate back to the page for each flow
              await page.goto(nextUrl, {
                waitUntil: 'domcontentloaded',
                timeout: this.config.browser.timeout,
              });

              const flow = await flowExplorer.explore(page, scenario.description);
              flows.push(flow);

              this.emit('flow:complete', flow);
            }
          }

          await page.close();
          pageIndex++;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          this.emit('page:error', nextUrl, error);
          // Continue with next page — error isolation
        }
      }

      const result: ExplorationResult = {
        pages,
        flows,
        startUrl,
        duration: Date.now() - startTime,
        pagesExplored: pages.length,
      };

      this.emit('complete', result);
      return result;
    } finally {
      await this.browserManager.close();
    }
  }

  async analyzePage(url: string): Promise<ExplorationResult> {
    const startTime = Date.now();
    this.provider = await createProvider(this.config.ai);

    const context = await this.browserManager.launch();
    const authHandler = new AuthHandler(this.config.auth);
    await authHandler.setup(context);

    const pageAnalyzer = new PageAnalyzer(this.provider);
    const flowExplorer = new FlowExplorer(this.provider, {
      maxSteps: this.config.explore.maxStepsPerFlow,
    });

    const pages: PageAnalysis[] = [];
    const flows: UserFlow[] = [];

    try {
      this.emit('page:start', url, 0);
      const page = await context.newPage();

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.browser.timeout,
      });

      const analysis = await pageAnalyzer.analyze(page);
      pages.push(analysis);

      this.emit('page:complete', analysis, 0);
      this.emit('progress', 1, 1);

      // Level 2: Flow exploration
      if (this.config.explore.depth >= 2 && analysis.elementAnalysis.testScenarios.length > 0) {
        for (const scenario of analysis.elementAnalysis.testScenarios) {
          if (this.isStopped) break;
          if (scenario.priority !== 'high') continue;

          this.emit('flow:start', scenario.name);

          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: this.config.browser.timeout,
          });

          const flow = await flowExplorer.explore(page, scenario.description);
          flows.push(flow);

          this.emit('flow:complete', flow);
        }
      }

      await page.close();

      const result: ExplorationResult = {
        pages,
        flows,
        startUrl: url,
        duration: Date.now() - startTime,
        pagesExplored: pages.length,
      };

      this.emit('complete', result);
      return result;
    } finally {
      await this.browserManager.close();
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    this.isStopped = true;
    this.isPaused = false;
  }
}
