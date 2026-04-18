'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHealth } from '../lib/api';
import { useGovernanceStore } from '../store/useGovernanceStore';
import { 
  Search, Settings, Bell, User, Zap, GitBranch, Shield, 
  TerminalSquare, FileText, LifeBuoy, Activity, Play, RefreshCw, Layers
} from 'lucide-react';

export function HephaestusLayout({ children }: { children: React.ReactNode }) {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const pathname = usePathname();
  const { loading, runEvaluation } = useGovernanceStore();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await fetchHealth();
        setHealthStatus(health);
      } catch (e) {
        setHealthStatus(null);
      }
    };
    checkHealth();
    const intv = setInterval(checkHealth, 10000);
    return () => clearInterval(intv);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0F14] text-[#fdfdfe] font-sans selection:bg-[#00A3FF] selection:text-white">
      
      {/* TOP NAV - Stripe Metric Style */}
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
            <Link href="/evaluate" className={`transition-all hover:text-white ${pathname === '/evaluate' ? 'text-white' : ''}`}>Sentinel</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => runEvaluation()}
             disabled={loading}
             className="btn-primary flex items-center gap-2 h-8 px-4"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
            Analyze
          </motion.button>

          <div className="relative border-x border-[rgba(255,255,255,0.06)] px-4 mx-2">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64707D]" />
            <input 
              type="text" 
              placeholder="Search data..." 
              className="bg-transparent border-none text-[13px] py-1.5 pl-8 pr-2 w-32 focus:outline-none focus:w-48 transition-all text-[#fdfdfe] placeholder-[#64707D]"
            />
          </div>

          <div className="flex gap-4 text-[#8A949E]">
            <Settings className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
            <div className="relative">
              <Bell className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
              {healthStatus && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full border border-black"></div>}
            </div>
            <div className="w-7 h-7 rounded-full bg-[#181E26] flex items-center justify-center border border-[rgba(255,255,255,0.1)] ml-2 cursor-pointer hover:border-[#00A3FF] transition-all">
              <User className="w-4 h-4 text-[#00A3FF]" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR - Clean Linear Style */}
        <aside className="w-[200px] flex flex-col justify-between border-r border-[rgba(255,255,255,0.06)] bg-[#0B0F14] shrink-0 px-4 py-8 z-40">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 px-2">
               <div className="flex flex-col">
                 <span className="text-[11px] font-bold tracking-[0.05em] text-[#64707D]">WORKSPACE</span>
                 <span className="text-[13px] font-semibold text-[#fdfdfe]">Genesis Core</span>
               </div>
            </div>

            <nav className="flex flex-col gap-1">
              <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${pathname === '/' ? 'bg-[rgba(255,255,255,0.03)] text-white shadow-sm' : 'text-[#8A949E] hover:text-white hover:bg-[rgba(255,255,255,0.02)]'}`}>
                <Activity className={`w-4 h-4 transition-colors ${pathname === '/' ? 'text-[#00A3FF]' : 'group-hover:text-[#00A3FF]'}`} />
                <span className="text-[13px] font-medium">Overview</span>
              </Link>
              <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${pathname.includes('/engine') ? 'bg-[rgba(255,255,255,0.03)] text-white' : 'text-[#8A949E] hover:text-white hover:bg-[rgba(255,255,255,0.02)]'}`}>
                <GitBranch className="w-4 h-4" />
                <span className="text-[13px] font-medium">Lineage</span>
              </Link>
              <Link href="/timeline" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${pathname === '/timeline' ? 'bg-[rgba(255,255,255,0.03)] text-white' : 'text-[#8A949E] hover:text-white hover:bg-[rgba(255,255,255,0.02)]'}`}>
                <TerminalSquare className="w-4 h-4" />
                <span className="text-[13px] font-medium">History</span>
              </Link>
              <Link href="/evaluate" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${pathname === '/evaluate' ? 'bg-[rgba(255,255,255,0.03)] text-white' : 'text-[#8A949E] hover:text-white hover:bg-[rgba(255,255,255,0.02)]'}`}>
                <Shield className="w-4 h-4" />
                <span className="text-[13px] font-medium">Governance</span>
              </Link>
            </nav>

            <div className="mt-4 flex flex-col gap-4">
               <span className="px-3 text-[11px] font-bold tracking-[0.05em] text-[#64707D]">RESOURCES</span>
               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-3 px-3 py-1.5 text-[#8A949E] hover:text-white transition-colors cursor-pointer group">
                   <FileText className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                   <span className="text-[13px]">Docs</span>
                 </div>
                 <div className="flex items-center gap-3 px-3 py-1.5 text-[#8A949E] hover:text-white transition-colors cursor-pointer group">
                   <LifeBuoy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                   <span className="text-[13px]">Support</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#12171D] border border-[rgba(255,255,255,0.03)]">
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-[#64707D]">ENGINE_V2</span>
               <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${healthStatus ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></div>
                  <span className="text-[11px] font-semibold">{healthStatus ? 'Stable' : 'Error'}</span>
               </div>
             </div>
             <Settings className="w-3 h-3 text-[#64707D] cursor-pointer hover:text-white" />
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 overflow-hidden bg-[#0B0F14] relative dot-pattern">
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
      
      {/* Footer Area - Minimal */}
      <footer className="h-[28px] flex items-center justify-between px-6 bg-[#0B0F14] border-t border-[rgba(255,255,255,0.06)] shrink-0 text-[10px] font-medium text-[#64707D]">
        <div className="flex items-center gap-6">
           <span className="flex items-center gap-2">
              <span className="text-[#8A949E]">Session</span>
              <span className="font-mono">8A2-991C</span>
           </span>
           <span className="flex items-center gap-2">
              <span className="text-[#8A949E]">Status</span>
              <span className={healthStatus ? 'text-[#10B981]' : 'text-[#EF4444]'}>Operational</span>
           </span>
        </div>
        <div className="flex gap-6">
           <span>Hephaestus Governance Logic V0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
