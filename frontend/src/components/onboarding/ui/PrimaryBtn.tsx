'use client';

import { ReactNode } from 'react';
import { T } from '../tokens';

interface PrimaryBtnProps {
  children: ReactNode;
  full?: boolean;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function PrimaryBtn({ children, full, icon, onClick, disabled }: PrimaryBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 42,
        padding: full ? '0' : '0 18px',
        width: full ? '100%' : 'auto',
        background: disabled ? T.mute2 : T.navy,
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        fontSize: 13.5,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: disabled ? 'none' : `0 1px 0 ${T.navyDeep}, 0 4px 12px ${T.navy}4d`,
        fontFamily: T.sans,
        transition: 'opacity 0.15s, transform 0.1s',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = '0.9'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {children}
      {icon && <span style={{ fontFamily: T.mono, fontSize: 14 }}>{icon}</span>}
    </button>
  );
}
