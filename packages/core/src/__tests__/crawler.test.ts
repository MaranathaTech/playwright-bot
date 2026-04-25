import { describe, it, expect } from 'vitest';
import { Crawler } from '../explorer/crawler.js';

describe('Crawler', () => {
  it('should visit seeded URLs', () => {
    const crawler = new Crawler({ strategy: 'bfs', maxPages: 10 });
    crawler.seed('https://example.com');

    const url = crawler.next();
    expect(url).toBe('https://example.com/');
    expect(crawler.visitedCount).toBe(1);
  });

  it('should normalize URLs by removing trailing slashes', () => {
    const crawler = new Crawler({ strategy: 'bfs', maxPages: 10 });
    crawler.seed('https://example.com/about/');

    const url = crawler.next();
    expect(url).toBe('https://example.com/about');
  });

  it('should strip UTM parameters', () => {
    const crawler = new Crawler({ strategy: 'bfs', maxPages: 10 });
    crawler.seed('https://example.com/page?utm_source=google&utm_medium=cpc&foo=bar');

    const url = crawler.next();
    expect(url).toBe('https://example.com/page?foo=bar');
  });

  it('should strip hash fragments', () => {
    const crawler = new Crawler({ strategy: 'bfs', maxPages: 10 });
    crawler.seed('https://example.com/page#section');

    const url = crawler.next();
    expect(url).toBe('https://example.com/page');
  });

  it('should not revisit the same URL', () => {
    const crawler = new Crawler({ strategy: 'bfs', maxPages: 10 });
    crawler.seed('https://example.com');
    crawler.next(); // visit it
    crawler.addLinks(['https://example.com', 'https://example.com/']); // add duplicates

    expect(crawler.next()).toBeNull();
  });

  it('should respect maxPages limit', () => {
    const crawler = new Crawler({ strategy: 'bfs', maxPages: 2 });
    crawler.seed('https://example.com');
    crawler.addLinks([
      'https://example.com/a',
      'https://example.com/b',
      'https://example.com/c',
    ]);

    crawler.next(); // page 1
    crawler.next(); // page 2
    expect(crawler.next()).toBeNull();
    expect(crawler.visitedCount).toBe(2);
  });

  it('should follow BFS order', () => {
    const crawler = new Crawler({ strategy: 'bfs', maxPages: 10 });
    crawler.seed('https://example.com');
    crawler.next(); // visit root
    crawler.addLinks([
      'https://example.com/a',
      'https://example.com/b',
    ]);

    expect(crawler.next()).toBe('https://example.com/a');
    expect(crawler.next()).toBe('https://example.com/b');
  });

  it('should follow DFS order', () => {
    const crawler = new Crawler({ strategy: 'dfs', maxPages: 10 });
    crawler.seed('https://example.com');
    crawler.next(); // visit root
    crawler.addLinks([
      'https://example.com/a',
      'https://example.com/b',
    ]);

    // DFS: last added = first popped
    expect(crawler.next()).toBe('https://example.com/b');
    expect(crawler.next()).toBe('https://example.com/a');
  });

  it('should filter by include patterns', () => {
    const crawler = new Crawler({
      strategy: 'bfs',
      maxPages: 10,
      include: ['/dashboard'],
    });
    crawler.seed('https://example.com/dashboard');
    crawler.next();
    crawler.addLinks([
      'https://example.com/dashboard/settings',
      'https://example.com/about',
      'https://example.com/dashboard/profile',
    ]);

    expect(crawler.next()).toBe('https://example.com/dashboard/settings');
    expect(crawler.next()).toBe('https://example.com/dashboard/profile');
    expect(crawler.next()).toBeNull();
  });

  it('should filter by exclude patterns', () => {
    const crawler = new Crawler({
      strategy: 'bfs',
      maxPages: 10,
      exclude: ['/api', '/admin'],
    });
    crawler.seed('https://example.com');
    crawler.next();
    crawler.addLinks([
      'https://example.com/about',
      'https://example.com/api/users',
      'https://example.com/admin/panel',
      'https://example.com/contact',
    ]);

    expect(crawler.next()).toBe('https://example.com/about');
    expect(crawler.next()).toBe('https://example.com/contact');
    expect(crawler.next()).toBeNull();
  });

  it('should track visited URLs', () => {
    const crawler = new Crawler({ strategy: 'bfs', maxPages: 10 });
    crawler.seed('https://example.com');
    crawler.next();
    crawler.addLinks(['https://example.com/a']);
    crawler.next();

    expect(crawler.visitedUrls).toEqual([
      'https://example.com/',
      'https://example.com/a',
    ]);
  });

  it('should track pending count', () => {
    const crawler = new Crawler({ strategy: 'bfs', maxPages: 10 });
    crawler.seed('https://example.com');
    crawler.next();
    crawler.addLinks([
      'https://example.com/a',
      'https://example.com/b',
    ]);

    expect(crawler.pendingCount).toBe(2);
  });
});
