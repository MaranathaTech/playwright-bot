import { WebSocketServer, WebSocket } from 'ws';
import { Explorer, defineConfig, createProvider, TestWriter, ManifestManager, urlToFilename } from '@playwright-ai-bot/core';
import type { PlaywrightBotConfig, PageAnalysis, UserFlow, ManifestEntry } from '@playwright-ai-bot/core';
import { loadConfig } from '../config-loader.js';
import chalk from 'chalk';

interface ServeOptions {
  port: string;
}

interface WSMessage {
  type: string;
  payload?: unknown;
}

export async function serveCommand(options: ServeOptions): Promise<void> {
  const port = parseInt(options.port, 10);
  const wss = new WebSocketServer({ port });

  console.log(chalk.green(`WebSocket server listening on ws://localhost:${port}`));
  console.log(chalk.dim('Waiting for connections from React dev panel...'));

  wss.on('connection', (ws) => {
    console.log(chalk.blue('Client connected'));
    let explorer: Explorer | null = null;

    ws.on('message', async (data) => {
      try {
        const msg: WSMessage = JSON.parse(data.toString());
        await handleMessage(ws, msg, explorer, (e) => { explorer = e; });
      } catch (err) {
        sendError(ws, err instanceof Error ? err.message : String(err));
      }
    });

    ws.on('close', () => {
      console.log(chalk.dim('Client disconnected'));
      explorer?.stop();
    });
  });
}

async function handleMessage(
  ws: WebSocket,
  msg: WSMessage,
  explorer: Explorer | null,
  setExplorer: (e: Explorer) => void,
): Promise<void> {
  switch (msg.type) {
    case 'start': {
      const payload = msg.payload as { url: string; config?: Partial<PlaywrightBotConfig> };
      const fileConfig = await loadConfig();
      const config = defineConfig({ ...fileConfig, ...payload.config, baseUrl: payload.url });

      const newExplorer = new Explorer(config);
      setExplorer(newExplorer);

      // Wire up events to WebSocket
      newExplorer.on('page:start', (url: string, index: number) => {
        send(ws, 'page:start', { url, index });
      });

      newExplorer.on('page:complete', (analysis: PageAnalysis, index: number) => {
        send(ws, 'page:complete', {
          index,
          url: analysis.url,
          title: analysis.title,
          screenshot: analysis.screenshot.toString('base64'),
          elementCount: analysis.elementAnalysis.elements.length,
          scenarioCount: analysis.elementAnalysis.testScenarios.length,
        });
      });

      newExplorer.on('page:error', (url: string, error: Error) => {
        send(ws, 'page:error', { url, error: error.message });
      });

      newExplorer.on('flow:start', (objective: string) => {
        send(ws, 'flow:start', { objective });
      });

      newExplorer.on('flow:complete', (flow: UserFlow) => {
        send(ws, 'flow:complete', {
          name: flow.name,
          startUrl: flow.startUrl,
          endUrl: flow.endUrl,
          stepCount: flow.steps.length,
          success: flow.success,
        });
      });

      newExplorer.on('progress', (visited: number, total: number) => {
        send(ws, 'progress', { visited, total });
      });

      newExplorer.on('complete', async (result) => {
        // Generate tests
        const provider = await createProvider(config.ai);
        const writer = new TestWriter(provider, { outputDir: config.output.dir });
        const pageTests = await writer.generateFromPages(result.pages);
        const flowTests = await writer.generateFromFlows(result.flows);
        const allTests = [...pageTests, ...flowTests];
        await writer.writeTests(allTests);

        // Update manifest
        const manifest = new ManifestManager(config.output.dir);
        const manifestEntries: ManifestEntry[] = allTests.map((test) => {
          const page = result.pages.find((p: PageAnalysis) => p.url === test.url);
          const slug = urlToFilename(test.url);
          return {
            filePath: test.source === 'flow'
              ? `flows/${test.filePath.split('/').pop()!}`
              : `${slug}.spec.ts`,
            url: test.url,
            source: test.source,
            ariaSnapshot: page?.ariaSnapshot ?? '',
            generatedAt: new Date().toISOString(),
            slug,
          };
        });
        await manifest.addEntries(manifestEntries);

        send(ws, 'complete', {
          pagesExplored: result.pagesExplored,
          testsGenerated: allTests.length,
          duration: result.duration,
          tests: allTests.map((t) => ({ filePath: t.filePath, code: t.code, source: t.source, url: t.url })),
        });
      });

      newExplorer.explore(payload.url).catch((err) => {
        sendError(ws, err instanceof Error ? err.message : String(err));
      });

      send(ws, 'started', { url: payload.url });
      break;
    }

    case 'pause':
      explorer?.pause();
      send(ws, 'paused', {});
      break;

    case 'resume':
      explorer?.resume();
      send(ws, 'resumed', {});
      break;

    case 'stop':
      explorer?.stop();
      send(ws, 'stopped', {});
      break;

    default:
      sendError(ws, `Unknown message type: ${msg.type}`);
  }
}

function send(ws: WebSocket, type: string, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

function sendError(ws: WebSocket, message: string): void {
  send(ws, 'error', { message });
}
