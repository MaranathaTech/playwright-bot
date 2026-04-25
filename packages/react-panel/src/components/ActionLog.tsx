import type { ActionLogEntry } from '../types.js';

interface ActionLogProps {
  entries: ActionLogEntry[];
}

const typeColors: Record<ActionLogEntry['type'], string> = {
  page: '#89b4fa',
  flow: '#f9e2af',
  error: '#f38ba8',
  info: '#6c7086',
};

export function ActionLog({ entries }: ActionLogProps) {
  if (entries.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#6c7086' }}>
        No activity yet.
      </div>
    );
  }

  return (
    <div style={{ padding: 8 }}>
      {entries.map((entry, i) => (
        <div key={i} style={{
          padding: '4px 8px',
          fontSize: 11,
          fontFamily: 'monospace',
          borderBottom: '1px solid #313244',
          display: 'flex',
          gap: 8,
        }}>
          <span style={{ color: '#45475a', flexShrink: 0 }}>
            {new Date(entry.timestamp).toLocaleTimeString()}
          </span>
          <span style={{
            color: typeColors[entry.type],
            flexShrink: 0,
            width: 36,
            textAlign: 'right',
          }}>
            [{entry.type}]
          </span>
          <span style={{ color: '#cdd6f4', wordBreak: 'break-all' }}>
            {entry.message}
          </span>
        </div>
      ))}
    </div>
  );
}
