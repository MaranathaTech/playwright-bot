import { useState } from 'react';
import type { ExplorationState } from '../types.js';

interface ExplorationViewProps {
  state: ExplorationState;
  connected: boolean;
  onStart: (url: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const buttonStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 4,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
};

export function ExplorationView({
  state,
  connected,
  onStart,
  onPause,
  onResume,
  onStop,
}: ExplorationViewProps) {
  const [url, setUrl] = useState('');

  const isIdle = state.status === 'idle' || state.status === 'complete' || state.status === 'error';

  return (
    <div style={{ padding: 12 }}>
      {/* URL Input */}
      {isIdle && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 4,
              border: '1px solid #45475a',
              background: '#313244',
              color: '#cdd6f4',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={() => url && onStart(url)}
            disabled={!connected || !url}
            style={{
              ...buttonStyle,
              background: connected && url ? '#89b4fa' : '#45475a',
              color: connected && url ? '#1e1e2e' : '#6c7086',
            }}
          >
            Explore
          </button>
        </div>
      )}

      {/* Controls */}
      {(state.status === 'running' || state.status === 'paused') && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {state.status === 'running' ? (
            <button onClick={onPause} style={{ ...buttonStyle, background: '#f9e2af', color: '#1e1e2e' }}>
              Pause
            </button>
          ) : (
            <button onClick={onResume} style={{ ...buttonStyle, background: '#a6e3a1', color: '#1e1e2e' }}>
              Resume
            </button>
          )}
          <button onClick={onStop} style={{ ...buttonStyle, background: '#f38ba8', color: '#1e1e2e' }}>
            Stop
          </button>
        </div>
      )}

      {/* Progress */}
      {state.status !== 'idle' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#6c7086', fontSize: 11 }}>
              {state.status === 'running' ? 'Exploring...' :
                state.status === 'paused' ? 'Paused' :
                  state.status === 'complete' ? 'Complete' : 'Error'}
            </span>
            <span style={{ color: '#6c7086', fontSize: 11 }}>
              {state.progress.visited} / {state.progress.total} pages
            </span>
          </div>
          <div style={{
            height: 4,
            background: '#313244',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: state.progress.total > 0
                ? `${(state.progress.visited / state.progress.total) * 100}%`
                : '0%',
              background: state.status === 'error' ? '#f38ba8' : '#89b4fa',
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Current activity */}
      {state.currentPage && (
        <div style={{ fontSize: 11, color: '#6c7086', marginBottom: 8 }}>
          Analyzing: {state.currentPage.url}
        </div>
      )}
      {state.currentFlow && (
        <div style={{ fontSize: 11, color: '#f9e2af', marginBottom: 8 }}>
          Flow: {state.currentFlow.objective}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
        <StatBox label="Pages" value={state.pages.length} />
        <StatBox label="Flows" value={state.flows.length} />
        <StatBox label="Errors" value={state.errors.length} color={state.errors.length > 0 ? '#f38ba8' : undefined} />
      </div>

      {/* Error message */}
      {state.errorMessage && (
        <div style={{
          marginTop: 12,
          padding: 8,
          background: 'rgba(243, 139, 168, 0.1)',
          border: '1px solid #f38ba8',
          borderRadius: 4,
          fontSize: 12,
          color: '#f38ba8',
        }}>
          {state.errorMessage}
        </div>
      )}

      {/* Page list */}
      {state.pages.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: '#6c7086', marginBottom: 4 }}>Explored Pages</div>
          {state.pages.map((page, i) => (
            <div key={i} style={{
              padding: '4px 0',
              borderBottom: '1px solid #313244',
              fontSize: 12,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: '#cdd6f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                {page.title || page.url}
              </span>
              <span style={{ color: '#6c7086' }}>
                {page.elementCount} el.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{
      padding: 8,
      background: '#313244',
      borderRadius: 4,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: color ?? '#cdd6f4' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#6c7086' }}>{label}</div>
    </div>
  );
}
