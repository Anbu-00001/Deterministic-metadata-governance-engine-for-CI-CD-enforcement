'use client';

import React, { useEffect, useState } from 'react';
import { fetchHealth } from '@/lib/api';
import { Activity, Server, Clock, GitCommit } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to connect to backend.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-gray-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight">Hephaestus Dashboard</h1>
        <p className="text-gray-400 mt-2">Deterministic Metadata Governance Engine</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* System Status Card */}
        <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Server className="w-5 h-5 text-gray-400" />
              System Status
            </h3>
            {loading ? (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
              </span>
            ) : error ? (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            ) : (
              <span className="flex h-3 w-3 relative text-green-500">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            {error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : status ? (
              <>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Status</span>
                  <span className="text-green-400 font-medium uppercase">{status.status}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Version</span>
                  <span className="font-mono text-gray-300">{status.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Service</span>
                  <span className="font-mono text-gray-300">{status.service}</span>
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-sm">Loading backend status...</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <Link href="/evaluate" className="bg-[#161b22] border border-gray-800 rounded-lg p-6 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all group flex flex-col">
          <h3 className="font-semibold flex items-center gap-2 mb-2 group-hover:text-indigo-400 transition-colors">
            <Activity className="w-5 h-5 text-indigo-500" />
            Run Sentinel
          </h3>
          <p className="text-gray-400 text-sm mt-1 mb-4 flex-1">
            Evaluate a metadata schema change payload against your governance rules to calculate FGS and Blast Radius.
          </p>
          <div className="text-indigo-500 text-sm font-medium mt-auto flex items-center">
            Go to Evaluate &rarr;
          </div>
        </Link>
        
        <Link href="/timeline" className="bg-[#161b22] border border-gray-800 rounded-lg p-6 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group flex flex-col">
          <h3 className="font-semibold flex items-center gap-2 mb-2 group-hover:text-blue-400 transition-colors">
            <GitCommit className="w-5 h-5 text-blue-500" />
            View Timeline
          </h3>
          <p className="text-gray-400 text-sm mt-1 mb-4 flex-1">
            Browse through chronological snapshots of your metadata estate and perform rollbacks.
          </p>
          <div className="text-blue-500 text-sm font-medium mt-auto flex items-center">
            Go to Timeline &rarr;
          </div>
        </Link>

      </div>
    </div>
  );
}
