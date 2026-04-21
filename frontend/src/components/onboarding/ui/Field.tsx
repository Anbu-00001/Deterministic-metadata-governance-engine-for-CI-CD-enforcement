'use client';

import { ReactNode, useState } from 'react';
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
  error,
  onChange,
}: FieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error ? T.err : isFocused ? T.navy : T.line;
  const boxShadow = isFocused ? `0 0 0 3px ${T.navy}26` : 'none';

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
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          height: 40,
          borderRadius: 6,
          border: `1px solid ${borderColor}`,
          boxShadow,
          background: '#fff',
          padding: '0 12px',
          fontSize: 13,
          color: value ? T.ink : T.mute2,
          fontFamily: mono ? T.mono : T.sans,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
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
