
import React from 'react';
import { CouncilMember } from '../types';
import { LucideIcon, AlertCircle, Heart, User, Info, MessageCircle } from 'lucide-react';

interface CouncilRowProps {
  role: string;
  data: CouncilMember;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

const CouncilRow: React.FC<CouncilRowProps> = ({ role, data, icon: Icon, colorClass, bgClass }) => {
  // 防禦性檢查：若 data 本身為空則直接不渲染
  if (!data) return null;
  
  const textColor = colorClass?.replace('border', 'text')?.replace('200', '700') ?? 'text-slate-400';
  const iconColor = colorClass?.replace('border', 'text')?.replace('200', '400') ?? 'text-slate-500';

  return (
    <div className={`w-full p-5 lg:p-6 rounded-[2.5rem] border-l-8 border ${colorClass} ${bgClass} transition-all hover:translate-x-1 duration-300 mb-4 shadow-xl backdrop-blur-md relative group/card`}>
      <div className="flex flex-col sm:flex-row gap-5 lg:gap-6">
        <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:w-28 lg:w-32 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-800/50 pb-4 sm:pb-0 sm:pr-6">
          <div className="relative">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt={role} className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl border-2 border-white/10 shadow-lg object-cover" />
            ) : (
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-slate-800 border-2 border-white/5 flex items-center justify-center">
                <User className="w-8 h-8 text-slate-600" />
              </div>
            )}
            <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-slate-950 border border-white/10 shadow-lg ${iconColor}`}>
               <Icon className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className={`text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] ${textColor} mt-2 text-center`}>{role}</span>
        </div>

        <div className="flex-1 space-y-3 lg:space-y-4">
          <div className="relative">
            <p className="text-sm lg:text-base font-serif font-medium text-slate-200 leading-relaxed italic">
              {data.stance || "分析模組加載中..."}
            </p>
            {data.critical_to && (
              <div className="mt-2 text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <MessageCircle className="w-3 h-3" /> Blind Spot: {data.critical_to}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative group/tooltip">
              <div className="flex items-start gap-3 bg-black/20 p-3 rounded-2xl border border-white/5 cursor-help hover:border-amber-500/30 transition-all">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500/70" />
                <div className="flex-1 overflow-hidden">
                  <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest flex items-center gap-1">Logic Friction <Info className="w-2 h-2" /></span>
                  <p className="text-[10px] text-slate-500 truncate">{data.conflict_point || "無顯著衝突"}</p>
                </div>
              </div>
              <div className="absolute bottom-full left-0 mb-3 w-64 p-4 bg-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-200 z-50 backdrop-blur-xl translate-y-2 group-hover/tooltip:translate-y-0 text-[11px] text-slate-300 font-serif italic">
                {data.conflict_point || "本路徑邏輯自洽"}
              </div>
            </div>

            <div className="relative group/tooltip">
              <div className="flex items-start gap-3 bg-black/20 p-3 rounded-2xl border border-white/5 cursor-help hover:border-emerald-500/30 transition-all">
                <Heart className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400/70" />
                <div className="flex-1 overflow-hidden">
                  <span className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest flex items-center gap-1">Benevolence Audit <Info className="w-2 h-2" /></span>
                  <p className="text-[10px] text-slate-500 truncate">{data.benevolence_check || "等待審核"}</p>
                </div>
              </div>
              <div className="absolute bottom-full right-0 mb-3 w-64 p-4 bg-slate-900 border border-emerald-500/20 rounded-2xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-200 z-50 backdrop-blur-xl translate-y-2 group-hover/tooltip:translate-y-0 text-[11px] text-slate-300 font-serif italic">
                {data.benevolence_check || "正在驗證回應的善意導向"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouncilRow;
