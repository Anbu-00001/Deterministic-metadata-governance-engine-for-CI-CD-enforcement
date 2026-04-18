'use client';

import React, { useEffect, useState } from 'react';
import { fetchTimeline } from '@/lib/api';
import { Clock, History, AlertCircle, Crosshair, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TimelinePage() {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTimeline()
      .then((data) => {
        setSnapshots(Array.isArray(data) ? data : data.snapshots || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch timeline.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 h-full flex flex-col relative">
      <div className="mb-10 flex justify-between items-center z-10">
        <div>
          <h1 className="text-2xl font-black tracking-[0.3em] text-[#00E5FF] glow-text uppercase italic">Historical Timeline</h1>
          <p className="text-[10px] text-[#6B7A90] font-mono mt-1 font-bold tracking-widest uppercase opacity-60">Metadata Estate Snapshot Registry</p>
        </div>
      </div>

      <div className="flex-1 panel-border rounded-xl flex flex-col p-8 h-full bg-[#0d1219]/60 backdrop-blur-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f0ff]/5 blur-[120px] pointer-events-none" />
        
        <h3 className="text-[10px] font-black tracking-[0.2em] text-[#6B7A90] mb-8 uppercase flex items-center gap-3 italic">
           <Clock className="w-3 h-3 text-[#00E5FF]" />
           Chronological Registry Matrix
        </h3>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#00E5FF]">
            <Clock className="w-12 h-12 animate-spin mb-6 drop-shadow-[0_0_10px_rgba(0,229,255,0.7)]" />
            <span className="text-[10px] font-black tracking-[0.5em] animate-pulse">EXTRACTING_CHRONOS_LOGS...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-[#ff5b5b]/5 border border-[#ff5b5b]/20 rounded-xl flex items-start gap-4 text-[#ff5b5b]">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="text-xs font-black tracking-widest uppercase">Registry Access Failure</p>
              <p className="text-[10px] font-mono mt-2 opacity-80">{error}</p>
            </div>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex-1 border border-dashed border-[#1a2230] bg-black/20 rounded-xl flex flex-col items-center justify-center text-[#4A5568] text-[10px] font-mono font-bold">
            <History className="w-10 h-10 mb-4 opacity-30" />
            <span className="tracking-[0.2em]">NO ARCHIVED REGISTRIES DETECTED.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#1a2230] bg-black/30 backdrop-blur-md">
            <table className="w-full text-left border-collapse text-[11px] font-medium tracking-wide">
              <thead>
                <tr className="bg-[#121c26]/80 border-b border-[#1a2230] text-[#00E5FF]">
                  <th className="py-5 px-6 font-black tracking-[0.2em] uppercase">Snapshot ID</th>
                  <th className="py-5 px-6 font-black tracking-[0.2em] uppercase">Temporal Offset</th>
                  <th className="py-5 px-6 font-black tracking-[0.2em] uppercase text-right">Commit Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#16202e] text-[#e0e5ea]">
                {snapshots.map((snap, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx} 
                    className="hover:bg-[#00E5FF]/5 transition-all group cursor-pointer"
                  >
                    <td className="py-5 px-6 flex items-center gap-3">
                      <Crosshair className="w-4 h-4 text-[#00E5FF] opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110" />
                      <span className="font-bold group-hover:text-white transition-colors">{snap.label || 'SYSTEM_SNAPSHOT'}</span>
                    </td>
                    <td className="py-5 px-6 text-[#6B7A90] font-mono font-bold italic">
                      {snap.age_human || snap.timestamp_human || '0.0s OFFSET'}
                    </td>
                    <td className="py-5 px-6 text-right font-mono text-[#00E5FF] opacity-70 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-[10px] tracking-widest">{snap.commit_sha ? snap.commit_sha.substring(0, 7).toUpperCase() : 'N/A'}</span>
                        <ArrowRight className="w-3 h-3 translate-x-[-5px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
