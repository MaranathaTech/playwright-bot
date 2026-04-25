import { Explorer, defineConfig, TestWriter, createProvider } from '@playwright-bot/core';
import type { PlaywrightBotConfig } from '@playwright-bot/core';
import { loadConfig } from '../config-loader.js';
import { ConsoleReporter } from '../reporter.js';

interface ExploreOptions {
  depth: string;
  maxPages: string;
  output: string;
  provider: string;
  model?: string;
  headed: boolean;
  authState?: string;
  include?: string;
  exclude?: string;
  dryRun: boolean;
  config?: string;
}

export async function exploreCommand(url: string, options: ExploreOptions): Promise<void> {
  const reporter = new ConsoleReporter();

  try {
    // Load config file if present, merge with CLI options
    const fileConfig = await loadConfig(options.config);

    const config = defineConfig({
      ...fileConfig,
      baseUrl: url,
      ai: {
        ...fileConfig?.ai,
        provider: options.provider as PlaywrightBotConfig['ai']['provider'],
        model: options.model ?? fileConfig?.ai?.model,
      },
      explore: {
        ...fileConfig?.explore,
        depth: parseInt(options.depth, 10) as 1 | 2,
        maxPages: parseInt(options.maxPages, 10),
        include: options.include?.split(',').map((s) => s.trim()),
        exclude: options.exclude?.split(',').map((s) => s.trim()),
      },
      browser: {
        ...fileConfig?.browser,
        headed: options.headed,
      },
      auth: {
        ...fileConfig?.auth,
        ...(options.authState ? { storageState: options.authState } : {}),
      },
      output: {
        ...fileConfig?.output,
        dir: options.output,
      },
    });

    reporter.start(config);

    const explorer = new Explorer(config);

    // Wire up events
    explorer.on('page:start', (pageUrl: string, index: number) => {
      reporter.pageStart(pageUrl, index);
    });

    explorer.on('page:complete', (_analysis: unknown, index: number) => {
      reporter.pageComplete(index);
    });

    explorer.on('page:error', (pageUrl: string, error: Error) => {
      reporter.pageError(pageUrl, error);
    });

    explorer.on('flow:start', (objective: string) => {
      reporter.flowStart(objective);
    });

    explorer.on('flow:complete', () => {
      reporter.flowComplete();
    });

    explorer.on('progress', (visited: number, total: number) => {
      reporter.progress(visited, total);
    });

    // Run exploration
    const result = await explorer.explore(url);

    // Generate tests
    reporter.generatingTests();
    const provider = await createProvider(config.ai);
    const writer = new TestWriter(provider, {
      outputDir: config.output.dir,
      dryRun: options.dryRun,
    });

    const pageTests = await writer.generateFromPages(result.pages);
    const flowTests = await writer.generateFromFlows(result.flows);
    const allTests = [...pageTests, ...flowTests];

    if (!options.dryRun) {
      await writer.writeTests(allTests);
    }

    // Save report
    if (config.output.saveReport && !options.dryRun) {
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const reportDir = join(config.output.dir, '.reports');
      await mkdir(reportDir, { recursive: true });

      // Serialize without screenshot buffers for JSON
      const serializableResult = {
        ...result,
        pages: result.pages.map((p) => ({
          ...p,
          screenshot: undefined,
          ariaSnapshot: p.ariaSnapshot,
        })),
        flows: result.flows.map((f) => ({
          ...f,
          steps: f.steps.map((s) => ({ ...s, screenshot: undefined })),
        })),
      };
      await writeFile(
        join(reportDir, `report-${Date.now()}.json`),
        JSON.stringify(serializableResult, null, 2),
      );
    }

    reporter.complete(result.pagesExplored, allTests.length, result.duration, options.dryRun);
  } catch (err) {
    reporter.error(err instanceof Error ? err : new Error(String(err)));
    process.exit(1);
  }
}
