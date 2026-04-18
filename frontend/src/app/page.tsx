'use client';

import React, { useEffect, useState } from 'react';
import { evaluateSentinel } from '../lib/api';
import { AlertTriangle, CheckCircle2, Expand, Crosshair } from 'lucide-react';

export default function Dashboard() {
  const [evalResult, setEvalResult] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const evaluation = await evaluateSentinel({}).catch(() => null);
        setEvalResult(evaluation && evaluation.length > 0 ? evaluation[0] : null);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    const intv = setInterval(load, 5000); // Polling for real-time evaluate updates
    return () => clearInterval(intv);
  }, []);

  const fgsScore = evalResult?.fgs?.score || 75.4;
  const isPass = !evalResult?.fgs?.is_blocked ?? true;

  return (
    <div className="p-6 h-full grid grid-cols-12 grid-rows-6 gap-6 relative">
      {/* COL 1: Context & Lineage */}
      <div className="col-span-3 row-span-6 flex flex-col gap-6">
        <div className="panel-border rounded flex flex-col p-5 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90]">INPUT CONTEXT</h3>
            <span className="px-2 py-0.5 rounded bg-[#1a2636] border border-[#26374a] text-[9px] text-[#00E5FF] font-bold">LIVE</span>
          </div>
          <p className="text-xs text-[#a0aab8] leading-relaxed mb-5">
            Detected 4 high-velocity schema mutations in <span className="text-white font-mono bg-[#141b24] px-1 py-0.5 rounded">cluster-gamma-9</span>.
          </p>
          
          <div className="flex flex-col gap-3">
            <div className="p-3 border border-[#2d2121] bg-[#1a1215] rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-[#00E5FF]">USERS_METADATA</span>
                <AlertTriangle className="w-3 h-3 text-[#ff5b5b]" />
              </div>
              <div className="w-full h-1 bg-[#2d1b1f] rounded overflow-hidden mb-2">
                <div className="h-full w-4/5 bg-[#ff5b5b]"></div>
              </div>
              <div className="flex justify-between text-[8px] font-bold tracking-wider text-[#6B7A90]">
                <span>SCHEMA CHANGE</span>
                <span className="text-[#ff5b5b]">CRITICAL</span>
              </div>
            </div>

            <div className="p-3 border border-[#162529] bg-[#0d161a] rounded">
              <div className="flex justify-between items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#00E5FF]">TRANSACTION_LOG_V2</span>
                <CheckCircle2 className="w-3 h-3 text-[#00E5FF]" />
              </div>
              <div className="flex justify-between text-[8px] font-bold tracking-wider text-[#6B7A90]">
                <span>NEW TABLE</span>
                <span className="text-[#00E5FF]">STABLE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-border rounded flex flex-col p-5 flex-1 relative overflow-hidden group">
          <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-4">LINEAGE PREVIEW</h3>
          <div className="flex-1 rounded border border-[#16202e] bg-[#080d12] dot-pattern relative flex items-center justify-center">
            <div className="w-10 h-10 border border-[#00E5FF]/30 bg-[#00E5FF]/10 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.2)]">
              <span className="text-[#00E5FF] font-mono text-xs">{'<->'}</span>
            </div>
            <Expand className="absolute bottom-2 right-2 w-3 h-3 text-[#4A5568] group-hover:text-[#00E5FF] cursor-pointer" />
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-[40px] w-5 h-px bg-[#00E5FF]/40"></div>
            <div className="absolute top-1/2 right-1/2 -translate-y-1/2 translate-x-[40px] w-5 h-px bg-[#00E5FF]/40"></div>
          </div>
        </div>
      </div>

      {/* COL 2: FGS Score & Change Magnitude */}
      <div className="col-span-4 row-span-6 flex flex-col gap-6">
        <div className="panel-border rounded flex flex-col p-5 flex-[2]">
          <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-8">FGS SCORE</h3>
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
              <div className="absolute inset-0 rounded-full border-[6px] border-[#0F1E2A]"></div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="90" fill="transparent" stroke="url(#cyan-gradient)" strokeWidth="6" strokeDasharray="565" strokeDashoffset={565 - (565 * fgsScore) / 100} className="drop-shadow-[0_0_8px_rgba(0,229,255,0.7)] transition-all duration-1000" strokeLinecap="round" />
                <defs>
                  <linearGradient id="cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex flex-col items-center text-center z-10 animate-pulse">
                <span className="text-5xl font-black text-white glow-text tracking-tighter">{fgsScore.toFixed(1)}</span>
                <span className="text-[9px] font-bold tracking-[0.2em] text-[#6B7A90] mt-2">OPTIMIZED</span>
              </div>
            </div>
            
            <div className="flex w-full justify-around mt-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-[#6B7A90] font-bold tracking-wider mb-1">VELOCITY</span>
                <span className="text-white text-sm font-mono">+12.4%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-[#6B7A90] font-bold tracking-wider mb-1">RELIABILITY</span>
                <span className="text-white text-sm font-mono">99.98%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-border rounded flex flex-col p-5 flex-[1]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90]">CHANGE MAGNITUDE</h3>
            <div className="flex gap-3">
              <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></div><span className="text-[8px] text-[#6B7A90]">ACTIVE</span></div>
              <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#4A5568]"></div><span className="text-[8px] text-[#6B7A90]">BASELINE</span></div>
            </div>
          </div>
          <div className="flex items-end justify-between flex-1 gap-2 mx-2">
            <div className="w-5 bg-[#253245] h-[40%] rounded-t-sm hover:bg-[#4A5568] transition-colors"></div>
            <div className="w-5 bg-[#00E5FF] h-[70%] rounded-t-sm shadow-[0_0_8px_rgba(0,229,255,0.4)] animate-pulse"></div>
            <div className="w-5 bg-[#253245] h-[50%] rounded-t-sm hover:bg-[#4A5568] transition-colors"></div>
            <div className="w-5 bg-[#00E5FF] h-[90%] rounded-t-sm shadow-[0_0_8px_rgba(0,229,255,0.4)] animate-pulse"></div>
            <div className="w-5 bg-[#253245] h-[60%] rounded-t-sm hover:bg-[#4A5568] transition-colors"></div>
            <div className="w-5 bg-[#253245] h-[30%] rounded-t-sm hover:bg-[#4A5568] transition-colors"></div>
            <div className="w-5 bg-[#253245] h-[90%] rounded-t-sm hover:bg-[#4A5568] transition-colors"></div>
            <div className="w-5 bg-[#00E5FF] h-[60%] rounded-t-sm shadow-[0_0_8px_rgba(0,229,255,0.4)] animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* COL 3: Blast Radius Scatter */}
      <div className="col-span-2 row-span-6 flex flex-col h-full bg-[#0D1219] border border-[#1a2230] rounded p-5 relative overflow-hidden">
        <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-4 relative z-10">BLAST RADIUS</h3>
        
        <div className="absolute inset-0 top-[60px] bottom-[80px] bg-[#080d12] mx-4 rounded-lg flex items-center justify-center border border-[#141b24] shadow-inner dot-pattern">
           <div className="w-16 h-16 border border-[#2d3748]/30 rounded flex items-center justify-center relative">
              <div className="absolute top-[-20%] left-[80%] w-2 h-2 rounded-full bg-[#ffb48f] shadow-[0_0_6px_#ffb48f] animate-pulse"></div>
              <div className="absolute top-[80%] left-[120%] w-3 h-3 rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] animate-bounce"></div>
              <div className="absolute top-[120%] left-[-30%] w-1.5 h-1.5 rounded-full bg-[#f8e81c] shadow-[0_0_5px_#f8e81c] animate-pulse"></div>
              <div className="absolute top-[160%] left-[50%] w-1.5 h-1.5 rounded-full bg-[#90cdf4] shadow-[0_0_5px_#90cdf4] animate-pulse"></div>
           </div>
        </div>

        <div className="absolute bottom-5 left-5 right-5 flex flex-col pt-3 border-t border-[#1a2230]">
           <span className="text-[10px] font-bold text-white mb-0.5 tracking-wider">ID: BLR-429</span>
           <span className="text-[9px] text-[#6B7A90]">NODES IMPACTED: {evalResult?.fgs?.blast_radius ?? 18}</span>
        </div>
      </div>

      {/* COL 4: Decision Engine, Risk Breakdown, Suggestion */}
      <div className="col-span-3 row-span-6 flex flex-col gap-6">
        
        <div className="panel-border rounded flex flex-col p-5 h-[320px]">
          <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-8">DECISION ENGINE</h3>
          <div className="flex flex-col items-center justify-center flex-1">
            <span className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-2">FINAL VERDICT</span>
            <div className={`w-[140px] h-[100px] border-2 rounded-lg flex items-center justify-center mb-6 shadow-lg ${
              isPass ? 'border-[#00E5FF] bg-[#00E5FF]/10 shadow-[#00E5FF]/20' : 'border-[#ff5b5b] bg-[#ff5b5b]/10 shadow-[#ff5b5b]/20'
            }`}>
              <span className={`text-2xl font-black tracking-widest glow-text ${isPass ? 'text-[#00E5FF]' : 'text-[#ff5b5b]'}`}>
                {isPass ? 'PASS' : 'BLOCK'}
              </span>
            </div>
            <span className="text-xs text-white font-medium mb-1">
              {isPass ? 'Auto-approval threshold met' : 'Safety thresholds violated'}
            </span>
            <span className="text-[9px] font-mono text-[#6B7A90]">
              CONFIDENCE: 92.4%
            </span>
          </div>
        </div>

        <div className="panel-border rounded flex flex-col p-5 flex-[1.5]">
          <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-4">RISK BREAKDOWN</h3>
          <div className="flex flex-col gap-4 mt-2">
            
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-bold tracking-wider text-[#e0e5ea]">DATA_LEAKAGE</span>
                <span className="text-[9px] font-bold text-[#00E5FF]">LOW</span>
              </div>
              <div className="w-full h-[3px] bg-[#1a2230] rounded overflow-hidden">
                <div className="h-full bg-[#00E5FF] shadow-[0_0_5px_#00E5FF]" style={{width: '20%'}}></div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-bold tracking-wider text-[#e0e5ea]">COST_IMPACT</span>
                <span className="text-[9px] font-bold text-[#fbc02d]">MED</span>
              </div>
              <div className="w-full h-[3px] bg-[#1a2230] rounded overflow-hidden">
                <div className="h-full bg-[#fbc02d] shadow-[0_0_5px_#fbc02d]" style={{width: '60%'}}></div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-bold tracking-wider text-[#e0e5ea]">LATENCY_DELTA</span>
                <span className="text-[9px] font-bold text-[#00E5FF]">LOW</span>
              </div>
              <div className="w-full h-[3px] bg-[#1a2230] rounded overflow-hidden">
                <div className="h-full bg-[#00E5FF] shadow-[0_0_5px_#00E5FF]" style={{width: '15%'}}></div>
              </div>
            </div>

          </div>
        </div>

        <div className="panel-border rounded flex flex-col p-5 flex-[1.2] relative overflow-hidden bg-gradient-to-br from-[#0c141d] to-[#0A0F15]">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00E5FF]"></div>
          <div className="flex items-center gap-2 mb-3">
            <Crosshair className="w-3 h-3 text-[#00E5FF]" />
            <h3 className="text-[10px] font-bold tracking-widest text-[#e0e5ea]">ENGINE SUGGESTION</h3>
          </div>
          <p className="text-[11px] text-[#a0aab8] leading-relaxed mb-4 flex-1">
            Consider indexing <span className="text-[#00E5FF]">shard_key_01</span> to reduce Blast Radius by 12%.
          </p>
          <button className="neon-btn-solid w-full py-2.5 rounded text-[9px] font-bold tracking-widest border-[#00E5FF]/40 border">
            APPLY OPTIMIZATION
          </button>
        </div>

      </div>
    </div>
  );
}
