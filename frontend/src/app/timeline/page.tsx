'use client';

import React, { useEffect } from 'react';
import { useHephaestus, api } from '../../store/HephaestusContext';
import { History, Clock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TimelinePage() {
  const { state, dispatch } = useHephaestus();

  useEffect(() => {
    // Phase 6: Timeline Fetch Flow
    const fetchTimeline = async () => {
      dispatch({ type: 'TIMELINE_START' });
      try {
        const data = await api.timeline();
        dispatch({ type: 'TIMELINE_SUCCESS', payload: data });
      } catch (err: any) {
        dispatch({ type: 'TIMELINE_FAILURE', payload: err.message });
      }
    };

    if (!state.timelineFetched) {
      fetchTimeline();
    }
  }, [state.timelineFetched, dispatch]);

  const handleRefresh = async () => {
    dispatch({ type: 'TIMELINE_START' });
    try {
      const data = await api.timeline();
      dispatch({ type: 'TIMELINE_SUCCESS', payload: data });
    } catch (err: any) {
      dispatch({ type: 'TIMELINE_FAILURE', payload: err.message });
    }
  };

  return (
    <div className="flex flex-col gap-12 max-w-[1200px] mx-auto pb-16">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest opacity-60">
              <History className="w-3.5 h-3.5" />
              <span>Audit logs</span>
           </div>
           <h1 className="text-[32px] font-bold tracking-tighter">Governance History</h1>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={state.timelineLoading}
          className="btn-secondary flex items-center gap-2"
        >
          {state.timelineLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Refresh Registry"}
        </button>
      </div>

      {/* TABLE SECTION */}
      <div className="premium-card p-0 overflow-hidden bg-[#12171D]">
        <div className="p-8 border-b border-[rgba(255,255,255,0.06)] bg-[#0B0F14]/40 flex justify-between items-center">
           <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#64707D]">Chrono Snapshot Matrix</h3>
           <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
             Total Records: {state.timeline.length}
           </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black uppercase opacity-40 border-b border-[rgba(255,255,255,0.06)] bg-white/5">
                <th className="py-4 px-8 tracking-widest">Entry ID</th>
                <th className="py-4 px-8 tracking-widest">Timestamp</th>
                <th className="py-4 px-8 tracking-widest">Action</th>
                <th className="py-4 px-8 tracking-widest">Status</th>
                <th className="py-4 px-8 tracking-widest text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              <AnimatePresence mode="popLayout">
                {state.timelineLoading ? (
                  [1,2,3,4].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="py-6 px-8 h-12 bg-white/5" />
                    </tr>
                  ))
                ) : state.timeline.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-20">
                          <Clock className="w-8 h-8" />
                          <span className="text-[11px] font-bold uppercase tracking-widest">No history recorded</span>
                       </div>
                    </td>
                  </tr>
                ) : state.timeline.map((entry: any, idx: number) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={entry.id} 
                    className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group cursor-default"
                  >
                    <td className="py-5 px-8">
                       <code className="text-[#00A3FF] font-black text-[11px]">{entry.id.substring(0, 8)}</code>
                    </td>
                    <td className="py-5 px-8">
                       <span className="text-[13px] text-[#8A949E]">{new Date(entry.timestamp).toLocaleString()}</span>
                    </td>
                    <td className="py-5 px-8">
                       <span className="text-[11px] font-bold text-white tracking-wide uppercase">{entry.action}</span>
                    </td>
                    <td className="py-5 px-8">
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded ${entry.decision === 'APPROVE' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                         {entry.decision}
                       </span>
                    </td>
                    <td className="py-5 px-8 text-right font-mono font-bold">
                       <span className={entry.fgs_score > 80 ? 'text-[#10B981]' : 'text-[#F59E0B]'}>
                         {entry.fgs_score.toFixed(1)}
                       </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
