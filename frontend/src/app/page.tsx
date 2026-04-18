'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHephaestus, api } from '../store/HephaestusContext';
import { 
  Loader2, Zap, ArrowRight, ShieldCheck, Info, Activity, Database, GitBranch
} from 'lucide-react';
import { FgsGauge3D } from '../components/FgsGauge3D';
import { BlastRadius3D } from '../components/BlastRadius3D';

export default function Dashboard() {
  const { state, dispatch } = useHephaestus();
  const resultsRef = useRef<HTMLDivElement>(null);
  const currentRequestId = useRef(0);

  const handleAnalyze = async () => {
    // Phase 4: Primary Flow + Phase 9 Stale Request Guard
    const id = ++currentRequestId.current;
    
    dispatch({ type: 'EVALUATE_START' });
    try {
      const result = await api.evaluate({});
      
      if (id !== currentRequestId.current) return;
      
      dispatch({ type: 'EVALUATE_SUCCESS', payload: result });
      
      // Auto-scroll to results section (Phase 4)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (err: any) {
      if (id !== currentRequestId.current) return;
      dispatch({ type: 'EVALUATE_FAILURE', payload: err.message });
    }
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    dispatch({ type: 'OPTIMIZE_START' });
    try {
       const res = await api.optimize({ suggestion_id: suggestionId });
       dispatch({ type: 'OPTIMIZE_SUCCESS', payload: res });
       alert(`Applied optimization: ${res.message}`);
    } catch (err: any) {
       dispatch({ type: 'OPTIMIZE_FAILURE', payload: err.message });
    }
  };

  const { result, loading } = state;

  return (
    <div className="flex flex-col gap-12 max-w-[1400px] mx-auto pb-16">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest opacity-60">
              <Activity className="w-3.5 h-3.5" />
              <span>Pipeline Intelligence</span>
           </div>
           <h1 className="text-[32px] font-bold tracking-tighter">Infrastructure Overview</h1>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn-primary" 
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run Engine Audit"}
          </button>
        </div>
      </div>

      {/* TOP ROW: Metric Cards */}
      <div className="grid grid-cols-12 gap-6" ref={resultsRef}>
        
        {/* CENTERPIECE: Governance Score */}
        <div className="col-span-12 lg:col-span-5 premium-card p-8 min-h-[480px] flex flex-col items-center justify-center relative overflow-hidden bg-[#12171D]">
           <div className="absolute top-6 left-6 flex items-center gap-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#64707D]">Governance Health</h3>
              <Info className="w-3.5 h-3.5 text-[#64707D] cursor-help" />
           </div>
           
           <div className="w-full flex-1 flex flex-col items-center justify-center">
             {loading ? (
                <div className="flex flex-col items-center gap-6">
                   <div className="w-48 h-48 rounded-full border-[10px] border-[#00A3FF]/5 border-t-[#00A3FF] animate-spin shadow-[0_0_50px_rgba(0,163,255,0.1)]" />
                   <div className="flex flex-col items-center gap-1">
                      <span className="text-[13px] font-bold text-[#00A3FF] tracking-[0.2em] uppercase">Computing FGS</span>
                      <span className="text-[10px] text-[#64707D] animate-pulse">Scanning metadata clusters...</span>
                   </div>
                </div>
             ) : result ? (
               <FgsGauge3D score={result.fgs_score} />
             ) : (
               <div className="flex flex-col items-center text-center gap-4 opacity-30">
                  <Database className="w-12 h-12" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Source Telemetry Required</span>
               </div>
             )}
           </div>

           <div className="w-full grid grid-cols-2 border-t border-[rgba(255,255,255,0.06)] pt-8 mt-4">
              <div className="flex flex-col items-center border-r border-[rgba(255,255,255,0.06)]">
                 <span className="text-[10px] font-bold tracking-[0.2em] text-[#64707D] uppercase mb-1">SCORE</span>
                 <span className="text-[24px] font-black text-white">{result ? result.fgs_score.toFixed(1) : "—"}</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-[10px] font-bold tracking-[0.2em] text-[#64707D] uppercase mb-1">DECISION</span>
                 <span className={`text-[20px] font-bold ${result?.decision === 'APPROVE' ? 'text-[#10B981]' : result?.decision === 'REJECT' ? 'text-[#EF4444]' : 'text-[#8A949E]'}`}>
                    {result?.decision || "PENDING"}
                 </span>
              </div>
           </div>
        </div>

        {/* TOP RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
           
           {/* Decision Panel */}
           <div className="premium-card p-8 flex items-center justify-between min-h-[160px] bg-[#12171D]">
              <div className="flex flex-col gap-2">
                 <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#64707D]">Verdict Engine</h3>
                 {loading ? (
                    <div className="h-12 w-48 bg-white/5 animate-pulse rounded-lg" />
                 ) : result ? (
                    <div className="flex items-baseline gap-4 mt-2">
                       <span className={`text-[42px] font-black tracking-tighter ${result.decision === 'APPROVE' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                         {result.decision}
                       </span>
                    </div>
                 ) : (
                    <span className="text-[24px] font-bold text-white/10 mt-2 uppercase tracking-tighter">Awaiting logic sweep</span>
                 )}
              </div>
              {result && !loading && (
                 <div className="flex flex-col gap-3 max-w-[280px]">
                    <div className="flex items-center gap-2 text-[#10B981] justify-end">
                       <ShieldCheck className="w-4 h-4" />
                       <span className="text-[10px] font-black tracking-widest">SECURE_ENVIRONMENT_LOCKED</span>
                    </div>
                 </div>
              )}
           </div>

           {/* Risk Breakdown Row */}
           <div className="premium-card p-8 flex flex-col flex-1 bg-[#12171D]">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#64707D] mb-8">Risk Vector Mapping</h3>
              <div className="grid grid-cols-2 gap-12">
                 <div className="flex flex-col gap-6">
                    {loading ? [1,2,3].map(i => (
                      <div key={i} className="flex flex-col gap-2">
                         <div className="h-2 w-full bg-white/5 animate-pulse rounded" />
                         <div className="h-1 w-1/2 bg-white/3 animate-pulse rounded" />
                      </div>
                    )) : 
                     result ? Object.entries(result.risk).map(([key, val]) => (
                       <div key={key} className="flex flex-col gap-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                             <span className="text-[#8A949E]">{key.replace(/_/g, ' ')}</span>
                             <span className="text-white">{val}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${val}%` }}
                               className={`h-full ${val > 50 ? 'bg-[#EF4444]' : val > 30 ? 'bg-[#F59E0B]' : 'bg-[#00A3FF]'}`}
                             />
                          </div>
                       </div>
                    )) : (
                       <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-10">
                          <span className="text-[10px] font-black tracking-[0.3em] uppercase">No Risk Data</span>
                       </div>
                    )}
                 </div>
                 <div className="flex flex-col justify-between border-l border-white/5 pl-12">
                    <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-[#64707D] uppercase tracking-widest">Blast Radius</span>
                       <span className="text-[42px] font-black text-white leading-none tabular-nums">{result ? result.blast_radius : "0"}</span>
                       <span className="text-[11px] text-[#8A949E] font-medium leading-relaxed">
                          {result?.blast_radius === 0 ? "No downstream impact detected." : "Potential nodes affected by this deployment."}
                       </span>
                    </div>
                    <button className="w-full btn-secondary text-[10px] font-black uppercase tracking-widest py-3">Audit Details</button>
                 </div>
              </div>
           </div>

        </div>
      </div>

      {/* SECOND ROW: Analysis & Lineage */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* LINEAGE TOPOLOGY */}
        <div className="col-span-12 lg:col-span-8 premium-card overflow-hidden h-[500px] flex flex-col relative bg-[#12171D]">
           <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#64707D]">Lineage Topology</h3>
              {loading && <div className="w-2 h-2 rounded-full bg-[#00A3FF] animate-ping" />}
           </div>
           
           <div className="flex-1 relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm z-20">
                   <Loader2 className="w-8 h-8 animate-spin text-[#00A3FF]" />
                   <span className="text-[11px] font-black tracking-[0.3em] uppercase animate-pulse">Resolving Lineage...</span>
                </div>
              ) : result ? (
                <BlastRadius3D data={result.lineage_graph} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02)_0%,_transparent_70%)]">
                   <GitBranch className="w-16 h-16 mb-4" />
                   <span className="text-[11px] font-black uppercase tracking-[0.3em]">Topology Offline</span>
                </div>
              )}
           </div>
        </div>

        {/* SUGGESTIONS */}
        <div className="col-span-12 lg:col-span-4 premium-card p-8 flex flex-col bg-gradient-to-br from-[#12171D] to-[#0B0F14]">
           <div className="flex items-center gap-3 mb-8">
              <Zap className="w-4 h-4 text-[#F59E0B]" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">Smart Suggestions</h3>
           </div>
           
           <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide">
              {loading ? [1,2,3].map(i => (
                <div key={i} className="h-32 w-full bg-white/3 animate-pulse rounded-xl border border-white/5" />
              )) :
               result?.suggestions?.length ? result.suggestions.map((item: any) => (
                 <div key={item.id} className="p-5 rounded-xl border border-white/5 bg-black/40 group hover:border-[#00A3FF]/40 transition-all flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${item.priority === 'HIGH' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                          {item.priority}
                       </span>
                       <span className="text-[11px] font-black text-[#10B981] tabular-nums">{item.estimated_impact}</span>
                    </div>
                    <h4 className="text-[14px] font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-[12px] text-[#8A949E] leading-relaxed mb-6 flex-1 opacity-80">{item.description}</p>
                    <button 
                      onClick={() => handleApplySuggestion(item.id)}
                      disabled={state.optimizationLoading}
                      className="w-full py-2.5 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] text-[10px] font-black uppercase tracking-widest hover:bg-[#00A3FF] hover:text-white transition-all disabled:opacity-20"
                    >
                      {state.optimizationLoading ? <RefreshCw className="w-3 h-3 animate-spin mx-auto" /> : "Apply Optimization"}
                    </button>
                 </div>
               )) : (
                 <div className="flex-1 flex flex-col items-center justify-center opacity-10 gap-4">
                    <Info className="w-10 h-10" />
                    <span className="text-[10px] font-black text-center tracking-[0.3em] uppercase">No Optimization<br/>Required</span>
                 </div>
               )}
           </div>
        </div>

      </div>

    </div>
  );
}
