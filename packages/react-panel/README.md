# @playwright-ai-bot/react-panel

React dev panel for [playwright-bot](https://www.npmjs.com/package/playwright-bot). Provides real-time visualization of AI-powered exploration with test preview and editing.

## Installation

```bash
npm install @playwright-ai-bot/react-panel
```

`react` and `react-dom` are peer dependencies (>=18.0.0).

## Usage

```tsx
import { PlaywrightBotDevtools } from '@playwright-ai-bot/react-panel';

function App() {
  return (
    <>
      <MyApp />
      {process.env.NODE_ENV === 'development' && (
        <PlaywrightBotDevtools serverUrl="ws://localhost:3100" />
      )}
    </>
  );
}
```

Start the WebSocket server:

```bash
npx playwright-bot serve --port 3100
```

## Features

- Real-time exploration progress visualization
- Site map graph view
- Screenshot previews of analyzed pages
- Test code preview with syntax highlighting
- Start, pause, resume, and stop controls

## Related Packages

| Package | Description |
|---------|-------------|
| [`playwright-bot`](https://www.npmjs.com/package/playwright-bot) | CLI interface |
| [`@playwright-ai-bot/core`](https://www.npmjs.com/package/@playwright-ai-bot/core) | Engine library |

## License

MIT
