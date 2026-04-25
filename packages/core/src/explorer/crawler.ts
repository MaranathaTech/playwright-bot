export interface CrawlerOptions {
  strategy: 'bfs' | 'dfs';
  maxPages: number;
  include?: string[];
  exclude?: string[];
}

export class Crawler {
  private visited = new Set<string>();
  private frontier: string[] = [];
  private includePatterns: RegExp[];
  private excludePatterns: RegExp[];

  constructor(private options: CrawlerOptions) {
    this.includePatterns = (options.include ?? []).map((p) => new RegExp(p));
    this.excludePatterns = (options.exclude ?? []).map((p) => new RegExp(p));
  }

  seed(url: string): void {
    const normalized = this.normalizeUrl(url);
    this.frontier.push(normalized);
  }

  next(): string | null {
    if (this.visited.size >= this.options.maxPages) return null;

    while (this.frontier.length > 0) {
      const url = this.options.strategy === 'bfs'
        ? this.frontier.shift()!
        : this.frontier.pop()!;

      const normalized = this.normalizeUrl(url);
      if (this.visited.has(normalized)) continue;
      if (!this.isAllowed(normalized)) continue;

      this.visited.add(normalized);
      return normalized;
    }

    return null;
  }

  addLinks(links: string[]): void {
    for (const link of links) {
      const normalized = this.normalizeUrl(link);
      if (!this.visited.has(normalized) && this.isAllowed(normalized)) {
        this.frontier.push(normalized);
      }
    }
  }

  get visitedCount(): number {
    return this.visited.size;
  }

  get visitedUrls(): string[] {
    return [...this.visited];
  }

  get pendingCount(): number {
    return this.frontier.length;
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slash, hash, and common tracking params
      parsed.hash = '';
      parsed.searchParams.delete('utm_source');
      parsed.searchParams.delete('utm_medium');
      parsed.searchParams.delete('utm_campaign');
      parsed.searchParams.delete('utm_content');
      parsed.searchParams.delete('utm_term');

      let path = parsed.pathname;
      if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
      }
      parsed.pathname = path;

      return parsed.toString();
    } catch {
      return url;
    }
  }

  private isAllowed(url: string): boolean {
    if (this.includePatterns.length > 0) {
      const included = this.includePatterns.some((p) => p.test(url));
      if (!included) return false;
    }

    if (this.excludePatterns.length > 0) {
      const excluded = this.excludePatterns.some((p) => p.test(url));
      if (excluded) return false;
    }

    return true;
  }
}
