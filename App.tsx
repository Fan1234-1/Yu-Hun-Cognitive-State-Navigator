
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, ArrowRight, Shield, 
  MessageSquare, Lightbulb, Brain, 
  Cpu, X, History, Settings, Zap, Compass,
  Heart, Terminal, Sparkles, Waves, Users
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

  const [filters, setFilters] = useState<FilterCriteria>({
    search: '',
    entropyLevel: 'all',
    verdict: 'all',
    dateRange: 'all'
  });

  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [history, loading]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || inputText;
    if (!textToSend.trim() || loading) return;
    
    setInputText('');
    setLoading(true);

    try {
      const historyContext = history.slice(-5).map(h => ({
        user: h.input,
        ai: h.deliberation.final_synthesis.response_text
      }));

      const result = await deliberate(textToSend, historyContext);
      
      const newNode: SoulStateNode = {
        id: `node_${Date.now()}`,
        timestamp: Date.now(),
        input: textToSend,
        deliberation: result || {
          council_chamber: {
            philosopher: { stance: "Lock", conflict_point: "Fail", benevolence_check: "Fail" },
            engineer: { stance: "Lock", conflict_point: "Fail", benevolence_check: "Fail" },
            guardian: { stance: "Lock", conflict_point: "Fail", benevolence_check: "Fail" }
          },
          tension_tensor: { 
            E_internal: 1, 
            D_resistance: { fact: 1, logic: 1, ethics: 1 }, 
            W_weight: { fact: 1, logic: 1, ethics: 1 }, 
            total_T: 1, 
            status: "ERROR", 
            calculation_note: "API Stalled" 
          },
          soul_persistence: 0,
          intrinsic_drive: { vector_name: "Self-Repair", intensity: 1 },
          decision_matrix: { user_hidden_intent: "N/A", ai_strategy_name: "FAILSAFE", intended_effect: "Recovery", tone_tag: "EMERGENCY" },
          final_synthesis: { response_text: "Encountered a stall. / 遭遇停滯。" },
          next_moves: [{ label: "Retry / 重試", text: textToSend }]
        }
      };
      
      setHistory(prev => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(node => {
      const val = node.deliberation.tension_tensor?.total_T || 0;
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
    const insight = await generateInsight(history);
    setReportData(insight);
    setReportLoading(false);
  };

  const clearHistory = () => {
    if (confirm("Purge memory Traces? / 抹除記憶軌跡？")) {
      setHistory([]);
      localStorage.removeItem('yuhun_history_v4');
      setSelectedNodeId(null);
    }
  };

  const currentNode = history.find(n => n.id === selectedNodeId) || history[history.length - 1];

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
          <button onClick={clearHistory} className="p-2 hover:bg-red-500/10 rounded-xl transition-all">
            <History className="w-4 h-4 text-slate-500" />
          </button>
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
                <p className="text-[10px] text-slate-500 line-clamp-1 italic font-serif mt-1">{node.deliberation.final_synthesis.response_text}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/60">
          <button 
            onClick={handleGenerateReport}
            disabled={history.length === 0 || reportLoading}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs flex items-center justify-center gap-3 group shadow-2xl"
          >
            <Brain className="w-4 h-4" /> Launch Soul Audit / 啟動深度分析結報
          </button>
        </div>
      </aside>

      {/* Main Space */}
      <main className="flex-1 flex flex-col relative bg-[#020617] overflow-hidden">
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-black tracking-widest uppercase">Inner Council / 內在審議視窗</h2>
          </div>
          {currentNode && (
             <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                   <Waves className="w-3.5 h-3.5" /> Persistence: {(currentNode.deliberation.soul_persistence || 0).toFixed(3)}
                </span>
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

              {/* Tension Tensor Visualization */}
              <div className="mb-20 bg-slate-900/10 p-10 rounded-[3rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden">
                 <div className="flex items-center justify-between mb-8 relative">
                    <div className="flex items-center gap-4">
                       <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
                       <div>
                         <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Tension Tensor (T) / 張力脈動</span>
                         <h4 className="text-lg font-bold text-white uppercase tracking-tighter">{currentNode.deliberation.tension_tensor.status}</h4>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-4xl font-black text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]">
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
                        <p className="text-sm font-serif font-bold text-slate-200 italic">"{currentNode.deliberation.intrinsic_drive.vector_name}"</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                      <Zap className="w-5 h-5 text-purple-400 mt-1" />
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Impulse (E) / 內在動能</p>
                        <p className="text-sm font-mono text-slate-200">Value: {currentNode.deliberation.tension_tensor.E_internal.toFixed(3)}</p>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-8 mb-20">
                 <div className="flex items-center gap-5 mb-10 text-xs font-black uppercase tracking-[0.4em] text-slate-400">
                    <Users className="w-8 h-8 text-emerald-500" />
                    <span>Audit Council / 審議議會</span>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <CouncilRow role="Philosopher" roleZh="哲學家" data={currentNode.deliberation.council_chamber.philosopher} icon={Lightbulb} colorClass="border-amber-500/30" bgClass="bg-amber-500/5" />
                    <CouncilRow role="Engineer" roleZh="工程師" data={currentNode.deliberation.council_chamber.engineer} icon={Cpu} colorClass="border-indigo-500/30" bgClass="bg-indigo-500/5" />
                    <CouncilRow role="Guardian" roleZh="守護者" data={currentNode.deliberation.council_chamber.guardian} icon={Shield} colorClass="border-emerald-500/30" bgClass="bg-emerald-500/5" />
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
                  {currentNode.deliberation.final_synthesis.response_text}
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
                 placeholder="Inject Soul Command... / 注入靈魂指令..."
                 disabled={loading}
                 className="w-full bg-white border border-slate-200 rounded-[2.5rem] pl-20 pr-10 py-6 outline-none transition-all text-black placeholder-slate-400 shadow-3xl font-serif text-xl"
               />
             </div>
             <button 
               onClick={() => handleSend()}
               disabled={loading || !inputText.trim()}
               className="w-20 h-20 rounded-[2.5rem] bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl transition-all"
             >
               <ArrowRight className="w-8 h-8" />
             </button>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/95 backdrop-blur-[40px] animate-in fade-in">
           <div className="bg-slate-900 border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] flex flex-col shadow-3xl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                    <h2 className="text-xl font-black text-white">Soul Audit Report / 深度分析結報</h2>
                 </div>
                 <button onClick={() => setShowReport(false)} className="p-3 hover:bg-slate-800 rounded-full">
                    <X className="w-8 h-8 text-slate-500" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                 {/* EKG Heartbeat View */}
                 <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-2">
                       <Activity className="w-5 h-5" /> Tension EKG Timeline / 張力心電圖時間線
                    </h3>
                    <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 h-64">
                       <EntropyChart history={history} />
                    </div>
                 </section>

                 {reportData ? (
                   <>
                      <section className="bg-indigo-950/30 p-10 rounded-[2.5rem] border border-indigo-500/20">
                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 block">Emotional Arc / 情感軌跡</span>
                         <p className="text-xl font-serif italic text-slate-50">{reportData.emotional_arc}</p>
                      </section>
                      <section className="space-y-6">
                         <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Core Insights / 核心洞察</h3>
                         <div className="grid grid-cols-1 gap-4">
                           {reportData.key_insights.map((insight, i) => (
                             <div key={i} className="p-6 bg-slate-800/20 rounded-2xl border border-white/5 text-slate-200 font-serif leading-relaxed">
                               {insight}
                             </div>
                           ))}
                         </div>
                      </section>
                   </>
                 ) : <div className="py-20 text-center italic text-slate-500">Generating Analysis...</div>}
              </div>
              <div className="p-8 border-t border-white/5 bg-slate-900 flex justify-end">
                 <button onClick={() => setShowReport(false)} className="px-10 py-4 rounded-[1.5rem] bg-indigo-600 text-white font-black text-sm">Close Report</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
