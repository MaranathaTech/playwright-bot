import type { PageAnalysis, UserFlow } from '../provider.js';

function isPageAnalysis(input: PageAnalysis | UserFlow): input is PageAnalysis {
  return 'elementAnalysis' in input;
}

export function buildTestGenerationPrompt(analysis: PageAnalysis | UserFlow): string {
  if (isPageAnalysis(analysis)) {
    return buildPageTestPrompt(analysis);
  }
  return buildFlowTestPrompt(analysis);
}

function buildPageTestPrompt(analysis: PageAnalysis): string {
  const { url, title, elementAnalysis } = analysis;

  return `Generate a Playwright test file (.spec.ts) for the following page analysis.

**Page URL:** ${url}
**Page Title:** ${title}

**Page Description:** ${elementAnalysis.pageDescription}

**Interactive Elements:**
${JSON.stringify(elementAnalysis.elements, null, 2)}

**Suggested Test Scenarios:**
${JSON.stringify(elementAnalysis.testScenarios, null, 2)}

**Form Flows:**
${JSON.stringify(elementAnalysis.formFlows, null, 2)}

**Requirements:**
1. Use \`import { test, expect } from '@playwright/test';\`
2. Use \`test.describe\` to group related tests
3. Each test should navigate to the page URL first
4. Use the locators exactly as provided (getByRole, getByLabel, getByText, getByTestId)
5. Include appropriate assertions (visibility, text content, navigation, etc.)
6. Use \`test.beforeEach\` for common setup (navigation)
7. Generate realistic test data for form fills
8. Add meaningful test names that describe the user behavior being tested
9. Handle async operations with appropriate waits

Generate ONLY the TypeScript code, no explanations. The code should be complete and runnable.`;
}

function buildFlowTestPrompt(flow: UserFlow): string {
  const stepsDescription = flow.steps.map((step, i) =>
    `Step ${i + 1}: ${step.action}${step.selector ? ` → "${step.selector}"` : ''}${step.value ? ` (value: "${step.value}")` : ''}\n  Reasoning: ${step.reasoning}\n  URL: ${step.url}`,
  ).join('\n');

  return `Generate a Playwright test file (.spec.ts) for the following user flow.

**Flow Name:** ${flow.name}
**Start URL:** ${flow.startUrl}
**End URL:** ${flow.endUrl}
**Success:** ${flow.success}

**Steps:**
${stepsDescription}

**Requirements:**
1. Use \`import { test, expect } from '@playwright/test';\`
2. Translate the flow steps into a single test (or a small suite if sub-flows are identifiable)
3. Navigate to the start URL first
4. Execute each step using the Playwright API matching the action type
5. Add assertions after key steps (URL changes, element visibility, content changes)
6. Use the locators from the steps (they are already in Playwright format)
7. Include proper error handling for navigation/loading waits
8. Name the test descriptively based on the flow objective

Generate ONLY the TypeScript code, no explanations. The code should be complete and runnable.`;
}
