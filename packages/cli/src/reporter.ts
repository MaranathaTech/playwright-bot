import chalk from 'chalk';
import ora from 'ora';
import type { PlaywrightBotConfig } from '@playwright-ai-bot/core';

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
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
