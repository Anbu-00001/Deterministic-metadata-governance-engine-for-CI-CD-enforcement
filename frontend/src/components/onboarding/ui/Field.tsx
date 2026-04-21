'use client';

import { ReactNode } from 'react';
import { T } from '../tokens';

interface FieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  type?: string;
  hint?: ReactNode;
  hintColor?: string;
  mono?: boolean;
  right?: ReactNode;
  focused?: boolean;
  error?: boolean;
  onChange?: (v: string) => void;
}

export function Field({
  label,
  value = '',
  placeholder,
  type = 'text',
  hint,
  hintColor,
  mono,
  right,
  focused,
  error,
  onChange,
}: FieldProps) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: 11.5,
        fontWeight: 500,
        color: T.ink2,
        marginBottom: 6,
        fontFamily: T.mono,
        letterSpacing: 0.2,
        textTransform: 'uppercase',
      }}>
        <span>{label}</span>
        {right}
      </div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: '100%',
          height: 40,
          borderRadius: 6,
          border: `1px solid ${error ? T.err : focused ? T.navy : T.line}`,
          boxShadow: focused ? `0 0 0 3px ${T.navy}26` : 'none',
          background: '#fff',
          padding: '0 12px',
          fontSize: 13,
          color: value ? T.ink : T.mute2,
          fontFamily: mono ? T.mono : T.sans,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.navy}26`; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? T.err : T.line; e.currentTarget.style.boxShadow = 'none'; }}
      />
      {hint && (
        <div style={{
          fontSize: 11,
          color: hintColor || T.mute,
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {hint}
        </div>
      )}
    </label>
  );
}
