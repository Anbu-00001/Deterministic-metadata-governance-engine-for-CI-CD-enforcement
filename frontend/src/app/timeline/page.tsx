'use client';

import React, { useEffect } from 'react';
import { useGovernanceStore } from '../store/useGovernanceStore';
import { Clock, AlertCircle, ArrowRight, Loader2, Database, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TimelinePage() {
  const { history, loading, error, getTimeline } = useGovernanceStore();

  useEffect(() => {
    getTimeline();
  }, []);

  return (
    <div className="flex flex-col gap-12 max-w-[1200px] mx-auto pb-16">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3 text-metadata uppercase tracking-widest opacity-60">
              <History className="w-3.5 h-3.5" />
              <span>Audit logs</span>
           </div>
           <h1>Governance History</h1>
        </div>
        <div className="flex gap-3">
           <button className="btn-secondary flex items-center gap-2">
             <Database className="w-3.5 h-3.5" />
             Backup Registry
           </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="premium-card p-0 overflow-hidden bg-[#12171D]">
        <div className="p-lg border-b border-[rgba(255,255,255,0.06)] bg-[#0B0F14]/40 flex justify-between items-center">
           <h3 className="text-xs">Chrono Snapshot Matrix</h3>
           <span className="text-metadata opacity-40 uppercase">Total Artifacts: {history.length}</span>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 flex flex-col items-center justify-center gap-4"
            >
              <Loader2 className="w-6 h-6 animate-spin text-[#00A3FF]" />
              <span className="text-body opacity-60">Loading historical registry...</span>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 flex flex-col items-center justify-center gap-4 text-[#EF4444]"
            >
              <AlertCircle className="w-8 h-8 opacity-40" />
              <div className="text-center">
                <p className="font-bold mb-1 uppercase tracking-widest text-[11px]">Sync failure</p>
                <p className="text-body opacity-80">{error}</p>
              </div>
            </motion.div>
          ) : history.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6 text-[#64707D]">
              <div className="w-12 h-12 rounded-full border border-dashed border-[rgba(255,255,255,0.1)] flex items-center justify-center">
                 <Clock className="w-6 h-6 opacity-30" />
              </div>
              <span className="text-metadata tracking-widest uppercase italic">No archived snapshots found</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-metadata uppercase opacity-40 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="py-5 px-lg font-bold">Temporal id</th>
                    <th className="py-5 px-lg font-bold">Relative Offset</th>
                    <th className="py-5 px-lg font-bold text-right pr-12">Registry SHA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {history.map((snap, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      key={idx} 
                      className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group cursor-pointer"
                    >
                      <td className="py-5 px-lg">
                        <span className="text-[13px] font-semibold text-[#fdfdfe]">{snap.label || 'Automated_Rollback_Ref'}</span>
                      </td>
                      <td className="py-5 px-lg">
                        <span className="text-metadata text-[#8A949E] italic">{snap.age_human || snap.timestamp_human || 'Now'}</span>
                      </td>
                      <td className="py-5 px-lg text-right pr-12">
                        <div className="flex items-center justify-end gap-3">
                          <code className="text-metadata text-[#00A3FF] bg-[#00A3FF]/5 px-2 py-0.5 rounded">
                            {snap.commit_sha ? snap.commit_sha.substring(0, 10).toUpperCase() : 'DE31A04FC2'}
                          </code>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-all translate-x-1" />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex items-start gap-4 p-lg premium-card border-dashed border-[rgba(255,255,255,0.1)] bg-transparent opacity-60">
        <Info className="w-4 h-4 text-[#00A3FF] shrink-0 mt-0.5" />
        <p className="text-metadata leading-relaxed">
          Hephaestus automatically captures metadata estate snapshots upon every successful CI/CD enforcement pass. These snapshots are immutable and can be used for zero-data-loss rollback orchestrations.
        </p>
      </div>
    </div>
  );
}
