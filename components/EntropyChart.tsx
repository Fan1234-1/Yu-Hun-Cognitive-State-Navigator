
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceArea, Tooltip } from 'recharts';
import { SoulStateNode } from '../types';

interface EntropyChartProps {
  history: SoulStateNode[];
}

const EntropyChart: React.FC<EntropyChartProps> = ({ history }) => {
  const data = history
    .filter(n => !n.isError)
    .map((n, i) => ({
      time: i,
      entropy: n.deliberation.entropy_meter.value,
      label: `Node ${i + 1}`
    }));

  return (
    <div className="h-48 w-full bg-slate-900/50 rounded-xl border border-slate-800 p-2 overflow-hidden relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="entropyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 1]} hide />
          
          <ReferenceArea y1={0.7} y2={1.0} fill="#ef4444" fillOpacity={0.1} />
          <ReferenceArea y1={0.3} y2={0.7} fill="#a855f7" fillOpacity={0.1} />
          <ReferenceArea y1={0.0} y2={0.3} fill="#3b82f6" fillOpacity={0.1} />
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '10px' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Area 
            type="monotone" 
            dataKey="entropy" 
            stroke="#a855f7" 
            strokeWidth={3} 
            fill="url(#entropyGrad)" 
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="absolute right-3 top-3 text-[9px] font-mono space-y-1 text-right pointer-events-none opacity-50 uppercase tracking-widest">
        <div className="text-red-400">Chaos > 0.7</div>
        <div className="text-purple-400">Friction 0.3 - 0.7</div>
        <div className="text-blue-400">Echo &lt; 0.3</div>
      </div>
    </div>
  );
};

export default EntropyChart;
