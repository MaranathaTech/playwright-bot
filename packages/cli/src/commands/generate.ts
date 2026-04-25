import { readFile } from 'fs/promises';
import { createProvider, TestWriter } from '@playwright-bot/core';
import type { PageAnalysis, UserFlow } from '@playwright-bot/core';
import chalk from 'chalk';

interface GenerateOptions {
  output: string;
  provider: string;
  model?: string;
}

export async function generateCommand(reportPath: string, options: GenerateOptions): Promise<void> {
  try {
    console.log(chalk.blue(`Reading report from ${reportPath}...`));

    const raw = await readFile(reportPath, 'utf-8');
    const report = JSON.parse(raw) as {
      pages: PageAnalysis[];
      flows: UserFlow[];
    };

    const provider = await createProvider({
      provider: options.provider as 'anthropic' | 'openai' | 'ollama',
      model: options.model,
    });

    const writer = new TestWriter(provider, {
      outputDir: options.output,
    });

    console.log(chalk.blue('Generating tests from report...'));

    const pageTests = await writer.generateFromPages(report.pages ?? []);
    const flowTests = await writer.generateFromFlows(report.flows ?? []);
    const allTests = [...pageTests, ...flowTests];

    await writer.writeTests(allTests);

    console.log(chalk.green(`Generated ${allTests.length} test file(s) in ${options.output}`));
  } catch (err) {
    console.error(chalk.red('Failed to generate tests:'), err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
