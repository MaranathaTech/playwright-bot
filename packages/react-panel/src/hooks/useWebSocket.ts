import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ExplorationState,
  WSMessage,
  PageStartPayload,
  PageCompletePayload,
  PageErrorPayload,
  FlowStartPayload,
  FlowCompletePayload,
  ProgressPayload,
  CompletePayload,
  ErrorPayload,
  ActionLogEntry,
} from '../types.js';

const initialState: ExplorationState = {
  status: 'idle',
  pages: [],
  errors: [],
  flows: [],
  tests: [],
  progress: { visited: 0, total: 0 },
  currentPage: null,
  currentFlow: null,
  duration: 0,
  errorMessage: null,
};

export function useWebSocket(serverUrl: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<ExplorationState>(initialState);
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState<ActionLogEntry[]>([]);

  const addLog = useCallback((type: ActionLogEntry['type'], message: string) => {
    setLog((prev) => [...prev, { timestamp: Date.now(), type, message }]);
  }, []);

  useEffect(() => {
    const ws = new WebSocket(serverUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      addLog('info', 'Connected to server');
    };

    ws.onclose = () => {
      setConnected(false);
      addLog('info', 'Disconnected from server');
    };

    ws.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data as string);

      switch (msg.type) {
        case 'started':
          setState((s) => ({ ...s, status: 'running' }));
          addLog('info', 'Exploration started');
          break;

        case 'page:start': {
          const p = msg.payload as PageStartPayload;
          setState((s) => ({ ...s, currentPage: p }));
          addLog('page', `Analyzing: ${p.url}`);
          break;
        }

        case 'page:complete': {
          const p = msg.payload as PageCompletePayload;
          setState((s) => ({
            ...s,
            pages: [...s.pages, p],
            currentPage: null,
          }));
          addLog('page', `Complete: ${p.url} (${p.elementCount} elements, ${p.scenarioCount} scenarios)`);
          break;
        }

        case 'page:error': {
          const p = msg.payload as PageErrorPayload;
          setState((s) => ({
            ...s,
            errors: [...s.errors, p],
            currentPage: null,
          }));
          addLog('error', `Error on ${p.url}: ${p.error}`);
          break;
        }

        case 'flow:start': {
          const p = msg.payload as FlowStartPayload;
          setState((s) => ({ ...s, currentFlow: p }));
          addLog('flow', `Flow: ${p.objective}`);
          break;
        }

        case 'flow:complete': {
          const p = msg.payload as FlowCompletePayload;
          setState((s) => ({
            ...s,
            flows: [...s.flows, p],
            currentFlow: null,
          }));
          addLog('flow', `Flow complete: ${p.name} (${p.stepCount} steps, ${p.success ? 'success' : 'failed'})`);
          break;
        }

        case 'progress': {
          const p = msg.payload as ProgressPayload;
          setState((s) => ({ ...s, progress: p }));
          break;
        }

        case 'complete': {
          const p = msg.payload as CompletePayload;
          setState((s) => ({
            ...s,
            status: 'complete',
            tests: p.tests,
            duration: p.duration,
          }));
          addLog('info', `Complete: ${p.pagesExplored} pages, ${p.testsGenerated} tests`);
          break;
        }

        case 'paused':
          setState((s) => ({ ...s, status: 'paused' }));
          addLog('info', 'Paused');
          break;

        case 'resumed':
          setState((s) => ({ ...s, status: 'running' }));
          addLog('info', 'Resumed');
          break;

        case 'stopped':
          setState((s) => ({ ...s, status: 'idle' }));
          addLog('info', 'Stopped');
          break;

        case 'error': {
          const p = msg.payload as ErrorPayload;
          setState((s) => ({ ...s, status: 'error', errorMessage: p.message }));
          addLog('error', p.message);
          break;
        }
      }
    };

    return () => {
      ws.close();
    };
  }, [serverUrl, addLog]);

  const send = useCallback((type: string, payload?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const startExploration = useCallback((url: string, config?: Record<string, unknown>) => {
    setState(initialState);
    setLog([]);
    send('start', { url, config });
  }, [send]);

  const pause = useCallback(() => send('pause'), [send]);
  const resume = useCallback(() => send('resume'), [send]);
  const stop = useCallback(() => send('stop'), [send]);

  return {
    state,
    connected,
    log,
    startExploration,
    pause,
    resume,
    stop,
  };
}
