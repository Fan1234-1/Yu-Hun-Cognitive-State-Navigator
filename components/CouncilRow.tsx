
import React, { useState } from 'react';
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
  if (!data) return null;
  
  const textColor = colorClass.replace('border', 'text').replace('200', '700');
  const iconColor = colorClass.replace('border', 'text').replace('200', '400');

  return (
    <div className={`w-full p-6 rounded-[2.5rem] border-l-8 border ${colorClass} ${bgClass} transition-all hover:translate-x-2 duration-500 mb-4 shadow-xl backdrop-blur-md relative group/card`}>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:w-32 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-800/50 pb-4 sm:pb-0 sm:pr-6">
          <div className="relative">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt={role} className="w-20 h-20 rounded-2xl border-2 border-white/10 shadow-lg object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-white/5 flex items-center justify-center">
                <User className="w-10 h-10 text-slate-600" />
              </div>
            )}
            <div className={`absolute -bottom-2 -right-2 p-2 rounded-xl bg-slate-950 border border-white/10 shadow-lg ${iconColor}`}>
               <Icon className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${textColor} mt-2`}>{role}</span>
        </div>

        <div className="flex-1 space-y-4">
          <div className="relative">
            <p className="text-lg font-serif font-medium text-slate-100 leading-relaxed italic">
              {data.stance || "審議中..."}
            </p>
            {data.critical_to && (
              <div className="mt-2 text-[11px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <MessageCircle className="w-3 h-3" /> Blind Spot: {data.critical_to}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Conflict Point Tooltip */}
            <div className="relative group/tooltip">
              <div className="flex items-start gap-3 bg-black/30 p-3 rounded-2xl border border-white/5 cursor-help hover:border-amber-500/30 transition-all">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                <div className="flex-1 overflow-hidden">
                  <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest flex items-center gap-1">Friction <Info className="w-2 h-2" /></span>
                  <p className="text-[11px] text-slate-400 truncate">{data.conflict_point}</p>
                </div>
              </div>
              
              {/* Tooltip Card */}
              <div className="absolute bottom-full left-0 mb-4 w-72 p-5 bg-slate-900/95 border border-amber-500/30 rounded-3xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 z-50 backdrop-blur-xl translate-y-2 group-hover/tooltip:translate-y-0">
                <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Cognitive Tension Detail</h5>
                <p className="text-xs text-slate-200 font-serif leading-relaxed italic">{data.conflict_point}</p>
                <div className="absolute top-full left-6 border-8 border-transparent border-t-slate-900"></div>
              </div>
            </div>

            {/* Benevolence Check Tooltip */}
            <div className="relative group/tooltip">
              <div className="flex items-start gap-3 bg-black/30 p-3 rounded-2xl border border-white/5 cursor-help hover:border-emerald-500/30 transition-all">
                <Heart className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                <div className="flex-1 overflow-hidden">
                  <span className="text-[9px] font-black text-emerald-400/80 uppercase tracking-widest flex items-center gap-1">Audit <Info className="w-2 h-2" /></span>
                  <p className="text-[11px] text-slate-400 truncate">{data.benevolence_check}</p>
                </div>
              </div>

              {/* Tooltip Card */}
              <div className="absolute bottom-full right-0 mb-4 w-72 p-5 bg-slate-900/95 border border-emerald-500/30 rounded-3xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 z-50 backdrop-blur-xl translate-y-2 group-hover/tooltip:translate-y-0">
                <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Benevolence Verification</h5>
                <p className="text-xs text-slate-200 font-serif leading-relaxed italic">{data.benevolence_check}</p>
                <div className="absolute top-full right-6 border-8 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouncilRow;
