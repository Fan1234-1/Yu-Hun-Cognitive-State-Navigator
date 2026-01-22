
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, ArrowRight, Shield, 
  Lightbulb, Brain, Cpu, X, 
  History, Settings, Zap, Compass,
  Heart, RotateCw, BarChart3, Fingerprint, Eye,
  Search, Info, Terminal, Link2, Ghost,
  Layers, AlertTriangle, CheckCircle2, Loader2,
  Sparkles, Quote, Users
} from 'lucide-react';
import { deliberate, generateInsight, generateAvatar } from './geminiService';
import { SoulStateNode, InsightReport } from './types';
import CouncilRow from './components/CouncilRow';
import EntropyChart from './components/EntropyChart';

const App: React.FC = () => {
  const [history, setHistory] = useState<SoulStateNode[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<InsightReport | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('yuhun_v53_stable');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          setSelectedNodeId(parsed[parsed.length - 1].id);
        }
      } catch (e) { 
        localStorage.removeItem('yuhun_v53_stable');
      }
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('yuhun_v53_stable', JSON.stringify(history));
    }
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || inputText;
    if (!textToSend.trim() || loading) return;
    
    setInputText('');
    setLoading(true);
    setLoadingPhase('VMT-2601 並行議會啟動...');

    try {
      const result = await deliberate(textToSend, history);
      if (result) {
        const newNode: SoulStateNode = {
          id: `node_${Date.now()}`,
          timestamp: Date.now(),
          input: textToSend,
          deliberation: result as any
        };
        setHistory(prev => [...prev, newNode]);
        setSelectedNodeId(newNode.id);

        setLoadingPhase(' Manifesting Spiritual Avatars...');
        const roles = ['philosopher', 'engineer', 'guardian'];
        Promise.all(roles.map(r => generateAvatar(r))).then(avatars => {
          setHistory(prev => prev.map(n => n.id === newNode.id ? {
            ...n,
            deliberation: {
              ...n.deliberation,
              council_chamber: {
                philosopher: { ...n.deliberation?.council_chamber?.philosopher, avatarUrl: avatars[0] || undefined },
                engineer: { ...n.deliberation?.council_chamber?.engineer, avatarUrl: avatars[1] || undefined },
                guardian: { ...n.deliberation?.council_chamber?.guardian, avatarUrl: avatars[2] || undefined },
              }
            }
          } : n));
        });
      } else {
        throw new Error("Deliberation returned null");
      }
    } catch (err) { 
      console.error(err);
      alert("思想連結超時或中斷。"); 
    } finally { 
      setLoading(false); 
      setLoadingPhase(''); 
    }
  };

  const currentNode = useMemo(() => {
    if (history.length === 0) return null;
    const found = history.find(n => n.id === selectedNodeId);
    return found || history[history.length - 1] || null;
  }, [history, selectedNodeId]);

  const handleOpenReport = async () => {
    if (history.length < 1) return;
    setReportLoading(true);
    setShowReport(true);
    setReportData(null); // 先清除舊資料防崩潰
    try {
      const data = await generateInsight(history);
      if (data) setReportData(data);
    } catch (e) {
      console.error("Report generation failed", e);
    } finally {
      setReportLoading(false);
    }
  };

  // 防崩潰 UI 保護：如果 currentNode 為空，顯示引導畫面
  if (history.length === 0 && !loading) {
    return (
      <div className="flex h-screen bg-[#02040a] items-center justify-center p-8 overflow-hidden">
        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700">
           <div className="relative inline-block">
              <Compass className="w-24 h-24 text-indigo-500 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-0 bg-indigo-500/20 blur-[80px]" />
           </div>
           <h1 className="text-4xl font-black text-white uppercase tracking-[0.5em] italic">Yu-Hun vMT</h1>
           <p className="text-slate-500 font-serif italic max-w-md mx-auto">「請注入第一絲思想，開啟複用思維審議系統。」</p>
           <div className="max-w-xl mx-auto flex gap-4 mt-12">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="在此注入指令..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none text-white font-serif text-lg focus:border-indigo-500/40"
              />
              <button onClick={() => handleSend()} className="p-4 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-500 shadow-xl transition-all">
                <ArrowRight className="w-6 h-6" />
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#02040a] text-slate-300 overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black/40 flex flex-col hidden lg:flex shrink-0 backdrop-blur-3xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-indigo-500" />
            <h1 className="font-black text-white text-sm tracking-tighter uppercase italic">Yu-Hun vMT</h1>
          </div>
          <button onClick={() => { setHistory([]); localStorage.removeItem('yuhun_v53_stable'); }} className="p-2 hover:bg-red-500/10 rounded-xl transition-all">
            <RotateCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="p-6 border-b border-white/5">
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-4">Neural Tension Chart</span>
           <EntropyChart history={history} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {history.slice().reverse().map((node) => (
            <button 
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 ${
                selectedNodeId === node.id ? 'bg-indigo-600/10 border-indigo-500/40 shadow-xl' : 'border-transparent hover:bg-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] font-mono text-slate-600">{new Date(node.timestamp).toLocaleTimeString()}</span>
                {node.deliberation?.audit?.audit_verdict && (
                   <Shield className={`w-2.5 h-2.5 ${node.deliberation.audit.audit_verdict === 'Pass' ? 'text-emerald-500' : 'text-amber-500'}`} />
                )}
              </div>
              <h4 className="text-[10px] font-bold truncate text-slate-300">{node.input}</h4>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-white/5">
           <button 
             onClick={handleOpenReport}
             disabled={history.length < 1 || loading}
             className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl disabled:opacity-20"
           >
             <BarChart3 className="w-4 h-4" /> Final Audit Report
           </button>
        </div>
      </aside>

      {/* Main Deliberation */}
      <main className="flex-1 flex flex-col relative bg-[#010409]">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/20 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <Layers className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xs font-black uppercase text-white tracking-[0.2em]">VMT-2601 Hybrid Intelligence</h2>
          </div>
          <div className="flex items-center gap-3">
             {loading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
             <span className="text-[9px] font-mono text-slate-600">{history.length} Nodes</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-16 space-y-20 max-w-5xl mx-auto w-full custom-scrollbar">
          
          {currentNode ? (
            <div key={currentNode.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* User Input Section */}
              <div className="flex items-start gap-8 mb-16">
                 <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center shrink-0 shadow-lg">
                    <History className="w-8 h-8 text-indigo-500/40" />
                 </div>
                 <div className="flex-1 pt-2">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-3 block">Instruction Received</span>
                    <h3 className="text-2xl md:text-3xl font-serif font-black text-white italic tracking-tight leading-relaxed">{currentNode.input}</h3>
                 </div>
              </div>

              {/* Council Debate */}
              <div className="space-y-4 mb-20">
                 <div className="flex items-center gap-3 mb-8 opacity-40">
                    <Users className="w-4 h-4" />
                    <h4 className="text-[9px] font-black uppercase tracking-[0.4em]">Multi-Agent Chamber</h4>
                 </div>
                 {currentNode.deliberation?.council_chamber && (
                   <>
                     <CouncilRow role="Philosopher" data={currentNode.deliberation.council_chamber.philosopher} icon={Lightbulb} colorClass="border-amber-500/30" bgClass="bg-amber-500/5" />
                     <CouncilRow role="Engineer" data={currentNode.deliberation.council_chamber.engineer} icon={Cpu} colorClass="border-indigo-500/30" bgClass="bg-indigo-500/5" />
                     <CouncilRow role="Guardian" data={currentNode.deliberation.council_chamber.guardian} icon={Shield} colorClass="border-emerald-500/30" bgClass="bg-emerald-500/5" />
                   </>
                 )}
              </div>

              {/* Internal Monologue */}
              {currentNode.deliberation?.final_synthesis?.thinking_monologue && (
                 <div className="mb-20 p-10 rounded-[3rem] bg-indigo-500/[0.03] border border-indigo-500/10">
                    <div className="flex items-center gap-3 mb-6">
                       <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                       <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Synthesizer Reflection</span>
                    </div>
                    <p className="text-lg font-serif text-slate-400 leading-relaxed italic">
                       {currentNode.deliberation.final_synthesis.thinking_monologue}
                    </p>
                 </div>
              )}

              {/* Final Synthesis - REFINED SIZE */}
              <div className="bg-slate-900/40 border border-white/5 rounded-[4rem] p-12 lg:p-20 relative overflow-hidden group shadow-2xl">
                <div className="flex items-center gap-8 mb-12">
                  <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20">
                    <Heart className="w-10 h-10 text-red-500" />
                  </div>
                  <div>
                    <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1 block">Output Matrix</span>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-widest">{currentNode.deliberation?.decision_matrix?.ai_strategy_name ?? "Neutral"}</span>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl lg:text-4xl font-serif text-slate-100 leading-snug italic tracking-tight">
                  {currentNode.deliberation?.final_synthesis?.response_text ?? "回應加載失敗。"}
                </p>
                
                {/* Shadows - Subtle UI */}
                {currentNode.deliberation?.shadows && currentNode.deliberation.shadows.length > 0 && (
                   <div className="mt-16 pt-12 border-t border-white/5 opacity-50 hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-600 block mb-8">Sublimated Shadows</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         {currentNode.deliberation.shadows.map((s, idx) => (
                            <div key={idx} className="p-6 rounded-[2.5rem] bg-black/30 border border-white/5">
                               <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{s.source}</span>
                               <p className="mt-3 text-[11px] text-slate-400 italic font-serif leading-relaxed">"{s.conflict_reason}"</p>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-32 space-y-6">
               <Brain className="w-16 h-16 opacity-10 animate-pulse" />
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-12 py-32">
               <div className="w-24 h-24 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
               <div className="text-center">
                  <h4 className="text-xl font-black uppercase tracking-[0.5em] text-white animate-pulse">Deliberating</h4>
                  <p className="text-[9px] text-indigo-400 mt-4 font-mono font-bold">{loadingPhase}</p>
               </div>
            </div>
          )}
          <div ref={scrollRef} className="h-32" />
        </div>

        {/* Input Dock */}
        <div className="p-8 pb-12 border-t border-white/5 bg-black/60 backdrop-blur-3xl sticky bottom-0 z-40">
          <div className="max-w-4xl mx-auto flex gap-6 items-center">
             <div className="flex-1 relative">
                <input 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="注入您的思想指令..."
                  disabled={loading}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-[2.5rem] px-10 py-6 focus:border-indigo-500/40 outline-none text-white font-serif text-2xl shadow-xl transition-all"
                />
             </div>
             <button 
               onClick={() => handleSend()}
               disabled={loading || !inputText.trim()}
               className="w-20 h-20 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-indigo-500/20 shadow-xl transition-all active:scale-90"
             >
               <ArrowRight className="w-10 h-10" />
             </button>
          </div>
        </div>
      </main>

      {/* Trajectory Report Modal - REFINED SIZES */}
      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="bg-[#020617] border border-white/10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[4rem] shadow-2xl flex flex-col relative">
              <div className="p-10 border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <BarChart3 className="w-8 h-8 text-indigo-500" />
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Soul Trajectory Insights</h2>
                 </div>
                 <X className="w-10 h-10 text-slate-600 cursor-pointer hover:text-white transition-colors" onClick={() => setShowReport(false)} />
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 lg:p-16 custom-scrollbar">
                {reportLoading ? (
                   <div className="h-96 flex flex-col items-center justify-center gap-8">
                      <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.6em] animate-pulse">Analyzing Neural History...</p>
                   </div>
                ) : reportData ? (
                   <div className="space-y-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
                      <section className="text-center space-y-8">
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em]">Emotional Arc Analysis</span>
                         <p className="text-2xl lg:text-3xl font-serif text-slate-100 italic leading-relaxed tracking-tight max-w-3xl mx-auto">
                           "{reportData.emotional_arc ?? "分析異常"}"
                         </p>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="p-10 bg-white/[0.02] rounded-[3rem] border border-white/5 space-y-8">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Key Insights</h4>
                            <ul className="space-y-5">
                               {(reportData.key_insights ?? []).map((insight, i) => (
                                  <li key={i} className="flex gap-4 text-slate-300 font-serif italic text-lg leading-relaxed">
                                     <span className="text-indigo-600 font-black shrink-0">#</span> {insight}
                                  </li>
                               ))}
                            </ul>
                         </div>
                         <div className="p-10 bg-white/[0.02] rounded-[3rem] border border-white/5 space-y-8">
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Hidden Needs</h4>
                            <p className="text-xl lg:text-2xl font-serif text-slate-100 italic leading-relaxed">
                               {reportData.hidden_needs ?? "無顯著需求提取"}
                            </p>
                            <div className="pt-10 grid grid-cols-2 gap-8 border-t border-white/5">
                               <div>
                                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Neural Connection</span>
                                  <div className="text-3xl font-mono font-black text-indigo-400">{(reportData.navigator_rating?.connection_score ?? 0) * 10}%</div>
                                </div>
                               <div>
                                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Growth Prob.</span>
                                  <div className="text-3xl font-mono font-black text-emerald-400">{(reportData.navigator_rating?.growth_score ?? 0) * 10}%</div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <section className="bg-indigo-600 text-white p-12 lg:p-16 rounded-[4rem] text-center space-y-8 shadow-2xl relative overflow-hidden">
                         <Sparkles className="w-10 h-10 mx-auto" />
                         <p className="text-xl lg:text-3xl font-serif italic tracking-tight leading-relaxed max-w-2xl mx-auto">
                            {reportData.closing_advice ?? "系統核心建議已坍縮。"}
                         </p>
                      </section>
                   </div>
                ) : (
                   <div className="h-96 flex flex-col items-center justify-center gap-6">
                      <AlertTriangle className="w-12 h-12 text-red-500/30" />
                      <p className="text-slate-500 italic text-lg">軌跡信號異常，請稍後重試。</p>
                      <button onClick={handleOpenReport} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold uppercase text-[9px] tracking-widest">Retry Report</button>
                   </div>
                )}
              </div>
              <div className="p-10 border-t border-white/5 bg-black/40 flex justify-end">
                 <button onClick={() => setShowReport(false)} className="px-16 py-5 rounded-[2rem] bg-white text-black font-black uppercase text-[10px] tracking-[0.4em] transition-all active:scale-95 shadow-xl">Close Terminal</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 40px; }
      `}</style>
    </div>
  );
};

export default App;
