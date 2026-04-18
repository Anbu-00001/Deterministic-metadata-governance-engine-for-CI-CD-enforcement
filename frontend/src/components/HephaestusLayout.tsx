'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHealth } from '../lib/api';
import { 
  Search, Settings, Bell, User, Zap, GitBranch, Shield, 
  TerminalSquare, FileText, LifeBuoy, Activity
} from 'lucide-react';

export function HephaestusLayout({ children }: { children: React.ReactNode }) {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const pathname = usePathname();

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
    <div className="flex flex-col h-screen w-screen bg-[#06090E] text-[#e0e5ea] overflow-hidden select-none">
       {/* Global Scanline Effect */}
      <div className="scanline"></div>
      
      {/* TOP NAV */}
      <header className="h-[60px] flex items-center justify-between px-6 border-b border-[#1a2230] bg-[#0A0F15]/90 backdrop-blur-xl z-50 shrink-0">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <span className="text-[#00E5FF] font-black tracking-widest text-xl glow-text transition-all group-hover:tracking-[0.15em]">HEPHAESTUS</span>
          </Link>
          <nav className="flex gap-6 text-[10px] font-bold tracking-widest text-[#6B7A90]">
            <Link href="/" className={`transition-all hover:text-[#00E5FF] ${pathname === '/' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF] pb-1' : ''}`}>LINEAGE</Link>
            <Link href="/" className={`transition-all hover:text-[#00E5FF] ${pathname.includes('/engine') ? 'text-[#00E5FF] border-b-2 border-[#00E5FF] pb-1' : ''}`}>ENGINE</Link>
            <Link href="/timeline" className={`transition-all hover:text-[#00E5FF] ${pathname === '/timeline' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF] pb-1' : ''}`}>LOGS</Link>
            <Link href="/evaluate" className={`transition-all hover:text-[#00E5FF] ${pathname === '/evaluate' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF] pb-1' : ''}`}>SENTINEL</Link>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7A90]" />
            <input 
              type="text" 
              placeholder="QUERY_ID..." 
              className="bg-[#111721] border border-[#1d2737] rounded focus:outline-none focus:border-[#00E5FF] text-[10px] py-2 pl-9 pr-4 w-60 transition-all font-mono"
            />
          </div>
          <div className="flex gap-4 text-[#6B7A90]">
            <Settings className="w-4 h-4 hover:text-[#00E5FF] cursor-pointer transition-colors" />
            <TerminalSquare className="w-4 h-4 hover:text-[#00E5FF] cursor-pointer transition-colors" />
            <div className="relative">
              <Bell className="w-4 h-4 hover:text-[#00E5FF] cursor-pointer transition-colors" />
              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#ff5b5b] rounded-full border border-[#06090e]"></div>
            </div>
            <div className="w-7 h-7 rounded bg-[#1f2b38] flex items-center justify-center border border-[#303e50] ml-2 cursor-pointer hover:border-[#00E5FF] transition-all">
              <User className="w-4 h-4 text-[#00E5FF]" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-[210px] flex flex-col justify-between border-r border-[#1a2230] bg-[#080B10] shrink-0 p-5 z-40">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-3 mb-2 p-3 rounded bg-gradient-to-br from-[#121c26] to-[#0A0F15] border border-[#1a2533] shadow-lg shadow-[#00f0ff]/5">
              <div className="mt-1 text-[#00E5FF]"><Zap className="w-5 h-5" fill="currentColor" /></div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-[11px] tracking-wider">CORE_ENGINE</span>
                <span className="text-[#00E5FF] text-[9px] tracking-widest font-mono">V2.0.4-STABLE</span>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5">
              <Link href="/" className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-all ${pathname === '/' ? 'bg-[#121C26] text-[#00E5FF] border-l-2 border-[#00E5FF] rounded-r' : 'text-[#6B7A90] hover:text-white hover:bg-white/5'}`}>
                <GitBranch className="w-4 h-4" />
                <span className="text-[11px] font-bold tracking-wide">Lineage</span>
              </Link>
              <Link href="/" className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-all ${pathname.includes('/engine') ? 'bg-[#121C26] text-[#00E5FF] border-l-2 border-[#00E5FF] rounded-r' : 'text-[#6B7A90] hover:text-white hover:bg-white/5'}`}>
                <Activity className="w-4 h-4" />
                <span className="text-[11px] font-bold tracking-wide">Engine</span>
              </Link>
              <Link href="/timeline" className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-all ${pathname === '/timeline' ? 'bg-[#121C26] text-[#00E5FF] border-l-2 border-[#00E5FF] rounded-r' : 'text-[#6B7A90] hover:text-white hover:bg-white/5'}`}>
                <TerminalSquare className="w-4 h-4" />
                <span className="text-[11px] font-bold tracking-wide">Logs</span>
              </Link>
              <Link href="/evaluate" className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-all ${pathname === '/evaluate' ? 'bg-[#121C26] text-[#00E5FF] border-l-2 border-[#00E5FF] rounded-r' : 'text-[#6B7A90] hover:text-white hover:bg-white/5'}`}>
                <Shield className="w-4 h-4" />
                <span className="text-[11px] font-bold tracking-wide">Sentinel</span>
              </Link>
            </nav>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 neon-btn w-full py-3 rounded text-[10px] font-black tracking-widest text-[#00E5FF] border border-[#00E5FF]/30 shadow-lg shadow-[#00f0ff]/10"
            >
              DEPLOY NEW NODE
            </motion.button>
          </div>

          <div className="flex flex-col gap-3 text-[#6B7A90] text-[10px] font-bold tracking-wider">
            <div className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
              <span>DOCUMENTATION</span>
            </div>
            <div className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors">
              <LifeBuoy className="w-4 h-4" />
              <span>SUPPORT</span>
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 overflow-hidden bg-[#0B1017] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* BOTTOM STATUS BAR */}
      <footer className="h-[35px] flex items-center justify-between px-6 border-t border-[#1a2230] bg-[#06090E] shrink-0 text-[10px] font-mono font-bold text-[#6B7A90] relative z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${healthStatus ? 'bg-[#39ff14] shadow-[0_0_10px_#39ff14]' : 'bg-[#ff5b5b] shadow-[0_0_10px_#ff5b5b] animate-pulse'}`}></div>
            <span className="text-white tracking-[0.2em]">{healthStatus ? 'STREAM ACTIVE' : 'SYSTEM DISCONNECTED'}</span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <span>TX_ID:</span>
            <span className="text-white">F8A2-991C-42X0</span>
          </div>
        </div>
        <div className="flex items-center gap-8 pr-12">
          <div className="flex gap-3">
            <span className="opacity-50 tracking-widest">CPU_LOAD</span>
            <span className="text-[#00E5FF] transition-all">14.2%</span>
          </div>
          <div className="flex gap-3">
             <span className="opacity-50 tracking-widest">QUEUE_LAT</span>
             <span className="text-[#39ff14]">0.0 ms</span>
          </div>
        </div>
        {/* Decorative middle cutout */}
        <div className="absolute left-1/2 bottom-0 w-[120px] h-3.5 bg-[#111721] rounded-t-[20px] -translate-x-1/2 border-t border-l border-r border-[#1a2230] flex items-center justify-center">
            <div className="w-10 h-1 bg-white/5 rounded-full" />
        </div>
      </footer>
    </div>
  );
}
