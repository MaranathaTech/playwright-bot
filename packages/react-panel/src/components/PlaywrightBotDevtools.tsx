import { useState } from 'react';
import type { DevtoolsProps } from '../types.js';
import { PlaywrightBotPanel } from './PlaywrightBotPanel.js';

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  'bottom-right': { bottom: 16, right: 16 },
  'bottom-left': { bottom: 16, left: 16 },
  'top-right': { top: 16, right: 16 },
  'top-left': { top: 16, left: 16 },
};

const PANEL_POSITION: Record<string, React.CSSProperties> = {
  'bottom-right': { bottom: 60, right: 16, maxHeight: 'calc(100vh - 80px)' },
  'bottom-left': { bottom: 60, left: 16, maxHeight: 'calc(100vh - 80px)' },
  'top-right': { top: 60, right: 16, maxHeight: 'calc(100vh - 80px)' },
  'top-left': { top: 60, left: 16, maxHeight: 'calc(100vh - 80px)' },
};

export function PlaywrightBotDevtools({
  serverUrl,
  position = 'bottom-right',
  defaultOpen = false,
}: DevtoolsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          ...POSITION_STYLES[position],
          zIndex: 99999,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          background: isOpen ? '#ef4444' : '#2563eb',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'background 0.2s',
        }}
        title={isOpen ? 'Close playwright-bot' : 'Open playwright-bot'}
      >
        {isOpen ? '\u2715' : '\u25B6'}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            ...PANEL_POSITION[position],
            zIndex: 99998,
            width: 480,
            background: '#1e1e2e',
            borderRadius: 8,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PlaywrightBotPanel serverUrl={serverUrl} />
        </div>
      )}
    </>
  );
}
