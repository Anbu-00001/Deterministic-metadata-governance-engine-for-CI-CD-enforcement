'use client';

import React, { useState } from 'react';
import { evaluateSentinel } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Play, Cpu, ShieldAlert, CheckCircle, Code } from 'lucide-react';

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
      setError('INVALID_JSON: Potential syntax error in metadata payload.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await evaluateSentinel(parsed);
      setResult(Array.isArray(res) ? res[0] : res);
    } catch (err: any) {
      setError(err.message || 'ENGINE_FAULT: RPC transport level error.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const isPass = !result?.fgs?.is_blocked ?? true;

  return (
    <div className="flex flex-col gap-12 max-w-[1200px] mx-auto pb-16">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3 text-metadata uppercase tracking-widest opacity-60">
              <Cpu className="w-3.5 h-3.5" />
              <span>Sentinel sandbox</span>
           </div>
           <h1>Governance Testing</h1>
        </div>
        <button 
           className="btn-primary flex items-center gap-2"
           onClick={handleSubmit}
           disabled={loading}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
          Run Simulation
        </button>
      </div>

      <div className="grid grid-cols-12 gap-lg">
        
        {/* INPUT AREA */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
           <div className="premium-card p-lg flex flex-col min-h-[500px] bg-[#12171D]">
              <div className="flex items-center gap-3 mb-6">
                 <Code className="w-4 h-4 text-[#00A3FF]" />
                 <h3 className="text-xs">Metadata Payload</h3>
              </div>
              
              <textarea
                className="w-full flex-1 bg-[#0B0F14] border border-[rgba(255,255,255,0.06)] rounded-lg p-6 font-mono text-[13px] text-[#8A949E] focus:outline-none focus:border-[#00A3FF] transition-all resize-none mb-6 scrollbar-hide"
                placeholder='{ "metadata": { "TABLE_ID": { "COL": { "description": "...", "tags": ["PII"] } } } }'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                spellCheck={false}
              />
              
              <div className="flex justify-between items-center text-metadata opacity-40">
                 <span>Format: JSON Standard</span>
                 <span>Buffer Size: {jsonInput.length} bytes</span>
              </div>
           </div>
           
           {error && (
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 text-[#EF4444] text-metadata font-bold tracking-wide flex items-center gap-3"
             >
               <ShieldAlert className="w-4 h-4" />
               {error}
             </motion.div>
           )}
        </div>

        {/* OUTPUT AREA */}
        <div className="col-span-12 lg:col-span-5 flex flex-col">
           <div className="premium-card p-lg h-full bg-[#12171D] border-dashed">
              <h3 className="text-xs mb-10">Analysis Result</h3>
              
              <AnimatePresence mode="wait">
                {!result && !loading ? (
                  <motion.div 
                    key="await"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-[#64707D] gap-6 text-center py-20"
                  >
                     <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] flex items-center justify-center">
                        <Play className="w-6 h-6 opacity-20" />
                     </div>
                     <span className="text-metadata uppercase tracking-widest leading-relaxed">
                        Input metadata payload<br />to trigger evaluation
                     </span>
                  </motion.div>
                ) : null}

                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-[#00A3FF] py-20"
                  >
                    <Loader2 className="w-8 h-8 animate-spin mb-6" />
                    <span className="text-metadata font-bold tracking-[0.2em] animate-pulse">Synchronizing logic...</span>
                  </motion.div>
                ) : null}

                {result && !loading ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-10"
                  >
                    <div className={`p-8 rounded-2xl border flex flex-col items-center gap-4 text-center ${isPass ? 'border-[#10B981]/20 bg-[#10B981]/5' : 'border-[#EF4444]/20 bg-[#EF4444]/5'}`}>
                       <h4 className={`text-[32px] font-black tracking-tighter ${isPass ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                         {isPass ? 'POLICY PASSED' : 'POLICY BLOCKED'}
                       </h4>
                       <p className="text-body max-w-[280px]">
                         {result.fgs?.explanation || 'Sentinel verified policy enforcement criteria successfully.'}
                       </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="premium-card p-md flex flex-col items-center gap-2 bg-[#0B0F14]">
                          <span className="text-metadata uppercase opacity-40">Genesis score</span>
                          <span className="text-[24px] font-bold">{result.fgs?.score?.toFixed(1) || '0.0'}</span>
                       </div>
                       <div className="premium-card p-md flex flex-col items-center gap-2 bg-[#0B0F14]">
                          <span className="text-metadata uppercase opacity-40">Downstream Impact</span>
                          <span className="text-[24px] font-bold text-[#F59E0B]">{result.fgs?.blast_radius || 0}</span>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4">
                       <h3 className="text-xs uppercase opacity-40">Processor findings</h3>
                       {result.skills_findings?.map((skill: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[#0B0F14]">
                             <span className="text-metadata font-bold tracking-tight text-white">{skill.skill.toUpperCase()}</span>
                             <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black italic ${skill.result?.error ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                                   {skill.result?.error ? 'FAILED' : 'VERIFIED'}
                                </span>
                                <CheckCircle className={`w-3 h-3 ${skill.result?.error ? 'text-[#EF4444]' : 'text-[#10B981]'}`} />
                             </div>
                          </div>
                       ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
           </div>
        </div>

      </div>
    </div>
  );
}
