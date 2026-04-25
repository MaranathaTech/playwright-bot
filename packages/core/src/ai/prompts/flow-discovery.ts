import type { FlowStep } from '../provider.js';

export function buildFlowDiscoveryPrompt(
  ariaSnapshot: string,
  history: FlowStep[],
  objective: string,
): string {
  const historyText = history.length > 0
    ? history.map((step, i) =>
        `Step ${i + 1}: ${step.action}${step.selector ? ` on "${step.selector}"` : ''}${step.value ? ` with value "${step.value}"` : ''} → URL: ${step.url}\n  Reasoning: ${step.reasoning}`,
      ).join('\n')
    : 'No actions taken yet.';

  return `You are an AI test explorer navigating a web application. Your objective is to explore a user flow and decide the next action.

**Objective:** ${objective}

**Current Accessibility Tree:**
\`\`\`
${ariaSnapshot}
\`\`\`

**Action History:**
${historyText}

**Instructions:**
1. Look at the current screenshot and accessibility tree
2. Consider the objective and what actions have been taken so far
3. Decide the next action to take, or declare the flow complete

**Rules:**
- Use Playwright locator syntax for selectors (getByRole > getByLabel > getByText > getByTestId)
- Set flowComplete=true when the objective has been achieved or when you've explored enough
- Set action="done" if there's nothing meaningful left to do
- Prefer exploring new functionality over repeating visited states
- For fill actions, provide realistic sample values

Respond with ONLY a JSON object:
{
  "action": "click|fill|select|hover|press|done|navigate",
  "selector": "page.getByRole(...) — required unless action is 'done'",
  "value": "value for fill/select/press actions",
  "reasoning": "Why this action was chosen",
  "expectation": "What we expect to happen after this action",
  "flowComplete": false
}`;
}
