'use client';

import React, { useState } from 'react';
import { evaluateSentinel } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Play, Crosshair, Cpu, ShieldAlert, CheckCircle } from 'lucide-react';

export default function EvaluatePage() {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!jsonInput.trim()) {
      setError('Awaiting payload data injection...');
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (e) {
      setError('INTEGRITY_VIOLATION: Invalid JSON syntax detected.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await evaluateSentinel(parsed);
      setResult(Array.isArray(res) ? res[0] : res);
    } catch (err: any) {
      setError(err.message || 'ENGINE_FAULT: RPC connection refused.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const isPass = !result?.fgs?.is_blocked ?? true;

  return (
    <div className="p-8 h-full flex flex-col relative grid grid-cols-12 gap-8">
      <div className="col-span-12 mb-2 z-10">
        <h1 className="text-2xl font-black tracking-[0.3em] text-[#00E5FF] glow-text uppercase italic">Sentinel Evaluator</h1>
        <p className="text-[10px] text-[#6B7A90] font-mono mt-1 font-bold tracking-widest uppercase opacity-60">High-Velocity Governance Payload Injection</p>
      </div>

      {/* Input Col */}
      <div className="col-span-12 lg:col-span-6 flex flex-col gap-6 h-full">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="panel-border rounded-xl flex flex-col p-6 h-full bg-[#0d1219]/60 backdrop-blur-2xl relative shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black tracking-widest text-[#6B7A90] uppercase flex items-center gap-3">
              <Cpu className="w-3.5 h-3.5 text-[#00E5FF]" />
              Payload Buffer
            </h3>
            <span className="px-2 py-0.5 rounded border border-[#00E5FF]/30 text-[9px] text-[#00E5FF] font-black italic tracking-widest">MTU_SYNC</span>
          </div>
          
          <textarea
            className="w-full flex-1 bg-black/40 border border-[#16202e] rounded-lg p-5 font-mono text-xs text-[#00f0ff] focus:outline-none focus:border-[#00E5FF] transition-all resize-none mb-6 shadow-inner custom-scrollbar"
            placeholder='{ "metadata": { "TABLE_ID": { "COL": { "description": "...", "tags": ["PII"] } } } }'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            spellCheck={false}
          />
          
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0, 240, 255, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            className="neon-btn w-full flex items-center justify-center gap-3 py-4 rounded-xl text-[11px] font-black tracking-[0.4em] text-[#00E5FF] border border-[#00E5FF]/40 bg-[#00E5FF]/5 uppercase disabled:opacity-30"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#00E5FF]" /> : <Play className="w-4 h-4 fill-[#00e5ff]" />}
            {loading ? 'CALCULATING_MATRIX...' : 'EXECUTE_OPTIMIZATION'}
          </motion.button>
          
          {error && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mt-4 text-[#ff5b5b] text-[10px] font-black border border-[#ff5b5b]/30 bg-[#ff5b5b]/10 p-3 rounded-lg italic tracking-widest"
            >
              ⚠ {error}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Output Col */}
      <div className="col-span-12 lg:col-span-6 flex flex-col h-full">
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="panel-border rounded-xl flex flex-col p-6 h-full bg-[#0d1219]/60 backdrop-blur-2xl relative shadow-2xl border-[#1a2230]"
        >
          <h3 className="text-[10px] font-black tracking-widest text-[#6B7A90] mb-8 uppercase flex items-center gap-3">
            <ShieldAlert className="w-3.5 h-3.5 text-[#00E5FF]" />
            Extraction Telemetry
          </h3>
          
          <AnimatePresence mode="wait">
            {!result && !loading ? (
              <motion.div 
                key="await"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 border border-dashed border-[#1a2230] bg-black/20 rounded-xl flex flex-col items-center justify-center text-[#4A5568] text-[10px] font-mono font-bold italic"
              >
                 <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
                    AWAITING_PAYLOAD_INJECTION...
                 </motion.div>
              </motion.div>
            ) : null}

            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 bg-black/20 rounded-xl flex flex-col items-center justify-center text-[#00E5FF]"
              >
                <div className="relative w-20 h-20 mb-6">
                   <Loader2 className="w-full h-full animate-spin opacity-20" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-[#00E5FF] rounded-full animate-ping" />
                   </div>
                </div>
                <span className="text-[10px] font-black tracking-[0.4em] animate-pulse italic">SYNCING_SECURITY_MANIFESTS...</span>
              </motion.div>
            ) : null}

            {result && !loading ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 h-full overflow-y-auto pr-3 custom-scrollbar"
              >
                {/* Result Verdict Card */}
                <div className={`p-6 border-l-4 rounded-xl bg-gradient-to-r relative overflow-hidden ${isPass ? 'from-[#39ff14]/10 to-transparent border-[#39ff14]/60' : 'from-[#ff5b5b]/10 to-transparent border-[#ff5b5b]/60'}`}>
                   <div className="absolute top-0 right-0 p-2 opacity-20">
                      {isPass ? <CheckCircle className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
                   </div>
                   <h4 className={`text-2xl font-black tracking-[0.4em] mb-2 italic ${isPass ? 'text-[#39ff14] glow-text' : 'text-[#ff5b5b] glow-text'}`}>
                     {isPass ? 'VERDICT: PASS' : 'VERDICT: BLOCK'}
                   </h4>
                   <p className="text-[11px] text-[#e0e5ea] font-mono font-bold leading-relaxed">{result.fgs?.explanation || 'Automatic policy compliance verified through Genesis Core.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="border border-[#1a2230] bg-black/40 p-5 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#00E5FF]/40 transition-all">
                    <span className="text-[9px] font-black tracking-[0.2em] text-[#6B7A90] mb-3 uppercase italic opacity-60">Genesis Score</span>
                    <span className="text-4xl font-black text-white glow-text italic transition-transform group-hover:scale-110">{result.fgs?.score?.toFixed(2) || '0.00'}</span>
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00E5FF]/20" />
                  </div>

                  <div className="border border-[#1a2230] bg-black/40 p-5 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#ffb48f]/40 transition-all">
                    <span className="text-[9px] font-black tracking-[0.2em] text-[#6B7A90] mb-3 uppercase italic opacity-60">Spectral Blast</span>
                    <span className="text-4xl font-black text-[#ffb48f] drop-shadow-[0_0_15px_rgba(255,180,143,0.3)] italic transition-transform group-hover:scale-110">{result.fgs?.blast_radius || 0}</span>
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ffb48f]/20" />
                  </div>
                </div>

                 {/* Detailed Processors */}
                 {result.skills_findings && result.skills_findings.length > 0 && (
                    <div className="flex flex-col gap-3 mt-2">
                      <span className="text-[10px] font-black tracking-[0.3em] text-[#6B7A90] mb-2 uppercase opacity-60">Engine Sub-Processors</span>
                      {result.skills_findings.map((skill: any, idx: number) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={idx} 
                          className="flex items-center justify-between p-4 border border-[#16202e] bg-black/40 rounded-xl hover:bg-white/5 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <Crosshair className={`w-4 h-4 transition-all ${skill.result?.error ? 'text-[#ff5b5b]' : 'text-[#00E5FF] group-hover:rotate-90'}`} />
                            <span className="text-[11px] text-white font-mono font-bold tracking-tight">{skill.skill.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`text-[9px] font-black tracking-widest italic ${skill.result?.error ? 'text-[#ff5b5b]' : 'text-[#39ff14]'}`}>
                               {skill.result?.error ? 'FAULT' : 'ACTIVE'}
                            </div>
                            <div className={`w-1.5 h-1.5 rounded-full ${skill.result?.error ? 'bg-[#ff5b5b] shadow-[0_0_5px_#ff5b5b]' : 'bg-[#39ff14] shadow-[0_0_5px_#39ff14]'}`} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                 )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
