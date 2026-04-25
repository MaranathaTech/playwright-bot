import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import type { AIProvider, PageAnalysis, UserFlow } from '../ai/provider.js';
import { urlToFilename } from './selector-strategy.js';

export interface TestWriterOptions {
  outputDir: string;
  dryRun?: boolean;
}

export interface GeneratedTest {
  filePath: string;
  code: string;
  source: 'page' | 'flow';
  url: string;
}

export class TestWriter {
  constructor(
    private provider: AIProvider,
    private options: TestWriterOptions,
  ) {}

  async generateFromPages(pages: PageAnalysis[]): Promise<GeneratedTest[]> {
    const results: GeneratedTest[] = [];

    for (const page of pages) {
      const code = await this.provider.generateTestCode(page);
      const validated = this.validateAndFixImports(code);
      const filename = urlToFilename(page.url) + '.spec.ts';
      const filePath = join(this.options.outputDir, filename);

      results.push({
        filePath,
        code: validated,
        source: 'page',
        url: page.url,
      });
    }

    return results;
  }

  async generateFromFlows(flows: UserFlow[]): Promise<GeneratedTest[]> {
    const results: GeneratedTest[] = [];

    for (const flow of flows) {
      const code = await this.provider.generateTestCode(flow);
      const validated = this.validateAndFixImports(code);
      const slug = flow.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const filename = `${slug}.spec.ts`;
      const filePath = join(this.options.outputDir, 'flows', filename);

      results.push({
        filePath,
        code: validated,
        source: 'flow',
        url: flow.startUrl,
      });
    }

    return results;
  }

  async writeTests(tests: GeneratedTest[]): Promise<void> {
    if (this.options.dryRun) return;

    for (const test of tests) {
      await mkdir(dirname(test.filePath), { recursive: true });
      await writeFile(test.filePath, test.code, 'utf-8');
    }
  }

  private validateAndFixImports(code: string): string {
    let fixed = code;

    // Ensure the Playwright test import is present
    if (!fixed.includes("from '@playwright/test'") && !fixed.includes('from "@playwright/test"')) {
      fixed = `import { test, expect } from '@playwright/test';\n\n${fixed}`;
    }

    // Remove duplicate imports
    const lines = fixed.split('\n');
    const importLines = new Set<string>();
    const dedupedLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('import ')) {
        if (importLines.has(line)) continue;
        importLines.add(line);
      }
      dedupedLines.push(line);
    }

    return dedupedLines.join('\n');
  }
}
