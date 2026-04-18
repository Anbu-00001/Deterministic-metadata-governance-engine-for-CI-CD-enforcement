'use client';

import React, { useState } from 'react';
import { evaluateSentinel } from '@/lib/api';
import { Loader2, Play, Crosshair } from 'lucide-react';

export default function EvaluatePage() {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!jsonInput.trim()) {
      setError('Please provide JSON input data');
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (e) {
      setError('Invalid JSON format. Please ensure your payload is valid.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await evaluateSentinel(parsed);
      if (Array.isArray(res)) {
        setResult(res[0]);
      } else {
        setResult(res);
      }
    } catch (err: any) {
      setError(err.message || 'API request failed.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const isPass = !result?.fgs?.is_blocked ?? true;

  return (
    <div className="p-6 h-full flex flex-col relative">
      <div className="mb-6 flex justify-between items-center z-10">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-[#00E5FF] glow-text">EVALUATE SENTINEL</h1>
          <p className="text-[10px] text-[#6B7A90] font-mono mt-1">FORGE GOVERNANCE PAYLOAD INJECTION</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6">
        {/* Left Col: Input */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="panel-border rounded flex flex-col p-5 h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90]">INPUT PAYLOAD [JSON]</h3>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-[#1a2636] border border-[#26374a] text-[9px] text-[#00E5FF] font-bold">RAW FORMAT</span>
              </div>
            </div>
            
            <textarea
              className="w-full flex-1 bg-[#080d12] border border-[#16202e] rounded p-4 font-mono text-xs text-[#00E5FF] focus:outline-none focus:border-[#00E5FF] transition-colors resize-none mb-4"
              placeholder='{ "metadata": { "example_table": { "id": { "description": "PK", "tags": ["PII"] } } } }'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              spellCheck={false}
            />
            
            <button
              onClick={handleSubmit}
              disabled={loading || !jsonInput.trim()}
              className="neon-btn w-full flex items-center justify-center gap-2 py-3 rounded text-[11px] font-bold tracking-widest disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {loading ? 'EVALUATING...' : 'EXECUTE SENTINEL'}
            </button>
            {error && <div className="mt-3 text-[#ff5b5b] text-[10px] font-mono border border-[#ff5b5b]/30 bg-[#ff5b5b]/10 p-2 rounded">{error}</div>}
          </div>
        </div>

        {/* Right Col: Output */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="panel-border rounded flex flex-col p-5 h-full">
            <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-4">EVALUATION TELEMETRY</h3>
            
            {!result && !loading && (
              <div className="flex-1 border border-dashed border-[#1a2230] bg-[#0c1017] rounded flex items-center justify-center text-[#4A5568] text-[10px] font-mono">
                AWAITING PAYLOAD INJECTION...
              </div>
            )}

            {loading && (
              <div className="flex-1 border border-[#1a2230] bg-[#0A0F15] rounded flex flex-col items-center justify-center text-[#00E5FF]">
                <Loader2 className="w-8 h-8 animate-spin mb-4 drop-shadow-[0_0_8px_rgba(0,229,255,0.7)]" />
                <span className="text-[10px] font-mono tracking-widest animate-pulse">COMPUTING GOVERNANCE MATRIX...</span>
              </div>
            )}

            {result && !loading && (
              <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Verdict */}
                <div className={`p-4 border-l-4 rounded bg-gradient-to-r ${isPass ? 'from-[#00E5FF]/10 to-transparent border-[#00E5FF]' : 'from-[#ff5b5b]/10 to-transparent border-[#ff5b5b]'}`}>
                   <h4 className={`text-xl font-black tracking-widest mb-1 ${isPass ? 'text-[#00E5FF]' : 'text-[#ff5b5b]'}`}>
                     {isPass ? 'VERDICT: PASS' : 'VERDICT: BLOCKED'}
                   </h4>
                   <p className="text-[10px] text-[#e0e5ea] font-mono">{result.fgs?.explanation || 'Automatic bounds verified.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* FGS Score Block */}
                  <div className="border border-[#1a2230] bg-[#0c1017] p-4 rounded flex flex-col items-center justify-center">
                    <span className="text-[9px] tracking-widest text-[#6B7A90] mb-2">FGS SCORE</span>
                    <span className="text-3xl font-black text-white glow-text">{result.fgs?.score?.toFixed(2) || '0.00'}</span>
                  </div>

                  {/* Blast Radius Block */}
                  <div className="border border-[#1a2230] bg-[#0c1017] p-4 rounded flex flex-col items-center justify-center">
                    <span className="text-[9px] tracking-widest text-[#6B7A90] mb-2">BLAST RADIUS</span>
                    <span className="text-3xl font-black text-[#ffb48f] drop-shadow-[0_0_8px_rgba(255,180,143,0.5)]">{result.fgs?.blast_radius || 0}</span>
                  </div>
                </div>

                 {/* Change Magnitude Block */}
                 {result.change_magnitude && (
                   <div className="border border-[#1a2230] bg-[#0c1017] p-4 rounded">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] tracking-widest text-[#6B7A90]">CHANGE MAGNITUDE</span>
                       <span className="text-xl font-black text-[#00E5FF]">{result.change_magnitude?.magnitude?.toFixed(4) || '0.00'}</span>
                     </div>
                     <p className="text-[9px] text-[#e0e5ea] font-mono">{result.change_magnitude?.summary}</p>
                   </div>
                 )}

                 {/* Skills Telemetry */}
                 {result.skills_findings && result.skills_findings.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] tracking-widest text-[#6B7A90] mb-1">SKILL PROCESSORS</span>
                      {result.skills_findings.map((skill: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 border border-[#16202e] bg-[#080d12] rounded">
                          <div className="flex items-center gap-2">
                            <Crosshair className="w-3 h-3 text-[#00E5FF]" />
                            <span className="text-[10px] text-white font-mono">{skill.skill}</span>
                          </div>
                          {skill.result?.error ? (
                             <span className="text-[9px] text-[#ff5b5b] font-bold tracking-widest">FAIL</span>
                          ) : (
                             <span className="text-[9px] text-[#39ff14] font-bold tracking-widest">OK</span>
                          )}
                        </div>
                      ))}
                    </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
