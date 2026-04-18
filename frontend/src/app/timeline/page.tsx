'use client';

import React, { useEffect, useState } from 'react';
import { fetchTimeline } from '@/lib/api';
import { Clock, History, AlertCircle, Crosshair } from 'lucide-react';

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
    <div className="p-6 h-full flex flex-col relative grid grid-cols-12 gap-6">
      <div className="col-span-12 mb-2 flex justify-between items-center z-10">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-[#00E5FF] glow-text">SYSTEM LOGS</h1>
          <p className="text-[10px] text-[#6B7A90] font-mono mt-1">METADATA ESTATE SNAPSHOT TIMELINE</p>
        </div>
      </div>

      <div className="col-span-12 panel-border rounded flex flex-col p-5 h-[calc(100vh-180px)]">
        <h3 className="text-[10px] font-bold tracking-widest text-[#6B7A90] mb-4">CHRONOLOGICAL EVENT REGISTRY</h3>

        {loading ? (
          <div className="flex-1 border border-[#1a2230] bg-[#0A0F15] rounded flex flex-col items-center justify-center text-[#00E5FF]">
            <Clock className="w-8 h-8 animate-spin mb-4 drop-shadow-[0_0_8px_rgba(0,229,255,0.7)]" />
            <span className="text-[10px] font-mono tracking-widest animate-pulse">LOADING SECURE REGISTRY...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-[#ff5b5b]/10 border border-[#ff5b5b]/30 rounded flex items-start gap-3 text-[#ff5b5b]">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="text-xs font-bold tracking-widest">REGISTRY CORRUPTION DETECTED</p>
              <p className="text-[10px] font-mono mt-1">{error}</p>
            </div>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex-1 border border-dashed border-[#1a2230] bg-[#0c1017] rounded flex flex-col items-center justify-center text-[#4A5568] text-[10px] font-mono">
            <History className="w-8 h-8 mb-4 opacity-50" />
            <span>NO ARCHIVED SNAPSHOTS FOUND.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-[#1a2230] bg-[#080B10]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#121c26] border-b border-[#1a2230] text-[#00E5FF]">
                  <th className="py-3 px-5 font-bold tracking-widest text-[9px]">SNAPSHOT LABEL</th>
                  <th className="py-3 px-5 font-bold tracking-widest text-[9px]">AGE</th>
                  <th className="py-3 px-5 font-bold tracking-widest text-[9px] text-right">COMMIT SHA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#16202e]">
                {snapshots.map((snap, idx) => (
                  <tr key={idx} className="hover:bg-[#121c26] transition-colors group cursor-pointer">
                    <td className="py-4 px-5 text-[#e0e5ea] font-medium flex items-center gap-2">
                      <Crosshair className="w-3 h-3 text-[#00E5FF] opacity-0 group-hover:opacity-100 transition-opacity" />
                      {snap.label || 'Unnamed Snapshot'}
                    </td>
                    <td className="py-4 px-5 text-[#6B7A90] font-mono">
                      {snap.age_human || snap.timestamp_human || 'Unknown time'}
                    </td>
                    <td className="py-4 px-5 text-right font-mono text-[#00E5FF]/70 text-[10px]">
                      {snap.commit_sha ? snap.commit_sha.substring(0, 7) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
