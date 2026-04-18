'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useHephaestus, api } from '../store/HephaestusContext';
import {
  Search, Settings, Bell, User, Zap, GitBranch, Shield,
  TerminalSquare, FileText, LifeBuoy, Activity, Play, RefreshCw, Layers, AlertTriangle, X
} from 'lucide-react';

export function HephaestusLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, dispatch } = useHephaestus();

  const handleAnalyze = async () => {
    // Phase 4: Primary Flow
    dispatch({ type: 'EVALUATE_START' });
    try {
      const result = await api.evaluate({});
      dispatch({ type: 'EVALUATE_SUCCESS', payload: result });
    } catch (err: any) {
      dispatch({ type: 'EVALUATE_FAILURE', payload: err.message });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0F14] text-[#fdfdfe] font-sans overflow-hidden">

      {/* PHASE 9 — ERROR BANNER */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#EF4444] text-white px-6 py-2 flex items-center justify-between z-[100] shrink-0 overflow-hidden"
          >
            <div className="flex items-center gap-3 text-[13px] font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>{state.error}</span>
              <button
                onClick={handleAnalyze}
                className="ml-4 underline hover:text-white/80 transition-colors"
                disabled={state.loading}
              >
                Retry
              </button>
            </div>
            <button onClick={() => dispatch({ type: 'CLEAR_ERROR' })}>
              <X className="w-4 h-4 opacity-70 hover:opacity-100" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-[56px] flex items-center justify-between px-6 border-b border-[rgba(255,255,255,0.06)] bg-[#0B0F14]/80 backdrop-blur-xl z-50 shrink-0">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-6 h-6 bg-[#00A3FF] rounded flex items-center justify-center shadow-[0_0_15px_rgba(0,163,255,0.2)]">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold tracking-[-0.03em] text-[18px]">Hephaestus</span>
          </Link>
          <nav className="flex gap-8 text-[13px] font-medium text-[#8A949E]">
            <Link href="/" className={`transition-all hover:text-white ${pathname === '/' ? 'text-white' : ''}`}>Dashboard</Link>
            <Link href="/" className={`transition-all hover:text-white ${pathname.includes('/engine') ? 'text-white' : ''}`}>Analysis</Link>
            <Link href="/timeline" className={`transition-all hover:text-white ${pathname === '/timeline' ? 'text-white' : ''}`}>Chronos</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAnalyze}
            disabled={state.loading}
            className="btn-primary flex items-center gap-2 h-8 px-4 disabled:opacity-50"
          >
            {state.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
            Analyze
          </motion.button>

          <div className="flex gap-4 text-[#8A949E]">
            <Settings className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
            <div className="relative">
              <Bell className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
              {state.connection === 'offline' && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full border border-black"></div>}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[200px] flex flex-col justify-between border-r border-[rgba(255,255,255,0.06)] bg-[#0B0F14] shrink-0 px-4 py-8 z-40">
          <div className="flex flex-col gap-8">
            <nav className="flex flex-col gap-1">
              <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${pathname === '/' ? 'bg-[rgba(255,255,255,0.03)] text-white shadow-sm' : 'text-[#8A949E] hover:text-white hover:bg-[rgba(255,255,255,0.02)]'}`}>
                <Activity className={`w-4 h-4 transition-colors ${pathname === '/' ? 'text-[#00A3FF]' : 'group-hover:text-[#00A3FF]'}`} />
                <span className="text-[13px] font-medium">Overview</span>
              </Link>
              <Link href="/timeline" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${pathname === '/timeline' ? 'bg-[rgba(255,255,255,0.03)] text-white' : 'text-[#8A949E] hover:text-white hover:bg-[rgba(255,255,255,0.02)]'}`}>
                <TerminalSquare className="w-4 h-4" />
                <span className="text-[13px] font-medium">History</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#12171D] border border-[rgba(255,255,255,0.03)]">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#64707D]">ENGINE_V2</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${state.connection === 'connected' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></div>
                <span className="text-[11px] font-semibold tracking-tighter uppercase">{state.connection}</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#0B0F14] relative scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full w-full p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <footer className="h-[28px] flex items-center justify-between px-6 bg-[#0B0F14] border-t border-[rgba(255,255,255,0.06)] shrink-0 text-[10px] font-medium text-[#64707D]">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="text-[#8A949E]">Status:</span>
            <span className={state.connection === 'connected' ? 'text-[#10B981]' : 'text-[#EF4444]'}>{state.connection.toUpperCase()}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
