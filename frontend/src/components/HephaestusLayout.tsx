'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { fetchHealth } from '../lib/api';
import { 
  Search, Settings, Bell, User, Zap, GitBranch, Shield, 
  TerminalSquare, FileText, LifeBuoy, Activity
} from 'lucide-react';

export function HephaestusLayout({ children }: { children: React.ReactNode }) {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Keep checking health every 5 seconds
    const checkHealth = async () => {
      try {
        const health = await fetchHealth();
        setHealthStatus(health);
      } catch (e) {
        setHealthStatus(null);
      }
    };
    checkHealth();
    const intv = setInterval(checkHealth, 5000);
    return () => clearInterval(intv);
  }, []);

  return (
    <>
      {/* TOP NAV */}
      <header className="h-[60px] flex items-center justify-between px-6 border-b border-[#1a2230] bg-[#0A0F15] z-10 shrink-0">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <span className="text-[#00E5FF] font-black tracking-widest text-xl glow-text">HEPHAESTUS</span>
          </Link>
          <nav className="flex gap-6 text-[11px] font-bold tracking-widest text-[#6B7A90]">
            <Link href="/" className={`hover:text-gray-300 transition-colors ${pathname === '/' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF] pb-1' : ''}`}>LINEAGE</Link>
            <Link href="/" className={`hover:text-gray-300 transition-colors ${pathname.includes('/engine') ? 'text-[#00E5FF] border-b-2 border-[#00E5FF] pb-1' : ''}`}>ENGINE</Link>
            <Link href="/timeline" className={`hover:text-gray-300 transition-colors ${pathname === '/timeline' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF] pb-1' : ''}`}>LOGS</Link>
            <Link href="/evaluate" className={`hover:text-gray-300 transition-colors ${pathname === '/evaluate' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF] pb-1' : ''}`}>SENTINEL</Link>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7A90]" />
            <input 
              type="text" 
              placeholder="QUERY_ID..." 
              className="bg-[#111721] border border-[#1d2737] rounded focus:outline-none focus:border-[#00E5FF] text-xs py-2 pl-9 pr-4 w-64 transition-colors text-white"
            />
          </div>
          <div className="flex gap-4 text-[#6B7A90]">
            <Settings className="w-4 h-4 hover:text-[#00E5FF] cursor-pointer transition-colors" />
            <TerminalSquare className="w-4 h-4 hover:text-[#00E5FF] cursor-pointer transition-colors" />
            <div className="relative">
              <Bell className="w-4 h-4 hover:text-[#00E5FF] cursor-pointer transition-colors" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff5b5b] rounded-full border border-[#06090e]"></div>
            </div>
            <div className="w-6 h-6 rounded bg-[#1f2b38] flex items-center justify-center border border-[#303e50] ml-2 cursor-pointer">
              <User className="w-4 h-4 text-[#00E5FF]" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-[220px] flex flex-col justify-between border-r border-[#1a2230] bg-[#080B10] shrink-0 p-5">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-3 mb-2 p-2 rounded bg-gradient-to-br from-[#121c26] to-[#0A0F15] border border-[#1a2533]">
              <div className="mt-1 text-[#00E5FF]"><Zap className="w-5 h-5" fill="currentColor" /></div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-xs tracking-wider">CORE_ENGINE</span>
                <span className="text-[#00E5FF] text-[10px] tracking-widest font-mono">V2.0.4-STABLE</span>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              <Link href="/" className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${pathname === '/' ? 'bg-[#121C26] text-[#00E5FF] border-l-2 border-[#00E5FF] rounded-r' : 'text-[#6B7A90] hover:text-white transition-colors'}`}>
                <GitBranch className="w-4 h-4" />
                <span className="text-xs font-bold tracking-wide">Lineage</span>
              </Link>
              <Link href="/" className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${pathname.includes('/engine') ? 'bg-[#121C26] text-[#00E5FF] border-l-2 border-[#00E5FF] rounded-r' : 'text-[#6B7A90] hover:text-white transition-colors'}`}>
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold tracking-wide">Engine</span>
              </Link>
              <Link href="/timeline" className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${pathname === '/timeline' ? 'bg-[#121C26] text-[#00E5FF] border-l-2 border-[#00E5FF] rounded-r' : 'text-[#6B7A90] hover:text-white transition-colors'}`}>
                <TerminalSquare className="w-4 h-4" />
                <span className="text-xs font-bold tracking-wide">Logs</span>
              </Link>
              <Link href="/evaluate" className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${pathname === '/evaluate' ? 'bg-[#121C26] text-[#00E5FF] border-l-2 border-[#00E5FF] rounded-r' : 'text-[#6B7A90] hover:text-white transition-colors'}`}>
                <Shield className="w-4 h-4" />
                <span className="text-xs font-bold tracking-wide">Sentinel</span>
              </Link>
            </nav>

            <button className="mt-4 neon-btn w-full py-3 rounded text-[11px] font-bold tracking-widest text-[#00E5FF]">
              DEPLOY NEW NODE
            </button>
          </div>

          <div className="flex flex-col gap-3 text-[#6B7A90] text-xs">
            <div className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
              <span>Documentation</span>
            </div>
            <div className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors">
              <LifeBuoy className="w-4 h-4" />
              <span>Support</span>
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="flex-1 overflow-auto bg-[#0B1017]">
          {children}
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <footer className="h-[30px] flex items-center justify-between px-6 border-t border-[#1a2230] bg-[#06090E] shrink-0 text-[10px] font-mono text-[#6B7A90] relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${healthStatus ? 'bg-[#39ff14] shadow-[0_0_5px_#39ff14]' : 'bg-[#ff5b5b] shadow-[0_0_5px_#ff5b5b] animate-pulse'}`}></div>
            <span className="text-white tracking-widest">{healthStatus ? 'STREAM ACTIVE' : 'SYSTEM DISCONNECTED'}</span>
          </div>
          <span>TX_ID: f8a2-991c-42x0</span>
        </div>
        <div className="flex items-center gap-6">
          <span>CPU LOAD <strong className="text-white">14.2%</strong></span>
          <span>QUEUE SIZE <strong className="text-white">0.0 ms</strong></span>
        </div>
        {/* Decorative middle cutout */}
        <div className="absolute left-1/2 bottom-0 w-[100px] h-3 bg-[#111721] rounded-t-[20px] -translate-x-1/2 border-t border-l border-r border-[#1a2230]"></div>
      </footer>
    </>
  );
}
