'use client';

import { T } from '../tokens';

export function BrowserBar() {
  return (
    <div style={{
      height: 34,
      background: '#f3f4f8',
      borderBottom: `1px solid ${T.line}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      gap: 14,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: 10, background: '#ff5f57', display: 'block' }} />
        <span style={{ width: 10, height: 10, borderRadius: 10, background: '#febc2e', display: 'block' }} />
        <span style={{ width: 10, height: 10, borderRadius: 10, background: '#28c840', display: 'block' }} />
      </div>
      <div style={{
        flex: 1,
        height: 20,
        borderRadius: 4,
        background: '#fff',
        border: `1px solid ${T.line}`,
        fontFamily: T.mono,
        fontSize: 10.5,
        color: T.mute,
        padding: '0 10px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <span style={{ color: T.mute2 }}>https://</span>
        <span style={{ color: T.ink2 }}>app.metagov.dev</span>
        <span style={{ color: T.mute2 }}>/onboarding</span>
      </div>
    </div>
  );
}
