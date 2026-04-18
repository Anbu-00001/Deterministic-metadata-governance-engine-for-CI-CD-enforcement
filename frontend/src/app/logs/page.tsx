'use client';

import React, { useEffect, useState } from 'react';
import { useHephaestus, api } from '../../store/HephaestusContext';
import { Terminal, Search, Filter, Database, AlertCircle, Info, ShieldAlert, Download, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LogsPage() {
  const { state, dispatch } = useHephaestus();
  const [filterComponent, setFilterComponent] = useState('');
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  useEffect(() => {
    // Phase 6: Logs Fetch Flow
    const fetchLogs = async () => {
      dispatch({ type: 'LOGS_START' });
      try {
        const data = await api.logs();
        dispatch({ type: 'LOGS_SUCCESS', payload: data });
      } catch (err: any) {
        dispatch({ type: 'LOGS_FAILURE', payload: err.message });
      }
    };

    if (!state.logsFetched) {
      fetchLogs();
    }
  }, [state.logsFetched, dispatch]);

  const handleRefresh = async () => {
    dispatch({ type: 'LOGS_START' });
    try {
      const data = await api.logs({ 
        ...(filterComponent ? { component: filterComponent } : {}),
        ...(filterLevel ? { level: filterLevel } : {})
      });
      dispatch({ type: 'LOGS_SUCCESS', payload: data });
    } catch (err: any) {
      dispatch({ type: 'LOGS_FAILURE', payload: err.message });
    }
  };

  const handleExport = () => {
    const text = state.logs.map(l => `[${l.timestamp}] ${l.level} - ${l.component}: ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hephaestus_logs_${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = state.logs.filter(log => {
    if (filterComponent && !log.component.toLowerCase().includes(filterComponent.toLowerCase())) return false;
    if (filterLevel && log.level !== filterLevel) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-12 max-w-[1400px] mx-auto pb-16">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest opacity-60">
              <Terminal className="w-3.5 h-3.5" />
              <span>Diagnostic runtime</span>
           </div>
           <h1 className="text-[32px] font-bold tracking-tighter">System Telemetry</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export logs
          </button>
          <button 
            onClick={handleRefresh}
            disabled={state.logsLoading}
            className="btn-primary flex items-center gap-2"
          >
            {state.logsLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="premium-card p-6 bg-[#12171D] flex items-center justify-between gap-8 border-dashed">
         <div className="flex-1 flex items-center gap-4 bg-[#0B0F14] border border-white/5 rounded-xl px-4 py-2 group focus-within:border-[#00A3FF]/40 transition-all">
            <Search className="w-4 h-4 text-[#64707D]" />
            <input 
              type="text" 
              placeholder="Filter by component (e.g. sentinel.core)..." 
              className="bg-transparent border-none focus:outline-none text-[13px] w-full text-[#8A949E]"
              value={filterComponent}
              onChange={(e) => setFilterComponent(e.target.value)}
            />
         </div>
         <div className="flex gap-2">
            {['INFO', 'WARN', 'ERROR'].map(level => (
               <button 
                 key={level}
                 onClick={() => setFilterLevel(filterLevel === level ? null : level)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterLevel === level ? 'bg-white/5 border-white/10 text-white' : 'border-white/5 text-[#64707D] hover:text-white hover:bg-white/5'}`}
               >
                 {level}
               </button>
            ))}
         </div>
      </div>

      {/* LOG LIST */}
      <div className="premium-card p-0 overflow-hidden bg-[#12171D] min-h-[500px] flex flex-col">
        <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
           <span className="text-[10px] font-bold text-[#64707D] uppercase tracking-widest">Showing {filteredLogs.length} of {state.logs.length} entries</span>
           <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></div>
              <span className="text-[10px] font-bold text-[#10B981] uppercase">Streaming Real-time</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide max-h-[600px] font-mono">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black uppercase opacity-40 border-b border-white/5 bg-white/2 bg-white/2">
                   <th className="py-3 px-6 w-56">Timestamp</th>
                   <th className="py-3 px-6 w-24">Level</th>
                   <th className="py-3 px-6 w-64">Component</th>
                   <th className="py-3 px-6">Message</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {state.logsLoading && state.logs.length === 0 ? (
                    [1,2,3,4,5].map(i => (
                      <tr key={i} className="animate-pulse">
                         <td colSpan={4} className="py-4 px-6 h-12 bg-white/3" />
                      </tr>
                    ))
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                       <td colSpan={4} className="py-32 text-center opacity-20">
                          <div className="flex flex-col items-center gap-4">
                             <Database className="w-12 h-12" />
                             <span className="text-[11px] font-bold uppercase tracking-widest">No matching logs identified.</span>
                          </div>
                       </td>
                    </tr>
                  ) : filteredLogs.map((log, idx) => (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-white/2 hover:bg-white/2 transition-colors group"
                    >
                       <td className="py-4 px-6 text-[12px] text-[#64707D] tabular-nums whitespace-nowrap">
                          {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                       </td>
                       <td className="py-4 px-6">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${log.level === 'ERROR' ? 'bg-[#EF4444]/10 text-[#EF4444]' : log.level === 'WARN' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#00A3FF]/10 text-[#00A3FF]'}`}>
                             {log.level}
                          </span>
                       </td>
                       <td className="py-4 px-6 text-[12px] text-[#8A949E] font-bold">
                          {log.component}
                       </td>
                       <td className="py-4 px-6 text-[13px] text-white/80 leading-relaxed font-sans">
                          {log.message}
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
