'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertTriangle, Expand, Activity, Loader2, Crosshair, Zap 
} from 'lucide-react';

import { fetchHealth, evaluateSentinel, EvaluationResult } from '../lib/api';
import { useMousePosition } from '../hooks/useMouse';
import { InteractiveCard } from '../components/InteractiveCard';
import { FgsGauge3D } from '../components/FgsGauge3D';
import { BlastRadius3D } from '../components/BlastRadius3D';
import { ChangeMagnitudeBars } from '../components/ChangeMagnitudeBars';

export default function Dashboard() {
  const [evalResults, setEvalResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const mouse = useMousePosition();

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await evaluateSentinel({}).catch(() => []);
      setEvalResults(results);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Dashboard Eval Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Poll evaluations every minute
    return () => clearInterval(interval);
  }, []);

  const activeResult = useMemo(() => evalResults[0], [evalResults]);
  const isPass = !activeResult?.fgs?.is_blocked ?? true;
  const score = activeResult?.fgs?.score || 0;

  return (
    <div className="p-6 h-full grid grid-cols-12 grid-rows-6 gap-6 relative">
      
      {/* Background depth decor */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          transform: `translate(${mouse.x * 30}px, ${mouse.y * 30}px) translateZ(-100px)`,
          backgroundImage: `radial-gradient(circle at 50% 50%, #00E5FF 0%, transparent 80%)`
        }}
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0B1017]/60 backdrop-blur-md z-40 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
               <Loader2 className="w-12 h-12 text-[#00E5FF] animate-spin" />
               <span className="text-[10px] font-black tracking-[0.4em] text-[#00E5FF] animate-pulse">RECALIBRATING_GENESIS_CORE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COL 1: Context & Lineage */}
      <div className="col-span-3 row-span-6 flex flex-col gap-6">
        <InteractiveCard className="flex flex-col flex-shrink-0">
          <div className="panel-border rounded flex flex-col p-5 bg-[#0d1219]/60 backdrop-blur-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] uppercase underline decoration-[#00E5FF]/30 underline-offset-4">Input Context</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#39ff14] shadow-[0_0_8px_#39ff14]" />
                <span className="text-[9px] text-[#00E5FF] font-black italic">STREAMING</span>
              </div>
            </div>
            <p className="text-xs text-[#a0aab8] font-medium leading-relaxed mb-5">
              Detected <span className="text-[#00E5FF] font-black">{evalResults.length}</span> security-critical schema mutations in <span className="text-white font-mono bg-[#141b24] px-1 py-0.5 rounded">cluster-gamma-9</span>.
            </p>
            
            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {evalResults.map((res, i) => (
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={res.entity_fqn} 
                  className={`p-3 border rounded-lg transition-all group ${res.fgs.is_blocked ? 'border-[#ff5b5b]/40 bg-[#ff5b5b]/5' : 'border-[#1a2230] bg-[#0A0F15] hover:border-[#00E5FF]/40'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-[#00E5FF] truncate max-w-[130px] group-hover:glow-text transition-all">{res.entity_fqn}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${res.fgs.is_blocked ? 'text-[#ff5b5b] border-[#ff5b5b]/30' : 'text-[#39ff14] border-[#39ff14]/30'}`}>
                      {res.fgs.is_blocked ? 'CRITICAL' : 'SAFE'}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden mb-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${res.fgs.score}%` }}
                      className={`h-full ${res.fgs.is_blocked ? 'bg-[#ff5b5b]' : 'bg-[#00E5FF]'}`}
                     />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold tracking-widest text-[#6B7A90] uppercase opacity-60">
                    <span>FGS_SCORE</span>
                    <span>{res.fgs.score.toFixed(1)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </InteractiveCard>

        <InteractiveCard className="flex-1">
          <div className="panel-border rounded flex flex-col p-5 h-full relative overflow-hidden group bg-[#0d1219]/60 backdrop-blur-lg border-[#1a2230]">
            <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-4 uppercase">Lineage Topology</h3>
            <div className="flex-1 rounded-xl border border-[#16202e] bg-black/40 dot-pattern relative flex items-center justify-center overflow-hidden">
              <BlastRadius3D data={activeResult?.fgs} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none" />
              <div className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-[#111721] border border-[#1d2737] cursor-pointer hover:scale-110 transition-transform shadow-2xl">
                <Expand className="w-4 h-4 text-[#6B7A90] group-hover:text-[#00E5FF]" />
              </div>
            </div>
          </div>
        </InteractiveCard>
      </div>

      {/* COL 2: FGS Score & Change Magnitude */}
      <div className="col-span-4 row-span-6 flex flex-col gap-6">
        <InteractiveCard intensity={10} className="flex-[2]">
          <div className="panel-border rounded flex flex-col p-5 h-full bg-[#0d1219]/60 backdrop-blur-lg relative border-[#1a2230]">
            <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-6 uppercase">Governance Evaluation</h3>
            <div className="flex flex-col items-center justify-center flex-1">
              <FgsGauge3D score={score} />
              
              <div className="flex w-full justify-around mt-6 pt-6 border-t border-white/5 font-mono">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-[#6B7A90] font-black tracking-widest mb-1 opacity-50">VELOCITY_OFFSET</span>
                  <span className="text-[#00E5FF] text-sm font-black">+12.4%</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-[#6B7A90] font-black tracking-widest mb-1 opacity-50">INTEGRITY_INDEX</span>
                  <span className="text-[#39ff14] text-sm font-black">99.98%</span>
                </div>
              </div>
            </div>
          </div>
        </InteractiveCard>

        <InteractiveCard className="flex-[1]">
          <div className="panel-border rounded flex flex-col p-5 h-full bg-[#0d1219]/60 backdrop-blur-lg border-[#1a2230]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] uppercase italic">Drift Magnitude Historical</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_5px_#00E5FF]" /><span className="text-[8px] text-[#6B7A90] font-bold">DELTA</span></div>
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#303e50]" /><span className="text-[8px] text-[#6B7A90] font-bold">BASE</span></div>
              </div>
            </div>
            <div className="mt-auto h-28">
                <ChangeMagnitudeBars data={evalResults.map(r => r.change_magnitude.magnitude)} />
            </div>
          </div>
        </InteractiveCard>
      </div>

      {/* COL 3: Blast Radius Scatter */}
      <div className="col-span-2 row-span-6 flex flex-col gap-6">
        <InteractiveCard className="h-full">
          <div className="flex flex-col h-full bg-[#0D1219]/80 border border-[#1a2230] rounded-xl p-6 relative overflow-hidden backdrop-blur-2xl">
            <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-8 uppercase">Radial Blast Analysis</h3>
            
            <div className="flex-1 bg-black/60 rounded-xl border border-white/5 shadow-2xl relative group ring-1 ring-[#1f3a47] overflow-hidden dot-pattern">
              <BlastRadius3D />
              
              <div className="absolute top-2 left-2 bg-[#0d1219]/90 px-2 py-1 rounded border border-white/5 backdrop-blur-md pointer-events-none">
                <span className="text-[8px] font-mono text-[#00E5FF] tracking-tighter">SIMULATING_LINEAGE_IMPACT...</span>
              </div>
            </div>

            <motion.div 
               key={activeResult?.entity_fqn}
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               className="pt-6 mt-6 border-t border-white/5"
            >
               <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-white tracking-widest uppercase mb-1">Impact Identifier</span>
                  <div className="text-[#00E5FF] text-[11px] font-mono font-bold">BLR-{Math.floor(score * 4.2)}</div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-[9px] text-[#6B7A90] font-bold uppercase">Blast Count</span>
                    <span className="text-xl font-black text-white glow-text">{activeResult?.fgs?.blast_radius || 0}</span>
                  </div>
               </div>
            </motion.div>
          </div>
        </InteractiveCard>
      </div>

      {/* COL 4: Decision Engine, Risk Breakdown, Suggestion */}
      <div className="col-span-3 row-span-6 flex flex-col gap-6">
        
        <InteractiveCard className="h-[320px]">
          <div className="panel-border rounded flex flex-col p-6 h-full bg-[#0d1219]/60 backdrop-blur-lg border-[#1a2230]">
            <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-8 uppercase">Automated Verdict Engine</h3>
            <div className="flex flex-col items-center justify-center flex-1">
              <span className="text-[9px] font-black tracking-widest text-[#6B7A90] mb-4 uppercase opacity-50">Policy Decision</span>
              
              <motion.div 
                initial={{ rotateX: 45, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                className={`w-[170px] h-[110px] border-2 rounded-xl flex flex-col items-center justify-center mb-10 shadow-3xl transition-all duration-700 relative group overflow-hidden ${
                  isPass 
                    ? 'border-[#00E5FF]/60 bg-[#00E5FF]/5 text-[#00E5FF] shadow-[#00f0ff]/10' 
                    : 'border-[#ff5b5b]/60 bg-[#ff5b5b]/5 text-[#ff5b5b] shadow-[#ff5b5b]/10'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-1000 ${isPass ? 'from-[#00E5FF]/20 to-transparent' : 'from-[#ff5b5b]/20 to-transparent'}`} />
                <span className="text-3xl font-black tracking-[0.3em] glow-text italic z-10 transition-all group-hover:tracking-[0.4em]">
                  {isPass ? 'PASS' : 'BLOCK'}
                </span>
              </motion.div>

              <div className="bg-black/40 p-4 rounded-lg border border-white/5 w-full">
                 <p className="text-[11px] text-center text-[#e0e5ea] font-medium leading-snug">
                   {activeResult?.fgs?.explanation || 'Awaiting telemetry synchronization...'}
                 </p>
              </div>
              <div className="flex items-center gap-2 mt-4 text-[9px] font-mono font-bold tracking-widest uppercase">
                 <span className="text-[#6B7A90]">Assurance:</span>
                 <span className="text-[#39ff14]">92.4%</span>
              </div>
            </div>
          </div>
        </InteractiveCard>

        <div className="panel-border rounded flex flex-col p-6 flex-[1.5] bg-[#0d1219]/60 backdrop-blur-lg border-[#1a2230]">
          <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-6 uppercase">Risk Vector Categorization</h3>
          <div className="flex flex-col gap-5 mt-2">
            {[
              { name: 'SECURITY_INTEGRITY', value: 20, level: 'LOW', color: '#00E5FF' },
              { name: 'RESOURCE_COLLISION', value: 60, level: 'MED', color: '#fbc02d' },
              { name: 'ORCHESTRATION_LAG', value: 15, level: 'LOW', color: '#00E5FF' },
            ].map(risk => (
              <div key={risk.name} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] font-bold tracking-tighter">
                  <span className="text-[#e0e5ea]">{risk.name}</span>
                  <span style={{ color: risk.color }} className="text-[9px] font-black">{risk.level}</span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${risk.value}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="h-full rounded-full shadow-lg"
                    style={{ backgroundColor: risk.color, boxShadow: `0 0 10px ${risk.color}66` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <motion.div 
          whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
          className="panel-border rounded flex flex-col p-6 flex-[1.2] relative overflow-hidden bg-gradient-to-br from-[#0c141d] to-[#010203] border-[#1a2230] group"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-[#00E5FF] shadow-[0_0_20px_#00E5FF]" />
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-4 h-4 text-[#00E5FF] fill-[#00e5ff]" />
            <h3 className="text-[10px] font-black tracking-widest text-[#e0e5ea] uppercase">Dynamic Recommendation</h3>
          </div>
          <p className="text-[11px] text-[#a0aab8] font-medium leading-relaxed mb-6 flex-1 italic group-hover:text-white transition-colors">
            Heuristic detection triggered: Implement <span className="text-[#00E5FF] font-black underline underline-offset-4 decoration-[#00E5FF]/40">shard_key_01</span> partitioning to compress Blast Radius by ~<span className="text-white font-bold font-mono">12.4%</span>.
          </p>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => alert('Orchestrating Optimization...')}
            className="w-full py-3.5 rounded-xl text-[10px] font-black tracking-widest bg-[#00E5FF] text-black shadow-[0_0_30px_#00f0ff44] hover:shadow-[0_0_40px_#00f0ff66] transition-all uppercase"
          >
            EXECUTE OPTIMIZATION
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}
