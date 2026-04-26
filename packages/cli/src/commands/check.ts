import {
  Explorer,
  defineConfig,
  TestWriter,
  createProvider,
  ManifestManager,
  StalenessChecker,
} from '@playwright-ai-bot/core';
import type { PlaywrightBotConfig, ManifestEntry, CheckResult } from '@playwright-ai-bot/core';
import { loadConfig } from '../config-loader.js';
import { ConsoleReporter } from '../reporter.js';

interface CheckOptions {
  output: string;
  provider: string;
  model?: string;
  headed: boolean;
  authState?: string;
  fix: boolean;
  threshold: string;
  config?: string;
}

export async function checkCommand(url: string | undefined, options: CheckOptions): Promise<void> {
  const reporter = new ConsoleReporter();

  try {
    const fileConfig = await loadConfig(options.config);

    const config = defineConfig({
      ...fileConfig,
      baseUrl: url ?? fileConfig?.baseUrl ?? '',
      ai: {
        ...fileConfig?.ai,
        provider: options.provider as PlaywrightBotConfig['ai']['provider'],
        model: options.model ?? fileConfig?.ai?.model,
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

    const threshold = parseFloat(options.threshold);
    const checker = new StalenessChecker(config, { threshold });

    reporter.checkStart(url);

    let results: CheckResult[];
    if (url) {
      results = [await checker.checkUrl(url)];
    } else {
      results = await checker.checkAll();
    }

    for (const result of results) {
      reporter.checkResult(result);
    }

    reporter.checkSummary(results);

    // Auto-fix stale tests
    const staleResults = results.filter((r) => r.status === 'stale');
    if (options.fix && staleResults.length > 0) {
      const provider = await createProvider(config.ai);
      const writer = new TestWriter(provider, { outputDir: config.output.dir });
      const manifest = new ManifestManager(config.output.dir);

      for (const stale of staleResults) {
        reporter.fixStart(stale.url);

        const explorer = new Explorer(config);
        const result = await explorer.analyzePage(stale.url);

        const pageTests = await writer.generateFromPages(result.pages);
        const flowTests = await writer.generateFromFlows(result.flows);
        const allTests = [...pageTests, ...flowTests];
        await writer.writeTests(allTests);

        const entries: ManifestEntry[] = allTests.map((test) => {
          const page = result.pages.find((p) => p.url === test.url);
          return {
            filePath: stale.filePath,
            url: test.url,
            source: test.source,
            ariaSnapshot: page?.ariaSnapshot ?? '',
            generatedAt: new Date().toISOString(),
            slug: stale.filePath.replace('.spec.ts', ''),
          };
        });
        await manifest.addEntries(entries);

        reporter.fixComplete(stale.url);
      }
    }

    // Exit code 1 if stale tests found without --fix (CI-friendly)
    if (!options.fix && staleResults.length > 0) {
      process.exit(1);
    }
  } catch (err) {
    reporter.error(err instanceof Error ? err : new Error(String(err)));
    process.exit(1);
  }
}
