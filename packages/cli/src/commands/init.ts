import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import chalk from 'chalk';

const CONFIG_TEMPLATE = `import { defineConfig } from '@playwright-bot/core';

export default defineConfig({
  baseUrl: 'https://example.com',
  ai: {
    provider: 'anthropic',
    // model: 'claude-sonnet-4-5-20250929',
    // apiKey: process.env.ANTHROPIC_API_KEY,
  },
  explore: {
    depth: 1,
    maxPages: 20,
    strategy: 'bfs',
    // include: ['/dashboard.*'],
    // exclude: ['/api.*', '/admin.*'],
  },
  browser: {
    headed: false,
    viewportWidth: 1280,
    viewportHeight: 720,
  },
  // auth: {
  //   storageState: './auth/storageState.json',
  // },
  output: {
    dir: './tests/generated',
    saveReport: true,
  },
});
`;

export async function initCommand(): Promise<void> {
  const filename = 'playwright-bot.config.ts';

  if (existsSync(filename)) {
    console.log(chalk.yellow(`${filename} already exists. Skipping.`));
    return;
  }

  await writeFile(filename, CONFIG_TEMPLATE, 'utf-8');
  console.log(chalk.green(`Created ${filename}`));
  console.log(chalk.dim('Edit the config file and run: npx playwright-bot explore'));
}
