'use client';

import { DesignCanvas, DCSection, DCArtboard, DCPostIt } from '@/components/onboarding/canvas/DesignCanvas';
import { Screen1 } from '@/components/onboarding/screens/Screen1';
import { Screen2 } from '@/components/onboarding/screens/Screen2';
import { Screen3 } from '@/components/onboarding/screens/Screen3';
import { Screen4 } from '@/components/onboarding/screens/Screen4';
import { Screen5 } from '@/components/onboarding/screens/Screen5';

const W = 1280;
const H = 720;

// Noop handlers for design-canvas preview — screens are static here
const noop = () => {};

export default function DesignCanvasPage() {
  return (
    <DesignCanvas>
      <DCSection
        title="Deterministic Metadata Governance Engine"
        subtitle="Signup flow · 5 screens · 1280 × 720 · desktop-first"
      >
        <div style={{ position: 'relative' }}>
          <DCArtboard label="01 — Welcome" width={W} height={H}>
            <Screen1 onNext={noop} />
          </DCArtboard>
          <DCPostIt top={80} left={W + 24} rotate={1.5} width={200}>
            Hero split layout.<br />Left: copy + CTA<br />Right: pipeline viz
          </DCPostIt>
        </div>

        <div style={{ position: 'relative' }}>
          <DCArtboard label="02 — Account" width={W} height={H}>
            <Screen2 onNext={noop} onBack={noop} />
          </DCArtboard>
          <DCPostIt top={80} left={W + 24} rotate={-1} width={200}>
            SSO domain detection,<br />password strength meter,<br />OAuth alternatives
          </DCPostIt>
        </div>

        <div style={{ position: 'relative' }}>
          <DCArtboard label="03 — Organization" width={W} height={H}>
            <Screen3 onNext={noop} onBack={noop} />
          </DCArtboard>
          <DCPostIt top={80} left={W + 24} rotate={2} width={200}>
            Auto-slug from org name.<br />Team size chips.<br />Role radio cards.
          </DCPostIt>
        </div>

        <div style={{ position: 'relative' }}>
          <DCArtboard label="04 — CI/CD Integrations" width={W} height={H}>
            <Screen4 onNext={noop} onBack={noop} />
          </DCArtboard>
          <DCPostIt top={80} left={W + 24} rotate={-2} width={200}>
            3-col integration grid.<br />Auto-detect badge.<br />Connect → connected state.
          </DCPostIt>
        </div>

        <div style={{ position: 'relative' }}>
          <DCArtboard label="05 — Ready" width={W} height={H}>
            <Screen5 onFinish={noop} />
          </DCArtboard>
          <DCPostIt top={80} left={W + 24} rotate={1} width={200}>
            Provision summary card.<br />Amber → pending ruleset.<br />Green → confirmed items.
          </DCPostIt>
        </div>
      </DCSection>
    </DesignCanvas>
  );
}
