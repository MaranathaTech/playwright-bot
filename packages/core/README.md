# @playwright-ai-bot/core

AI-powered Playwright test generation engine. This is the core library that powers [playwright-bot](https://www.npmjs.com/package/playwright-bot).

## Installation

```bash
npm install @playwright-ai-bot/core
```

`playwright-core` is a peer dependency:

```bash
npm install playwright-core
```

## Usage

```typescript
import { Explorer, defineConfig, createProvider, TestWriter } from '@playwright-ai-bot/core';

const config = defineConfig({
  baseUrl: 'https://example.com',
  ai: {
    provider: 'anthropic',
  },
});

const explorer = new Explorer(config);
const result = await explorer.explore('https://example.com');

const provider = await createProvider(config.ai);
const writer = new TestWriter(provider, { outputDir: './tests/generated' });
const tests = await writer.generateFromPages(result.pages);
await writer.writeTests(tests);
```

## Configuration

```typescript
import { defineConfig } from '@playwright-ai-bot/core';

export default defineConfig({
  baseUrl: 'https://myapp.example.com',
  ai: {
    provider: 'anthropic', // 'anthropic' | 'openai' | 'ollama'
    model: 'claude-sonnet-4-5-20250929',
  },
  explore: {
    depth: 2,          // 1 = page analysis, 2 = interactive flows
    maxPages: 30,
    strategy: 'bfs',   // 'bfs' | 'dfs'
    exclude: ['/admin.*', '/api.*'],
  },
  browser: {
    headed: false,
    viewportWidth: 1280,
    viewportHeight: 720,
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

## Related Packages

| Package | Description |
|---------|-------------|
| [`playwright-bot`](https://www.npmjs.com/package/playwright-bot) | CLI interface |
| [`@playwright-ai-bot/react-panel`](https://www.npmjs.com/package/@playwright-ai-bot/react-panel) | React dev panel |

## License

MIT
