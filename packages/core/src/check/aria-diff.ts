export interface AriaDiffResult {
  similarity: number;
  added: string[];
  removed: string[];
  changeSummary: string;
}

export function compareAriaSnapshots(original: string, current: string): AriaDiffResult {
  const originalLines = toLineSet(original);
  const currentLines = toLineSet(current);

  const added = currentLines.filter((line) => !originalLines.includes(line));
  const removed = originalLines.filter((line) => !currentLines.includes(line));

  const totalUnique = new Set([...originalLines, ...currentLines]).size;
  const similarity = totalUnique === 0 ? 1 : 1 - (added.length + removed.length) / totalUnique;

  const parts: string[] = [];
  if (added.length > 0) parts.push(`${added.length} element(s) added`);
  if (removed.length > 0) parts.push(`${removed.length} element(s) removed`);
  const changeSummary = parts.length > 0 ? parts.join(', ') : 'No changes';

  return { similarity, added, removed, changeSummary };
}

function toLineSet(snapshot: string): string[] {
  return snapshot
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
