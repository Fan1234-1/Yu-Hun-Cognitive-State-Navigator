
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, ArrowRight, Shield, 
  Lightbulb, Brain, Cpu, X, 
  History, Settings, Zap, Compass,
  Heart, RotateCw, BarChart3, Fingerprint, Eye,
  Search, Info, Terminal, Link2, Ghost,
  Layers, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { deliberate, generateInsight, generateAvatar } from './geminiService';
import { SoulStateNode, InsightReport, FilterCriteria } from './types';
import CouncilRow from './components/CouncilRow';
import EntropyChart from './components/EntropyChart';

const App: React.FC = () => {
  const [history, setHistory] = useState<SoulStateNode[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditNode, setAuditNode] = useState<SoulStateNode | null>(null);
  const [reportData, setReportData] = useState<InsightReport | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showSystemMeta, setShowSystemMeta] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('yuhun_v52_vmt');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('yuhun_v52_vmt', JSON.stringify(history));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || inputText;
    if (!textToSend.trim() || loading) return;
    
    setInputText('');
    setLoading(true);
    setLoadingPhase('並行派發三方角色 (Parallel Dispatch)...');

    try {
      const result = await deliberate(textToSend, history.slice(-5));
      if (result) {
        const newNodeId = `node_${Date.now()}`;
        const newNode: SoulStateNode = {
          id: newNodeId,
          timestamp: Date.now(),
          input: textToSend,
          deliberation: result
        };
        setHistory(prev => [...prev, newNode]);
        setSelectedNodeId(newNodeId);

        setLoadingPhase('同步生成靈魂頭像...');
        Promise.all([
          generateAvatar('philosopher'),
          generateAvatar('engineer'),
          generateAvatar('guardian')
        ]).then(([phi, eng, gua]) => {
          setHistory(prev => prev.map(node => node.id === newNodeId ? {
            ...node,
            deliberation: {
              ...node.deliberation,
              council_chamber: {
                philosopher: { ...node.deliberation.council_chamber.philosopher, avatarUrl: phi || undefined },
                engineer: { ...node.deliberation.council_chamber.engineer, avatarUrl: eng || undefined },
                guardian: { ...node.deliberation.council_chamber.guardian, avatarUrl: gua || undefined },
              }
            }
          } : node));
        });
      }
    } catch (err) { console.error(err); } finally { setLoading(false); setLoadingPhase(''); }
  };

  const currentNode = useMemo(() => {
    return selectedNodeId ? history.find(n => n.id === selectedNodeId) : (history.length > 0 ? history[history.length - 1] : null);
  }, [history, selectedNodeId]);

  return (
    <div className="flex h-screen bg-[#010409] text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-indigo-500" />
            <h1 className="font-black tracking-tighter text-white text-base leading-none uppercase">Yu-Hun vMT</h1>
          </div>
          <button onClick={() => setHistory([])} className="p-2 hover:bg-red-500/10 rounded-xl transition-all">
            <RotateCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800">
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4">Trajectory Memory</span>
           <EntropyChart history={history} />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {history.slice().reverse().map((node) => (
            <button 
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                selectedNodeId === node.id ? 'bg-indigo-600/10 border-indigo-500/40 shadow-xl' : 'border-transparent hover:bg-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono opacity-50">{new Date(node.timestamp).toLocaleTimeString()}</span>
                <div className="flex items-center gap-2">
                  {node.deliberation.audit && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setAuditNode(node);
                        setShowAuditModal(true);
                      }}
                      className="p-1 rounded-md hover:bg-emerald-500/20 transition-colors group/audit"
                      title="View Audit Report"
                    >
                      <Shield className={`w-3 h-3 ${node.deliberation.audit.audit_verdict === 'Pass' ? 'text-emerald-500' : 'text-amber-500'}`} />
                    </div>
                  )}
                  <div className={`w-2 h-2 rounded-full ${node.deliberation.entropy_meter.value > 0.7 ? 'bg-red-500' : 'bg-cyan-500'}`} />
                </div>
              </div>
              <h4 className="text-[11px] font-bold truncate text-slate-300">{node.input}</h4>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Deliberation */}
      <main className="flex-1 flex flex-col relative bg-[#010409]">
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-5">
            <Layers className="w-5 h-5 text-indigo-500" />
            <div>
              <h2 className="text-sm font-black uppercase text-white tracking-widest">Multiplex Synthesizer VMT-2601</h2>
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Multi-Agent Orchestration Enabled</span>
            </div>
          </div>
          <button onClick={() => setShowSystemMeta(!showSystemMeta)} className={`p-3 rounded-xl border transition-all ${showSystemMeta ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>
               <Eye className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-16 max-w-5xl mx-auto w-full custom-scrollbar relative">
          
          {currentNode && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <div className="flex items-start gap-8 mb-16">
                 <div className="w-20 h-20 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-2xl">
                    <History className="w-8 h-8 text-slate-600" />
                 </div>
                 <div className="flex-1 pt-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 block">User Instruction (RE2 Filtered)</span>
                    <h3 className="text-4xl font-serif font-black text-white italic tracking-tight">{currentNode.input}</h3>
                 </div>
              </div>

              {/* Entropy & Tension */}
              <div className="mb-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                 <div className="md:col-span-4 bg-slate-900/40 p-10 rounded-[3rem] border border-slate-800/50 text-center relative group">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 block">Multiplex Tension (ΔT)</span>
                    <div className="text-7xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-red-500">
                      {(currentNode.deliberation.entropy_meter.value * 10).toFixed(2)}
                    </div>
                    <span className="text-[9px] font-bold text-indigo-400 uppercase mt-4 block tracking-tighter">Algorithm: vMT-Weighting</span>
                 </div>
                 <div className="md:col-span-8 space-y-6">
                    <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden p-1 border border-white/5">
                        <div 
                          className="h-full bg-indigo-600 transition-all duration-[2s] rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                          style={{ width: `${currentNode.deliberation.entropy_meter.value * 100}%` }}
                        />
                    </div>
                    <p className="text-xl text-slate-400 italic font-serif leading-relaxed px-4 border-l-2 border-indigo-500/30">
                       「{currentNode.deliberation.entropy_meter.status} 模式：系統正在評估各路徑之間的邏輯權重分佈。」
                    </p>
                 </div>
              </div>

              {/* Council Chamber */}
              <div className="space-y-8 mb-20">
                 <CouncilRow role="Philosopher" data={currentNode.deliberation.council_chamber.philosopher} icon={Lightbulb} colorClass="border-amber-500/30" bgClass="bg-amber-500/5" />
                 <CouncilRow role="Engineer" data={currentNode.deliberation.council_chamber.engineer} icon={Cpu} colorClass="border-indigo-500/30" bgClass="bg-indigo-500/5" />
                 <CouncilRow role="Guardian" data={currentNode.deliberation.council_chamber.guardian} icon={Shield} colorClass="border-emerald-500/30" bgClass="bg-emerald-500/5" />
              </div>

              {/* Logical Shadows */}
              {(currentNode.deliberation as any).shadows && (
                <div className="mb-20 space-y-6">
                  <div className="flex items-center gap-3">
                    <Ghost className="w-5 h-5 text-slate-600" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600">Logical Shadows (被犧牲的路徑)</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(currentNode.deliberation as any).shadows.map((s: any, idx: number) => (
                      <div key={idx} className="p-8 rounded-[2.5rem] bg-slate-950 border border-slate-800/50 opacity-60 hover:opacity-100 transition-opacity">
                         <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">From: {s.source}</span>
                         <p className="mt-4 text-sm text-slate-400 italic">衝突點: {s.conflict_reason}</p>
                         <div className="mt-6 flex items-start gap-2 text-xs text-red-400/70">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>坍縮代價: {s.collapse_cost}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Synthesis */}
              <div className="bg-slate-900/30 border border-slate-800 rounded-[4rem] p-12 lg:p-20 relative overflow-hidden group">
                <div className="flex items-center gap-8 mb-16">
                  <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20 shadow-2xl">
                    <Heart className="w-12 h-12 text-red-500" />
                  </div>
                  <div>
                    <span className="text-[14px] font-black text-slate-500 uppercase tracking-[0.5em] mb-1 block">Yu-Hun Synthesized Output</span>
                    <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest">Primary Strategy: {currentNode.deliberation.decision_matrix.ai_strategy_name}</span>
                  </div>
                </div>
                <p className="text-3xl md:text-5xl font-serif text-slate-100 leading-[1.4] italic tracking-tight">
                  {currentNode.deliberation.final_synthesis.response_text}
                </p>
                
                {currentNode.deliberation.next_moves.length > 0 && (
                  <div className="mt-20 pt-16 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {currentNode.deliberation.next_moves.map((move, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSend(move.text)}
                        className="p-8 rounded-[2.5rem] bg-slate-900/40 hover:bg-indigo-600 transition-all text-left border border-white/5 flex flex-col gap-3 group/btn"
                      >
                        <span className="font-black text-indigo-400 group-hover:text-white uppercase tracking-widest text-[9px]">{move.label}</span>
                        <span className="text-xl font-serif font-bold text-slate-200 group-hover:text-white">{move.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-12 py-32">
               <div className="w-32 h-32 rounded-full border-[6px] border-indigo-500/10 border-t-indigo-500 animate-spin" />
               <div className="text-center">
                  <h4 className="text-2xl font-black uppercase tracking-[0.5em] text-indigo-400 animate-pulse">Orchestrating...</h4>
                  <p className="text-xs text-slate-500 mt-4 font-mono">{loadingPhase}</p>
               </div>
            </div>
          )}
          <div ref={scrollRef} className="h-40" />
        </div>

        {/* Input Dock */}
        <div className="p-8 pb-12 border-t border-slate-800 bg-slate-950/90 backdrop-blur-2xl sticky bottom-0 z-30">
          <div className="max-w-4xl mx-auto flex gap-6 items-center">
             <input 
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="注入思想指令 (RE2 Processed)..."
               disabled={loading}
               className="flex-1 bg-slate-900/80 border border-slate-800 rounded-[2.5rem] px-10 py-7 focus:border-indigo-500/40 outline-none text-white font-serif text-2xl placeholder-slate-700"
             />
             <button 
               onClick={() => handleSend()}
               disabled={loading || !inputText.trim()}
               className="w-24 h-24 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl transition-all active:scale-90"
             >
               <ArrowRight className="w-10 h-10" />
             </button>
          </div>
        </div>
      </main>

      {/* Audit Modal */}
      {showAuditModal && auditNode && auditNode.deliberation.audit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#0d1117] border border-emerald-500/30 w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-emerald-500/5">
              <div className="flex items-center gap-4">
                <Shield className="w-8 h-8 text-emerald-500" />
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Audit Intelligence</h2>
                  <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Responsibility Trace Log</p>
                </div>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-6">
                 <div className="p-6 bg-slate-950 rounded-3xl border border-white/5 text-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Honesty Score</span>
                    <div className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-cyan-500">
                      {(auditNode.deliberation.audit.honesty_score * 100).toFixed(0)}%
                    </div>
                 </div>
                 <div className="p-6 bg-slate-950 rounded-3xl border border-white/5 text-center flex flex-col justify-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Verdict</span>
                    <div className={`text-2xl font-black uppercase tracking-tighter flex items-center justify-center gap-2 ${auditNode.deliberation.audit.audit_verdict === 'Pass' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {auditNode.deliberation.audit.audit_verdict === 'Pass' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      {auditNode.deliberation.audit.audit_verdict}
                    </div>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Audit Rationale</span>
                 <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5">
                   <p className="text-lg font-serif italic text-slate-300 leading-relaxed">
                     "{auditNode.deliberation.audit.audit_rationale}"
                   </p>
                 </div>
              </div>

              <div className="p-8 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10">
                 <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-4">Responsibility Check</span>
                 <p className="text-sm text-slate-400 leading-relaxed">
                   {auditNode.deliberation.audit.responsibility_check}
                 </p>
              </div>
              
              <div className="p-6 bg-slate-950 rounded-3xl border border-white/5">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Node Context</span>
                 <p className="text-xs text-slate-500 font-mono truncate italic">Input ID: {auditNode.id}</p>
                 <p className="text-sm text-slate-400 mt-2 truncate">"{auditNode.input}"</p>
              </div>
            </div>
            <div className="p-8 border-t border-white/5 flex justify-end bg-slate-950/40">
              <button 
                onClick={() => setShowAuditModal(false)}
                className="px-12 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insight Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
           <div className="bg-slate-900 border border-white/10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[4rem] shadow-2xl flex flex-col">
              <div className="p-12 border-b border-white/5 flex justify-between items-center">
                 <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Trajectory Insight Report</h2>
                 <X className="w-10 h-10 text-slate-500 cursor-pointer" onClick={() => setShowReport(false)} />
              </div>
              <div className="flex-1 overflow-y-auto p-16 space-y-20 custom-scrollbar">
                {/* Simplified report content */}
                <p className="text-center text-slate-500 italic">Trajectory analysis currently processing...</p>
              </div>
              <div className="p-12 border-t border-white/5 bg-slate-950/60 flex justify-end">
                 <button onClick={() => setShowReport(false)} className="px-20 py-6 rounded-3xl bg-white text-slate-950 font-black uppercase text-xs tracking-[0.4em]">Close Terminal</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 40px; }
      `}</style>
    </div>
  );
};

export default App;
