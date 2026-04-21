'use client';

import { useState } from 'react';
import { T } from '../tokens';
import { BrowserBar } from '../shared/BrowserBar';
import { TopBar } from '../shared/TopBar';
import { PrimaryBtn } from '../ui/PrimaryBtn';
import { GhostBtn } from '../ui/GhostBtn';
import { IntegrationCard } from '../integrations/IntegrationCard';

interface Screen4Props {
  onNext: () => void;
  onBack: () => void;
}

type IntegrationStatus = 'connected' | 'detecting' | 'idle';

interface Integration {
  logo: 'gha' | 'glc' | 'jen' | 'circle' | 'bb';
  name: string;
  desc: string;
  initialStatus: IntegrationStatus;
  featured?: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    logo: 'gha',
    name: 'GitHub Actions',
    featured: true,
    desc: 'Native Action + required status check. Policies run on push and pull_request.',
    initialStatus: 'detecting',
  },
  {
    logo: 'glc',
    name: 'GitLab CI',
    featured: true,
    desc: 'Drop-in include: directive with SaaS runner support. Enforces before deploy jobs.',
    initialStatus: 'idle',
  },
  {
    logo: 'jen',
    name: 'Jenkins',
    desc: 'Shared library plus agent plugin. Validates declarative and scripted pipelines.',
    initialStatus: 'idle',
  },
  {
    logo: 'circle',
    name: 'CircleCI',
    desc: 'Orb that wraps your jobs with a policy gate — no pipeline config changes required.',
    initialStatus: 'idle',
  },
  {
    logo: 'bb',
    name: 'Bitbucket Pipelines',
    desc: 'Custom pipe with workspace-level merge checks and deployment gating.',
    initialStatus: 'idle',
  },
];

export function Screen4({ onNext, onBack }: Screen4Props) {
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>(
    () => Object.fromEntries(INTEGRATIONS.map((i) => [i.name, i.initialStatus]))
  );

  function handleConnect(name: string) {
    setStatuses((prev) => ({ ...prev, [name]: 'connected' }));
  }

  const connectedCount = Object.values(statuses).filter((s) => s === 'connected').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      <BrowserBar />
      <TopBar step={4} />
      <div style={{ flex: 1, padding: '48px 64px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{
            fontSize: 10.5,
            fontFamily: T.mono,
            color: T.navy,
            fontWeight: 600,
            letterSpacing: 0.6,
            marginBottom: 8,
          }}>
            STEP 04 / 05
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 28,
            gap: 24,
            flexWrap: 'wrap',
          }}>
            <div>
              <h2 style={{
                fontSize: 26,
                fontWeight: 700,
                color: T.ink,
                margin: 0,
                letterSpacing: -0.5,
                fontFamily: T.sans,
              }}>
                Connect your CI/CD
              </h2>
              <p style={{
                fontSize: 13.5,
                color: T.mute,
                marginTop: 6,
                marginBottom: 0,
                lineHeight: 1.5,
                maxWidth: 520,
                fontFamily: T.sans,
              }}>
                Metagov attaches policy hooks to your existing pipelines. No YAML rewrites — just connect and we inject.
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11.5,
              color: T.mute,
              fontFamily: T.mono,
              padding: '6px 10px',
              border: `1px solid ${T.line}`,
              borderRadius: 6,
              background: '#fff',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 6, background: T.ok, display: 'block' }} />
              auto-scan complete · 3 providers detected
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {INTEGRATIONS.map((intg) => (
              <IntegrationCard
                key={intg.name}
                logo={intg.logo}
                name={intg.name}
                desc={intg.desc}
                status={statuses[intg.name]}
                featured={intg.featured}
                onConnect={() => handleConnect(intg.name)}
              />
            ))}

            {/* Custom card */}
            <div style={{
              borderRadius: 10,
              border: `1.5px dashed ${T.line}`,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: T.mute,
              fontSize: 12.5,
              background: `${T.line2}99`,
              textAlign: 'center',
              cursor: 'pointer',
            }}>
              <span style={{ fontFamily: T.mono, fontSize: 22, color: T.mute2 }}>+</span>
              <div style={{ fontWeight: 600, color: T.ink2, fontFamily: T.sans }}>Custom / Self-hosted</div>
              <div style={{ fontSize: 11, lineHeight: 1.4, maxWidth: 180, fontFamily: T.sans }}>
                CLI token for Argo, Tekton, Drone, or your own runner.
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 28,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, color: T.mute, fontFamily: T.sans }}>
              {connectedCount > 0
                ? `${connectedCount} integration${connectedCount > 1 ? 's' : ''} connected. You can add more anytime from Settings.`
                : 'You can add, remove, or reconfigure integrations anytime from Settings.'}
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <GhostBtn onClick={onNext}>I&apos;ll do this later</GhostBtn>
              <PrimaryBtn icon="→" onClick={onNext}>Continue</PrimaryBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
