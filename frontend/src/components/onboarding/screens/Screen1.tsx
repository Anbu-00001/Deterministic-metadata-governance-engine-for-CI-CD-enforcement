'use client';

import { T } from '../tokens';
import { BrowserBar } from '../shared/BrowserBar';
import { TopBar } from '../shared/TopBar';
import { PrimaryBtn } from '../ui/PrimaryBtn';
import { GhostBtn } from '../ui/GhostBtn';

interface Screen1Props {
  onNext: () => void;
}

const PIPELINE_NODES = [
  { label: 'source.commit', sub: 'git@main • 4f2a9c', status: 'ok' },
  { label: 'policy.validate', sub: 'metagov/ruleset.yml', status: 'active' },
  { label: 'artifact.sign', sub: 'sha256 • verified', status: 'pending' },
  { label: 'deploy.production', sub: 'us-east-1 • blocked', status: 'blocked' },
] as const;

const STATS = [
  ['14k+', 'pipelines governed'],
  ['99.98%', 'policy accuracy'],
  ['SOC 2', 'Type II compliant'],
] as const;

function nodeColor(status: string) {
  if (status === 'ok') return T.ok;
  if (status === 'active') return T.amber;
  if (status === 'blocked') return T.err;
  return T.mute2;
}

export function Screen1({ onNext }: Screen1Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      <BrowserBar />
      <TopBar step={1} />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>
        {/* Left panel */}
        <div style={{
          padding: '72px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflowY: 'auto',
        }}>
          <div style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 20,
            background: T.amberSoft,
            fontSize: 11,
            fontWeight: 600,
            color: T.amber,
            fontFamily: T.mono,
            letterSpacing: 0.3,
            marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 6, background: T.amber, display: 'block' }} />
            v2.4 — POLICY-AS-CODE
          </div>

          <h1 style={{
            fontSize: 44,
            fontWeight: 700,
            color: T.ink,
            letterSpacing: -1.2,
            lineHeight: 1.05,
            margin: 0,
            marginBottom: 18,
            fontFamily: T.sans,
          }}>
            Start your<br />governance<br />
            <span style={{ color: T.navy }}>journey.</span>
          </h1>

          <p style={{
            fontSize: 15,
            color: T.mute,
            lineHeight: 1.55,
            margin: 0,
            marginBottom: 36,
            maxWidth: 420,
            fontFamily: T.sans,
          }}>
            Enforce deterministic metadata policies across every pipeline.
            Define once, validate everywhere — from commit to deploy.
          </p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 40 }}>
            <PrimaryBtn icon="→" onClick={onNext}>Get Started</PrimaryBtn>
            <GhostBtn>Watch demo (2 min)</GhostBtn>
          </div>

          <div style={{
            display: 'flex',
            gap: 28,
            paddingTop: 28,
            borderTop: `1px solid ${T.line}`,
          }}>
            {STATS.map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.ink, fontFamily: T.mono }}>{n}</div>
                <div style={{ fontSize: 11, color: T.mute, marginTop: 2, fontFamily: T.sans }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — pipeline visualization */}
        <div style={{
          background: `linear-gradient(135deg, ${T.navyDeep} 0%, ${T.navy} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}>
          {/* Subtle grid overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${T.navyHi}66 1px, transparent 1px), linear-gradient(90deg, ${T.navyHi}66 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

          <div style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
            {PIPELINE_NODES.map((node, i) => (
              <div key={i}>
                <div style={{
                  background: '#fff',
                  borderRadius: 8,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  marginLeft: i === 1 || i === 2 ? 40 : 0,
                  marginRight: i === 1 || i === 2 ? 0 : 40,
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: nodeColor(node.status),
                    display: 'block',
                    boxShadow: node.status === 'active' ? `0 0 0 4px ${T.amber}66` : 'none',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, fontFamily: T.mono }}>{node.label}</div>
                    <div style={{ fontSize: 10.5, color: T.mute, fontFamily: T.mono, marginTop: 1 }}>{node.sub}</div>
                  </div>
                  <span style={{ fontSize: 10, color: T.mute2, fontFamily: T.mono }}>
                    {String(i + 1).padStart(3, '0')}
                  </span>
                </div>
                {i < 3 && (
                  <div style={{
                    width: 2,
                    height: 18,
                    background: `${T.amber}cc`,
                    marginLeft: i % 2 === 0 ? 'auto' : 20,
                    marginRight: i % 2 === 0 ? 20 : 'auto',
                  }} />
                )}
              </div>
            ))}
          </div>

          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            fontSize: 10,
            fontFamily: T.mono,
            color: 'rgba(255,255,255,0.38)',
            letterSpacing: 0.5,
          }}>
            [ placeholder: pipeline-visualization.svg — real animation in prod ]
          </div>
        </div>
      </div>
    </div>
  );
}
