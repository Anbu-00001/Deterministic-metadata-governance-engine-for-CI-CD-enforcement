'use client';

import { T } from '../tokens';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 14 }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={size * 1.5} height={size * 1.5} viewBox="0 0 24 24">
        <rect x="2" y="2" width="9" height="9" rx="1.5" fill={T.navy} />
        <rect x="13" y="2" width="9" height="9" rx="1.5" fill="none" stroke={T.navy} strokeWidth="1.5" />
        <rect x="2" y="13" width="9" height="9" rx="1.5" fill="none" stroke={T.navy} strokeWidth="1.5" />
        <rect x="13" y="13" width="9" height="9" rx="1.5" fill={T.amber} />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: size, fontWeight: 700, color: T.ink, letterSpacing: -0.2 }}>Metagov</span>
        <span style={{ fontSize: size * 0.62, fontFamily: T.mono, color: T.mute, marginTop: 2 }}>governance.engine</span>
      </div>
    </div>
  );
}
