import chalk from 'chalk';
import ora from 'ora';
import type { PlaywrightBotConfig, CheckResult } from '@playwright-ai-bot/core';

export class ConsoleReporter {
  private spinner = ora();
  private startTime = 0;

  start(config: PlaywrightBotConfig): void {
    this.startTime = Date.now();
    console.log('');
    console.log(chalk.bold('playwright-bot'));
    console.log(chalk.dim('AI-powered Playwright test generator'));
    console.log('');
    console.log(`  URL:       ${chalk.cyan(config.baseUrl)}`);
    console.log(`  Provider:  ${chalk.cyan(config.ai.provider)}${config.ai.model ? ` (${config.ai.model})` : ''}`);
    console.log(`  Depth:     ${chalk.cyan(String(config.explore.depth))}`);
    console.log(`  Max pages: ${chalk.cyan(String(config.explore.maxPages))}`);
    console.log(`  Output:    ${chalk.cyan(config.output.dir)}`);
    console.log('');
  }

  pageStart(url: string, index: number): void {
    this.spinner.start(chalk.dim(`[${index + 1}] `) + `Analyzing ${chalk.cyan(url)}`);
  }

  pageComplete(index: number): void {
    this.spinner.succeed(chalk.dim(`[${index + 1}] `) + 'Page analyzed');
  }

  pageError(url: string, error: Error): void {
    this.spinner.fail(`Failed: ${url} — ${chalk.red(error.message)}`);
  }

  flowStart(objective: string): void {
    this.spinner.start(`Exploring flow: ${chalk.yellow(objective)}`);
  }

  flowComplete(): void {
    this.spinner.succeed('Flow complete');
  }

  progress(visited: number, total: number): void {
    // Progress is shown inline with page start/complete
    void visited;
    void total;
  }

  generatingTests(): void {
    console.log('');
    this.spinner.start('Generating test files...');
  }

  complete(pagesExplored: number, testsGenerated: number, duration: number, dryRun: boolean): void {
    this.spinner.succeed('Done');
    console.log('');
    console.log(chalk.bold('Summary'));
    console.log(`  Pages explored:  ${chalk.green(String(pagesExplored))}`);
    console.log(`  Tests generated: ${chalk.green(String(testsGenerated))}`);
    console.log(`  Duration:        ${chalk.green(formatDuration(duration))}`);
    if (dryRun) {
      console.log(chalk.yellow('  (dry run — no files written)'));
    }
    console.log('');
  }

  error(error: Error): void {
    this.spinner.fail(chalk.red(error.message));
  }

  pageGenerateStart(url: string, update: boolean): void {
    console.log('');
    console.log(chalk.bold('playwright-bot generate-page'));
    console.log('');
    console.log(`  URL:    ${chalk.cyan(url)}`);
    console.log(`  Mode:   ${update ? chalk.yellow('update') : chalk.green('new')}`);
    console.log('');
  }

  checkStart(url?: string): void {
    console.log('');
    console.log(chalk.bold('playwright-bot check'));
    console.log('');
    if (url) {
      console.log(`  URL: ${chalk.cyan(url)}`);
    } else {
      console.log(`  Checking ${chalk.cyan('all')} manifest entries`);
    }
    console.log('');
  }

  checkResult(result: CheckResult): void {
    const similarity = `${Math.round(result.similarity * 100)}%`;

    switch (result.status) {
      case 'fresh':
        console.log(`  ${chalk.green('OK')}      ${result.url} (${similarity})`);
        break;
      case 'stale':
        console.log(`  ${chalk.yellow('STALE')}   ${result.url} (${similarity}) — ${result.changeSummary}`);
        break;
      case 'missing':
        console.log(`  ${chalk.red('MISSING')} ${result.url}`);
        break;
      case 'error':
        console.log(`  ${chalk.red('ERROR')}   ${result.url} — ${result.error}`);
        break;
    }
  }

  checkSummary(results: CheckResult[]): void {
    const fresh = results.filter((r) => r.status === 'fresh').length;
    const stale = results.filter((r) => r.status === 'stale').length;
    const missing = results.filter((r) => r.status === 'missing').length;
    const errors = results.filter((r) => r.status === 'error').length;

    console.log('');
    console.log(chalk.bold('Summary'));
    console.log(`  Fresh:   ${chalk.green(String(fresh))}`);
    if (stale > 0) console.log(`  Stale:   ${chalk.yellow(String(stale))}`);
    if (missing > 0) console.log(`  Missing: ${chalk.red(String(missing))}`);
    if (errors > 0) console.log(`  Errors:  ${chalk.red(String(errors))}`);
    console.log('');
  }

  fixStart(url: string): void {
    this.spinner.start(`Regenerating test for ${chalk.cyan(url)}`);
  }

  fixComplete(url: string): void {
    this.spinner.succeed(`Regenerated test for ${chalk.cyan(url)}`);
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
