
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

  // 初始化讀取歷史
  useEffect(() => {
    const saved = localStorage.getItem('yuhun_v55_bilingual');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          setSelectedNodeId(parsed[parsed.length - 1].id);
        }
      } catch (e) { 
        console.error("Storage Recovery Error", e);
        localStorage.removeItem('yuhun_v55_bilingual');
      }
    }
  }, []);

  // 自動保存與滾動
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('yuhun_v55_bilingual', JSON.stringify(history));
    }
    const timer = setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [history, loading]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || inputText;
    if (!textToSend.trim() || loading) return;
    
    setInputText('');
    setLoading(true);
    setLoadingPhase('VMT-2601 Hybrid Dispatch... / 系統調度中...');

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

        setLoadingPhase('Manifesting Avatars... / 頭像具像化中...');
        const roles = ['philosopher', 'engineer', 'guardian'];
        Promise.all(roles.map(r => generateAvatar(r))).then(avatars => {
          setHistory(prev => prev.map(n => n.id === newNode.id ? {
            ...n,
            deliberation: {
              ...n.deliberation,
              council_chamber: {
                philosopher: { ...(n.deliberation?.council_chamber?.philosopher ?? {}), avatarUrl: avatars[0] || undefined } as any,
                engineer: { ...(n.deliberation?.council_chamber?.engineer ?? {}), avatarUrl: avatars[1] || undefined } as any,
                guardian: { ...(n.deliberation?.council_chamber?.guardian ?? {}), avatarUrl: avatars[2] || undefined } as any,
              }
            }
          } : n));
        });
      }
    } catch (err) { 
      console.error(err);
      alert("Neural Link Interrupted. / 思想連結中斷。"); 
    } finally { 
      setLoading(false); 
      setLoadingPhase(''); 
    }
  };

  const currentNode = useMemo(() => {
    if (!history || history.length === 0) return null;
    return history.find(n => n.id === selectedNodeId) ?? history[history.length - 1] ?? null;
  }, [history, selectedNodeId]);

  const handleOpenReport = async () => {
    if (history.length < 1) return;
    setReportLoading(true);
    setShowReport(true);
    setReportData(null);
    try {
      const data = await generateInsight(history);
      if (data) setReportData(data);
    } catch (e) {
      console.error("Insight failed", e);
    } finally {
      setReportLoading(false);
    }
  };

  // 防崩潰 UI 保護：初始引導
  if (history.length === 0 && !loading) {
    return (
      <div className="flex h-screen bg-[#02040a] items-center justify-center p-8 overflow-hidden">
        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-1000">
           <Compass className="w-20 h-20 text-indigo-500 animate-[spin_12s_linear_infinite] mx-auto opacity-50" />
           <h1 className="text-3xl font-black text-white uppercase tracking-[0.5em] italic">Yu-Hun / 語魂 vMT</h1>
           <p className="text-slate-500 font-serif italic max-w-sm mx-auto text-sm leading-relaxed">
             "Inject your thought to initiate the VMT protocol."<br/>
             「請注入第一絲思想，開啟複用思維審議系統。」
           </p>
           <div className="max-w-xl mx-auto flex gap-4 mt-8">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Command / 指令..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none text-white font-serif text-lg focus:border-indigo-500/40"
              />
              <button onClick={() => handleSend()} className="p-4 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-500 shadow-xl">
                <ArrowRight className="w-6 h-6" />
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#02040a] text-slate-300 overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar / 側邊欄 */}
      <aside className="w-72 border-r border-white/5 bg-black/40 flex flex-col hidden lg:flex shrink-0 backdrop-blur-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-4 h-4 text-indigo-500" />
            <h1 className="font-black text-white text-xs tracking-tighter uppercase italic">Yu-Hun vMT</h1>
          </div>
          <button onClick={() => { setHistory([]); localStorage.removeItem('yuhun_v53_stable'); }} className="p-2 hover:bg-red-500/10 rounded-lg transition-all">
            <RotateCw className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 border-b border-white/5">
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-4">Neural Tension Chart / 神經張力圖</span>
           <EntropyChart history={history} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {history.slice().reverse().map((node) => (
            <button 
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 ${
                selectedNodeId === node.id ? 'bg-indigo-600/10 border-indigo-500/30 shadow-lg scale-[1.02]' : 'border-transparent hover:bg-white/5 opacity-40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-mono text-slate-600">{new Date(node.timestamp).toLocaleTimeString()}</span>
                {node.deliberation?.audit && (
                   <Shield className="w-2.5 h-2.5 text-indigo-500/50" />
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
             <BarChart3 className="w-3.5 h-3.5" /> Trajectory Report / 軌跡報告
           </button>
        </div>
      </aside>

      {/* Main Deliberation / 主審議區 */}
      <main className="flex-1 flex flex-col relative bg-[#010409]">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h2 className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Hybrid Intelligence / 混合智能監控</h2>
          </div>
          <div className="flex items-center gap-3">
             {loading && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
             <span className="text-[8px] font-mono text-slate-600 uppercase">System Ready / 系統就緒</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-16 max-w-4xl mx-auto w-full custom-scrollbar">
          
          {currentNode ? (
            <div key={currentNode.id} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              
              {/* User Input Section */}
              <div className="flex items-start gap-6 mb-12">
                 <div className="w-16 h-16 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center shrink-0 shadow-lg">
                    <History className="w-6 h-6 text-indigo-500/40" />
                 </div>
                 <div className="flex-1 pt-1">
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2 block">Instruction / 指令接收</span>
                    <h3 className="text-xl md:text-2xl font-serif font-black text-white italic tracking-tight leading-relaxed">{currentNode.input}</h3>
                 </div>
              </div>

              {/* Council Debate */}
              <div className="space-y-4 mb-16">
                 <div className="flex items-center gap-3 mb-6 opacity-30">
                    <Users className="w-3.5 h-3.5" />
                    <h4 className="text-[8px] font-black uppercase tracking-[0.4em]">Multi-Agent Chamber / 多代理議會</h4>
                 </div>
                 {currentNode.deliberation?.council_chamber && (
                   <>
                     <CouncilRow role="Philosopher" roleZh="哲學家" data={currentNode.deliberation.council_chamber.philosopher} icon={Lightbulb} colorClass="border-amber-500/20" bgClass="bg-amber-500/5" />
                     <CouncilRow role="Engineer" roleZh="工程師" data={currentNode.deliberation.council_chamber.engineer} icon={Cpu} colorClass="border-indigo-500/20" bgClass="bg-indigo-500/5" />
                     <CouncilRow role="Guardian" roleZh="守護者" data={currentNode.deliberation.council_chamber.guardian} icon={Shield} colorClass="border-emerald-500/20" bgClass="bg-emerald-500/5" />
                   </>
                 )}
              </div>

              {/* Internal Monologue */}
              {currentNode.deliberation?.final_synthesis?.thinking_monologue && (
                 <div className="mb-16 p-8 rounded-[2.5rem] bg-indigo-500/[0.03] border border-indigo-500/10">
                    <div className="flex items-center gap-3 mb-4">
                       <Sparkles className="w-3 h-3 text-indigo-400" />
                       <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Internal Monologue / 內在獨白</span>
                    </div>
                    <p className="text-sm font-serif text-slate-400 leading-relaxed italic">
                       {currentNode.deliberation.final_synthesis.thinking_monologue}
                    </p>
                 </div>
              )}

              {/* Final Synthesis - REFINED SIZE AND BILINGUAL */}
              <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 lg:p-16 relative overflow-hidden group shadow-2xl">
                <div className="flex items-center gap-6 mb-10">
                  <div className="p-5 rounded-full bg-red-500/10 border border-red-500/20">
                    <Heart className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1 block">Output Matrix / 最終合成</span>
                    <span className="text-[8px] text-indigo-400 font-mono font-bold uppercase tracking-widest">{currentNode.deliberation?.decision_matrix?.ai_strategy_name ?? "Neutral Path"}</span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-serif text-slate-100 leading-relaxed italic tracking-tight">
                  {currentNode.deliberation?.final_synthesis?.response_text ?? "System collapse. / 系統生成失敗。"}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 opacity-10">
               <Brain className="w-12 h-12 animate-pulse" />
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-10 py-20">
               <div className="w-16 h-16 rounded-full border-2 border-indigo-500/10 border-t-indigo-500 animate-spin" />
               <div className="text-center">
                  <h4 className="text-sm font-black uppercase tracking-[0.5em] text-white animate-pulse">Deliberating... / 正在審議</h4>
                  <p className="text-[8px] text-indigo-400 mt-3 font-mono font-bold">{loadingPhase}</p>
               </div>
            </div>
          )}
          <div ref={scrollRef} className="h-24" />
        </div>

        {/* Input Dock / 輸入區域 */}
        <div className="p-6 pb-10 border-t border-white/5 bg-black/60 backdrop-blur-3xl sticky bottom-0 z-40">
          <div className="max-w-3xl mx-auto flex gap-6 items-center">
             <div className="flex-1 relative">
                <input 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Inject thought... / 注入思想指令..."
                  disabled={loading}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-8 py-5 focus:border-indigo-500/40 outline-none text-white font-serif text-xl shadow-xl transition-all"
                />
             </div>
             <button 
               onClick={() => handleSend()}
               disabled={loading || !inputText.trim()}
               className="w-16 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-indigo-500/20 shadow-xl transition-all active:scale-95"
             >
               <ArrowRight className="w-8 h-8" />
             </button>
          </div>
        </div>
      </main>

      {/* Trajectory Report Modal / 洞察報告 */}
      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="bg-[#020617] border border-white/10 w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col relative">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                 <div className="flex items-center gap-5">
                    <BarChart3 className="w-6 h-6 text-indigo-500" />
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Soul Trajectory Insights</h2>
                      <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Neural History Audit / 靈魂軌跡審計</span>
                    </div>
                 </div>
                 <X className="w-8 h-8 text-slate-600 cursor-pointer hover:text-white transition-colors" onClick={() => setShowReport(false)} />
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                {reportLoading ? (
                   <div className="h-64 flex flex-col items-center justify-center gap-6">
                      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.6em] animate-pulse">Analyzing... / 正在分析神經軌跡</p>
                   </div>
                ) : reportData ? (
                   <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <section className="text-center space-y-6">
                         <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.5em]">Emotional Arc / 情緒脈絡</span>
                         <p className="text-xl lg:text-2xl font-serif text-slate-100 italic leading-relaxed tracking-tight max-w-2xl mx-auto">
                           "{reportData.emotional_arc ?? "Processing... / 數據加載中"}"
                         </p>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/5 space-y-6">
                            <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Key Insights / 核心洞察</h4>
                            <ul className="space-y-4">
                               {(reportData.key_insights ?? []).map((insight, i) => (
                                  <li key={i} className="flex gap-3 text-slate-300 font-serif italic text-base leading-relaxed">
                                     <span className="text-indigo-600 font-black shrink-0">#</span> {insight}
                                  </li>
                               ))}
                            </ul>
                         </div>
                         <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/5 space-y-6">
                            <h4 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Hidden Needs / 潛在需求</h4>
                            <p className="text-lg font-serif text-slate-100 italic leading-relaxed">
                               {reportData.hidden_needs ?? "N/A / 無顯著提取"}
                            </p>
                            <div className="pt-8 grid grid-cols-2 gap-6 border-t border-white/5">
                               <div>
                                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Link Rate</span>
                                  <div className="text-2xl font-mono font-black text-indigo-400">{(reportData.navigator_rating?.connection_score ?? 0) * 10}%</div>
                                </div>
                               <div>
                                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Growth</span>
                                  <div className="text-2xl font-mono font-black text-emerald-400">{(reportData.navigator_rating?.growth_score ?? 0) * 10}%</div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <section className="bg-indigo-600 text-white p-10 lg:p-12 rounded-[2.5rem] text-center space-y-6 shadow-xl relative overflow-hidden">
                         <Sparkles className="w-8 h-8 mx-auto" />
                         <span className="text-[9px] font-black uppercase tracking-[0.8em] opacity-40">Navigator's Advice / 領航員建議</span>
                         <p className="text-lg lg:text-xl font-serif italic tracking-tight leading-relaxed max-w-xl mx-auto">
                            {reportData.closing_advice ?? "Continue exploration. / 保持思想的邊界探索。"}
                         </p>
                      </section>
                   </div>
                ) : (
                   <div className="h-64 flex flex-col items-center justify-center gap-5">
                      <AlertTriangle className="w-10 h-10 text-red-500/20" />
                      <p className="text-slate-500 italic text-sm">Failed to retrieve trajectory. / 軌跡信號中斷。</p>
                      <button onClick={handleOpenReport} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold uppercase text-[8px] tracking-widest hover:scale-105 transition-all">Retry / 重試</button>
                   </div>
                )}
              </div>
              <div className="p-8 border-t border-white/5 bg-black/40 flex justify-end">
                 <button onClick={() => setShowReport(false)} className="px-12 py-4 rounded-xl bg-white text-black font-black uppercase text-[9px] tracking-[0.4em] transition-all hover:bg-slate-200">Close / 關閉終端</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 40px; }
      `}</style>
    </div>
  );
};

export default App;
