'use client';

import { useState } from 'react';
import { T } from '../tokens';
import { BrowserBar } from '../shared/BrowserBar';
import { TopBar } from '../shared/TopBar';
import { Field } from '../ui/Field';
import { PrimaryBtn } from '../ui/PrimaryBtn';
import { GhostBtn } from '../ui/GhostBtn';

interface Screen3Props {
  onNext: () => void;
  onBack: () => void;
}

const SIZES = ['1–10', '11–50', '51–200', '201–1k', '1k+'];

const ROLES = [
  { k: 'devops', l: 'DevOps Engineer', d: 'Pipelines & release eng.' },
  { k: 'dev', l: 'Developer', d: 'Application code & CI checks' },
  { k: 'arch', l: 'Platform Architect', d: 'Org-wide policy design' },
  { k: 'sec', l: 'Security / Compliance', d: 'Audit & attestation' },
] as const;

const REGIONS = [
  { value: 'us-east-1', label: 'Virginia, USA' },
  { value: 'us-west-2', label: 'Oregon, USA' },
  { value: 'eu-west-1', label: 'Ireland, EU' },
  { value: 'ap-southeast-1', label: 'Singapore, APAC' },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function Screen3({ onNext, onBack }: Screen3Props) {
  const [orgName, setOrgName] = useState('');
  const [sizeIdx, setSizeIdx] = useState(2);
  const [roleIdx, setRoleIdx] = useState(0);
  const [region, setRegion] = useState('us-east-1');
  const [regionOpen, setRegionOpen] = useState(false);

  const slug = orgName ? slugify(orgName) : 'your-org';
  const regionLabel = REGIONS.find((r) => r.value === region)?.label ?? '';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      <BrowserBar />
      <TopBar step={3} />
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        overflowY: 'auto',
      }}>
        <div style={{
          width: 560,
          background: T.card,
          borderRadius: 10,
          border: `1px solid ${T.line}`,
          padding: 36,
          boxShadow: '0 1px 2px rgba(10,20,50,0.04), 0 8px 32px rgba(10,20,50,0.06)',
        }}>
          <div style={{
            fontSize: 10.5,
            fontFamily: T.mono,
            color: T.navy,
            fontWeight: 600,
            letterSpacing: 0.6,
            marginBottom: 8,
          }}>
            STEP 03 / 05
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: -0.5, fontFamily: T.sans }}>
            Set up your organization
          </h2>
          <p style={{ fontSize: 13, color: T.mute, marginTop: 6, marginBottom: 28, lineHeight: 1.5, fontFamily: T.sans }}>
            We&apos;ll scaffold a default workspace and policy namespace from this info.
          </p>

          <div style={{ display: 'grid', gap: 18 }}>
            {/* Org name */}
            <Field
              label="Organization name"
              value={orgName}
              placeholder="Acme Systems"
              onChange={setOrgName}
              right={
                <span style={{ fontFamily: T.mono, textTransform: 'none', color: T.mute, fontSize: 11 }}>
                  ns · <span style={{ color: T.ink2 }}>{slug}</span>
                </span>
              }
              hint={`This becomes your namespace: metagov.dev/o/${slug}`}
            />

            {/* Team size */}
            <div>
              <div style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: T.ink2,
                marginBottom: 8,
                fontFamily: T.mono,
                letterSpacing: 0.2,
                textTransform: 'uppercase',
              }}>
                Team size
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {SIZES.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setSizeIdx(i)}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 6,
                      border: `1px solid ${i === sizeIdx ? T.navy : T.line}`,
                      background: i === sizeIdx ? T.navy : '#fff',
                      color: i === sizeIdx ? '#fff' : T.ink2,
                      fontSize: 12.5,
                      fontWeight: 500,
                      fontFamily: T.mono,
                      cursor: 'pointer',
                      boxShadow: i === sizeIdx ? `0 0 0 3px ${T.navy}26` : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Role */}
            <div>
              <div style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: T.ink2,
                marginBottom: 8,
                fontFamily: T.mono,
                letterSpacing: 0.2,
                textTransform: 'uppercase',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>Your role</span>
                <span style={{ textTransform: 'none', color: T.mute, fontWeight: 400, fontFamily: T.sans }}>
                  Determines default permissions
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ROLES.map((r, i) => {
                  const sel = i === roleIdx;
                  return (
                    <div
                      key={r.k}
                      onClick={() => setRoleIdx(i)}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${sel ? T.navy : T.line}`,
                        background: sel ? `${T.navy}0a` : '#fff',
                        boxShadow: sel ? `0 0 0 3px ${T.navy}1f` : 'none',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{
                        width: 14,
                        height: 14,
                        borderRadius: 14,
                        marginTop: 2,
                        flexShrink: 0,
                        border: `1.5px solid ${sel ? T.navy : T.line}`,
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {sel && (
                          <span style={{ width: 6, height: 6, borderRadius: 6, background: T.navy, display: 'block' }} />
                        )}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: T.sans }}>{r.l}</div>
                        <div style={{ fontSize: 11.5, color: T.mute, marginTop: 2, fontFamily: T.sans }}>{r.d}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Region */}
            <div style={{ position: 'relative' }}>
              <div style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: T.ink2,
                marginBottom: 8,
                fontFamily: T.mono,
                letterSpacing: 0.2,
                textTransform: 'uppercase',
              }}>
                Primary region
              </div>
              <div
                onClick={() => setRegionOpen((o) => !o)}
                style={{
                  height: 40,
                  borderRadius: 6,
                  border: `1px solid ${regionOpen ? T.navy : T.line}`,
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  fontSize: 13,
                  color: T.ink,
                  justifyContent: 'space-between',
                  fontFamily: T.mono,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span>
                  <span style={{ color: T.mute }}>{region} · </span>
                  {regionLabel}
                </span>
                <span style={{ color: T.mute2, fontSize: 11 }}>{regionOpen ? '▴' : '▾'}</span>
              </div>
              {regionOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: `1px solid ${T.navy}`,
                  borderRadius: 6,
                  zIndex: 10,
                  boxShadow: '0 4px 16px rgba(10,20,50,0.1)',
                  marginTop: 4,
                  overflow: 'hidden',
                }}>
                  {REGIONS.map((r) => (
                    <div
                      key={r.value}
                      onClick={() => { setRegion(r.value); setRegionOpen(false); }}
                      style={{
                        padding: '10px 12px',
                        fontSize: 13,
                        fontFamily: T.mono,
                        color: r.value === region ? T.navy : T.ink,
                        background: r.value === region ? `${T.navy}0a` : '#fff',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${T.line2}`,
                      }}
                      onMouseEnter={(e) => { if (r.value !== region) e.currentTarget.style.background = T.bg; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = r.value === region ? `${T.navy}0a` : '#fff'; }}
                    >
                      <span style={{ color: T.mute }}>{r.value} · </span>
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            <GhostBtn onClick={onBack}>← Back</GhostBtn>
            <div style={{ display: 'flex', gap: 10 }}>
              <GhostBtn onClick={onNext}>Skip for now</GhostBtn>
              <PrimaryBtn icon="→" onClick={onNext}>Continue</PrimaryBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
