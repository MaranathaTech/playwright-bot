export interface PlaywrightBotConfig {
  /** Base URL to start exploring */
  baseUrl: string;

  /** AI provider configuration */
  ai: {
    /** AI provider to use */
    provider: 'anthropic' | 'openai' | 'ollama';
    /** Model name */
    model?: string;
    /** API key (reads from env if not set) */
    apiKey?: string;
    /** Base URL for ollama or custom endpoints */
    baseUrl?: string;
  };

  /** Exploration settings */
  explore: {
    /** Exploration depth: 1 = page-level analysis, 2 = interactive flow exploration */
    depth: 1 | 2;
    /** Maximum pages to explore */
    maxPages: number;
    /** Maximum steps per flow (depth 2 only) */
    maxStepsPerFlow: number;
    /** Crawl strategy */
    strategy: 'bfs' | 'dfs';
    /** URL patterns to include (regex strings) */
    include?: string[];
    /** URL patterns to exclude (regex strings) */
    exclude?: string[];
  };

  /** Browser settings */
  browser: {
    /** Show browser window */
    headed: boolean;
    /** Viewport width */
    viewportWidth: number;
    /** Viewport height */
    viewportHeight: number;
    /** Navigation timeout in ms */
    timeout: number;
  };

  /** Authentication */
  auth?: {
    /** Path to storageState.json */
    storageState?: string;
    /** Login credentials */
    credentials?: {
      usernameSelector: string;
      passwordSelector: string;
      submitSelector: string;
      username: string;
      password: string;
      loginUrl: string;
    };
    /** Custom setup script path */
    setupScript?: string;
  };

  /** Output settings */
  output: {
    /** Directory for generated test files */
    dir: string;
    /** Also save exploration report JSON */
    saveReport: boolean;
  };
}

export const defaultConfig: PlaywrightBotConfig = {
  baseUrl: '',
  ai: {
    provider: 'anthropic',
  },
  explore: {
    depth: 1,
    maxPages: 20,
    maxStepsPerFlow: 10,
    strategy: 'bfs',
  },
  browser: {
    headed: false,
    viewportWidth: 1280,
    viewportHeight: 720,
    timeout: 30_000,
  },
  output: {
    dir: './tests/generated',
    saveReport: true,
  },
};

/** Deeply partial config type for defineConfig */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function defineConfig(config: DeepPartial<PlaywrightBotConfig>): PlaywrightBotConfig {
  return {
    ...defaultConfig,
    ...config,
    ai: { ...defaultConfig.ai, ...config.ai },
    explore: { ...defaultConfig.explore, ...config.explore },
    browser: { ...defaultConfig.browser, ...config.browser },
    output: { ...defaultConfig.output, ...config.output },
  } as PlaywrightBotConfig;
}
