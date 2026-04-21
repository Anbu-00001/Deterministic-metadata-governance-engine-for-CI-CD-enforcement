'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHephaestus, api } from '../store/HephaestusContext';
import { 
  Loader2, Zap, ArrowRight, ShieldCheck, Info, Activity, Database, GitBranch, BrainCircuit, LineChart, AlertTriangle, Clock, CheckCircle2, ChevronRight
} from 'lucide-react';
import { FgsGauge3D } from '../components/FgsGauge3D';
import { BlastRadius3D } from '../components/BlastRadius3D';

type ExecStatus = 
  | 'idle' 
  | 'loading_metadata' 
  | 'analyzing_schema' 
  | 'computing_blast' 
  | 'calculating_fgs' 
  | 'applying_policy' 
  | 'generating_ai' 
  | 'completed';

const TypewriterText = ({ text, delay = 0 }: { text: string, delay?: number }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let index = 0;
    let t: any;
    const startObj = setTimeout(() => {
      t = setInterval(() => {
         setDisplayed(text.substring(0, index));
         index++;
         if (index > text.length) clearInterval(t);
      }, 10);
    }, delay * 1000);
    return () => { clearTimeout(startObj); clearInterval(t); };
  }, [text, delay]);
  return <span>{displayed}</span>;
};

export default function Dashboard() {
  const { state, dispatch } = useHephaestus();
  const resultsRef = useRef<HTMLDivElement>(null);
  const currentRequestId = useRef(0);

  const [execStatus, setExecStatus] = useState<ExecStatus>('idle');
  const [execLogs, setExecLogs] = useState<{ id: number; msg: string; type: 'info' | 'success' | 'warn' }[]>([]);
  const [delayedResult, setDelayedResult] = useState<any>(null);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn') => {
    setExecLogs(prev => [...prev, { id: Date.now() + Math.random(), msg, type }]);
  };

  const handleAnalyze = async () => {
    const id = ++currentRequestId.current;
    
    dispatch({ type: 'EVALUATE_START' });
    setExecStatus('loading_metadata');
    setExecLogs([]);
    setDelayedResult(null);

    try {
      const payload = {
        metadata: {
          "production.core.users": {
            "id": { "tier": 1, "description": "Primary key", "tags": ["key"] },
            "email": { "tier": 2, "description": "User email address", "tags": ["pii"] },
            "status": { "tier": 3, "description": "Account status", "tags": [] }
          }
        },
        lineage: {
            "production.core.users": ["warehouse.analytics.daily_active_users", "downstream.marketing.campaigns"],
            "downstream.marketing.campaigns": ["external.crm.sync"]
        },
        schema_change: { "added_columns": 1, "removed_columns": 0, "modified_columns": 1, "total_columns_before": 2 },
        volume_change: { "changed_rows": 5000, "total_rows": 100000 }
      };

      // Real backend computation happens here
      const result = await api.evaluate(payload);
      
      if (id !== currentRequestId.current) return;
      
      // Delay to show UX stages instead of faking computation
      addLog("Metadata loaded", "success");
      await new Promise(r => setTimeout(r, 600));

      if (id !== currentRequestId.current) return;
      setExecStatus('analyzing_schema');
      addLog("Schema analyzed", "success");
      await new Promise(r => setTimeout(r, 700));

      if (id !== currentRequestId.current) return;
      setExecStatus('computing_blast');
      addLog("Computing blast radius...", "info");
      await new Promise(r => setTimeout(r, 600));
      addLog("Blast radius computed", "success");

      if (id !== currentRequestId.current) return;
      setExecStatus('calculating_fgs');
      addLog("Calculating Governance Score...", "info");
      await new Promise(r => setTimeout(r, 800));
      addLog(`FGS Score calculated: ${result.fgs_score.toFixed(1)}`, "success");

      if (id !== currentRequestId.current) return;
      setExecStatus('applying_policy');
      addLog("Applying policies...", "info");
      await new Promise(r => setTimeout(r, 600));
      if (result.policy_triggered && result.policy_triggered.length > 0) {
        addLog("Policy triggered!", "warn");
      } else {
        addLog("Policies passed safely", "success");
      }

      if (id !== currentRequestId.current) return;
      setExecStatus('generating_ai');
      addLog("Generating AI Insights...", "info");
      await new Promise(r => setTimeout(r, 900));

      if (id !== currentRequestId.current) return;
      setExecStatus('completed');
      setDelayedResult(result);
      dispatch({ type: 'EVALUATE_SUCCESS', payload: result });
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (err: any) {
      if (id !== currentRequestId.current) return;
      setExecStatus('idle');
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

  const { result: contextResult, loading } = state;
  const result = delayedResult; // Use delayedResult for UI so we don't flash instantly

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
                <div className="flex flex-col flex-1 w-full p-4 relative justify-center items-center">
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.9 }} 
                     animate={{ opacity: 1, scale: 1 }} 
                     className="w-48 h-48 rounded-full border-[10px] border-[#00A3FF]/5 border-t-[#00A3FF] animate-spin shadow-[0_0_50px_rgba(0,163,255,0.1)] mb-6" 
                   />
                   <div className="flex flex-col items-center gap-2 mb-8">
                      <span className="text-[14px] font-bold text-[#00A3FF] tracking-[0.2em] uppercase h-6 overflow-hidden">
                        {execStatus === 'loading_metadata' && 'Loading Metadata...'}
                        {execStatus === 'analyzing_schema' && 'Analyzing Schema Changes...'}
                        {execStatus === 'computing_blast' && 'Computing Blast Radius...'}
                        {execStatus === 'calculating_fgs' && 'Calculating Governance Score...'}
                        {execStatus === 'applying_policy' && 'Applying Policies...'}
                        {execStatus === 'generating_ai' && 'Generating AI Insights...'}
                      </span>
                      {execStatus === 'analyzing_schema' && (
                        <motion.div className="h-1 w-48 bg-white/10 rounded overflow-hidden">
                          <motion.div className="h-full bg-[#00A3FF]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 0.7 }} />
                        </motion.div>
                      )}
                   </div>
                   
                   <div className="w-full max-w-sm bg-black/40 rounded border border-white/5 p-4 overflow-hidden h-32 flex flex-col justify-end">
                     <AnimatePresence>
                       {execLogs.map(log => (
                         <motion.div 
                          key={log.id} 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          className="flex items-center gap-2 mb-1.5"
                         >
                           {log.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                           {log.type === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />}
                           {log.type === 'info' && <ChevronRight className="w-3.5 h-3.5 text-[#00A3FF]" />}
                           <span className={`text-[11px] font-mono tracking-widest uppercase ${log.type === 'warn' ? 'text-[#EF4444]' : 'text-white/70'}`}>{log.msg}</span>
                         </motion.div>
                       ))}
                     </AnimatePresence>
                   </div>
                </div>
             ) : result ? (
               <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: 'spring' }}>
                 <FgsGauge3D score={result.fgs_score} />
               </motion.div>
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
                 <span className={`text-[20px] font-bold ${['APPROVE', 'ALLOW'].includes(result?.decision || '') ? 'text-[#10B981]' : ['REJECT', 'BLOCK'].includes(result?.decision || '') ? 'text-[#EF4444]' : result?.decision === 'WARN' ? 'text-[#F59E0B]' : 'text-[#8A949E]'}`}>
                    {result?.decision || "PENDING"}
                 </span>
              </div>
           </div>
        </div>

        {/* TOP RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
           
           {/* Decision Panel */}
           <div className="premium-card p-8 flex items-center justify-between min-h-[160px] bg-[#12171D]">
              <div className="flex flex-col gap-2 relative h-[100px] justify-center">
                 <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#64707D] absolute top-[-10px] left-0">Verdict Engine</h3>
                 {loading ? (
                    <div className="h-12 w-48 bg-white/5 animate-pulse rounded-lg mt-2" />
                 ) : result ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      transition={{ duration: 0.5, type: 'spring' }}
                      className="flex items-baseline gap-4 mt-2"
                    >
                       <span className={`text-[42px] font-black tracking-tighter drop-shadow-2xl ${['APPROVE', 'ALLOW'].includes(result.decision || '') ? 'text-[#10B981]' : ['REJECT', 'BLOCK'].includes(result.decision || '') ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                         {result.decision}
                       </span>
                       {result.confidence_score !== undefined && (
                          <span className="text-[#8A949E] text-[12px] font-bold tracking-widest ml-2 bg-white/5 px-2 py-1 object-inline rounded border border-white/5">
                             CONFIDENCE {Math.round(result.confidence_score * 100)}%
                          </span>
                       )}
                    </motion.div>
                 ) : (
                    <span className="text-[24px] font-bold text-white/10 mt-2 uppercase tracking-tighter">Awaiting logic sweep</span>
                 )}
              </div>
              {result && !loading && (
                 <motion.div 
                   initial={{ x: 20, opacity: 0 }} 
                   animate={{ x: 0, opacity: 1 }} 
                   transition={{ delay: 0.3 }}
                   className="flex flex-col gap-3 max-w-[280px]"
                 >
                    <div className={`flex items-center gap-2 justify-end ${['APPROVE', 'ALLOW'].includes(result.decision || '') ? 'text-[#10B981]' : ['REJECT', 'BLOCK'].includes(result.decision || '') ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                       <ShieldCheck className="w-4 h-4" />
                       <span className="text-[10px] font-black tracking-widest">{['APPROVE', 'ALLOW'].includes(result.decision || '') ? 'SECURE_ENVIRONMENT_LOCKED' : ['REJECT', 'BLOCK'].includes(result.decision || '') ? 'HARD_BLOCK_ENFORCED' : 'MANUAL_REVIEW_ADVISED'}</span>
                    </div>
                    {result.policy_triggered && result.policy_triggered.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        transition={{ 
                          repeat: Infinity, 
                          repeatType: "reverse", 
                          duration: 2.5 
                        }} 
                        className="text-[9px] bg-red-500/10 text-red-400 p-2 rounded flex flex-col gap-1 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                      >
                        <span className="font-bold uppercase tracking-widest block border-b border-red-500/20 pb-1 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Policy Tripped
                        </span>
                        {result.policy_triggered.map((p: string, i: number) => <span key={i}>• {p}</span>)}
                      </motion.div>
                    )}
                 </motion.div>
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
                             <span className="text-white">{String(val)}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                             <motion.div
                               initial={{ width: 0 }}
                               animate={{ width: `${Number(val)}%` }}
                               className={`h-full ${Number(val) > 50 ? 'bg-[#EF4444]' : Number(val) > 30 ? 'bg-[#F59E0B]' : 'bg-[#00A3FF]'}`}
                             />
                          </div>
                       </div>
                    )) : (
                       <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-10">
                          <span className="text-[10px] font-black tracking-[0.3em] uppercase">No Risk Data</span>
                       </div>
                    )}
                 </div>
                 <div className="flex flex-col justify-between border-l border-white/5 pl-12 gap-8">
                    <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-[#64707D] uppercase tracking-widest">Blast Radius</span>
                       <span className="text-[42px] font-black text-white leading-none tabular-nums">{result ? result.blast_radius : "0"}</span>
                       <span className="text-[11px] text-[#8A949E] font-medium leading-relaxed">
                          {result?.blast_radius === 0 ? "No downstream impact detected." : "Potential nodes affected by this deployment."}
                       </span>
                    </div>
                    <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-[#64707D] uppercase tracking-widest">Diff Magnitude</span>
                       <span className="text-[42px] font-black text-white leading-none tabular-nums">{result ? result.change_magnitude : "0"}</span>
                       <span className="text-[11px] text-[#8A949E] font-medium leading-relaxed">
                          Schema and volume drift coefficient.
                       </span>
                    </div>
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
              {loading || execStatus !== 'completed' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm z-20">
                   <Loader2 className="w-8 h-8 animate-spin text-[#00A3FF]" />
                   <span className="text-[11px] font-black tracking-[0.3em] uppercase animate-pulse">Resolving Lineage...</span>
                </div>
              ) : result ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="h-full">
                  <BlastRadius3D data={result.lineage_graph} />
                </motion.div>
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
           <div className="flex items-center gap-3 mb-6">
              <Zap className="w-4 h-4 text-[#F59E0B]" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">AI Insights & Suggestions</h3>
           </div>
           
           <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide">
              {loading ? [1,2,3].map(i => (
                <div key={i} className="h-24 w-full bg-white/3 animate-pulse rounded-xl border border-white/5" />
              )) :
               result?.ai_insight ? (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   transition={{ duration: 0.6 }}
                   className="flex flex-col gap-4"
                 >
                    {/* Explanation Tree & Reasoning Combined */}
                    {(result.ai_insight.explanation_tree && result.ai_insight.explanation_tree.length > 0) || (result.reasoning_chain && result.reasoning_chain.length > 0) ? (
                      <div className="p-4 rounded border border-white/5 bg-[#F59E0B]/5">
                         <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest mb-2 flex items-center gap-2"><BrainCircuit className="w-3 h-3"/> Explainability & Reasoning</span>
                         <ul className="list-none flex flex-col gap-2 relative">
                           {result.ai_insight?.explanation_tree?.map((exp: string, i: number) => (
                             <li key={`exp-${i}`} className="text-[12px] text-white flex gap-2">
                               <span className="text-[#F59E0B] opacity-50 mt-0.5">↳</span> <span className="opacity-90"><TypewriterText text={exp} delay={i * 0.3} /></span>
                             </li>
                           ))}
                           {result.reasoning_chain?.map((exp: string, i: number) => (
                             <li key={`res-${i}`} className="text-[12px] text-white flex gap-2">
                               <span className="text-[#00A3FF] opacity-50 mt-0.5">❖</span> <span className="opacity-90 font-bold"><TypewriterText text={exp} delay={i * 0.3 + 1} /></span>
                             </li>
                           ))}
                         </ul>
                      </div>
                    ) : null}
                    
                    {/* Simulated Improvement */}
                    {result.simulation && result.simulation.delta > 0 && (
                      <div className="p-4 rounded border border-[#10B981]/20 bg-[#10B981]/5 mt-4">
                        <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest mb-2 flex items-center gap-2"><LineChart className="w-3 h-3"/> Projected Impact</span>
                        <div className="flex items-end gap-2">
                          <span className="text-[24px] font-bold text-white">{result.simulation.current_fgs} → {result.simulation.projected_fgs}</span>
                          <span className="text-[14px] text-[#10B981] mb-1 font-bold">(+{result.simulation.delta})</span>
                        </div>
                        <p className="text-[10px] text-[#10B981]/70 mt-1 uppercase tracking-widest">Risk reduction: {result.simulation.risk_reduction}</p>
                      </div>
                    )}
                    
                    {/* Risk Prediction Card */}
                    {result.predicted_risk && (
                      <div className={`p-4 rounded border mt-4 ${result.predicted_risk.predicted_risk === 'high' ? 'border-red-500/20 bg-red-500/5' : result.predicted_risk.predicted_risk === 'medium' ? 'border-orange-500/20 bg-orange-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}>
                         <span className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${result.predicted_risk.predicted_risk === 'high' ? 'text-red-400' : result.predicted_risk.predicted_risk === 'medium' ? 'text-orange-400' : 'text-blue-400'}`}>
                           <AlertTriangle className="w-3 h-3"/> Prior Risk Forecast
                         </span>
                         <div className="flex gap-4 items-center">
                           <span className="text-[24px] font-bold text-white tracking-widest uppercase">{result.predicted_risk.predicted_risk}</span>
                           <span className="text-[12px] opacity-70">Conf: {Math.round(result.predicted_risk.confidence * 100)}%</span>
                         </div>
                         <p className="text-[11px] opacity-60 mt-1">{result.predicted_risk.reason}</p>
                      </div>
                    )}

                    {/* Historical Patterns Panel */}
                    {result.historical_patterns && result.historical_patterns.length > 0 && (
                      <div className="p-4 rounded border border-white/5 bg-black/40 mt-4">
                         <span className="text-[10px] font-black text-[#00A3FF] uppercase tracking-widest mb-3 flex items-center gap-2"><Clock className="w-3 h-3"/> Historical Patterns</span>
                         <div className="flex flex-col gap-2">
                           {result.historical_patterns.map((p: any, idx: number) => (
                             <div key={idx} className="flex gap-2 items-center bg-white/5 p-2 rounded">
                               <div className={`w-2 h-2 rounded-full ${p.risk_level === 'high' ? 'bg-red-500' : p.risk_level === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                               <span className="text-[11px] text-white/90 flex-1">{p.pattern}</span>
                               <span className="text-[10px] text-white/50 bg-black/50 px-2 py-0.5 rounded">Freq: {p.frequency}</span>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}
                    
                    {/* Actionable Suggestions */}
                    {result.suggestions && result.suggestions.length > 0 && (
                      <div className="p-4 rounded border border-white/5 bg-black/40 mt-4">
                         <span className="text-[10px] font-black text-[#00A3FF] uppercase tracking-widest mb-3 flex items-center gap-2"><Zap className="w-3 h-3"/> Suggested Actions</span>
                         <div className="flex flex-col gap-3">
                           {result.suggestions.map((s: any, idx: number) => (
                             <div key={idx} className="flex gap-3">
                               <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ${s.severity === 'high' ? 'bg-red-500' : s.severity === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                               <div className="flex flex-col gap-1">
                                 <span className="text-[12px] font-bold text-white">{s.title}</span>
                                 <span className="text-[11px] text-white/70">{s.action}</span>
                                 <span className="text-[10px] text-white/40 italic">{s.expected_impact}</span>
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}
                    
                    {/* Risks */}
                    {result.ai_insight.risks?.length > 0 && (
                      <div className="p-4 rounded border border-white/5 bg-black/40">
                         <span className="text-[10px] font-black text-[#EF4444] uppercase tracking-widest mb-2 block">Identified Risks</span>
                         <ul className="list-none flex flex-col gap-2">
                           {result.ai_insight.risks.map((risk: string, i: number) => (
                             <li key={i} className="text-[12px] text-white/80 flex gap-2"><span className="text-[#EF4444]">•</span> {risk}</li>
                           ))}
                         </ul>
                      </div>
                    )}

                    {/* Suggestions */}
                    {result.ai_insight.suggestions?.length > 0 && (
                      <div className="p-4 rounded border border-white/5 bg-[#10B981]/5">
                         <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest mb-2 block">Actionable Fixes</span>
                         <ul className="list-none flex flex-col gap-2 relative">
                           {result.ai_insight.suggestions.map((sug: string, i: number) => (
                             <li key={i} className="text-[12px] text-white flex gap-2"><span className="text-[#10B981]">→</span> {sug}</li>
                           ))}
                         </ul>
                      </div>
                    )}
                 </motion.div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center opacity-10 gap-4">
                    <Info className="w-10 h-10" />
                    <span className="text-[10px] font-black text-center tracking-[0.3em] uppercase">No AI Insight<br/>Available</span>
                 </div>
               )}
           </div>
        </div>

      </div>

    </div>
  );
}
