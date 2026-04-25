# playwright-bot

AI-powered Playwright test generator CLI. Autonomously explores web UIs using AI vision and generates comprehensive Playwright test suites.

## Quick Start

```bash
# Set your AI provider API key
export ANTHROPIC_API_KEY=sk-ant-...

# Explore a site and generate tests
npx playwright-bot explore https://example.com

# With options
npx playwright-bot explore https://example.com \
  --depth 2 \
  --max-pages 10 \
  --output ./tests/generated \
  --headed
```

## Installation

```bash
# Global install
npm install -g playwright-bot

# Or use directly with npx
npx playwright-bot explore <url>
```

## Commands

### `explore <url>`

Explore a website and generate Playwright tests.

| Flag | Default | Description |
|------|---------|-------------|
| `--depth <1\|2>` | `1` | Exploration depth |
| `--max-pages <n>` | `20` | Maximum pages to explore |
| `--output <dir>` | `./tests/generated` | Output directory for test files |
| `--provider <name>` | `anthropic` | AI provider (anthropic, openai, ollama) |
| `--model <name>` | Provider default | Override model name |
| `--headed` | `false` | Show browser window |
| `--auth-state <path>` | — | Path to storageState.json |
| `--include <patterns>` | — | URL patterns to include (comma-separated) |
| `--exclude <patterns>` | — | URL patterns to exclude (comma-separated) |
| `--dry-run` | `false` | Explore without writing test files |

### `init`

Scaffold a `playwright-bot.config.ts` configuration file.

### `generate <report>`

Regenerate test files from a previously saved exploration report.

### `serve`

Start a WebSocket server for the React dev panel.

```bash
npx playwright-bot serve --port 3100
```

## Configuration

Create a `playwright-bot.config.ts` in your project root:

```typescript
import { defineConfig } from '@playwright-ai-bot/core';

export default defineConfig({
  baseUrl: 'https://myapp.example.com',
  ai: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929',
  },
  explore: {
    depth: 2,
    maxPages: 30,
    strategy: 'bfs',
    exclude: ['/admin.*', '/api.*'],
  },
  browser: {
    headed: false,
    viewportWidth: 1280,
    viewportHeight: 720,
  },
  auth: {
    storageState: './auth/storageState.json',
  },
  output: {
    dir: './tests/generated',
    saveReport: true,
  },
});
```

## AI Providers

- **Anthropic** (default) — Claude with vision. Set `ANTHROPIC_API_KEY`.
- **OpenAI** — GPT-4o with vision. Set `OPENAI_API_KEY`.
- **Ollama** — Local models with vision (LLaVA, Llama 3.2 Vision).

```bash
ollama pull llava
npx playwright-bot explore https://example.com --provider ollama --model llava
```

## Related Packages

| Package | Description |
|---------|-------------|
| [`@playwright-ai-bot/core`](https://www.npmjs.com/package/@playwright-ai-bot/core) | Engine library |
| [`@playwright-ai-bot/react-panel`](https://www.npmjs.com/package/@playwright-ai-bot/react-panel) | React dev panel |

## License

MIT
