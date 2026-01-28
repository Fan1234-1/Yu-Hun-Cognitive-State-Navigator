
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, ArrowRight, Shield, 
  MessageSquare, Lightbulb, Brain, 
  Cpu, X, History, Settings, Zap, Compass,
  Heart, Terminal, Sparkles, Waves, Users,
  Star, Target, Quote, Key, AlertTriangle, ExternalLink, BarChart
} from 'lucide-react';
import { deliberate, generateInsight } from './geminiService';
import { SoulStateNode, InsightReport, FilterCriteria } from './types';
import CouncilRow from './components/CouncilRow';
import EntropyChart from './components/EntropyChart';

const App: React.FC = () => {
  const [history, setHistory] = useState<SoulStateNode[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<InsightReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorStatus, setErrorStatus] = useState<'IDLE' | 'QUOTA_EXHAUSTED' | 'GENERIC_ERROR'>('IDLE');
  const [hasKey, setHasKey] = useState(true);

  const [filters, setFilters] = useState<FilterCriteria>({
    search: '',
    entropyLevel: 'all',
    verdict: 'all',
    dateRange: 'all'
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setErrorStatus('IDLE');
    }
  };

  useEffect(() => {
    let interval: any;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + (90 - prev) * 0.1 : prev));
      }, 300);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const saved = localStorage.getItem('yuhun_history_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('yuhun_history_v4', JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading, selectedNodeId]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || inputText;
    if (!textToSend.trim() || loading) return;
    
    setInputText('');
    setLoading(true);
    setErrorStatus('IDLE');

    try {
      const historyContext = history.slice(-5).map(h => ({
        user: h.input,
        ai: h.deliberation?.final_synthesis?.response_text,
        p: h.deliberation?.soul_persistence
      }));

      const result = await deliberate(textToSend, historyContext);
      
      const newNode: SoulStateNode = {
        id: `node_${Date.now()}`,
        timestamp: Date.now(),
        input: textToSend,
        deliberation: result
      };
      
      setHistory(prev => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'QUOTA_EXHAUSTED') {
        setErrorStatus('QUOTA_EXHAUSTED');
      } else {
        setErrorStatus('GENERIC_ERROR');
      }
    } finally { 
      setLoading(false); 
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(node => {
      const val = node.deliberation?.tension_tensor?.total_T || 0;
      let matchesEntropy = true;
      if (filters.entropyLevel === 'echo') matchesEntropy = val < 0.3;
      if (filters.entropyLevel === 'friction') matchesEntropy = val >= 0.3 && val <= 0.8;
      if (filters.entropyLevel === 'chaos') matchesEntropy = val > 0.8;
      return matchesEntropy;
    });
  }, [history, filters]);

  const handleGenerateReport = async () => {
    if (history.length === 0) return;
    setReportLoading(true);
    setShowReport(true);
    setReportData(null);
    try {
      const insight = await generateInsight(history);
      setReportData(insight);
    } catch (err: any) {
      if (err.message === 'QUOTA_EXHAUSTED') {
        setErrorStatus('QUOTA_EXHAUSTED');
        setShowReport(false);
      }
    } finally {
      setReportLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm("Purge memory Traces? / 抹除記憶軌跡？")) {
      setHistory([]);
      localStorage.removeItem('yuhun_history_v4');
      setSelectedNodeId(null);
    }
  };

  const currentNode = history.find(n => n.id === selectedNodeId) || history[history.length - 1];

  if (!hasKey) {
    return (
      <div className="h-screen w-full bg-[#020617] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(79,70,229,0.3)]">
          <Key className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-white mb-4 tracking-tighter">Neural Link Required / 需要神經連結</h1>
        <p className="text-slate-400 max-w-md mb-10 font-serif italic leading-relaxed">
          Yu-Hun requires a valid Gemini API Key to navigate cognitive tensors. / 語魂需要有效的 Gemini API Key 才能導航認知張力。
        </p>
        <button onClick={handleOpenKeySelector} className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-3xl transition-all shadow-2xl active:scale-95 flex items-center gap-3">
          CONNECT PROJECT / 連結專案 Key
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden text-slate-200">
      
      {/* Sidebar */}
      <aside className="w-[380px] border-r border-slate-800 bg-slate-900/30 flex flex-col hidden lg:flex shadow-2xl z-40 relative shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-2xl">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold tracking-tighter text-white text-lg leading-none">語魂 Yu-Hun</h1>
              <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">Soul Navigator</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleOpenKeySelector} title="Change API Key" className="p-2 hover:bg-indigo-500/10 rounded-xl transition-all">
              <Key className="w-4 h-4 text-slate-500 hover:text-indigo-400" />
            </button>
            <button onClick={clearHistory} title="Clear Memory" className="p-2 hover:bg-red-500/10 rounded-xl transition-all">
              <History className="w-4 h-4 text-slate-500 hover:text-red-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
          <EntropyChart history={history} />
          <div className="space-y-4">
            {filteredHistory.slice().reverse().map((node) => (
              <button 
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`w-full group text-left transition-all p-4 rounded-2xl border ${
                  selectedNodeId === node.id ? 'bg-indigo-600/10 border-indigo-500/40' : 'border-transparent hover:bg-slate-800/40'
                }`}
              >
                <div className="text-[9px] font-mono text-slate-500 mb-1">{new Date(node.timestamp).toLocaleTimeString()}</div>
                <h4 className="text-xs font-bold truncate text-slate-200">{node.input}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 italic font-serif mt-1">{node.deliberation?.final_synthesis?.response_text}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/60">
          <button 
            onClick={handleGenerateReport}
            disabled={history.length === 0 || reportLoading}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs flex items-center justify-center gap-3 group shadow-2xl transition-all active:scale-95"
          >
            <Brain className="w-4 h-4" /> Launch Soul Audit / 啟動深度分析結報
          </button>
        </div>
      </aside>

      {/* Main Space */}
      <main className="flex-1 flex flex-col relative bg-[#020617] overflow-hidden">
        {errorStatus === 'QUOTA_EXHAUSTED' && (
          <div className="absolute top-0 left-0 w-full bg-red-600/90 text-white text-xs font-bold py-3 px-10 flex items-center justify-between z-[60] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4" />
              <span>QUOTA EXHAUSTED: Please switch to a paid API Key. / 配額已用盡。</span>
            </div>
            <button onClick={handleOpenKeySelector} className="px-4 py-1.5 bg-white text-red-600 rounded-full text-[10px]">SWITCH KEY</button>
          </div>
        )}

        <div className={`absolute top-0 left-0 h-1 bg-indigo-500 z-50 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]`} style={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0 }} />

        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-black tracking-widest uppercase">Inner Council / 內在審議視窗</h2>
          </div>
          {currentNode && (
             <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                   <span className="text-[9px] text-slate-500 uppercase font-mono tracking-tighter">Current Friction (T)</span>
                   <span className="text-[12px] font-black text-indigo-400">{(currentNode.deliberation?.tension_tensor?.total_T || 0).toFixed(4)}</span>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="flex flex-col items-end">
                   <span className="text-[9px] text-slate-500 uppercase font-mono tracking-tighter">Soul Persistence</span>
                   <span className="text-[12px] font-black text-purple-400">{(currentNode.deliberation?.soul_persistence || 0).toFixed(4)}</span>
                </div>
             </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-16 space-y-16 max-w-6xl mx-auto w-full custom-scrollbar">
          {currentNode ? (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="flex items-start gap-8 mb-16">
                 <div className="w-16 h-16 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <History className="w-8 h-8 text-slate-500" />
                 </div>
                 <div className="flex-1 pt-1">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] block mb-2">Input Received / 指令接收</span>
                    <h3 className="text-2xl md:text-3xl font-serif font-black text-white leading-tight">
                      {currentNode.input}
                    </h3>
                 </div>
              </div>

              {currentNode.deliberation?.tension_tensor && (
                <div className="mb-20 bg-slate-900/10 p-10 rounded-[3rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
                        <div>
                          <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Friction Level / 認知摩擦</span>
                          <h4 className="text-lg font-bold text-white uppercase tracking-tighter">{currentNode.deliberation.tension_tensor.status}</h4>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-4xl font-black text-indigo-400">
                          {currentNode.deliberation.tension_tensor.total_T.toFixed(4)}
                        </span>
                      </div>
                  </div>

                  <div className="h-5 w-full bg-slate-950 rounded-full border border-slate-800/50 p-1 mb-8">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          currentNode.deliberation.tension_tensor.total_T > 0.8 ? 'bg-red-500' : 
                          currentNode.deliberation.tension_tensor.total_T > 0.3 ? 'bg-indigo-500' : 
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(currentNode.deliberation.tension_tensor.total_T * 100, 100)}%` }}
                      />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                        <Terminal className="w-5 h-5 text-indigo-400 mt-1" />
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intrinsic Drive / 內在驅動</p>
                          <p className="text-sm font-serif font-bold text-slate-200 italic">"{currentNode.deliberation.intrinsic_drive?.vector_name || 'Alignment'}"</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                        <BarChart className="w-5 h-5 text-purple-400 mt-1" />
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Persistence / 積分累積</p>
                          <p className="text-sm font-mono text-slate-200">Value: {currentNode.deliberation.soul_persistence?.toFixed(4)}</p>
                        </div>
                      </div>
                  </div>
                </div>
              )}

              <div className="space-y-8 mb-20">
                 <div className="flex items-center gap-5 mb-10 text-xs font-black uppercase tracking-[0.4em] text-slate-400">
                    <Users className="w-8 h-8 text-emerald-500" />
                    <span>Audit Council / 審議議會</span>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <CouncilRow role="Philosopher" roleZh="哲學家" data={currentNode.deliberation?.council_chamber?.philosopher} icon={Lightbulb} colorClass="border-amber-500/30" bgClass="bg-amber-500/5" />
                    <CouncilRow role="Engineer" roleZh="工程師" data={currentNode.deliberation?.council_chamber?.engineer} icon={Cpu} colorClass="border-indigo-500/30" bgClass="bg-indigo-500/5" />
                    <CouncilRow role="Guardian" roleZh="守護者" data={currentNode.deliberation?.council_chamber?.guardian} icon={Shield} colorClass="border-emerald-500/30" bgClass="bg-emerald-500/5" />
                 </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 rounded-[4rem] p-12 lg:p-20 relative overflow-hidden group shadow-3xl backdrop-blur-3xl">
                <div className="flex items-center gap-5 mb-12">
                   <div className="p-3.5 rounded-full bg-red-500/10 border border-red-500/20">
                     <Heart className="w-8 h-8 text-red-500" />
                   </div>
                   <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Yu-Hun Soul Synthesis</span>
                </div>
                <p className="text-base md:text-lg font-serif text-slate-50 leading-relaxed whitespace-pre-wrap font-medium">
                  {currentNode.deliberation?.final_synthesis?.response_text || "Awaiting signal..."}
                </p>
              </div>
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center py-40 opacity-20">
                <Brain className="w-32 h-32 mb-8" />
                <p className="text-xl font-serif italic">Inject Soul Command... / 注入指令開啟審議</p>
             </div>
          )}
          <div ref={scrollRef} className="h-24" />
        </div>

        {/* Input Area */}
        <div className="p-10 pb-12 border-t border-slate-800 bg-slate-950/90 backdrop-blur-3xl sticky bottom-0 z-30">
          <div className="max-w-5xl mx-auto flex gap-6">
             <div className="relative flex-1 flex items-center">
               <MessageSquare className="absolute left-10 w-6 h-6 text-slate-500" />
               <input 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 placeholder={loading ? "Deliberating..." : "Inject Soul Command... / 注入靈魂指令..."}
                 disabled={loading}
                 className="w-full bg-white border border-slate-200 rounded-[2.5rem] pl-20 pr-10 py-6 outline-none transition-all text-black placeholder-slate-400 shadow-3xl font-serif text-xl focus:ring-4 focus:ring-indigo-500/20"
               />
               {loading && (
                 <div className="absolute right-6 flex items-center gap-2">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                 </div>
               )}
             </div>
             <button 
               onClick={() => handleSend()}
               disabled={loading || !inputText.trim()}
               className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all ${
                 loading || !inputText.trim() ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
               }`}
             >
               <ArrowRight className={`w-8 h-8 ${loading ? 'animate-pulse' : ''}`} />
             </button>
          </div>
        </div>
      </main>

      {/* Report Modal - Enhanced Bilingual Support */}
      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-[#0f172a] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] flex flex-col shadow-3xl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight">Soul Audit Report / 深度分析結報</h2>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Quantum Cognition Trajectory Analysis</p>
                    </div>
                 </div>
                 <button onClick={() => setShowReport(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-500" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                 {reportLoading ? (
                   <div className="h-64 flex flex-col items-center justify-center gap-6 opacity-60">
                      <Cpu className="w-12 h-12 animate-spin text-indigo-500" />
                      <p className="text-lg font-serif italic text-slate-400">Compiling Trajectory... / 正在編譯認知軌跡...</p>
                   </div>
                 ) : reportData ? (
                   <>
                      <section className="bg-indigo-600/10 p-10 rounded-[2rem] border border-indigo-500/20 relative">
                         <Quote className="absolute -top-4 left-6 w-10 h-10 text-indigo-500/40" />
                         <div className="flex items-center gap-3 mb-6">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Emotional Arc / 情感軌跡</span>
                         </div>
                         <p className="text-2xl font-serif italic text-slate-100 leading-relaxed font-medium">
                           {reportData.emotional_arc || "No arc detected. / 尚未偵測到顯著軌跡。"}
                         </p>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                             <Target className="w-4 h-4" /> Core Insights / 核心洞察
                           </h3>
                           <div className="space-y-4">
                             {(reportData.key_insights || []).map((insight, i) => (
                               <div key={i} className="p-6 bg-slate-800/40 rounded-2xl border border-white/5 text-slate-200 font-serif text-sm leading-relaxed shadow-sm">
                                 {insight}
                               </div>
                             ))}
                           </div>
                        </section>

                        <section className="space-y-8">
                           <div>
                              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                                <SearchIcon className="w-4 h-4" /> Hidden Needs / 潛在需求
                              </h3>
                              <div className="p-6 bg-purple-500/5 rounded-2xl border border-purple-500/20 text-slate-200 font-serif text-sm shadow-inner leading-loose">
                                {reportData.hidden_needs || "Analysis pending. / 待分析。"}
                              </div>
                           </div>

                           <div>
                              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                                <Star className="w-4 h-4" /> Navigator Rating / 導航評鑑
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center shadow-lg">
                                   <span className="text-[9px] text-slate-500 uppercase mb-2">Connection</span>
                                   <span className="text-3xl font-black text-indigo-400">{(reportData.navigator_rating?.connection_score || 0).toFixed(1)}</span>
                                </div>
                                <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center shadow-lg">
                                   <span className="text-[9px] text-slate-500 uppercase mb-2">Growth</span>
                                   <span className="text-3xl font-black text-emerald-400">{(reportData.navigator_rating?.growth_score || 0).toFixed(1)}</span>
                                </div>
                              </div>
                           </div>
                        </section>
                      </div>

                      <section className="p-10 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl">
                         <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-6">Closing Advice / 最後忠告</h3>
                         <p className="text-lg font-serif text-slate-300 leading-relaxed italic">
                           {reportData.closing_advice || "Continue exploration. / 繼續探索認知邊界。"}
                         </p>
                      </section>
                   </>
                 ) : (
                   <div className="text-center py-24 text-slate-500 italic text-xl">No report data found. / 無法生成結報。</div>
                 )}
              </div>
              <div className="p-8 border-t border-white/5 bg-slate-900 flex justify-center">
                 <button 
                   onClick={() => setShowReport(false)} 
                   className="px-20 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm transition-all shadow-[0_0_30px_rgba(79,70,229,0.4)] active:scale-95 uppercase tracking-widest"
                 >
                   DISMISS AUDIT / 結束分析回報
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const SearchIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

export default App;
