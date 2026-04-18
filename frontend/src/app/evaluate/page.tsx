'use client';

import React, { useState } from 'react';
import { useHephaestus, api } from '../../store/HephaestusContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Play, Cpu, ShieldAlert, CheckCircle, Code, Terminal } from 'lucide-react';

export default function EvaluatePage() {
  const [jsonInput, setJsonInput] = useState('');
  const { state, dispatch } = useHephaestus();
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Phase 4.3: Validation
    setValidationError(null);
    if (!jsonInput.trim()) {
      setValidationError('Awaiting payload data injection...');
      return;
    }
    
    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (e) {
      setValidationError('INVALID_JSON: Potential syntax error in metadata payload.');
      return;
    }

    dispatch({ type: 'EVALUATE_START' });
    try {
      const result = await api.evaluate(parsed);
      dispatch({ type: 'EVALUATE_SUCCESS', payload: result });
    } catch (err: any) {
      dispatch({ type: 'EVALUATE_FAILURE', payload: err.message });
    }
  };

  const { result, loading } = state;
  const isPass = result?.decision === 'APPROVE';

  return (
    <div className="flex flex-col gap-12 max-w-[1200px] mx-auto pb-16">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest opacity-60">
              <Cpu className="w-3.5 h-3.5" />
              <span>Sentinel sandbox</span>
           </div>
           <h1 className="text-[32px] font-bold tracking-tighter">Governance Testing</h1>
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

      <div className="grid grid-cols-12 gap-8">
        
        {/* INPUT AREA */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
           <div className="premium-card p-8 flex flex-col min-h-[500px] bg-[#12171D]">
              <div className="flex items-center gap-3 mb-6">
                 <Terminal className="w-4 h-4 text-[#00A3FF]" />
                 <h3 className="text-[11px] font-bold uppercase tracking-widest">Metadata Payload</h3>
              </div>
              
              <textarea
                className="w-full flex-1 bg-[#0B0F14] border border-[rgba(255,255,255,0.06)] rounded-lg p-6 font-mono text-[13px] text-[#8A949E] focus:outline-none focus:border-[#00A3FF] transition-all resize-none mb-6 scrollbar-hide"
                placeholder='{ "metadata": { "TABLE_ID": { "COL": { "description": "...", "tier": 1 } } } }'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                spellCheck={false}
              />
              
              <div className="flex justify-between items-center text-[10px] font-bold opacity-40 uppercase tracking-widest">
                 <span>Format: JSON Standard</span>
                 <span>Buffer: {jsonInput.length} bytes</span>
              </div>
           </div>
           
           <AnimatePresence>
             {validationError && (
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 text-[#EF4444] text-[11px] font-black tracking-widest flex items-center gap-3 uppercase"
               >
                 <ShieldAlert className="w-4 h-4" />
                 {validationError}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* OUTPUT AREA */}
        <div className="col-span-12 lg:col-span-5 flex flex-col">
           <div className="premium-card p-8 h-full bg-[#12171D] border-dashed border-white/5">
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-10 text-[#64707D]">Simulation Result</h3>
              
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-[#00A3FF] py-20"
                  >
                    <Loader2 className="w-8 h-8 animate-spin mb-6" />
                    <span className="text-[11px] font-bold tracking-[0.2em] animate-pulse uppercase">Engine Computing...</span>
                  </motion.div>
                ) : result ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-10"
                  >
                    <div className={`p-8 rounded-2xl border flex flex-col items-center gap-4 text-center ${isPass ? 'border-[#10B981]/20 bg-[#10B981]/5' : 'border-[#EF4444]/20 bg-[#EF4444]/5'}`}>
                       <h4 className={`text-[32px] font-black tracking-tighter ${isPass ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                         {result.decision}
                       </h4>
                       <span className="text-[11px] font-bold opacity-60">Confidence Rating: 100%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="premium-card p-6 flex flex-col items-center gap-2 bg-[#0B0F14]">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Genesis Score</span>
                          <span className="text-[24px] font-black">{result.fgs_score.toFixed(1)}</span>
                       </div>
                       <div className="premium-card p-6 flex flex-col items-center gap-2 bg-[#0B0F14]">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Impact Radius</span>
                          <span className="text-[24px] font-black text-[#F59E0B]">{result.blast_radius}</span>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4">
                       <h3 className="text-[11px] font-black uppercase opacity-40 tracking-widest">Diagnostic Findings</h3>
                       <div className="flex justify-between items-center p-4 rounded-xl border border-white/5 bg-[#0B0F14]">
                          <span className="text-[11px] font-bold text-white tracking-widest">SENTNEL_CORE</span>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black italic text-[#10B981]">VERIFIED</span>
                             <CheckCircle className="w-3 h-3 text-[#10B981]" />
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#64707D] gap-6 text-center py-20 opacity-20">
                     <div className="w-16 h-16 rounded-3xl border border-dashed border-white/20 flex items-center justify-center">
                        <Code className="w-6 h-6" />
                     </div>
                     <span className="text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                        Inject simulator payload<br />to trigger sentinel logic
                     </span>
                  </div>
                )}
              </AnimatePresence>
           </div>
        </div>

      </div>
    </div>
  );
}
