import OpenAI from 'openai';
import type { AIProvider, PageElementAnalysis, ActionDecision, PageAnalysis, UserFlow, FlowStep } from './provider.js';
import { PageElementAnalysisSchema, ActionDecisionSchema } from './provider.js';
import { buildElementDiscoveryPrompt } from './prompts/element-discovery.js';
import { buildFlowDiscoveryPrompt } from './prompts/flow-discovery.js';
import { buildTestGenerationPrompt } from './prompts/test-generation.js';

const DEFAULT_BASE_URL = 'http://localhost:11434/v1';
const DEFAULT_MODEL = 'llava';
const MAX_RETRIES = 2;

export class OllamaProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.client = new OpenAI({
      baseURL: baseUrl ?? DEFAULT_BASE_URL,
      apiKey: 'ollama', // Ollama doesn't need a real key
    });
    this.model = model ?? DEFAULT_MODEL;
  }

  async analyzePageElements(
    screenshot: Buffer,
    ariaSnapshot: string,
    url: string,
  ): Promise<PageElementAnalysis> {
    const prompt = buildElementDiscoveryPrompt(ariaSnapshot, url);

    return this.requestWithRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${screenshot.toString('base64')}`,
                },
              },
              { type: 'text', text: prompt + '\n\nIMPORTANT: Respond with ONLY valid JSON, no additional text.' },
            ],
          },
        ],
      });

      const text = response.choices[0]?.message?.content ?? '';
      return PageElementAnalysisSchema.parse(JSON.parse(this.extractJson(text)));
    });
  }

  async decideNextAction(
    screenshot: Buffer,
    ariaSnapshot: string,
    history: FlowStep[],
    objective: string,
  ): Promise<ActionDecision> {
    const prompt = buildFlowDiscoveryPrompt(ariaSnapshot, history, objective);

    return this.requestWithRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${screenshot.toString('base64')}`,
                },
              },
              { type: 'text', text: prompt + '\n\nIMPORTANT: Respond with ONLY valid JSON, no additional text.' },
            ],
          },
        ],
      });

      const text = response.choices[0]?.message?.content ?? '';
      return ActionDecisionSchema.parse(JSON.parse(this.extractJson(text)));
    });
  }

  async generateTestCode(analysis: PageAnalysis | UserFlow): Promise<string> {
    const prompt = buildTestGenerationPrompt(analysis);

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 8192,
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const text = response.choices[0]?.message?.content ?? '';
    return this.extractCodeBlock(text);
  }

  private extractJson(text: string): string {
    const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlock) return jsonBlock[1].trim();

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return text.slice(firstBrace, lastBrace + 1);
    }

    return text;
  }

  private extractCodeBlock(text: string): string {
    const codeBlock = text.match(/```(?:typescript|ts)?\s*([\s\S]*?)```/);
    if (codeBlock) return codeBlock[1].trim();
    return text;
  }

  private async requestWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }
}
