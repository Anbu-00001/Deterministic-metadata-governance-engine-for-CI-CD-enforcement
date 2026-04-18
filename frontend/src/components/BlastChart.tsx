'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BlastChartProps {
  radius: number;
}

export default function BlastChart({ radius }: BlastChartProps) {
  // We'll visualize the blast radius against some hypothetical threshold context
  // to make the chart meaningful, or just show a single bar for the current entity.
  const data = [
    {
      name: 'Current Entity',
      radius: radius,
    }
  ];

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Blast Radius</h4>
        <p className="text-3xl font-light text-white">{radius}</p>
      </div>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '4px', color: '#fff' }}
            />
            <Bar dataKey="radius" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.radius > 5 ? '#ef4444' : '#f59e0b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
