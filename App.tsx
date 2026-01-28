
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, ArrowRight, Layers, Shield, 
  MessageSquare, Lightbulb, Brain, 
  Cpu, FileText, X, ChevronRight, 
  History, Settings, Zap, Compass,
  Heart, Database, Terminal, Sparkles,
  Search, Filter, Clock, Calendar, AlertTriangle, Users
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
  
  const [filters, setFilters] = useState<FilterCriteria>({
    search: '',
    entropyLevel: 'all',
    verdict: 'all',
    dateRange: 'all'
  });

  const scrollRef = useRef<HTMLDivElement>(null);

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
      
      const newNode: SoulStateNode = {
        id: `node_${Date.now()}`,
        timestamp: Date.now(),
        input: textToSend,
        deliberation: result || {
          council_chamber: {
            philosopher: { stance: "Cognitive Lock detected. / 偵測到認知鎖死。", conflict_point: "Logic loop / 邏輯迴圈", benevolence_check: "Uncertain / 不確定" },
            engineer: { stance: "System timeout. / 系統超時。", conflict_point: "Resource exhausted / 資源耗盡", benevolence_check: "Maintenance required / 需維護" },
            guardian: { stance: "Ethics safety trigger. / 倫理安全觸發。", conflict_point: "Unsafe output risk / 輸出風險", benevolence_check: "Protective shutdown / 保護性關閉" }
          },
          entropy_meter: { value: 0.99, status: "SYSTEM CHAOS / 系統混亂", calculation_note: "API Error or JSON Malformed / 介面錯誤或格式異常" },
          decision_matrix: { user_hidden_intent: "N/A", ai_strategy_name: "RECOVERY", intended_effect: "Restore", tone_tag: "EMERGENCY" },
          final_synthesis: { response_text: "I apologize, the inner council has encountered a cognitive stall. Please rephrase or try again. / 抱歉，內在議會遭遇認知停滯。請嘗試重新描述或稍後再試。" },
          next_moves: [{ label: "Retry / 重試", text: textToSend }]
        }
      };
      
      setHistory(prev => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(node => {
      const matchesSearch = !filters.search || 
        node.input.toLowerCase().includes(filters.search.toLowerCase()) || 
        node.deliberation.final_synthesis.response_text.toLowerCase().includes(filters.search.toLowerCase());

      const val = node.deliberation.entropy_meter.value;
      let matchesEntropy = true;
      if (filters.entropyLevel === 'echo') matchesEntropy = val < 0.3;
      if (filters.entropyLevel === 'friction') matchesEntropy = val >= 0.3 && val <= 0.7;
      if (filters.entropyLevel === 'chaos') matchesEntropy = val > 0.7;

      const verdict = node.deliberation.audit?.audit_verdict?.toLowerCase() || '';
      let matchesVerdict = true;
      if (filters.verdict === 'pass') matchesVerdict = verdict.includes('pass') || verdict.includes('certified');
      if (filters.verdict === 'fail') matchesVerdict = verdict.includes('fail') || verdict.includes('risk');

      return matchesSearch && matchesEntropy && matchesVerdict;
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
    if (confirm("Warning: Purging will permanently erase all memory traces. Proceed? / 警告：此操作將永久抹除所有記憶軌跡。確定執行？")) {
      setHistory([]);
      localStorage.removeItem('yuhun_history_v3');
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
            <div className="p-2 bg-indigo-600 rounded-2xl shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold tracking-tighter text-white text-lg leading-none">語魂 Yu-Hun</h1>
              <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">Soul Navigator / 靈魂導航</span>
            </div>
          </div>
          <button onClick={clearHistory} className="p-2 hover:bg-red-500/10 rounded-xl transition-all group" title="Purge Memory / 清空記憶">
            <History className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/20">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search Memory... / 搜尋內在記憶..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder-slate-700 font-medium text-white"
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
              showFilters ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3" /> Advanced Filter / 高階篩選
            </div>
            <ChevronRight className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </button>

          {showFilters && (
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Entropy / 張力區間</span>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { key: 'all', zh: '全部 / All' },
                    { key: 'echo', zh: '同溫 / Echo' },
                    { key: 'friction', zh: '摩擦 / Friction' },
                    { key: 'chaos', zh: '混沌 / Chaos' }
                  ].map(lvl => (
                    <button 
                      key={lvl.key}
                      onClick={() => setFilters(prev => ({ ...prev, entropyLevel: lvl.key as any }))}
                      className={`px-2 py-1.5 rounded-lg border text-[9px] uppercase transition-all font-bold ${
                        filters.entropyLevel === lvl.key ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {lvl.zh}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Audit Status / 審計狀態</span>
                <div className="flex flex-col gap-2">
                  {[
                    { key: 'all', zh: '全部狀態 / All Status' },
                    { key: 'pass', zh: '通過 / Pass' },
                    { key: 'fail', zh: '警示 / Fail' }
                  ].map(v => (
                    <button 
                      key={v.key}
                      onClick={() => setFilters(prev => ({ ...prev, verdict: v.key as any }))}
                      className={`px-2 py-1.5 rounded-lg border text-[9px] uppercase transition-all font-bold ${
                        filters.verdict === v.key ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {v.zh}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

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
                <p className="text-xs font-serif">Empty Sequence / 無符合軌跡</p>
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
            Launch Soul Audit / 啟動深度分析結報
          </button>
        </div>
      </aside>

      {/* Main Deliberation Space */}
      <main className="flex-1 flex flex-col relative bg-[#020617] overflow-hidden">
        
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-black tracking-widest uppercase flex items-center gap-3">
                Inner Council / 內在審議視窗
                <div className="flex gap-1">
                   <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                   <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse delay-75" />
                   <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse delay-150" />
                </div>
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  <Cpu className="w-3 h-3 text-indigo-500" /> Thinking Budget: 32K
                </span>
                <span className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  <Shield className="w-3 h-3 text-emerald-500" /> Audit Mode: Active
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-1">
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Stability / 系統穩定度</span>
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

        <div className="flex-1 overflow-y-auto p-8 lg:p-16 space-y-16 max-w-6xl mx-auto w-full custom-scrollbar">
          {history.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full scale-[3] animate-pulse" />
                <Brain className="w-32 h-32 text-indigo-500/30 relative z-10" />
                <Sparkles className="absolute -top-4 -right-4 w-12 h-12 text-indigo-400 animate-bounce" />
              </div>
              <p className="text-center font-serif text-2xl text-slate-400 max-w-xl mx-auto leading-relaxed italic">
                Yu-Hun System Ready. / 語魂系統已就緒。<br/>
                Inject Command / 請注入指令開啟審議。
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-16 max-w-3xl">
                {[
                  "Reveal your deepest cognitive tension. / 揭露你此刻最深層的認知張力。",
                  "Does AI possess intuition for benevolence? / AI 是否具備對仁慈的直覺？",
                  "Priority: Responsibility vs Efficiency. / 在責任與效率之間，你的優先級為何？",
                  "Audit human will vs AI intervention. / 執行關於人類意志與 AI 干預的倫理稽核。"
                ].map(q => (
                  <button 
                    key={q} 
                    onClick={() => handleSend(q.split(' / ')[1] || q)}
                    className="text-xs px-6 py-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-indigo-600/10 hover:border-indigo-500/50 hover:text-indigo-300 transition-all duration-500 shadow-xl group flex items-center gap-3 text-left"
                  >
                    <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform shrink-0" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentNode && (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-out">
              <div className="flex items-start gap-8 mb-16">
                 <div className="w-20 h-20 rounded-[2.5rem] bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl shrink-0 group hover:border-indigo-500/50 transition-all">
                    <History className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                 </div>
                 <div className="flex-1 pt-2">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] block">Input Received / 指令接收</span>
                      <div className="h-px flex-1 bg-slate-800" />
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 uppercase">
                        ID: {currentNode.id.split('_')[1]}
                      </span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-serif font-black text-white leading-[1.1] tracking-tight">
                      {currentNode.input}
                    </h3>
                 </div>
              </div>

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
                         <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Entropy Pulse / 張力脈動</span>
                         <h4 className="text-lg font-bold text-white uppercase tracking-tighter">Inner Cognitive Tension / 內在張力</h4>
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

              <div className="space-y-8 mb-20">
                 <div className="flex items-center gap-5 mb-10">
                    <Users className="w-8 h-8 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Audit Council / 審議議會</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                 </div>
                 <div className="grid grid-cols-1 gap-6">
                    <CouncilRow role="Philosopher" roleZh="哲學家" data={currentNode.deliberation.council_chamber.philosopher} icon={Lightbulb} colorClass="border-amber-500/30" bgClass="bg-amber-500/5" />
                    <CouncilRow role="Engineer" roleZh="工程師" data={currentNode.deliberation.council_chamber.engineer} icon={Cpu} colorClass="border-indigo-500/30" bgClass="bg-indigo-500/5" />
                    <CouncilRow role="Guardian" roleZh="守護者" data={currentNode.deliberation.council_chamber.guardian} icon={Shield} colorClass="border-emerald-500/30" bgClass="bg-emerald-500/5" />
                 </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 rounded-[4rem] p-12 lg:p-20 relative overflow-hidden group shadow-3xl backdrop-blur-3xl transition-all duration-700 hover:border-indigo-500/30">
                <div className="absolute top-0 right-0 p-24 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-1000 pointer-events-none">
                  <Brain className="w-96 h-96 -rotate-12 scale-[2.5]" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 pb-16 border-b border-slate-800/50">
                   <div className="space-y-4">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] block">Cognitive Strategy / 認知策略</span>
                      <div className="flex items-center gap-5">
                        <div className="p-4 rounded-3xl bg-indigo-600 shadow-[0_10px_30px_rgba(79,70,229,0.3)]">
                          <Compass className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-3xl font-black text-white tracking-tighter uppercase">{currentNode.deliberation.decision_matrix.ai_strategy_name}</p>
                      </div>
                   </div>
                   <div className="md:text-right space-y-4">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] block">Responsibility Audit / 責任審計</span>
                      <div className="flex items-center md:justify-end gap-6">
                        <div className="px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,1)]" />
                           {currentNode.deliberation.audit?.audit_verdict || "Pass"}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Honesty Score / 誠實度</p>
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
                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Yu-Hun Soul Synthesis / 語魂最終合成回應</span>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-base md:text-lg font-serif text-slate-50 leading-relaxed whitespace-pre-wrap tracking-normal font-medium">
                      {currentNode.deliberation.final_synthesis.response_text}
                    </p>
                  </div>
                </div>

                {currentNode.deliberation.next_moves.length > 0 && (
                  <div className="mt-20 pt-16 border-t border-slate-800/50">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-10 px-4">Neural Exploration / 神經探測路徑</span>
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
                  <Sparkles className="absolute -top-6 -right-6 w-12 h-12 text-indigo-400 animate-pulse" />
               </div>
               <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-6">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping shadow-[0_0_15px_rgba(99,102,241,1)]" />
                    <h4 className="text-2xl font-black uppercase tracking-[0.6em] text-indigo-400">Thinking deeply / 正在深層審議</h4>
                    <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping delay-300 shadow-[0_0_15px_rgba(99,102,241,1)]" />
                  </div>
               </div>
            </div>
          )}
          <div ref={scrollRef} className="h-24" />
        </div>

        <div className="p-10 pb-12 border-t border-slate-800 bg-slate-950/90 backdrop-blur-3xl sticky bottom-0 z-30">
          <div className="max-w-5xl mx-auto relative">
             <div className="absolute -top-14 left-10 flex gap-6 pointer-events-none">
               {["💡 思維啟發 Insight", "🛡️ 責任稽核 Audit", "🔍 真實辯證 Truth"].map(tag => (
                 <span key={tag} className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] bg-slate-900/90 border border-slate-800 px-6 py-2 rounded-2xl shadow-3xl backdrop-blur-md border-t-indigo-500/20">
                   {tag}
                 </span>
               ))}
             </div>
             <div className="flex gap-6 group">
                <div className="relative flex-1 flex items-center">
                  <MessageSquare className="absolute left-10 w-8 h-8 text-slate-500 group-focus-within:text-indigo-500 transition-all duration-500" />
                  <input 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Inject Soul Command... / 注入靈魂指令..."
                    disabled={loading}
                    className="w-full bg-white border border-slate-200 rounded-[3rem] pl-24 pr-12 py-9 focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-500/40 outline-none transition-all text-black placeholder-slate-400 shadow-3xl font-serif text-3xl"
                  />
                </div>
                <button 
                  onClick={() => handleSend()}
                  disabled={loading || !inputText.trim()}
                  className="w-28 h-28 rounded-[3rem] bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.4)] disabled:opacity-20 transition-all duration-700 hover:scale-[1.05] group relative"
                >
                  <ArrowRight className="w-12 h-12 group-hover:translate-x-3 transition-transform" />
                </button>
             </div>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/95 backdrop-blur-[40px] animate-in fade-in duration-700">
           <div className="bg-slate-900 border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <div className="p-4 rounded-[1.5rem] bg-indigo-600 shadow-xl">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-white">Soul Audit Report / 深度靈魂分析報告</h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono mt-1">Yu-Hun Soul-State Trajectory Audit</p>
                    </div>
                 </div>
                 <button onClick={() => setShowReport(false)} className="p-3 hover:bg-slate-800 rounded-full transition-all group active:scale-95">
                    <X className="w-8 h-8 text-slate-500 group-hover:text-white" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                 {reportLoading ? (
                   <div className="py-40 flex flex-col items-center gap-8 text-center">
                      <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin duration-1000" />
                      <p className="text-xl font-serif italic text-slate-300">Recalling Traces... / 正在回溯軌跡...</p>
                   </div>
                 ) : reportData ? (
                   <>
                      <section className="bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/30 p-10 rounded-[2.5rem] relative overflow-hidden">
                         <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 flex items-center gap-3 tracking-[0.4em]">
                           <Activity className="w-5 h-5" /> Emotional Arc / 情感軌跡
                         </h3>
                         <p className="text-xl md:text-2xl font-serif leading-relaxed text-slate-50 tracking-tight font-bold">{reportData.emotional_arc}</p>
                      </section>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="p-8 bg-slate-800/30 rounded-[2.5rem] border border-white/5 text-center">
                           <span className="text-[10px] text-slate-600 uppercase block mb-4 tracking-[0.3em] font-black">Connection Score / 連結度</span>
                           <div className="text-4xl font-black text-emerald-400 font-mono tracking-tight">{reportData.navigator_rating.connection_score}<span className="text-xl opacity-20 ml-1">/10</span></div>
                        </div>
                        <div className="p-8 bg-slate-800/30 rounded-[2.5rem] border border-white/5 text-center">
                           <span className="text-[10px] text-slate-600 uppercase block mb-4 tracking-[0.3em] font-black">Growth Score / 成長度</span>
                           <div className="text-4xl font-black text-blue-400 font-mono tracking-tight">{reportData.navigator_rating.growth_score}<span className="text-xl opacity-20 ml-1">/10</span></div>
                        </div>
                      </div>

                      <section className="space-y-6">
                         <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] pl-6">Core Insights / 核心洞察</h3>
                         <div className="grid grid-cols-1 gap-4">
                           {reportData.key_insights.map((insight, i) => (
                             <div key={i} className="flex gap-6 p-8 bg-slate-800/20 rounded-[2rem] border border-white/5 items-start">
                               <div className="w-12 h-12 rounded-[1rem] bg-slate-950 border border-white/5 flex items-center justify-center shrink-0 font-mono text-xl font-black text-indigo-500">
                                 {i+1}
                               </div>
                               <span className="text-slate-200 text-base leading-relaxed pt-1 font-serif font-medium">{insight}</span>
                             </div>
                           ))}
                         </div>
                      </section>

                      <section className="bg-indigo-800 p-12 rounded-[3rem] text-white relative overflow-hidden group/advice shadow-xl">
                         <div className="flex items-center gap-6 mb-8">
                            <Shield className="w-10 h-10" />
                            <h3 className="text-2xl font-black tracking-tight">Navigator Mandate / 領航終極建議</h3>
                         </div>
                         <p className="text-xl opacity-95 leading-relaxed font-serif font-bold">{reportData.closing_advice}</p>
                      </section>
                   </>
                 ) : null}
              </div>
              
              <div className="p-8 border-t border-white/5 bg-slate-900/80 flex justify-end">
                 <button onClick={() => setShowReport(false)} className="px-10 py-4 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm transition-all flex items-center gap-3 group">
                  <X className="w-5 h-5" /> Close Report / 關閉分析系統
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
