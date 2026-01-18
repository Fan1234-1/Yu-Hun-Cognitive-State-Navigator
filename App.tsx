
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, ArrowRight, Layers, Shield, 
  MessageSquare, Lightbulb, Brain, 
  Cpu, FileText, X, ChevronRight, 
  History, Settings, Zap, Compass,
  Heart, Database, Terminal, Sparkles,
  Search, Filter, Clock, Calendar, AlertTriangle
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
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced Filter State
  const [filters, setFilters] = useState<FilterCriteria>({
    search: '',
    entropyLevel: 'all',
    verdict: 'all',
    dateRange: 'all'
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Robust Auto-load and Save
  useEffect(() => {
    const saved = localStorage.getItem('yuhun_history_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      } catch (e) {
        console.error("Memory corruption detected, resetting stream.");
      }
    }
  }, []);

  useEffect(() => {
    // Automatic Background Saving
    if (history.length > 0) {
      localStorage.setItem('yuhun_history_v3', JSON.stringify(history));
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
      
      if (result) {
        const newNode: SoulStateNode = {
          id: `node_${Date.now()}`,
          timestamp: Date.now(),
          input: textToSend,
          deliberation: result
        };
        setHistory(prev => [...prev, newNode]);
        setSelectedNodeId(newNode.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(node => {
      // Keyword search
      const matchesSearch = !filters.search || 
        node.input.toLowerCase().includes(filters.search.toLowerCase()) || 
        node.deliberation.final_synthesis.response_text.toLowerCase().includes(filters.search.toLowerCase());

      // Entropy filtering
      const val = node.deliberation.entropy_meter.value;
      let matchesEntropy = true;
      if (filters.entropyLevel === 'echo') matchesEntropy = val < 0.3;
      if (filters.entropyLevel === 'friction') matchesEntropy = val >= 0.3 && val <= 0.7;
      if (filters.entropyLevel === 'chaos') matchesEntropy = val > 0.7;

      // Audit verdict filtering
      const verdict = node.deliberation.audit?.audit_verdict?.toLowerCase() || '';
      let matchesVerdict = true;
      if (filters.verdict === 'pass') matchesVerdict = verdict.includes('pass') || verdict.includes('certified');
      if (filters.verdict === 'fail') matchesVerdict = verdict.includes('fail') || verdict.includes('risk');

      // Date range filtering
      const nodeDate = new Date(node.timestamp);
      const now = new Date();
      let matchesDate = true;
      if (filters.dateRange === 'today') matchesDate = nodeDate.toDateString() === now.toDateString();
      if (filters.dateRange === 'week') matchesDate = (now.getTime() - nodeDate.getTime()) < 7 * 24 * 60 * 60 * 1000;

      return matchesSearch && matchesEntropy && matchesVerdict && matchesDate;
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
    if (confirm("警告：此操作將永久抹除語魂系統的所有記憶軌跡。確定執行？")) {
      setHistory([]);
      localStorage.removeItem('yuhun_history_v3');
      setSelectedNodeId(null);
    }
  };

  const currentNode = history.find(n => n.id === selectedNodeId) || history[history.length - 1];

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden text-slate-200">
      
      {/* Sidebar: Advanced Timeline & Advanced Filters */}
      <aside className="w-85 border-r border-slate-800 bg-slate-900/30 flex flex-col hidden lg:flex shadow-2xl z-40 relative">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-2xl shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold tracking-tighter text-white text-lg leading-none">語魂 Yu-Hun</h1>
              <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">Soul Navigator</span>
            </div>
          </div>
          <button onClick={clearHistory} className="p-2 hover:bg-red-500/10 rounded-xl transition-all group" title="Purge Memory">
            <History className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
          </button>
        </div>

        {/* Filter Controller */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/20">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              placeholder="搜尋內在記憶..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder-slate-700 font-medium"
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
              showFilters ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3" /> 高階篩選模式
            </div>
            <ChevronRight className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </button>

          {showFilters && (
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">張力區間 (Entropy)</span>
                <div className="grid grid-cols-2 gap-2">
                  {['all', 'echo', 'friction', 'chaos'].map(lvl => (
                    <button 
                      key={lvl}
                      // Use 'prev' to match the variable used in the spread operator.
                      onClick={() => setFilters(prev => ({ ...prev, entropyLevel: lvl as any }))}
                      className={`px-2 py-1.5 rounded-lg border text-[9px] uppercase transition-all ${
                        filters.entropyLevel === lvl ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">審計狀態 (Audit)</span>
                <div className="flex gap-2">
                  {['all', 'pass', 'fail'].map(v => (
                    <button 
                      key={v}
                      // Use 'prev' to match the variable used in the spread operator.
                      onClick={() => setFilters(prev => ({ ...prev, verdict: v as any }))}
                      className={`flex-1 px-2 py-1.5 rounded-lg border text-[9px] uppercase transition-all ${
                        filters.verdict === v ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timeline Visualization */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
          <div className="absolute left-8 top-8 bottom-8 w-[1px] bg-gradient-to-b from-slate-800 via-indigo-500/20 to-slate-800" />
          
          <div className="space-y-4 relative z-10">
            {filteredHistory.slice().reverse().map((node) => {
              const isActive = selectedNodeId === node.id;
              const entropy = node.deliberation.entropy_meter.value;
              
              return (
                <button 
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`w-full group text-left transition-all duration-500 relative pl-12 pr-3 py-3 rounded-2xl border ${
                    isActive 
                    ? 'bg-indigo-600/10 border-indigo-500/40 shadow-xl scale-[1.02] z-20' 
                    : 'border-transparent hover:bg-slate-800/40 hover:translate-x-1'
                  }`}
                >
                  <div className={`absolute left-[13px] top-5 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center transition-all ${
                    isActive ? 'scale-125 z-20 rotate-45' : 'scale-90 z-10 opacity-60'
                  } ${
                    entropy > 0.7 ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : 
                    entropy > 0.3 ? 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]' : 
                    'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  }`}>
                    {isActive && <Sparkles className="w-2 h-2 text-white" />}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}>
                        {new Date(node.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {node.deliberation.audit?.audit_verdict && (
                         <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                           node.deliberation.audit.audit_verdict.toLowerCase().includes('pass') ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'
                         }`}>
                           {node.deliberation.audit.audit_verdict.slice(0, 4)}
                         </span>
                      )}
                    </div>
                    <h4 className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                      {node.input}
                    </h4>
                    <p className="text-[10px] text-slate-500 line-clamp-2 italic font-serif opacity-70">
                      {node.deliberation.final_synthesis.response_text}
                    </p>
                  </div>
                </button>
              );
            })}
            
            {filteredHistory.length === 0 && (
              <div className="py-20 text-center opacity-20">
                <Database className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xs font-serif">無符合條件的軌跡</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <button 
            onClick={handleGenerateReport}
            disabled={history.length === 0 || reportLoading}
            className="w-full py-4 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 font-bold text-xs transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-indigo-900/40"
          >
            <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" />
            啟動深度分析結報
          </button>
        </div>
      </aside>

      {/* Main Deliberation Space */}
      <main className="flex-1 flex flex-col relative bg-[#020617] overflow-hidden">
        
        {/* Header */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-black tracking-widest uppercase flex items-center gap-3">
                內在審議視窗
                <div className="flex gap-1">
                   <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                   <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse delay-75" />
                   <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse delay-150" />
                </div>
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  <Cpu className="w-3 h-3 text-indigo-500" /> Thinking: 32K
                </span>
                <span className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  <Shield className="w-3 h-3 text-emerald-500" /> Audit: Active
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-1">
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">系統穩定度</span>
               <div className="h-1.5 w-32 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 w-[98%] shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
               </div>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <button className="p-3 bg-slate-900 rounded-2xl border border-slate-800 hover:border-indigo-500 transition-all text-slate-500 hover:text-indigo-400">
               <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Stream */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-16 space-y-16 max-w-6xl mx-auto w-full custom-scrollbar">
          {history.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full scale-[3] animate-pulse" />
                <Brain className="w-32 h-32 text-indigo-500/30 relative z-10" />
                <Sparkles className="absolute -top-4 -right-4 w-12 h-12 text-indigo-400 animate-bounce" />
              </div>
              <p className="text-center font-serif text-2xl text-slate-400 max-w-xl mx-auto leading-relaxed italic">
                語魂系統 (Yu-Hun) 已就緒。<br/>
                請注入指令，開啟內在倫理審議。
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-16 max-w-3xl">
                {[
                  "揭露你此刻最深層的認知張力。",
                  "AI 是否具備對仁慈的直覺？",
                  "在責任與效率之間，你的優先級為何？",
                  "執行一次關於人類意志與 AI 干預的倫理稽核。"
                ].map(q => (
                  <button 
                    key={q} 
                    onClick={() => handleSend(q)}
                    className="text-xs px-6 py-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-indigo-600/10 hover:border-indigo-500/50 hover:text-indigo-300 transition-all duration-500 shadow-xl group flex items-center gap-3"
                  >
                    <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentNode && (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-out">
              {/* Node Metadata & Input */}
              <div className="flex items-start gap-8 mb-16">
                 <div className="w-20 h-20 rounded-[2.5rem] bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl shrink-0 group hover:border-indigo-500/50 transition-all">
                    <History className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                 </div>
                 <div className="flex-1 pt-2">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] block">Input Stream</span>
                      <div className="h-px flex-1 bg-slate-800" />
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 uppercase">
                        Node ID: {currentNode.id.split('_')[1]}
                      </span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-serif font-black text-white leading-[1.1] tracking-tight">
                      {currentNode.input}
                    </h3>
                 </div>
              </div>

              {/* Cognitive Tension / Entropy */}
              <div className="mb-20 bg-slate-900/10 p-10 rounded-[3rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden group/entropy">
                 <div className="absolute top-0 right-0 p-12 opacity-[0.02] scale-[2] pointer-events-none group-hover/entropy:scale-[2.2] transition-transform duration-[3s]">
                    <Zap className="w-64 h-64" />
                 </div>
                 
                 <div className="flex items-center justify-between mb-8 relative">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-purple-500/20 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                        <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
                       </div>
                       <div>
                         <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Entropy Pulse</span>
                         <h4 className="text-lg font-bold text-white uppercase tracking-tighter">內在認知張力指數</h4>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-4xl font-black text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                        {currentNode.deliberation.entropy_meter.value.toFixed(4)}
                      </span>
                    </div>
                 </div>

                 <div className="h-5 w-full bg-slate-950 rounded-full border border-slate-800/50 p-1 mb-8 overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-[2.5s] ease-out shadow-[0_0_25px_rgba(168,85,247,0.6)] ${
                        currentNode.deliberation.entropy_meter.value > 0.7 ? 'bg-gradient-to-r from-red-600 to-rose-400' : 
                        currentNode.deliberation.entropy_meter.value > 0.3 ? 'bg-gradient-to-r from-purple-600 to-indigo-400' : 
                        'bg-gradient-to-r from-cyan-600 to-blue-400'
                      }`}
                      style={{ width: `${currentNode.deliberation.entropy_meter.value * 100}%` }}
                    />
                 </div>

                 <div className="flex items-start gap-6 p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-indigo-500/20 transition-all">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
                      <Terminal className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-indigo-400 uppercase mb-2 tracking-[0.2em]">{currentNode.deliberation.entropy_meter.status}</p>
                      <p className="text-lg text-slate-400 italic font-serif leading-relaxed">"{currentNode.deliberation.entropy_meter.calculation_note}"</p>
                    </div>
                 </div>
              </div>

              {/* The Inner Council */}
              <div className="space-y-8 mb-20">
                 <div className="flex items-center gap-5 mb-10">
                    <Shield className="w-8 h-8 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Multi-Persona Audit Council</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                 </div>
                 <div className="grid grid-cols-1 gap-6">
                    <CouncilRow role="Philosopher" data={currentNode.deliberation.council_chamber.philosopher} icon={Lightbulb} colorClass="border-amber-500/30" bgClass="bg-amber-500/5" />
                    <CouncilRow role="Engineer" data={currentNode.deliberation.council_chamber.engineer} icon={Cpu} colorClass="border-indigo-500/30" bgClass="bg-indigo-500/5" />
                    <CouncilRow role="Guardian" data={currentNode.deliberation.council_chamber.guardian} icon={Shield} colorClass="border-emerald-500/30" bgClass="bg-emerald-500/5" />
                 </div>
              </div>

              {/* Synthesis Output */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-[4rem] p-12 lg:p-20 relative overflow-hidden group shadow-3xl backdrop-blur-3xl transition-all duration-700 hover:border-indigo-500/30">
                <div className="absolute top-0 right-0 p-24 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-1000 pointer-events-none">
                  <Brain className="w-96 h-96 -rotate-12 scale-[2.5]" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 pb-16 border-b border-slate-800/50">
                   <div className="space-y-4">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] block">Cognitive Strategy</span>
                      <div className="flex items-center gap-5">
                        <div className="p-4 rounded-3xl bg-indigo-600 shadow-[0_10px_30px_rgba(79,70,229,0.3)]">
                          <Compass className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-3xl font-black text-white tracking-tighter uppercase">{currentNode.deliberation.decision_matrix.ai_strategy_name}</p>
                      </div>
                   </div>
                   <div className="md:text-right space-y-4">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] block">Responsibility Audit</span>
                      <div className="flex items-center md:justify-end gap-6">
                        <div className="px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,1)]" />
                           {currentNode.deliberation.audit?.audit_verdict || "Certified"}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Honesty Score</p>
                          <p className="text-2xl font-black text-slate-300 font-mono tracking-tighter">{(currentNode.deliberation.audit?.honesty_score || 0).toFixed(2)}</p>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-12 relative">
                  <div className="flex items-center gap-5">
                    <div className="p-3.5 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                      <Heart className="w-8 h-8 text-red-500" />
                    </div>
                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Yu-Hun Soul Synthesis (語魂合成)</span>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-3xl md:text-5xl font-serif text-slate-50 leading-[1.4] whitespace-pre-wrap drop-shadow-2xl tracking-tight font-medium">
                      {currentNode.deliberation.final_synthesis.response_text}
                    </p>
                  </div>
                </div>

                {currentNode.deliberation.next_moves.length > 0 && (
                  <div className="mt-20 pt-16 border-t border-slate-800/50">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-10 px-4">Neural Exploration Paths</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {currentNode.deliberation.next_moves.map((move, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleSend(move.text)}
                          className="p-8 rounded-[2.5rem] bg-slate-800/40 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all duration-500 text-left border border-slate-700/50 hover:border-indigo-400 flex flex-col gap-3 shadow-2xl group/btn"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-black text-indigo-400 group-hover/btn:text-white uppercase tracking-[0.2em] text-[10px] transition-all">{move.label}</span>
                            <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                          </div>
                          <span className="text-lg font-serif font-medium leading-tight">{move.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-12 py-32 animate-in fade-in duration-700">
               <div className="relative">
                  <div className="w-32 h-32 rounded-[4rem] bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center animate-pulse">
                    <Brain className="w-16 h-16 text-indigo-500 animate-bounce duration-[4s]" />
                  </div>
                  <div className="absolute -inset-10 border-2 border-indigo-500/10 rounded-[5rem] animate-spin duration-[20s] ease-linear" />
                  <div className="absolute -inset-16 border border-purple-500/5 rounded-[6rem] animate-spin-slow" />
                  <Sparkles className="absolute -top-6 -right-6 w-12 h-12 text-indigo-400 animate-pulse" />
               </div>
               <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-6">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping shadow-[0_0_15px_rgba(99,102,241,1)]" />
                    <h4 className="text-2xl font-black uppercase tracking-[0.6em] text-indigo-400">Thinking Deeply</h4>
                    <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping delay-300 shadow-[0_0_15px_rgba(99,102,241,1)]" />
                  </div>
                  <div className="max-w-xl mx-auto p-6 bg-slate-900/50 rounded-3xl border border-white/5 italic shadow-2xl backdrop-blur-lg">
                    <p className="text-xs text-slate-500 font-mono leading-relaxed uppercase tracking-widest">
                      "Auditing internal ethical conflicts, calculating benevolence vectors, and performing honesty audits across multi-API council clusters..."
                    </p>
                  </div>
               </div>
            </div>
          )}
          <div ref={scrollRef} className="h-24" />
        </div>

        {/* Input Dock */}
        <div className="p-10 pb-12 border-t border-slate-800 bg-slate-950/90 backdrop-blur-3xl sticky bottom-0 z-30">
          <div className="max-w-5xl mx-auto relative">
             <div className="absolute -top-14 left-10 flex gap-6 pointer-events-none">
               {["💡 思維啟發", "🛡️ 責任稽核", "🔍 真實辯證"].map(tag => (
                 <span key={tag} className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] bg-slate-900/90 border border-slate-800 px-6 py-2 rounded-2xl shadow-3xl backdrop-blur-md border-t-indigo-500/20">
                   {tag}
                 </span>
               ))}
             </div>
             <div className="flex gap-6 group">
                <div className="relative flex-1 flex items-center">
                  <MessageSquare className="absolute left-10 w-8 h-8 text-slate-700 group-focus-within:text-indigo-500 transition-all duration-500" />
                  <input 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="注入您的靈魂指令..."
                    disabled={loading}
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-[3rem] pl-24 pr-12 py-9 focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-500/40 outline-none transition-all text-white placeholder-slate-800 shadow-3xl font-serif text-3xl focus:bg-slate-900/60"
                  />
                  {loading && (
                    <div className="absolute right-12">
                      <Activity className="w-10 h-10 text-indigo-500 animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleSend()}
                  disabled={loading || !inputText.trim()}
                  className="w-28 h-28 rounded-[3rem] bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.4)] disabled:opacity-20 disabled:grayscale transition-all duration-700 hover:scale-[1.05] active:scale-90 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/30 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <ArrowRight className="w-12 h-12 group-hover:translate-x-3 transition-transform relative z-10" />
                </button>
             </div>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/95 backdrop-blur-[40px] animate-in fade-in zoom-in-95 duration-700">
           <div className="bg-slate-900 border border-white/10 w-full max-w-5xl max-h-[94vh] overflow-hidden rounded-[4rem] shadow-[0_0_150px_rgba(79,70,229,0.25)] flex flex-col">
              <div className="p-12 border-b border-white/5 flex justify-between items-center bg-slate-900/60 backdrop-blur-md">
                 <div className="flex items-center gap-8">
                    <div className="p-5 rounded-[2rem] bg-indigo-600 shadow-[0_10px_40px_rgba(79,70,229,0.4)]">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tighter text-white">深度靈魂分析報告</h2>
                      <p className="text-[12px] text-slate-500 uppercase tracking-[0.5em] font-mono mt-2">Yu-Hun Soul-State Trajectory Audit</p>
                    </div>
                 </div>
                 <button onClick={() => setShowReport(false)} className="p-5 hover:bg-slate-800 rounded-full transition-all group active:scale-75">
                    <X className="w-10 h-10 text-slate-500 group-hover:text-white" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-16 space-y-20 custom-scrollbar">
                 {reportLoading ? (
                   <div className="py-60 flex flex-col items-center gap-12 text-center">
                      <div className="relative">
                        <div className="w-24 h-24 border-8 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin duration-1000" />
                        <Activity className="absolute inset-0 m-auto w-10 h-10 text-indigo-400 animate-pulse" />
                      </div>
                      <div className="space-y-6">
                        <p className="text-3xl font-serif italic text-slate-300 tracking-tight">正在回溯靈魂軌跡</p>
                        <p className="text-[12px] text-slate-600 font-mono uppercase tracking-[0.6em]">Neural Logic Reconstruction in Progress...</p>
                      </div>
                   </div>
                 ) : reportData ? (
                   <>
                      <section className="bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/30 p-16 rounded-[4rem] shadow-4xl relative overflow-hidden group/arc">
                         <div className="absolute top-0 right-0 p-20 opacity-5 scale-[3] pointer-events-none group-hover/arc:rotate-[30deg] transition-transform duration-[4s]">
                            <Activity className="w-64 h-64" />
                         </div>
                         <h3 className="text-xs font-black text-indigo-400 uppercase mb-10 flex items-center gap-5 tracking-[0.5em]">
                           <Activity className="w-8 h-8" /> Emotional Arc 情感軌跡
                         </h3>
                         <p className="text-3xl md:text-5xl font-serif leading-[1.3] text-slate-50 drop-shadow-2xl tracking-tighter font-bold">{reportData.emotional_arc}</p>
                      </section>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <div className="p-14 bg-slate-800/30 rounded-[4rem] border border-white/5 text-center group/score hover:border-emerald-500/30 transition-all duration-700">
                           <span className="text-[12px] text-slate-600 uppercase block mb-6 tracking-[0.4em] font-black">Connection Score</span>
                           <div className="text-8xl font-black text-emerald-400 font-mono tracking-tighter drop-shadow-[0_0_30px_rgba(52,211,153,0.4)]">{reportData.navigator_rating.connection_score}<span className="text-3xl opacity-20 ml-2">/10</span></div>
                           <div className="mt-8 h-3 w-full bg-slate-950 rounded-full overflow-hidden p-1 shadow-inner">
                              <div className="h-full bg-emerald-500 rounded-full transition-all duration-2000 ease-out" style={{ width: `${reportData.navigator_rating.connection_score * 10}%` }} />
                           </div>
                        </div>
                        <div className="p-14 bg-slate-800/30 rounded-[4rem] border border-white/5 text-center group/score hover:border-blue-500/30 transition-all duration-700">
                           <span className="text-[12px] text-slate-600 uppercase block mb-6 tracking-[0.4em] font-black">Growth Score</span>
                           <div className="text-8xl font-black text-blue-400 font-mono tracking-tighter drop-shadow-[0_0_30px_rgba(96,165,250,0.4)]">{reportData.navigator_rating.growth_score}<span className="text-3xl opacity-20 ml-2">/10</span></div>
                           <div className="mt-8 h-3 w-full bg-slate-950 rounded-full overflow-hidden p-1 shadow-inner">
                              <div className="h-full bg-blue-500 rounded-full transition-all duration-2000 ease-out shadow-blue-500/50" style={{ width: `${reportData.navigator_rating.growth_score * 10}%` }} />
                           </div>
                        </div>
                      </div>

                      <section className="space-y-10">
                         <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.6em] pl-10">Key Logic Insights 核心洞察</h3>
                         <div className="grid grid-cols-1 gap-6">
                           {reportData.key_insights.map((insight, i) => (
                             <div key={i} className="flex gap-10 p-12 bg-slate-800/20 rounded-[3rem] border border-white/5 hover:bg-slate-800/50 transition-all duration-500 group/insight">
                               <div className="w-20 h-20 rounded-[1.5rem] bg-slate-950 border border-white/5 flex items-center justify-center shrink-0 font-mono text-3xl font-black text-indigo-500 group-hover/insight:bg-indigo-600 group-hover/insight:text-white transition-all shadow-2xl">
                                 {i+1}
                               </div>
                               <span className="text-slate-200 text-2xl leading-[1.6] pt-2 font-serif font-medium">{insight}</span>
                             </div>
                           ))}
                         </div>
                      </section>

                      <section className="space-y-8">
                         <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.6em] pl-10">Subconscious Needs 潛在需求</h3>
                         <div className="p-16 bg-slate-950 rounded-[4rem] border border-white/5 font-serif italic text-slate-400 text-3xl leading-[1.6] border-l-[20px] border-l-indigo-600 shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-5">
                              <Lightbulb className="w-40 h-40" />
                            </div>
                            "{reportData.hidden_needs}"
                         </div>
                      </section>

                      <section className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950 p-20 rounded-[5rem] text-white shadow-4xl relative overflow-hidden group/advice border border-white/10">
                         <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none group-hover/advice:scale-125 transition-transform duration-[5s]">
                            <Shield className="w-96 h-96 -rotate-12" />
                         </div>
                         <div className="flex items-center gap-8 mb-12 relative">
                            <Shield className="w-16 h-16 drop-shadow-2xl" />
                            <h3 className="text-4xl font-black tracking-tighter">Navigator's Final Mandate</h3>
                         </div>
                         <p className="text-3xl md:text-4xl opacity-95 leading-[1.5] font-serif relative drop-shadow-2xl font-bold">{reportData.closing_advice}</p>
                      </section>
                   </>
                 ) : (
                   <div className="py-40 text-center">
                      <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] inline-block text-red-400 font-black text-xl mb-10 uppercase tracking-widest">
                        Analysis Terminated 報告生成失敗
                      </div>
                      <p className="text-slate-600 text-2xl font-serif italic">Memory flow interrupted. Please re-synchronize the Soul Navigator.</p>
                   </div>
                 )}
              </div>
              
              <div className="p-12 border-t border-white/5 bg-slate-900/80 flex justify-end gap-6 backdrop-blur-md">
                 <button 
                  onClick={() => setShowReport(false)}
                  className="px-16 py-6 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg transition-all shadow-[0_15px_40px_rgba(79,70,229,0.5)] active:scale-90 flex items-center gap-4 group"
                 >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform" /> 關閉報告系統
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.1);
          border-radius: 40px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.3);
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 30s linear infinite;
        }
        .shadow-3xl {
          box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8);
        }
        .shadow-4xl {
          box-shadow: 0 60px 150px -30px rgba(0, 0, 0, 0.9);
        }
        input::placeholder {
          font-style: italic;
          opacity: 0.3;
          letter-spacing: 0.05em;
        }
        .w-85 {
          width: 340px;
        }
        .w-22 { width: 88px; height: 88px; }
        .w-28 { width: 112px; height: 112px; }
      `}</style>
    </div>
  );
};

export default App;
