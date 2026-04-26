import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export interface ManifestEntry {
  filePath: string;
  url: string;
  source: 'page' | 'flow';
  ariaSnapshot: string;
  generatedAt: string;
  slug: string;
}

export interface Manifest {
  version: 1;
  entries: ManifestEntry[];
}

export class ManifestManager {
  private manifestPath: string;

  constructor(outputDir: string) {
    this.manifestPath = join(outputDir, '.manifest.json');
  }

  async load(): Promise<Manifest> {
    try {
      const raw = await readFile(this.manifestPath, 'utf-8');
      return JSON.parse(raw) as Manifest;
    } catch {
      return { version: 1, entries: [] };
    }
  }

  async save(manifest: Manifest): Promise<void> {
    await mkdir(dirname(this.manifestPath), { recursive: true });
    await writeFile(this.manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  async addEntries(newEntries: ManifestEntry[]): Promise<void> {
    const manifest = await this.load();

    for (const entry of newEntries) {
      const existingIndex = manifest.entries.findIndex((e) => e.filePath === entry.filePath);
      if (existingIndex >= 0) {
        manifest.entries[existingIndex] = entry;
      } else {
        manifest.entries.push(entry);
      }
    }

    await this.save(manifest);
  }

  async findByUrl(url: string): Promise<ManifestEntry | undefined> {
    const manifest = await this.load();
    return manifest.entries.find((e) => e.url === url);
  }

  async allEntries(): Promise<ManifestEntry[]> {
    const manifest = await this.load();
    return manifest.entries;
  }
}
