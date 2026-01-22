
import React from 'react';
import { CouncilMember } from '../types';
import { LucideIcon, AlertCircle, Heart, User, Info, MessageCircle } from 'lucide-react';

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
  
  const textColor = colorClass?.replace('border', 'text') ?? 'text-slate-400';
  const iconColor = colorClass?.replace('border', 'text') ?? 'text-slate-500';

  return (
    <div className={`w-full p-5 rounded-[2rem] border-l-4 border ${colorClass} ${bgClass} transition-all duration-300 mb-4 shadow-lg backdrop-blur-md relative group/card`}>
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="flex sm:flex-col items-center gap-2 sm:w-28 shrink-0 border-b sm:border-b-0 sm:border-r border-white/5 pb-4 sm:pb-0 sm:pr-4">
          <div className="relative">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt={role} className="w-14 h-14 rounded-xl border border-white/10 object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center">
                <User className="w-6 h-6 text-slate-600" />
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 p-1 rounded-md bg-slate-950 border border-white/10 ${iconColor}`}>
               <Icon className="w-3 h-3" />
            </div>
          </div>
          <div className="text-center">
            <span className={`text-[10px] font-black uppercase tracking-tighter ${textColor} block`}>{role}</span>
            <span className="text-[9px] font-bold text-slate-500 block">{roleZh}</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-sm font-serif text-slate-200 leading-relaxed italic">
            {data.stance || "Analyzing... / 正在分析數據..."}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
              <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest block mb-1">Logic Friction / 邏輯摩擦</span>
              <p className="text-[10px] text-slate-500 truncate">{data.conflict_point || "None / 無明顯衝突"}</p>
            </div>

            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
              <span className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest block mb-1">Benevolence / 善意審核</span>
              <p className="text-[10px] text-slate-500 truncate">{data.benevolence_check || "Verified / 驗證通過"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouncilRow;
