'use client';

import { Fragment } from 'react';
import { T } from '../tokens';
import { Logo } from './Logo';

interface TopBarProps {
  step: number;
  total?: number;
  hideSteps?: boolean;
}

const STEP_LABELS = ['Welcome', 'Account', 'Organization', 'Integrations', 'Ready'];

export function TopBar({ step, hideSteps = false }: TopBarProps) {
  return (
    <div style={{
      height: 58,
      borderBottom: `1px solid ${T.line}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      background: '#fff',
      flexShrink: 0,
    }}>
      <Logo />

      {!hideSteps && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {STEP_LABELS.map((label, i) => {
            const active = i + 1 === step;
            const done = i + 1 < step;
            return (
              <Fragment key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 20,
                    height: 20,
                    borderRadius: 20,
                    background: done || active ? T.navy : '#fff',
                    border: `1px solid ${done || active ? T.navy : T.line}`,
                    color: done || active ? '#fff' : T.mute2,
                    fontSize: 10.5,
                    fontWeight: 600,
                    fontFamily: T.mono,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {done ? '✓' : String(i + 1)}
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    color: active ? T.ink : done ? T.ink2 : T.mute2,
                    fontFamily: T.sans,
                  }}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <span style={{ width: 24, height: 1, background: done ? T.navy : T.line }} />
                )}
              </Fragment>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 12, color: T.mute, fontFamily: T.sans }}>Need help?</span>
        <span style={{
          fontSize: 11,
          fontFamily: T.mono,
          color: T.mute,
          padding: '4px 8px',
          border: `1px solid ${T.line}`,
          borderRadius: 4,
          cursor: 'pointer',
        }}>docs ↗</span>
      </div>
    </div>
  );
}
