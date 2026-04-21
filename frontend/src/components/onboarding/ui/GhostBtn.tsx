'use client';

import { ReactNode } from 'react';
import { T } from '../tokens';

interface GhostBtnProps {
  children: ReactNode;
  full?: boolean;
  onClick?: () => void;
}

export function GhostBtn({ children, full, onClick }: GhostBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 40,
        padding: full ? '0' : '0 14px',
        width: full ? '100%' : 'auto',
        background: '#fff',
        color: T.ink2,
        border: `1px solid ${T.line}`,
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontFamily: T.sans,
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.mute2; e.currentTarget.style.background = T.bg; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.background = '#fff'; }}
    >
      {children}
    </button>
  );
}
