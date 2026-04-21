'use client';

import { T } from '../tokens';

type LogoKind = 'gha' | 'glc' | 'jen' | 'circle' | 'bb';

interface IntegrationLogoProps {
  kind: LogoKind;
}

export function IntegrationLogo({ kind }: IntegrationLogoProps) {
  if (kind === 'gha') return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="#0e1b3f" />
      <path d="M8 7v4l3 2-3 2v4l6-4v-4z" fill="#fff" />
    </svg>
  );

  if (kind === 'glc') return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill={T.amberSoft} />
      <path d="M12 18l-4.5-7L9 5l1.5 4h3L15 5l1.5 6z" fill={T.amber} />
    </svg>
  );

  if (kind === 'jen') return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill={T.chipBg} />
      <circle cx="12" cy="10" r="4" fill={T.navy} />
      <path d="M8 16c0-2 2-3 4-3s4 1 4 3v3H8z" fill={T.navy} />
    </svg>
  );

  if (kind === 'circle') return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill={T.ink} />
      <circle cx="12" cy="12" r="3" fill="#fff" />
    </svg>
  );

  if (kind === 'bb') return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill={T.navyHi} />
      <path d="M5 7h14l-2 11H7z" fill="#fff" />
      <rect x="9" y="10" width="6" height="4" fill={T.navyHi} />
    </svg>
  );

  return null;
}
