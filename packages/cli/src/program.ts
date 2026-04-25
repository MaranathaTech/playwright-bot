import { Command } from 'commander';
import { exploreCommand } from './commands/explore.js';
import { initCommand } from './commands/init.js';
import { generateCommand } from './commands/generate.js';
import { serveCommand } from './commands/serve.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('playwright-bot')
    .description('AI-powered Playwright test generator')
    .version('0.1.0');

  program
    .command('explore <url>')
    .description('Explore a website and generate Playwright tests')
    .option('--depth <depth>', 'Exploration depth (1 or 2)', '1')
    .option('--max-pages <n>', 'Maximum pages to explore', '20')
    .option('--output <dir>', 'Output directory for test files', './tests/generated')
    .option('--provider <provider>', 'AI provider (anthropic, openai, ollama)', 'anthropic')
    .option('--model <model>', 'Override model name')
    .option('--headed', 'Show browser window', false)
    .option('--auth-state <path>', 'Path to storageState.json')
    .option('--include <patterns>', 'URL patterns to include (comma-separated)')
    .option('--exclude <patterns>', 'URL patterns to exclude (comma-separated)')
    .option('--dry-run', 'Explore without writing test files', false)
    .option('--config <path>', 'Path to config file')
    .action(exploreCommand);

  program
    .command('init')
    .description('Scaffold a playwright-bot.config.ts configuration file')
    .action(initCommand);

  program
    .command('generate <report>')
    .description('Regenerate test files from a saved exploration report')
    .option('--output <dir>', 'Output directory for test files', './tests/generated')
    .option('--provider <provider>', 'AI provider', 'anthropic')
    .option('--model <model>', 'Override model name')
    .action(generateCommand);

  program
    .command('serve')
    .description('Start WebSocket server for the React dev panel')
    .option('--port <port>', 'Server port', '3100')
    .action(serveCommand);

  return program;
}
