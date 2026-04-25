import { existsSync } from 'fs';
import { resolve } from 'path';
import type { PlaywrightBotConfig } from '@playwright-bot/core';

const CONFIG_FILES = [
  'playwright-bot.config.ts',
  'playwright-bot.config.js',
  'playwright-bot.config.mjs',
];

export async function loadConfig(
  configPath?: string,
): Promise<Partial<PlaywrightBotConfig> | undefined> {
  const path = configPath
    ? resolve(configPath)
    : CONFIG_FILES.map((f) => resolve(f)).find((f) => existsSync(f));

  if (!path || !existsSync(path)) return undefined;

  try {
    const { createJiti } = await import('jiti');
    const jiti = createJiti(import.meta.url);
    const mod = await jiti.import(path) as { default?: Partial<PlaywrightBotConfig> };
    return mod.default ?? mod as Partial<PlaywrightBotConfig>;
  } catch (err) {
    console.warn(`Warning: Failed to load config from ${path}:`, err instanceof Error ? err.message : err);
    return undefined;
  }
}
