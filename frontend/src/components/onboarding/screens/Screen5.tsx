'use client';

import { useEffect, useState } from 'react';
import { T } from '../tokens';
import { BrowserBar } from '../shared/BrowserBar';
import { TopBar } from '../shared/TopBar';
import { PrimaryBtn } from '../ui/PrimaryBtn';
import { GhostBtn } from '../ui/GhostBtn';

interface Screen5Props {
  onFinish: () => void;
}

const SUMMARY_ROWS = [
  { key: 'workspace', value: 'northframe-sys.metagov.dev', color: T.ok, sym: '✓' },
  { key: 'policy.namespace', value: 'ns/northframe-sys/default', color: T.ok, sym: '✓' },
  { key: 'integrations', value: 'github-actions, gitlab-ci', color: T.ok, sym: '✓' },
  { key: 'initial.ruleset', value: 'baseline.v1 (23 rules)', color: T.amber, sym: '→' },
] as const;

export function Screen5({ onFinish }: Screen5Props) {
  // Computed client-side only to avoid SSR/hydration mismatch
  const [provisionedAt, setProvisionedAt] = useState('');
  useEffect(() => {
    setProvisionedAt(new Date().toISOString().slice(0, 19).replace('T', ' '));
  }, []);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: `radial-gradient(circle at 50% 30%, #fff 0%, ${T.bg} 60%)`,
    }}>
      <BrowserBar />
      <TopBar step={5} />

      {/* Scrollable area — two-div pattern to support both centering and overflow */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          minHeight: 'min-content',
        }}>
          <div style={{
            width: 520,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Seal */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 80,
              background: `linear-gradient(145deg, ${T.navyHi} 0%, ${T.navyDeep} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 12px 32px ${T.navy}66, inset 0 1px 0 ${T.navyHi}`,
              marginBottom: 28,
              position: 'relative',
              flexShrink: 0,
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M4 12l5 5L20 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 24,
                height: 24,
                borderRadius: 24,
                background: T.amber,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: `0 4px 8px ${T.amber}80`,
              }}>
                ★
              </span>
            </div>

            <div style={{
              fontSize: 10.5,
              fontFamily: T.mono,
              color: T.ok,
              fontWeight: 600,
              letterSpacing: 0.6,
              marginBottom: 10,
              padding: '4px 10px',
              borderRadius: 20,
              background: T.okSoft,
            }}>
              ● READY TO ENFORCE
            </div>

            <h2 style={{
              fontSize: 36,
              fontWeight: 700,
              color: T.ink,
              margin: '0 0 14px',
              letterSpacing: -1,
              fontFamily: T.sans,
            }}>
              You&apos;re all set!
            </h2>

            <p style={{
              fontSize: 15,
              color: T.mute,
              margin: '0 0 32px',
              lineHeight: 1.55,
              maxWidth: 420,
              fontFamily: T.sans,
            }}>
              Your governance engine is provisioned and ready to enforce policies across
              your CI/CD pipelines. First scan starts in ~30 seconds.
            </p>

            {/* Summary card */}
            <div style={{
              width: '100%',
              background: '#fff',
              borderRadius: 10,
              border: `1px solid ${T.line}`,
              padding: 20,
              display: 'grid',
              gap: 12,
              textAlign: 'left',
              boxShadow: '0 4px 20px rgba(10,20,50,0.05)',
              marginBottom: 28,
            }}>
              {SUMMARY_ROWS.map(({ key, value, color, sym }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 20,
                    height: 20,
                    borderRadius: 20,
                    flexShrink: 0,
                    background: `${color}26`,
                    color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    {sym}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: T.mono, color: T.mute, minWidth: 130 }}>
                    {key}
                  </span>
                  <span style={{ fontSize: 12.5, color: T.ink, fontFamily: T.mono, fontWeight: 500 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <PrimaryBtn icon="→" onClick={onFinish}>Go to Dashboard</PrimaryBtn>
              <GhostBtn>View installation guide</GhostBtn>
            </div>

            <div style={{ marginTop: 32, fontSize: 11, color: T.mute2, fontFamily: T.mono }}>
              {provisionedAt ? `provisioned · ${provisionedAt} UTC` : 'provisioning…'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
