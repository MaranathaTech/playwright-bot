import { describe, it, expect } from 'vitest';
import { compareAriaSnapshots } from '../check/aria-diff.js';

describe('compareAriaSnapshots', () => {
  it('should return similarity 1.0 for identical snapshots', () => {
    const snapshot = '- heading "Hello"\n- button "Submit"';
    const result = compareAriaSnapshots(snapshot, snapshot);

    expect(result.similarity).toBe(1);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.changeSummary).toBe('No changes');
  });

  it('should return low similarity for completely different snapshots', () => {
    const original = '- heading "Hello"\n- button "Submit"';
    const current = '- link "About"\n- textbox "Search"';
    const result = compareAriaSnapshots(original, current);

    expect(result.similarity).toBe(0);
    expect(result.added).toHaveLength(2);
    expect(result.removed).toHaveLength(2);
  });

  it('should calculate correct similarity for partial overlap', () => {
    const original = '- heading "Hello"\n- button "Submit"\n- link "Home"';
    const current = '- heading "Hello"\n- button "Cancel"\n- link "Home"';
    const result = compareAriaSnapshots(original, current);

    // 4 unique lines, 2 changes (1 added, 1 removed)
    expect(result.similarity).toBe(0.5);
    expect(result.added).toEqual(['- button "Cancel"']);
    expect(result.removed).toEqual(['- button "Submit"']);
  });

  it('should detect added elements', () => {
    const original = '- heading "Hello"';
    const current = '- heading "Hello"\n- button "New"';
    const result = compareAriaSnapshots(original, current);

    expect(result.added).toEqual(['- button "New"']);
    expect(result.removed).toEqual([]);
    expect(result.changeSummary).toBe('1 element(s) added');
  });

  it('should detect removed elements', () => {
    const original = '- heading "Hello"\n- button "Old"';
    const current = '- heading "Hello"';
    const result = compareAriaSnapshots(original, current);

    expect(result.added).toEqual([]);
    expect(result.removed).toEqual(['- button "Old"']);
    expect(result.changeSummary).toBe('1 element(s) removed');
  });

  it('should handle both additions and removals in summary', () => {
    const original = '- heading "Hello"\n- button "Old"';
    const current = '- heading "Hello"\n- link "New"';
    const result = compareAriaSnapshots(original, current);

    expect(result.changeSummary).toBe('1 element(s) added, 1 element(s) removed');
  });

  it('should handle empty snapshots', () => {
    const result = compareAriaSnapshots('', '');
    expect(result.similarity).toBe(1);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it('should handle empty original with non-empty current', () => {
    const result = compareAriaSnapshots('', '- heading "Hello"');
    expect(result.similarity).toBe(0);
    expect(result.added).toEqual(['- heading "Hello"']);
    expect(result.removed).toEqual([]);
  });

  it('should handle non-empty original with empty current', () => {
    const result = compareAriaSnapshots('- heading "Hello"', '');
    expect(result.similarity).toBe(0);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual(['- heading "Hello"']);
  });

  it('should normalize whitespace', () => {
    const original = '  - heading "Hello"  \n\n  - button "Submit"  \n';
    const current = '- heading "Hello"\n- button "Submit"';
    const result = compareAriaSnapshots(original, current);

    expect(result.similarity).toBe(1);
  });
});
