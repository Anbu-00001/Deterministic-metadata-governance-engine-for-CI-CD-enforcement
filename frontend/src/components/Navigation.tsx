import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function Navigation() {
  return (
    <nav className="border-b border-gray-800 bg-[#161b22] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-white font-semibold flex-shrink-0">
          <Shield className="w-5 h-5 text-indigo-500" />
          <span>Hephaestus</span>
        </Link>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/evaluate" className="text-gray-300 hover:text-white transition-colors">Evaluate</Link>
          <Link href="/timeline" className="text-gray-300 hover:text-white transition-colors">Timeline</Link>
        </div>
      </div>
    </nav>
  );
}
