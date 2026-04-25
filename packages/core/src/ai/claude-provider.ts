import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, PageElementAnalysis, ActionDecision, PageAnalysis, UserFlow, FlowStep } from './provider.js';
import { PageElementAnalysisSchema, ActionDecisionSchema } from './provider.js';
import { buildElementDiscoveryPrompt } from './prompts/element-discovery.js';
import { buildFlowDiscoveryPrompt } from './prompts/flow-discovery.js';
import { buildTestGenerationPrompt } from './prompts/test-generation.js';

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_RETRIES = 2;

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
  }

  async analyzePageElements(
    screenshot: Buffer,
    ariaSnapshot: string,
    url: string,
  ): Promise<PageElementAnalysis> {
    const prompt = buildElementDiscoveryPrompt(ariaSnapshot, url);

    return this.requestWithRetry(async () => {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshot.toString('base64'),
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

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
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshot.toString('base64'),
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

      return ActionDecisionSchema.parse(JSON.parse(this.extractJson(text)));
    });
  }

  async generateTestCode(analysis: PageAnalysis | UserFlow): Promise<string> {
    const prompt = buildTestGenerationPrompt(analysis);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return this.extractCodeBlock(text);
  }

  private extractJson(text: string): string {
    // Try to extract JSON from code block first
    const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlock) return jsonBlock[1].trim();

    // Try to find raw JSON object
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
          // Exponential backoff: 1s, 2s
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }
}
