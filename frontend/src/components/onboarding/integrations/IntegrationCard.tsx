'use client';

import { T } from '../tokens';
import { IntegrationLogo } from './IntegrationLogo';

type LogoKind = 'gha' | 'glc' | 'jen' | 'circle' | 'bb';
type Status = 'connected' | 'detecting' | 'idle';

interface IntegrationCardProps {
  logo: LogoKind;
  name: string;
  desc: string;
  status: Status;
  featured?: boolean;
  onConnect?: () => void;
}

export function IntegrationCard({ logo, name, desc, status, featured, onConnect }: IntegrationCardProps) {
  const connected = status === 'connected';
  const detecting = status === 'detecting';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 10,
      border: `1px solid ${featured ? T.navy : T.line}`,
      boxShadow: featured ? `0 0 0 3px ${T.navy}1a` : '0 1px 2px rgba(10,20,50,0.03)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {featured && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          fontSize: 9.5,
          fontFamily: T.mono,
          fontWeight: 600,
          color: T.amber,
          background: T.amberSoft,
          padding: '3px 7px',
          borderRadius: 4,
          letterSpacing: 0.4,
        }}>
          DETECTED
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <IntegrationLogo kind={logo} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, fontFamily: T.sans }}>{name}</div>
          <div style={{ fontSize: 11, color: T.mute2, fontFamily: T.mono, marginTop: 1 }}>
            {connected ? 'oauth.v2 · scoped' : detecting ? 'scanning repos…' : 'oauth.v2'}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: T.mute, margin: 0, lineHeight: 1.5, minHeight: 32, fontFamily: T.sans }}>
        {desc}
      </p>

      {connected ? (
        <div style={{
          height: 36,
          borderRadius: 6,
          background: T.okSoft,
          color: T.ok,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 12.5,
          fontWeight: 600,
          border: `1px solid ${T.ok}4d`,
          fontFamily: T.sans,
        }}>
          <span>✓</span> Connected · 12 workflows
        </div>
      ) : detecting ? (
        <button
          onClick={onConnect}
          style={{
            height: 36,
            borderRadius: 6,
            border: `1px solid ${T.navy}`,
            background: T.navy,
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: T.sans,
            cursor: 'pointer',
            width: '100%',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Connect →
        </button>
      ) : (
        <button
          onClick={onConnect}
          style={{
            height: 36,
            borderRadius: 6,
            border: `1px solid ${T.line}`,
            background: '#fff',
            color: T.ink2,
            fontSize: 12.5,
            fontWeight: 500,
            fontFamily: T.sans,
            cursor: 'pointer',
            width: '100%',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.mute2; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.line; }}
        >
          Connect
        </button>
      )}
    </div>
  );
}
