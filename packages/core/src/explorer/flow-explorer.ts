import type { Page } from 'playwright-core';
import { PageCapture } from '../browser/page-capture.js';
import { Interaction } from '../browser/interaction.js';
import type { AIProvider, FlowStep, UserFlow } from '../ai/provider.js';

export interface FlowExplorerOptions {
  maxSteps: number;
}

export class FlowExplorer {
  private capture: PageCapture;
  private interaction: Interaction;

  constructor(
    private provider: AIProvider,
    private options: FlowExplorerOptions = { maxSteps: 10 },
  ) {
    this.capture = new PageCapture();
    this.interaction = new Interaction();
  }

  async explore(page: Page, objective: string): Promise<UserFlow> {
    const steps: FlowStep[] = [];
    const startUrl = page.url();

    for (let step = 0; step < this.options.maxSteps; step++) {
      const captured = await this.capture.capture(page);

      const decision = await this.provider.decideNextAction(
        captured.screenshot,
        captured.ariaSnapshot,
        steps,
        objective,
      );

      if (decision.flowComplete || decision.action === 'done') {
        break;
      }

      const flowStep: FlowStep = {
        action: decision.action,
        selector: decision.selector,
        value: decision.value,
        reasoning: decision.reasoning,
        screenshot: captured.screenshot,
        ariaSnapshot: captured.ariaSnapshot,
        url: captured.url,
        timestamp: Date.now(),
      };

      // Execute the action
      if (decision.selector) {
        let result;
        switch (decision.action) {
          case 'click':
            result = await this.interaction.click(page, decision.selector);
            break;
          case 'fill':
            result = await this.interaction.fill(page, decision.selector, decision.value ?? '');
            break;
          case 'select':
            result = await this.interaction.select(page, decision.selector, decision.value ?? '');
            break;
          case 'hover':
            result = await this.interaction.hover(page, decision.selector);
            break;
          case 'press':
            result = await this.interaction.press(page, decision.selector, decision.value ?? 'Enter');
            break;
          case 'navigate':
            await page.goto(decision.value ?? decision.selector, { waitUntil: 'domcontentloaded' });
            result = { success: true, beforeUrl: captured.url, afterUrl: page.url() };
            break;
        }

        if (result && !result.success) {
          flowStep.action = `${flowStep.action} (failed: ${result.error})`;
        }
      }

      steps.push(flowStep);
    }

    return {
      name: objective,
      startUrl,
      steps,
      endUrl: page.url(),
      success: steps.length > 0,
    };
  }
}
