import { useState } from 'react';
import type { PanelProps } from '../types.js';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { ExplorationView } from './ExplorationView.js';
import { TestPreview } from './TestPreview.js';
import { ActionLog } from './ActionLog.js';

type Tab = 'explore' | 'tests' | 'log';

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  border: 'none',
  background: active ? '#313244' : 'transparent',
  color: active ? '#cdd6f4' : '#6c7086',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'system-ui, sans-serif',
  borderBottom: active ? '2px solid #89b4fa' : '2px solid transparent',
});

export function PlaywrightBotPanel({ serverUrl }: PanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('explore');
  const ws = useWebSocket(serverUrl);

  return (
    <div style={{ color: '#cdd6f4', fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        background: '#181825',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #313244',
      }}>
        <span style={{ fontWeight: 600 }}>playwright-bot</span>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: ws.connected ? '#a6e3a1' : '#f38ba8',
          display: 'inline-block',
        }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #313244', background: '#181825' }}>
        <button style={tabStyle(activeTab === 'explore')} onClick={() => setActiveTab('explore')}>
          Explore
        </button>
        <button style={tabStyle(activeTab === 'tests')} onClick={() => setActiveTab('tests')}>
          Tests ({ws.state.tests.length})
        </button>
        <button style={tabStyle(activeTab === 'log')} onClick={() => setActiveTab('log')}>
          Log ({ws.log.length})
        </button>
      </div>

      {/* Content */}
      <div style={{ maxHeight: 500, overflow: 'auto' }}>
        {activeTab === 'explore' && (
          <ExplorationView
            state={ws.state}
            connected={ws.connected}
            onStart={ws.startExploration}
            onPause={ws.pause}
            onResume={ws.resume}
            onStop={ws.stop}
          />
        )}
        {activeTab === 'tests' && <TestPreview tests={ws.state.tests} />}
        {activeTab === 'log' && <ActionLog entries={ws.log} />}
      </div>
    </div>
  );
}
