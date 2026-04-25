# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install                                  # Install all dependencies
pnpm build                                    # Build all packages (Turborepo)
pnpm typecheck                                # Type-check all packages
pnpm test                                     # Run all tests
pnpm dev                                      # Watch mode for all packages

# Single package
pnpm --filter @playwright-bot/core build
pnpm --filter @playwright-bot/core test
pnpm --filter @playwright-bot/core test -- crawler.test.ts      # Single test file
pnpm --filter @playwright-bot/core test -- --watch              # Watch mode
pnpm --filter @playwright-bot/core test -- -t "should visit"    # Single test by name
```

Turborepo task order: `build` depends on `^build` (upstream packages first), `typecheck` depends on `^build`, `test` depends on `build`. Always run `pnpm build` before `pnpm typecheck`.

## Architecture

**Monorepo** (pnpm workspaces + Turborepo) with three packages:

- **`@playwright-bot/core`** (`packages/core/`) — Engine library
- **`playwright-bot`** (`packages/cli/`) — CLI (depends on core)
- **`@playwright-bot/react-panel`** (`packages/react-panel/`) — React dev panel (standalone, connects via WebSocket)

### Core data flow

```
Explorer (orchestrator, EventEmitter)
  │
  ├─ Level 1: Crawler (BFS/DFS) → PageCapture (screenshot + ARIA) → AIProvider.analyzePageElements()
  │
  ├─ Level 2: FlowExplorer → AIProvider.decideNextAction() loop → Interaction executes actions
  │
  └─ TestWriter → AIProvider.generateTestCode() → .spec.ts files
```

The **Explorer** (`explorer/explorer.ts`) orchestrates everything: launches browser via `BrowserManager`, seeds the `Crawler`, runs `PageAnalyzer` on each URL (Level 1), optionally runs `FlowExplorer` for interactive flows (Level 2, `--depth 2`), then hands results to `TestWriter` for code generation. Progress is reported via EventEmitter events.

### AI provider layer

`AIProvider` interface in `ai/provider.ts` with three methods: `analyzePageElements`, `decideNextAction`, `generateTestCode`. Provider factory uses **dynamic imports** — only the selected provider's SDK is loaded at runtime. All AI responses are validated with **Zod schemas** (`PageElementAnalysisSchema`, `ActionDecisionSchema`) with up to 2 retries on parse failure.

### CLI ↔ React panel communication

The `serve` command starts a WebSocket server. The React panel connects and exchanges typed JSON messages. Server emits Explorer events as WS messages (screenshots as base64 strings). Client sends commands: `start`, `pause`, `resume`, `stop`.

## Key conventions

- **ESM-only** — all imports must use `.js` extensions (`import { Foo } from './foo.js'`). Enforced by `verbatimModuleSyntax: true`.
- **No DOM lib in core** — `packages/core/tsconfig.json` only has `ES2022` in `lib`. Use `page.$$eval()` instead of `page.evaluate()` with DOM types. The react-panel tsconfig includes `DOM`.
- **`DeepPartial<T>`** — `defineConfig()` accepts deeply partial config and merges with defaults. Uses `as PlaywrightBotConfig` cast after shallow merge per section.
- **Provider-agnostic prompts** — Prompt templates in `ai/prompts/` are plain functions returning strings, not tied to any SDK.
- **Locator preference** — AI prompts instruct: `getByRole` > `getByLabel` > `getByText` > `getByTestId` > CSS.
- **Error isolation** — Single page failures don't halt exploration; errors are emitted and the crawler continues.
- **Screenshot resizing** — `sharp` resizes to max 1568px longest edge before sending to AI (token optimization).
- **Config loading** — CLI loads `playwright-bot.config.ts` via `jiti` (TypeScript without precompilation). Falls back silently if no config file found.
- **Buffer ↔ base64** — `Buffer` internally in core, converted to base64 string for WebSocket/JSON serialization.
- **URL normalization** — Crawler strips trailing slashes (except root `/`), hash fragments, and UTM parameters. Note: `new URL('https://example.com').toString()` always produces a trailing slash on root URLs.

## Testing

Vitest with tests in `packages/core/src/__tests__/`. Tests cover crawler behavior (BFS/DFS, URL normalization, include/exclude patterns, deduplication), selector strategy (URL-to-filename, locator validation), and config merging. Tests are behavior-focused — no mocking of Playwright or AI providers.
