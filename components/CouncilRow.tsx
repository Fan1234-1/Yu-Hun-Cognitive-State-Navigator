
import React from 'react';
import { CouncilMember } from '../types';
import { LucideIcon, AlertCircle, Heart } from 'lucide-react';

interface CouncilRowProps {
  role: string;
  roleZh: string;
  data: CouncilMember;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

const CouncilRow: React.FC<CouncilRowProps> = ({ role, roleZh, data, icon: Icon, colorClass, bgClass }) => {
  if (!data) return null;
  
  const textColor = colorClass.replace('border', 'text').replace('200', '700');
  const iconColor = colorClass.replace('border', 'text').replace('200', '400');

  return (
    <div className={`w-full p-4 rounded-xl border-l-4 border ${colorClass} ${bgClass} transition-all hover:translate-x-1 duration-300 mb-3`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex sm:flex-col items-center sm:items-start gap-1 sm:w-32 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200/50 pb-2 sm:pb-0 sm:pr-4">
          <div className={`p-2 rounded-lg bg-white/20 shadow-sm ${iconColor}`}>
             <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${textColor}`}>{role}</span>
            <span className={`text-[9px] font-bold text-slate-500`}>{roleZh}</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium text-slate-100 leading-relaxed font-serif">
            {data.stance || "Analyzing... / 審議中..."}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.conflict_point && (
              <div className="flex items-start gap-2 bg-black/10 p-2 rounded-lg border border-white/5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <span className="text-[10px] font-bold text-amber-500/80 uppercase block">Friction / 衝突點</span>
                  <span className="text-[11px] text-slate-400">{data.conflict_point}</span>
                </div>
              </div>
            )}
            {data.benevolence_check && (
              <div className="flex items-start gap-2 bg-black/10 p-2 rounded-lg border border-white/5">
                <Heart className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
                <div>
                  <span className="text-[10px] font-bold text-emerald-400/80 uppercase block">Benevolence / 仁慈檢查</span>
                  <span className="text-[11px] text-slate-400">{data.benevolence_check}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouncilRow;
