import { useState } from 'react';
import type { GeneratedTestInfo } from '../types.js';

interface TestPreviewProps {
  tests: GeneratedTestInfo[];
}

export function TestPreview({ tests }: TestPreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (tests.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#6c7086' }}>
        No tests generated yet. Start an exploration to generate tests.
      </div>
    );
  }

  const selected = tests[selectedIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Test file list */}
      <div style={{
        borderBottom: '1px solid #313244',
        maxHeight: 120,
        overflow: 'auto',
      }}>
        {tests.map((test, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 12px',
              border: 'none',
              background: i === selectedIndex ? '#313244' : 'transparent',
              color: '#cdd6f4',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
              borderLeft: i === selectedIndex ? '2px solid #89b4fa' : '2px solid transparent',
            }}
          >
            <div style={{ fontFamily: 'monospace' }}>{test.filePath}</div>
            <div style={{ fontSize: 10, color: '#6c7086' }}>
              {test.source} — {test.url}
            </div>
          </button>
        ))}
      </div>

      {/* Code preview */}
      {selected && (
        <pre style={{
          margin: 0,
          padding: 12,
          overflow: 'auto',
          fontSize: 11,
          lineHeight: 1.5,
          fontFamily: 'monospace',
          color: '#cdd6f4',
          background: '#1e1e2e',
          flex: 1,
        }}>
          {selected.code}
        </pre>
      )}
    </div>
  );
}
