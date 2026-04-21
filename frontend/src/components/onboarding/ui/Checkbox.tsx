'use client';

import { ReactNode } from 'react';
import { T } from '../tokens';

interface CheckboxProps {
  checked: boolean;
  label: ReactNode;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({ checked, label, onChange }: CheckboxProps) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
      onClick={() => onChange?.(!checked)}
    >
      <span style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        marginTop: 1,
        border: `1px solid ${checked ? T.navy : T.line}`,
        background: checked ? T.navy : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 10,
        flexShrink: 0,
        transition: 'background 0.15s, border-color 0.15s',
      }}>
        {checked && '✓'}
      </span>
      <span style={{ fontSize: 12, color: T.mute, lineHeight: 1.5, fontFamily: T.sans }}>
        {label}
      </span>
    </div>
  );
}
