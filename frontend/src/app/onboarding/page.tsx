'use client';

import { useState } from 'react';
import { Screen1 } from '@/components/onboarding/screens/Screen1';
import { Screen2 } from '@/components/onboarding/screens/Screen2';
import { Screen3 } from '@/components/onboarding/screens/Screen3';
import { Screen4 } from '@/components/onboarding/screens/Screen4';
import { Screen5 } from '@/components/onboarding/screens/Screen5';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {step === 1 && <Screen1 onNext={next} />}
      {step === 2 && <Screen2 onNext={next} onBack={back} />}
      {step === 3 && <Screen3 onNext={next} onBack={back} />}
      {step === 4 && <Screen4 onNext={next} onBack={back} />}
      {step === 5 && <Screen5 onFinish={() => setStep(1)} />}
    </div>
  );
}
