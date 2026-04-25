export function buildElementDiscoveryPrompt(ariaSnapshot: string, url: string): string {
  return `You are analyzing a web page to identify interactive elements and suggest test scenarios for Playwright tests.

**Page URL:** ${url}

**Accessibility Tree (ARIA Snapshot):**
\`\`\`
${ariaSnapshot}
\`\`\`

**Instructions:**
1. Examine the screenshot and accessibility tree to identify ALL interactive elements (buttons, links, inputs, selects, checkboxes, etc.)
2. For each element, provide a Playwright locator using this priority: getByRole > getByLabel > getByText > getByTestId > CSS locator
3. Suggest test scenarios that cover meaningful user interactions
4. Identify form flows (groups of inputs + submit)

**Locator Format Examples:**
- \`page.getByRole('button', { name: 'Submit' })\`
- \`page.getByLabel('Email address')\`
- \`page.getByText('Sign up')\`
- \`page.getByTestId('search-input')\`

Respond with ONLY a JSON object matching this schema:
{
  "pageDescription": "Brief description of the page purpose and layout",
  "elements": [
    {
      "type": "button|link|input|select|checkbox|radio|textarea|tab|menu|dialog|other",
      "label": "Human-readable label",
      "locator": "page.getByRole(...) or other Playwright locator",
      "locatorStrategy": "getByRole|getByLabel|getByText|getByTestId|locator",
      "description": "What this element does",
      "suggestedInteraction": "click|fill|select|hover|etc"
    }
  ],
  "testScenarios": [
    {
      "name": "Test scenario name",
      "description": "What this test verifies",
      "steps": ["Step 1", "Step 2"],
      "priority": "high|medium|low"
    }
  ],
  "formFlows": [
    {
      "name": "Form name",
      "fields": [
        {
          "locator": "page.getByLabel(...)",
          "type": "text|email|password|select|checkbox|etc",
          "label": "Field label",
          "sampleValue": "test@example.com"
        }
      ],
      "submitLocator": "page.getByRole('button', { name: 'Submit' })"
    }
  ]
}`;
}
