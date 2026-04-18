'use client';

import React, { useEffect, useState } from 'react';
import { fetchTimeline } from '@/lib/api';
import { Clock, History, AlertCircle } from 'lucide-react';

export default function TimelinePage() {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTimeline()
      .then((data) => {
        // Backend returns an array or an object wrapping an array.
        setSnapshots(Array.isArray(data) ? data : data.snapshots || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch timeline.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-gray-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight">Timeline</h1>
        <p className="text-gray-400 mt-2">Chronological snapshots of your metadata estate.</p>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-gray-400">
          <Clock className="w-8 h-8 animate-pulse mb-3" />
          <p>Loading timeline...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg flex items-start gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Error loading timeline</p>
            <p className="text-sm opacity-80 mt-1">{error}</p>
          </div>
        </div>
      ) : snapshots.length === 0 ? (
        <div className="py-12 border border-dashed border-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-500 text-sm">
          <History className="w-8 h-8 mb-3 opacity-50" />
          <p>No snapshots found in the timeline.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800 shadow-md">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#161b22] border-b border-gray-800 text-gray-300">
                <th className="py-3 px-5 font-semibold">Snapshot Label</th>
                <th className="py-3 px-5 font-semibold">Age</th>
                <th className="py-3 px-5 font-semibold text-right">Commit SHA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-[#0d1117]">
              {snapshots.map((snap, idx) => (
                <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-5 text-gray-200 font-medium">
                    {snap.label || 'Unnamed Snapshot'}
                  </td>
                  <td className="py-3 px-5 text-gray-400">
                    {snap.age_human || snap.timestamp_human || 'Unknown time'}
                  </td>
                  <td className="py-3 px-5 text-right font-mono text-gray-500 text-xs">
                    {snap.commit_sha ? snap.commit_sha.substring(0, 7) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
