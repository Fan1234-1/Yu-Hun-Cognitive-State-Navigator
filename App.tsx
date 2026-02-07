
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, ArrowRight, Shield, 
  MessageSquare, Lightbulb, Brain, 
  Cpu, X, History, Settings, Zap, Compass,
  Heart, Terminal, Sparkles, Waves, Users,
  Star, Target, Quote, Key, AlertTriangle, ExternalLink, BarChart, Languages
} from 'lucide-react';
import { deliberate, generateInsight } from './geminiService';
import { SoulStateNode, InsightReport, FilterCriteria } from './types';
import CouncilRow from './components/CouncilRow';
import EntropyChart from './components/EntropyChart';

// UI 語系定義
const TRANSLATIONS = {
  zh: {
    appTitle: "語魂 Yu-Hun",
    appSub: "靈魂導航儀",
    launchAudit: "啟動深度分析結報",
    clearMemory: "抹除記憶軌跡",
    innerCouncil: "內在審議視窗",
    currentFriction: "當前認知摩擦 (T)",
    soulPersistence: "靈魂積分累積",
    inputReceived: "指令接收",
    frictionLevel: "認知摩擦程度",
    intrinsicDrive: "內在驅動",
    persistence: "積分累積",
    soulSynthesis: "語魂靈魂共鳴",
    auditCouncil: "審議議會",
    inputPlaceholder: "注入靈魂指令...",
    generating: "審議中...",
    reportTitle: "深度分析結報",
    reportSub: "量子認知軌道分析",
    emotionalArc: "情感軌跡",
    coreInsights: "核心洞察",
    hiddenNeeds: "潛在需求",
    navigatorRating: "導航評鑑",
    closingAdvice: "最後忠告",
    dismiss: "結束分析回報",
    switchKey: "切換密鑰",
    quotaExhausted: "配額已用盡，請切換至付費專案 Key。",
    philosopher: "哲學家",
    engineer: "工程師",
    guardian: "守護者",
    analyzingText: "正在分析中... 請稍候片刻。",
    genericError: "發生未預期錯誤，請再試一次。"
  },
  en: {
    appTitle: "Yu-Hun",
    appSub: "Soul Navigator",
    launchAudit: "Launch Soul Audit",
    clearMemory: "Purge Memory Traces",
    innerCouncil: "Inner Council Chamber",
    currentFriction: "Current Friction (T)",
    soulPersistence: "Soul Persistence",
    inputReceived: "Input Received",
    frictionLevel: "Friction Level",
    intrinsicDrive: "Intrinsic Drive",
    persistence: "Persistence",
    soulSynthesis: "Yu-Hun Soul Synthesis",
    auditCouncil: "Audit Council",
    inputPlaceholder: "Inject Soul Command...",
    generating: "Deliberating...",
    reportTitle: "Soul Audit Report",
    reportSub: "Quantum Trajectory Analysis",
    emotionalArc: "Emotional Arc",
    coreInsights: "Core Insights",
    hiddenNeeds: "Hidden Needs",
    navigatorRating: "Navigator Rating",
    closingAdvice: "Closing Advice",
    dismiss: "Dismiss Audit",
    switchKey: "Switch Key",
    quotaExhausted: "Quota exhausted. Switch API key.",
    philosopher: "Philosopher",
    engineer: "Engineer",
    guardian: "Guardian",
    analyzingText: "Analyzing... This may take a moment.",
    genericError: "An unexpected error occurred. Please try again."
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
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

  const t = TRANSLATIONS[lang];

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
        p: h.deliberation?.soul_persistence,
        t: h.deliberation?.tension_tensor?.total_T
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
      if (err.message === 'QUOTA_EXHAUSTED') setErrorStatus('QUOTA_EXHAUSTED');
      else setErrorStatus('GENERIC_ERROR');
    } finally { 
      setLoading(false); 
    }
  };

  const clearHistory = () => {
    if (confirm(lang === 'zh' ? "抹除記憶軌跡？" : "Purge memory?")) {
      setHistory([]);
      localStorage.removeItem('yuhun_history_v4');
      setSelectedNodeId(null);
    }
  };

  const currentNode = history.find(n => n.id === selectedNodeId) || history[history.length - 1];

  if (!hasKey) {
    return (
      <div className="h-screen w-full bg-[#020617] flex flex-col items-center justify-center p-10 text-center">
        <Key className="w-16 h-16 text-indigo-500 mb-8" />
        <h1 className="text-3xl font-black text-white mb-4">Neural Link Required</h1>
        <button onClick={handleOpenKeySelector} className="px-12 py-5 bg-indigo-600 text-white font-black rounded-3xl">CONNECT PROJECT KEY</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden text-slate-200 transition-colors duration-500">
      
      {/* Sidebar */}
      <aside className="w-[380px] border-r border-slate-800 bg-slate-900/30 flex flex-col hidden lg:flex shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-2xl">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold tracking-tighter text-white text-lg leading-none">{t.appTitle}</h1>
              <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">{t.appSub}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} title="Switch Language" className="p-2 hover:bg-white/10 rounded-xl transition-all">
               <Languages className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={clearHistory} className="p-2 hover:bg-red-500/10 rounded-xl">
              <History className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <EntropyChart history={history} />
          <div className="space-y-4">
            {history.slice().reverse().map((node) => (
              <button 
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`w-full text-left p-4 rounded-2xl border ${
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
            onClick={async () => {
                setReportLoading(true);
                setShowReport(true);
                setReportData(null);
                setErrorStatus('IDLE');

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                try {
                  const insightPromise = generateInsight(history);
                  const timeoutPromise = new Promise((_, reject) => {
                    controller.signal.addEventListener('abort', () => reject(new Error('TIMEOUT')));
                  });

                  const insight = await Promise.race([insightPromise, timeoutPromise]) as InsightReport | null;
                  
                  if (!insight) {
                    throw new Error('EMPTY_RESPONSE');
                  }
                  
                  setReportData(insight);
                } catch (err: any) {
                  setShowReport(false);
                  if (err.message === 'QUOTA_EXHAUSTED') {
                    setErrorStatus('QUOTA_EXHAUSTED');
                  } else if (err.message === 'TIMEOUT') {
                    setErrorStatus('GENERIC_ERROR');
                  } else {
                    setErrorStatus('GENERIC_ERROR');
                  }
                } finally {
                  clearTimeout(timeoutId);
                  setReportLoading(false);
                }
            }}
            disabled={history.length === 0 || reportLoading}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <Brain className="w-4 h-4" /> {t.launchAudit}
          </button>
        </div>
      </aside>

      {/* Main Space */}
      <main className="flex-1 flex flex-col relative bg-[#020617]">
        {errorStatus === 'QUOTA_EXHAUSTED' && (
          <div className="absolute top-0 left-0 w-full bg-red-600/90 text-white text-[10px] font-bold py-2 px-10 flex items-center justify-between z-[60]">
            <div className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> <span>{t.quotaExhausted}</span></div>
            <button onClick={handleOpenKeySelector} className="px-3 py-1 bg-white text-red-600 rounded-full">{t.switchKey}</button>
          </div>
        )}
        {errorStatus === 'GENERIC_ERROR' && (
          <div className="absolute top-0 left-0 w-full bg-orange-600/90 text-white text-[10px] font-bold py-2 px-10 flex items-center justify-between z-[60]">
            <div className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> <span>{t.genericError}</span></div>
            <button onClick={() => setErrorStatus('IDLE')} className="px-3 py-1 bg-white text-orange-600 rounded-full">DISMISS</button>
          </div>
        )}

        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-black tracking-widest uppercase">{t.innerCouncil}</h2>
          </div>
          {currentNode && (
             <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                   <span className="text-[9px] text-slate-500 uppercase font-mono">{t.currentFriction}</span>
                   <span className="text-[12px] font-black text-indigo-400">{(currentNode.deliberation?.tension_tensor?.total_T || 0).toFixed(4)}</span>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="flex flex-col items-end">
                   <span className="text-[9px] text-slate-500 uppercase font-mono">{t.soulPersistence}</span>
                   <span className="text-[12px] font-black text-purple-400">{(currentNode.deliberation?.soul_persistence || 0).toFixed(4)}</span>
                </div>
             </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-16 space-y-16 max-w-6xl mx-auto w-full custom-scrollbar">
          {currentNode ? (
            <div>
              <div className="flex items-start gap-8 mb-16">
                 <div className="w-16 h-16 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <History className="w-8 h-8 text-slate-500" />
                 </div>
                 <div className="flex-1 pt-1">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] block mb-2">{t.inputReceived}</span>
                    <h3 className="text-2xl md:text-3xl font-serif font-black text-white">{currentNode.input}</h3>
                 </div>
              </div>

              {currentNode.deliberation?.tension_tensor && (
                <div className="mb-20 bg-slate-900/10 p-10 rounded-[3rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <Zap className="w-6 h-6 text-purple-400" />
                        <div>
                          <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">{t.frictionLevel}</span>
                          <h4 className="text-lg font-bold text-white uppercase tracking-tighter">{currentNode.deliberation.tension_tensor.status}</h4>
                        </div>
                      </div>
                      <span className="font-mono text-4xl font-black text-indigo-400">{(currentNode.deliberation.tension_tensor.total_T || 0).toFixed(4)}</span>
                  </div>
                  <div className="h-4 w-full bg-slate-950 rounded-full border border-slate-800/50 p-1 mb-8">
                      <div className={`h-full rounded-full transition-all duration-1000 ${currentNode.deliberation.tension_tensor.total_T > 0.8 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(currentNode.deliberation.tension_tensor.total_T * 100, 100)}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase">{t.intrinsicDrive}</p>
                        <p className="text-sm font-serif font-bold text-slate-200">"{currentNode.deliberation.intrinsic_drive?.vector_name || 'Alignment'}"</p>
                      </div>
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase">{t.persistence}</p>
                        <p className="text-sm font-mono text-slate-200">{currentNode.deliberation.soul_persistence?.toFixed(4)}</p>
                      </div>
                  </div>
                </div>
              )}

              <div className="space-y-6 mb-20">
                 <div className="flex items-center gap-4 mb-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                    <Users className="w-6 h-6 text-emerald-500" />
                    <span>{t.auditCouncil}</span>
                 </div>
                 <CouncilRow role={t.philosopher} roleZh="" data={currentNode.deliberation?.council_chamber?.philosopher} icon={Lightbulb} colorClass="border-amber-500/30" bgClass="bg-amber-500/5" />
                 <CouncilRow role={t.engineer} roleZh="" data={currentNode.deliberation?.council_chamber?.engineer} icon={Cpu} colorClass="border-indigo-500/30" bgClass="bg-indigo-500/5" />
                 <CouncilRow role={t.guardian} roleZh="" data={currentNode.deliberation?.council_chamber?.guardian} icon={Shield} colorClass="border-emerald-500/30" bgClass="bg-emerald-500/5" />
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 rounded-[4rem] p-12 lg:p-20 shadow-3xl backdrop-blur-3xl">
                <div className="flex items-center gap-5 mb-10 text-red-500">
                   <Heart className="w-8 h-8" />
                   <span className="text-[12px] font-black uppercase tracking-[0.4em]">{t.soulSynthesis}</span>
                </div>
                <p className="text-lg font-serif text-slate-50 leading-relaxed whitespace-pre-wrap">{currentNode.deliberation?.final_synthesis?.response_text}</p>
              </div>
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center py-40 opacity-20"><Brain className="w-32 h-32" /></div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-10 border-t border-slate-800 bg-slate-950/90 backdrop-blur-3xl sticky bottom-0">
          <div className="max-w-5xl mx-auto flex gap-6">
             <div className="relative flex-1 flex items-center">
               <input 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 placeholder={loading ? t.generating : t.inputPlaceholder}
                 disabled={loading}
                 className="w-full bg-white border border-slate-200 rounded-[2.5rem] pl-10 pr-10 py-6 text-black shadow-3xl font-serif text-xl focus:ring-4 focus:ring-indigo-500/20"
               />
               {loading && <div className="absolute right-6 w-4 h-4 bg-indigo-500 rounded-full animate-ping" />}
             </div>
             <button onClick={() => handleSend()} disabled={loading || !inputText.trim()} className="w-20 h-20 rounded-[2.5rem] flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl transition-all active:scale-95">
               <ArrowRight className="w-8 h-8" />
             </button>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl">
           <div className="bg-[#0f172a] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] flex flex-col shadow-3xl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                 <div className="flex items-center gap-4">
                    <Sparkles className="w-8 h-8 text-indigo-500" />
                    <div><h2 className="text-xl font-black text-white">{t.reportTitle}</h2><p className="text-[9px] text-slate-500 font-mono">{t.reportSub}</p></div>
                 </div>
                 <button onClick={() => setShowReport(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6 text-slate-500" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                 {reportLoading ? (
                   <div className="h-64 flex flex-col items-center justify-center opacity-60 text-center gap-4">
                      <Cpu className="w-12 h-12 animate-spin text-indigo-500" />
                      <p className="text-slate-400 font-serif italic animate-pulse">{t.analyzingText}</p>
                   </div>
                 ) : reportData ? (
                   <>
                      <section className="bg-indigo-600/10 p-10 rounded-[2rem] border border-indigo-500/20">
                         <span className="text-[10px] font-black text-indigo-400 uppercase mb-4 block">{t.emotionalArc}</span>
                         <p className="text-2xl font-serif italic text-slate-100 leading-relaxed">{reportData.emotional_arc}</p>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section>
                           <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4">{t.coreInsights}</h3>
                           <div className="space-y-4">
                             {(reportData.key_insights || []).map((insight, i) => (
                               <div key={i} className="p-6 bg-slate-800/40 rounded-2xl border border-white/5 text-slate-200 font-serif text-sm">{insight}</div>
                             ))}
                           </div>
                        </section>
                        <section className="space-y-8">
                           <div><h3 className="text-[10px] font-black text-slate-500 uppercase mb-4">{t.hiddenNeeds}</h3><div className="p-6 bg-purple-500/5 rounded-2xl border border-purple-500/20 text-slate-200 font-serif text-sm">{reportData.hidden_needs}</div></div>
                           <div>
                              <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4">{t.navigatorRating}</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-black/40 rounded-2xl text-center"><span className="text-[9px] text-slate-500 block">Connection</span><span className="text-3xl font-black text-indigo-400">{(reportData.navigator_rating?.connection_score || 0).toFixed(1)}</span></div>
                                <div className="p-5 bg-black/40 rounded-2xl text-center"><span className="text-[9px] text-slate-500 block">Growth</span><span className="text-3xl font-black text-emerald-400">{(reportData.navigator_rating?.growth_score || 0).toFixed(1)}</span></div>
                              </div>
                           </div>
                        </section>
                      </div>

                      <section className="p-10 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
                         <h3 className="text-[10px] font-black text-emerald-500 uppercase mb-6">{t.closingAdvice}</h3>
                         <p className="text-lg font-serif text-slate-300 italic">{reportData.closing_advice}</p>
                      </section>
                   </>
                 ) : null}
              </div>
              <div className="p-8 border-t border-white/5 bg-slate-900 flex justify-center">
                 <button onClick={() => setShowReport(false)} className="px-20 py-4 rounded-full bg-indigo-600 text-white font-black text-sm uppercase">{t.dismiss}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
