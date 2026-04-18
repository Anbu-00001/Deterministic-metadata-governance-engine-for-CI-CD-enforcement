import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface VerdictBannerProps {
  status: 'PASSED' | 'BLOCKED';
  explanation?: string;
}

export default function VerdictBanner({ status, explanation }: VerdictBannerProps) {
  const isPassed = status === 'PASSED';
  
  return (
    <div className={`p-4 rounded-md border flex items-start gap-3 ${isPassed ? 'bg-green-950/30 border-green-900/50 text-green-400' : 'bg-red-950/30 border-red-900/50 text-red-400'}`}>
      <div className="mt-0.5">
        {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <div>
        <h3 className="font-semibold text-lg tracking-tight">Verdict: {status}</h3>
        {explanation && <p className="text-sm opacity-80 mt-1">{explanation}</p>}
      </div>
    </div>
  );
}
