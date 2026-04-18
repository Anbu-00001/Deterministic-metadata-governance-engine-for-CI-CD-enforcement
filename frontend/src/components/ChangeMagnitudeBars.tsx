'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ChangeMagnitudeBarsProps {
  data?: number[];
}

export const ChangeMagnitudeBars: React.FC<ChangeMagnitudeBarsProps> = ({ data = [0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.9, 0.6] }) => {
  return (
    <div className="flex items-end justify-between flex-1 gap-2 mx-2 h-24">
      {data.map((val, idx) => (
        <React.Fragment key={idx}>
          {/* Baseline dummy bar */}
          <div className="w-5 bg-[#253245] h-[40%] rounded-t-sm opacity-30"></div>
          
          {/* Active bar */}
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${val * 100}%` }}
            transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
            className={`w-5 rounded-t-sm shadow-[0_0_8px_rgba(0,229,255,0.4)] ${idx % 2 === 0 ? 'bg-[#00E5FF]' : 'bg-[#00E5FF]/60'}`}
          />
        </React.Fragment>
      ))}
    </div>
  );
};
