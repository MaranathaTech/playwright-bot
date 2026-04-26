import {
  Explorer,
  defineConfig,
  TestWriter,
  createProvider,
  ManifestManager,
  urlToFilename,
} from '@playwright-ai-bot/core';
import type { PlaywrightBotConfig, ManifestEntry } from '@playwright-ai-bot/core';
import { existsSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '../config-loader.js';
import { ConsoleReporter } from '../reporter.js';

interface GeneratePageOptions {
  depth: string;
  output: string;
  provider: string;
  model?: string;
  headed: boolean;
  authState?: string;
  update: boolean;
  dryRun: boolean;
  config?: string;
}

export async function generatePageCommand(url: string, options: GeneratePageOptions): Promise<void> {
  const reporter = new ConsoleReporter();

  try {
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
        maxPages: 1,
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

    // Check if test file already exists
    const slug = urlToFilename(url);
    const testFilePath = join(config.output.dir, `${slug}.spec.ts`);

    if (!options.update && existsSync(testFilePath)) {
      reporter.error(
        new Error(`Test file already exists: ${testFilePath}\nUse --update to overwrite.`),
      );
      process.exit(1);
    }

    reporter.pageGenerateStart(url, options.update);

    const explorer = new Explorer(config);

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

    const result = await explorer.analyzePage(url);

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

      // Update manifest
      const manifest = new ManifestManager(config.output.dir);
      const entries: ManifestEntry[] = allTests.map((test) => {
        const page = result.pages.find((p) => p.url === test.url);
        return {
          filePath: `${slug}.spec.ts`,
          url: test.url,
          source: test.source,
          ariaSnapshot: page?.ariaSnapshot ?? '',
          generatedAt: new Date().toISOString(),
          slug,
        };
      });
      await manifest.addEntries(entries);
    }

    reporter.complete(result.pagesExplored, allTests.length, result.duration, options.dryRun);
  } catch (err) {
    reporter.error(err instanceof Error ? err : new Error(String(err)));
    process.exit(1);
  }
}
