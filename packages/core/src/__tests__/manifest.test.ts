import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { ManifestManager } from '../codegen/manifest.js';
import type { ManifestEntry } from '../codegen/manifest.js';

describe('ManifestManager', () => {
  let tempDir: string;
  let manager: ManifestManager;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'manifest-test-'));
    manager = new ManifestManager(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  function makeEntry(overrides: Partial<ManifestEntry> = {}): ManifestEntry {
    return {
      filePath: 'index.spec.ts',
      url: 'https://example.com/',
      source: 'page',
      ariaSnapshot: '- heading "Hello"',
      generatedAt: '2025-01-01T00:00:00.000Z',
      slug: 'index',
      ...overrides,
    };
  }

  it('should return empty manifest when file does not exist', async () => {
    const manifest = await manager.load();
    expect(manifest).toEqual({ version: 1, entries: [] });
  });

  it('should save and load round-trip', async () => {
    const entry = makeEntry();
    await manager.addEntries([entry]);

    const loaded = await manager.load();
    expect(loaded.version).toBe(1);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0]).toEqual(entry);
  });

  it('should upsert by filePath — replace existing', async () => {
    const original = makeEntry({ ariaSnapshot: '- heading "Old"' });
    await manager.addEntries([original]);

    const updated = makeEntry({ ariaSnapshot: '- heading "New"' });
    await manager.addEntries([updated]);

    const loaded = await manager.load();
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].ariaSnapshot).toBe('- heading "New"');
  });

  it('should upsert by filePath — add new entry', async () => {
    const first = makeEntry({ filePath: 'index.spec.ts', slug: 'index' });
    await manager.addEntries([first]);

    const second = makeEntry({
      filePath: 'about.spec.ts',
      url: 'https://example.com/about',
      slug: 'about',
    });
    await manager.addEntries([second]);

    const loaded = await manager.load();
    expect(loaded.entries).toHaveLength(2);
  });

  it('should find entry by URL', async () => {
    const entries = [
      makeEntry({ filePath: 'index.spec.ts', url: 'https://example.com/', slug: 'index' }),
      makeEntry({ filePath: 'about.spec.ts', url: 'https://example.com/about', slug: 'about' }),
    ];
    await manager.addEntries(entries);

    const found = await manager.findByUrl('https://example.com/about');
    expect(found).toBeDefined();
    expect(found!.filePath).toBe('about.spec.ts');
  });

  it('should return undefined when URL not found', async () => {
    const found = await manager.findByUrl('https://example.com/missing');
    expect(found).toBeUndefined();
  });

  it('should list all entries', async () => {
    const entries = [
      makeEntry({ filePath: 'a.spec.ts', slug: 'a' }),
      makeEntry({ filePath: 'b.spec.ts', slug: 'b' }),
      makeEntry({ filePath: 'c.spec.ts', slug: 'c' }),
    ];
    await manager.addEntries(entries);

    const all = await manager.allEntries();
    expect(all).toHaveLength(3);
  });
});
