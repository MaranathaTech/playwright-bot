import { z } from 'zod';

// ---- Zod Schemas ----

export const InteractiveElementSchema = z.object({
  type: z.enum(['button', 'link', 'input', 'select', 'checkbox', 'radio', 'textarea', 'tab', 'menu', 'dialog', 'other']),
  label: z.string(),
  locator: z.string(),
  locatorStrategy: z.enum(['getByRole', 'getByLabel', 'getByText', 'getByTestId', 'locator']),
  description: z.string(),
  suggestedInteraction: z.string().optional(),
});

export const TestScenarioSchema = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(z.string()),
  priority: z.enum(['high', 'medium', 'low']),
});

export const PageElementAnalysisSchema = z.object({
  pageDescription: z.string(),
  elements: z.array(InteractiveElementSchema),
  testScenarios: z.array(TestScenarioSchema),
  formFlows: z.array(z.object({
    name: z.string(),
    fields: z.array(z.object({
      locator: z.string(),
      type: z.string(),
      label: z.string(),
      sampleValue: z.string(),
    })),
    submitLocator: z.string(),
  })),
});

export const ActionDecisionSchema = z.object({
  action: z.enum(['click', 'fill', 'select', 'hover', 'press', 'done', 'navigate']),
  selector: z.string().optional(),
  value: z.string().optional(),
  reasoning: z.string(),
  expectation: z.string(),
  flowComplete: z.boolean(),
});

// ---- Types ----

export type InteractiveElement = z.infer<typeof InteractiveElementSchema>;
export type TestScenario = z.infer<typeof TestScenarioSchema>;
export type PageElementAnalysis = z.infer<typeof PageElementAnalysisSchema>;
export type ActionDecision = z.infer<typeof ActionDecisionSchema>;

export interface FlowStep {
  action: string;
  selector?: string;
  value?: string;
  reasoning: string;
  screenshot?: Buffer;
  ariaSnapshot?: string;
  url: string;
  timestamp: number;
}

export interface PageAnalysis {
  url: string;
  title: string;
  elementAnalysis: PageElementAnalysis;
  screenshot: Buffer;
  ariaSnapshot: string;
  timestamp: number;
}

export interface UserFlow {
  name: string;
  startUrl: string;
  steps: FlowStep[];
  endUrl: string;
  success: boolean;
}

// ---- Provider Interface ----

export interface AIProvider {
  analyzePageElements(
    screenshot: Buffer,
    ariaSnapshot: string,
    url: string,
  ): Promise<PageElementAnalysis>;

  decideNextAction(
    screenshot: Buffer,
    ariaSnapshot: string,
    history: FlowStep[],
    objective: string,
  ): Promise<ActionDecision>;

  generateTestCode(
    analysis: PageAnalysis | UserFlow,
  ): Promise<string>;
}

// ---- Provider Factory ----

export interface ProviderConfig {
  provider: 'anthropic' | 'openai' | 'ollama';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export async function createProvider(config: ProviderConfig): Promise<AIProvider> {
  switch (config.provider) {
    case 'anthropic': {
      const { ClaudeProvider } = await import('./claude-provider.js');
      return new ClaudeProvider(config.apiKey, config.model);
    }
    case 'openai': {
      const { OpenAIProvider } = await import('./openai-provider.js');
      return new OpenAIProvider(config.apiKey, config.model);
    }
    case 'ollama': {
      const { OllamaProvider } = await import('./ollama-provider.js');
      return new OllamaProvider(config.baseUrl, config.model);
    }
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}
