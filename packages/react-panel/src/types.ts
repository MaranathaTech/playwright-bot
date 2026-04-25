export interface DevtoolsProps {
  serverUrl: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultOpen?: boolean;
}

export interface PanelProps {
  serverUrl: string;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  payload: unknown;
}

export interface PageStartPayload {
  url: string;
  index: number;
}

export interface PageCompletePayload {
  index: number;
  url: string;
  title: string;
  screenshot: string; // base64
  elementCount: number;
  scenarioCount: number;
}

export interface PageErrorPayload {
  url: string;
  error: string;
}

export interface FlowStartPayload {
  objective: string;
}

export interface FlowCompletePayload {
  name: string;
  startUrl: string;
  endUrl: string;
  stepCount: number;
  success: boolean;
}

export interface ProgressPayload {
  visited: number;
  total: number;
}

export interface CompletePayload {
  pagesExplored: number;
  testsGenerated: number;
  duration: number;
  tests: GeneratedTestInfo[];
}

export interface GeneratedTestInfo {
  filePath: string;
  code: string;
  source: 'page' | 'flow';
  url: string;
}

export interface ErrorPayload {
  message: string;
}

export interface ExplorationState {
  status: 'idle' | 'running' | 'paused' | 'complete' | 'error';
  pages: PageCompletePayload[];
  errors: PageErrorPayload[];
  flows: FlowCompletePayload[];
  tests: GeneratedTestInfo[];
  progress: { visited: number; total: number };
  currentPage: PageStartPayload | null;
  currentFlow: FlowStartPayload | null;
  duration: number;
  errorMessage: string | null;
}

export interface GraphNode {
  id: string;
  label: string;
  color: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export type ActionLogEntry = {
  timestamp: number;
  type: 'page' | 'flow' | 'error' | 'info';
  message: string;
};
