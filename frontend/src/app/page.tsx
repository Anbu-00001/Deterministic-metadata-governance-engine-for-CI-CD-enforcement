'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertCircle, Expand, Activity, Loader2, Zap, ArrowRight, ShieldCheck, Info
} from 'lucide-react';

import { useGovernanceStore } from '../store/useGovernanceStore';
import { useMousePosition } from '../hooks/useMouse';
import { FgsGauge3D } from '../components/FgsGauge3D';
import { BlastRadius3D } from '../components/BlastRadius3D';
import { ChangeMagnitudeBars } from '../components/ChangeMagnitudeBars';

export default function Dashboard() {
  const { result, loading, error, runEvaluation, applyOptimization, optimizationPreview } = useGovernanceStore();
  const mouse = useMousePosition();

  useEffect(() => {
    if (!result) runEvaluation();
  }, []);

  const score = result?.fgs?.score || 0;
  const isPass = !result?.fgs?.is_blocked ?? true;
  const displayScore = optimizationPreview ? optimizationPreview.after : score;

  return (
    <div className="flex flex-col gap-12 max-w-[1400px] mx-auto pb-16">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3 text-metadata uppercase tracking-widest opacity-60">
              <Activity className="w-3.5 h-3.5" />
              <span>Pipeline Intelligence</span>
           </div>
           <h1>Infrastructure Overview</h1>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">Export Report</button>
          <button className="btn-primary" onClick={() => runEvaluation()}>Run Audit</button>
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0B0F14]/40 backdrop-blur-[2px] z-[100] flex items-center justify-center"
          >
             <div className="premium-card p-lg flex items-center gap-4 bg-[#12171D] border border-[rgba(255,255,255,0.1)]">
                <Loader2 className="w-5 h-5 text-[#00A3FF] animate-spin" />
                <span className="text-body font-medium">Running Governance Sentinel...</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP ROW: Metric Cards */}
      <div className="grid grid-cols-12 gap-lg">
        
        {/* CENTERPIECE: Governance Score */}
        <div className="col-span-12 lg:col-span-5 premium-card p-xl flex flex-col items-center justify-center relative overflow-hidden h-[480px]">
           <div className="absolute top-6 left-6 flex items-center gap-2">
              <h3 className="text-xs">Governance Health</h3>
              <Info className="w-3.5 h-3.5 text-[#64707D] cursor-help" />
           </div>
           
           <div className="w-full flex-1 flex items-center justify-center">
             <FgsGauge3D score={displayScore} />
           </div>

           <div className="w-full grid grid-cols-2 border-t border-[rgba(255,255,255,0.06)] pt-xl mt-4">
              <div className="flex flex-col items-center border-r border-[rgba(255,255,255,0.06)]">
                 <span className="text-metadata mb-1">DATA RELIABILITY</span>
                 <span className="text-[18px] font-semibold text-[#10B981]">99.98%</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-metadata mb-1">CHANGE VELOCITY</span>
                 <span className="text-[18px] font-semibold text-[#00A3FF]">+12.4%</span>
              </div>
           </div>
        </div>

        {/* TOP RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-lg">
           
           {/* Decision Panel */}
           <div className="premium-card p-lg flex items-center justify-between h-[160px]">
              <div className="flex flex-col gap-2">
                 <h3 className="text-xs">Verdict Output</h3>
                 <div className="flex items-baseline gap-4 mt-2">
                    <span className={`text-[42px] font-bold tracking-tighter ${isPass ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {isPass ? 'PASS' : 'BLOCK'}
                    </span>
                    <span className="text-body font-medium opacity-60 mb-2">Confidence: 92.4%</span>
                 </div>
              </div>
              <div className="flex flex-col gap-3 max-w-[280px]">
                 <p className="text-body text-right">
                   {result?.fgs?.explanation || 'Sentinel is monitoring current metadata estate deployments.'}
                 </p>
                 {isPass && (
                   <div className="flex items-center gap-2 text-[#10B981] justify-end">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[11px] font-bold tracking-wider">SECURE RELEASE VERIFIED</span>
                   </div>
                 )}
              </div>
           </div>

           {/* Risk & Change Magnitude Row */}
           <div className="grid grid-cols-2 gap-lg flex-1">
              <div className="premium-card p-lg flex flex-col">
                 <h3 className="text-xs mb-8">Risk Breakdown</h3>
                 <div className="flex flex-col gap-6">
                   {[
                     { name: 'Security Integrity', val: 20, color: '#00A3FF' },
                     { name: 'Resource Allocation', val: 60, color: '#F59E0B' },
                     { name: 'System Performance', val: 15, color: '#00A3FF' }
                   ].map(risk => (
                     <div key={risk.name} className="flex flex-col gap-2">
                        <div className="flex justify-between text-[11px] font-semibold">
                           <span className="text-[#8A949E] uppercase tracking-wider">{risk.name}</span>
                           <span className="text-[#64707D]">{risk.val}%</span>
                        </div>
                        <div className="w-full h-1 bg-[rgba(255,255,255,0.03)] rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                               animate={{ width: `${risk.val}%` }}
                               className="h-full rounded-full"
                               style={{ backgroundColor: risk.color }}
                           />
                        </div>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="premium-card p-lg flex flex-col">
                 <h3 className="text-xs mb-8">Drift magnitude</h3>
                 <div className="flex-1 flex items-end h-[100px]">
                    <ChangeMagnitudeBars data={[result?.change_magnitude?.magnitude || 0.4, 0.7, 0.5, 0.9, 0.6]} />
                 </div>
                 <p className="text-metadata mt-6 opacity-60">Comparative historical drift analysis</p>
              </div>
           </div>

        </div>
      </div>

      {/* SECOND ROW: Analysis & Lineage */}
      <div className="grid grid-cols-12 gap-lg">
        
        {/* INPUT CONTEXT */}
        <div className="col-span-12 lg:col-span-4 premium-card p-lg flex flex-col h-[500px]">
           <h3 className="text-xs mb-8">Discovery Context</h3>
           <div className="flex flex-col gap-1 overflow-y-auto pr-2 scrollbar-hide">
              {result ? (
                <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[#0B0F14] hover:bg-[#12171D] transition-colors cursor-pointer group">
                   <div className="flex justify-between items-center mb-4">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-[#00A3FF] transition-colors uppercase">{result.entity_fqn}</span>
                      <div className={`status-indicator ${result.fgs.is_blocked ? 'bg-[#EF4444]' : 'bg-[#10B981]'}`} />
                   </div>
                   <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-metadata">
                         <span>Compliance Score</span>
                         <span className="text-white">{(result.fgs.compliance_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-[1px] bg-[rgba(255,255,255,0.04)]" />
                      <div className="flex justify-between items-center text-metadata">
                         <span>Blast Sensitivity</span>
                         <span className="text-[#F59E0B] font-bold">{result.fgs.blast_radius}</span>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[#64707D] gap-4">
                   <Zap className="w-6 h-6 opacity-20" />
                   <span className="text-metadata italic">Awaiting source telemetry...</span>
                </div>
              )}
           </div>
        </div>

        {/* LINEAGE TOPOLOGY */}
        <div className="col-span-12 lg:col-span-5 premium-card overflow-hidden h-[500px] flex flex-col relative">
           <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
              <h3 className="text-xs">Lineage Topology</h3>
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
           </div>
           <div className="flex-1 canvas-bg relative group">
              <BlastRadius3D data={result?.fgs} />
              <div className="absolute bottom-6 right-6 z-10 p-2 rounded-lg bg-[#12171D] border border-[rgba(255,255,255,0.06)] cursor-pointer hover:border-white transition-all text-[#64707D] hover:text-white">
                 <Expand className="w-4 h-4" />
              </div>
           </div>
        </div>

        {/* RECOMMENDATIONS */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-lg">
           <div className="premium-card p-lg flex-1 bg-gradient-to-br from-[#12171D] to-[#0B0F14] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A3FF]/5 blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-8">
                <Zap className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="text-xs">Smart Suggestion</h3>
              </div>
              <p className="text-body leading-relaxed mb-8 font-medium">
                Detected high impact potential in <span className="text-white border-b border-[#00A3FF]/40 pb-0.5">shard_key_01</span>. Partitioning can reduce blast radius by <span className="text-white font-bold">12.4%</span> across 18 downstream entities.
              </p>
              <button 
                 onClick={() => applyOptimization()}
                 disabled={!!optimizationPreview}
                 className={`w-full py-3 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-2 ${optimizationPreview ? 'bg-[#10B981]/10 text-[#10B981]' : 'btn-primary'}`}
              >
                {optimizationPreview ? 'Optimization Applied' : 'Execute Optimization'}
                {!optimizationPreview && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
           </div>
           
           <div className="premium-card p-lg h-[140px] flex flex-col justify-center border-dashed border-[rgba(255,255,255,0.1)] bg-transparent">
              <span className="text-metadata text-center opacity-40">SYSTEM_UPTIME 14d 12h 4m</span>
           </div>
        </div>

      </div>

    </div>
  );
}
