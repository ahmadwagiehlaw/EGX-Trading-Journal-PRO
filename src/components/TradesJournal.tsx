import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ShieldAlert, 
  X, 
  PenTool, 
  LineChart, 
  ChevronDown, 
  ChevronUp, 
  ArrowDownLeft, 
  Trash2, 
  Layers,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Wallet,
  TrendingUp,
  Building2,
  Factory,
  FlaskConical,
  Cpu,
  Flame,
  Utensils,
  Activity,
  Truck,
  Car,
  Landmark,
  Briefcase,
  Boxes
} from 'lucide-react';
import NewTradeForm from './NewTradeForm';
import ActiveTrades from './ActiveTrades';
import TransactionFormModal from './TransactionFormModal';
import { useTrades, type TickerPosition } from '../context/TradeContext';
import { computePositionMetrics, formatEGP } from '../utils/calculations';
import { getStockBySymbol } from '../data/egxStocks';

// Helper to get sector icon and styling
function getSectorInfo(sectorName?: string) {
  switch (sectorName) {
    case 'بنوك':
      return { Icon: Landmark, label: 'بنوك', badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
    case 'خدمات مالية':
    case 'استثمار':
      return { Icon: Briefcase, label: 'خدمات مالية', badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
    case 'عقارات':
    case 'عقارات وسياحة':
    case 'مقاولات':
      return { Icon: Building2, label: 'عقارات', badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    case 'صناعي':
    case 'مواد أساسية':
    case 'منسوجات':
      return { Icon: Factory, label: sectorName || 'صناعة ومواد', badgeClass: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' };
    case 'كيماويات':
      return { Icon: FlaskConical, label: 'كيماويات وأسمدة', badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    case 'تكنولوجيا':
    case 'اتصالات':
      return { Icon: Cpu, label: 'تكنولوجيا', badgeClass: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' };
    case 'طاقة وبترول':
      return { Icon: Flame, label: 'طاقة وبترول', badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
    case 'أغذية ومشروبات':
    case 'أغذية':
      return { Icon: Utensils, label: 'أغذية ومشروبات', badgeClass: 'bg-lime-50 dark:bg-lime-950/60 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800' };
    case 'رعاية صحية':
    case 'أدوية':
      return { Icon: Activity, label: 'أدوية وصحة', badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800' };
    case 'نقل وشحن':
      return { Icon: Truck, label: 'نقل ولوجستيات', badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    case 'سيارات':
      return { Icon: Car, label: 'سيارات', badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
    default:
      return { Icon: Boxes, label: sectorName || 'سوق المال', badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
  }
}

function Modal({ isOpen, onClose, children, title, maxWidth = 'max-w-3xl' }: {
  isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string; maxWidth?: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
            <div className="w-20 h-0.5 bg-blue-500/40 mt-1 rounded-full"></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function TradesJournal({ 
  draftTrade, 
  isNewTradeOpen, 
  setIsNewTradeOpen 
}: {
  draftTrade: any; 
  isNewTradeOpen: boolean; 
  setIsNewTradeOpen: (v: boolean) => void;
}) {
  const { positions, deletePosition, deleteTransaction } = useTrades();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('egx_trades_view') as 'cards' | 'table') || 'cards';
  });

  const handleSetViewMode = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('egx_trades_view', mode);
  };

  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [editingTrade, setEditingTrade] = useState<any>(null);
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'won' | 'lost' | 'ruleBreaker'>('all');
  const [txModal, setTxModal] = useState<{ pos: TickerPosition; type: 'buy' | 'sell' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered positions
  const filteredPositions = useMemo(() => {
    return positions.filter(pos => {
      const metrics = computePositionMetrics(pos);
      const isWon = metrics.realizedPnL > 0 && (pos.status === 'closed' || metrics.openShares === 0);
      const isLost = metrics.realizedPnL < 0 && (pos.status === 'closed' || metrics.openShares === 0);
      const isActive = pos.status === 'active' && metrics.openShares > 0;
      const isRuleBreaker = pos.journal?.isRuleBreaker;

      // Status filter
      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'won' && !isWon) return false;
      if (statusFilter === 'lost' && !isLost) return false;
      if (statusFilter === 'ruleBreaker' && !isRuleBreaker) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const stockInfo = getStockBySymbol(pos.symbol);
        const symbolMatch = (pos.symbol || '').toLowerCase().includes(query);
        const nameMatch = (stockInfo?.nameAr || '').toLowerCase().includes(query) || (stockInfo?.nameEn || '').toLowerCase().includes(query);
        const sectorMatch = (stockInfo?.sector || '').toLowerCase().includes(query);
        const strategyMatch = (pos.plan?.strategy || pos.plan?.makerPlan || '').toLowerCase().includes(query);
        const tagsMatch = (pos.journal?.tags || []).some(t => t.toLowerCase().includes(query));
        const notesMatch = (pos.journal?.lessonLearned || pos.journal?.mistake || '').toLowerCase().includes(query);
        
        if (!symbolMatch && !nameMatch && !sectorMatch && !strategyMatch && !tagsMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [positions, statusFilter, searchQuery]);

  return (
    <div className="w-full space-y-5" dir="rtl">
      
      {/* Header Controls & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
        
        {/* Left/Main Filter Area */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 flex-wrap">
          
          {/* Status Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl overflow-x-auto border border-slate-200/60 dark:border-slate-700/50">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                statusFilter === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              الكل ({positions.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'active' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse"></span>
              نشطة ({positions.filter(p => computePositionMetrics(p).openShares > 0 && p.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('won')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                statusFilter === 'won' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              أرباح ✓
            </button>
            <button
              onClick={() => setStatusFilter('lost')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                statusFilter === 'lost' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              خسائر ✕
            </button>
            <button
              onClick={() => setStatusFilter('ruleBreaker')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap ${
                statusFilter === 'ruleBreaker' 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              مخالفات ⚠️
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="ابحث بالرمز، اسم الشركة، القطاع، الاستراتيجية..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-2 pr-9 pl-3 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Right Actions: View Toggle + New Trade */}
        <div className="flex items-center gap-2.5">
          {/* View Switcher (Cards vs Table) */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/60 dark:border-slate-700/50">
            <button
              onClick={() => handleSetViewMode('cards')}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="عرض الكروت الذكية"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">كروت</span>
            </button>
            <button
              onClick={() => handleSetViewMode('table')}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="عرض الجدول المالي الاحترافي"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden md:inline">جدول</span>
            </button>
          </div>

          {/* New Trade Button */}
          <button 
            onClick={() => { setEditingTrade(null); setIsNewTradeOpen(true); }}
            className="flex-1 sm:flex-none bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-black px-5 py-2.5 rounded-2xl shadow-md shadow-blue-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>توثيق صفقة جديدة</span>
          </button>
        </div>
      </div>

      {/* No positions state */}
      {filteredPositions.length === 0 ? (
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-handwriting text-2xl text-slate-500 dark:text-slate-400">لا توجد صفقات تطابق هذا الاختيار...</p>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">
            سجل صفقاتك وتابع مراكزك المالية بدقة متناهية!
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        
        /* ========================================================
           VIEW 1: SMART CARDS VIEW (Fintech Terminal Architecture)
           ======================================================== */
        <div className="space-y-4">
          {filteredPositions.map((pos) => {
            const metrics = computePositionMetrics(pos);
            const isExpanded = expandedPositionId === pos.id;
            const isRuleBreaker = pos.journal?.isRuleBreaker;
            const stockInfo = getStockBySymbol(pos.symbol);
            const sectorInfo = getSectorInfo(stockInfo?.sector || (pos.plan as any)?.sector);
            const SectorIcon = sectorInfo.Icon;

            const investedCapital = metrics.openShares * metrics.avgEntry;
            const riskAmount = metrics.openShares > 0 && metrics.currentStop > 0 && metrics.avgEntry > metrics.currentStop 
              ? (metrics.avgEntry - metrics.currentStop) * metrics.openShares 
              : 0;
            const riskPct = investedCapital > 0 && riskAmount > 0 ? (riskAmount / investedCapital) * 100 : 0;
            
            // Distances and RR
            const stopDistPct = metrics.avgEntry > 0 && metrics.currentStop > 0 
              ? ((metrics.avgEntry - metrics.currentStop) / metrics.avgEntry) * 100 
              : 0;
            const targetDistPct = metrics.avgEntry > 0 && pos.plan?.target && pos.plan.target > metrics.avgEntry 
              ? ((pos.plan.target - metrics.avgEntry) / metrics.avgEntry) * 100 
              : 0;
            const rrRatio = stopDistPct > 0 && targetDistPct > 0 ? (targetDistPct / stopDistPct) : null;

            return (
              <div 
                key={pos.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-lg overflow-hidden ${
                  metrics.isOpen 
                    ? 'border-blue-200/90 dark:border-blue-900/60 shadow-blue-500/5' 
                    : metrics.realizedPnL > 0 
                      ? 'border-emerald-200/90 dark:border-emerald-900/60 shadow-emerald-500/5' 
                      : metrics.realizedPnL < 0 
                        ? 'border-red-200/90 dark:border-red-900/60 shadow-red-500/5' 
                        : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* 1. HERO HEADER: Sector Avatar + Identity + Action Hub */}
                <div className="p-5 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
                  
                  {/* Stock Avatar & Info */}
                  <div className="flex items-center gap-4">
                    
                    {/* Expressive Sector Avatar (No letters, pure icon aesthetic) */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 transition-transform ${
                      isRuleBreaker 
                        ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300' 
                        : metrics.isOpen
                          ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 border-blue-400/40 text-white shadow-blue-500/20'
                          : metrics.realizedPnL > 0 
                            ? 'bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-700 border-emerald-400/40 text-white shadow-emerald-500/20' 
                            : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-white shadow-slate-500/10'
                    }`}>
                      <SectorIcon className="w-7 h-7 stroke-[2.2]" />
                    </div>

                    <div>
                      {/* Ticker Symbol + Arabic Name + Status */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono-num" dir="ltr">
                          {pos.symbol}
                        </span>

                        {stockInfo?.nameAr && (
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                            {stockInfo.nameAr}
                          </span>
                        )}
                        
                        {/* Live Status Pill */}
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${
                          metrics.isOpen 
                            ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-xs' 
                            : metrics.realizedPnL > 0 
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-xs' 
                              : metrics.realizedPnL < 0 
                                ? 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 shadow-xs' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}>
                          {metrics.isOpen ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                              <span>صفقة نشطة</span>
                            </>
                          ) : metrics.realizedPnL > 0 ? '✓ ربح محقق' : metrics.realizedPnL < 0 ? '✕ خسارة' : '○ تعادل'}
                        </span>

                        {isRuleBreaker && (
                          <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-black px-2.5 py-1 rounded-xl">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            مخالفة خطة الدخول
                          </span>
                        )}
                      </div>

                      {/* Sub-details: Sector & Strategy Tags */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 ${sectorInfo.badgeClass}`}>
                          <SectorIcon className="w-3.5 h-3.5" />
                          <span>{sectorInfo.label}</span>
                        </span>

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100/70 dark:bg-slate-800/70 px-2.5 py-0.5 rounded-lg">
                          {pos.plan?.strategy || 'تمركز واستثمار'}
                        </span>

                        {pos.journal?.tags && pos.journal.tags.map(t => (
                          <span key={t} className="text-[10px] bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-100 dark:border-purple-800 font-bold">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Segmented Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {metrics.isOpen && (
                      <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
                        <button
                          onClick={() => setTxModal({ pos, type: 'buy' })}
                          className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-blue-50 text-blue-700 dark:text-blue-300 text-xs font-black rounded-xl transition-all flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-600" />
                          تعزيز
                        </button>
                        <button
                          onClick={() => setTxModal({ pos, type: 'sell' })}
                          className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300 text-xs font-black rounded-xl transition-all flex items-center gap-1 shadow-xs"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                          تخفيف
                        </button>
                      </div>
                    )}

                    <button 
                      onClick={() => setSelectedTradeId(pos.id)}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black rounded-2xl transition-all flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700 shadow-xs"
                      title="الشارت ومحرك الوقف"
                    >
                      <LineChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      الوقف والشارت
                    </button>

                    <button 
                      onClick={() => { setEditingTrade(pos); setIsNewTradeOpen(true); }}
                      className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl transition-colors border border-transparent hover:border-blue-200"
                      title="تعديل"
                    >
                      <PenTool className="w-4 h-4" />
                    </button>

                    {deleteConfirmId === pos.id ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/60 p-1 rounded-2xl border border-red-200 dark:border-red-800">
                        <button
                          onClick={() => { deletePosition(pos.id); setDeleteConfirmId(null); }}
                          className="px-2.5 py-1 bg-red-600 text-white text-xs font-black rounded-xl shadow-xs"
                        >
                          تأكيد
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-1 text-slate-400 hover:text-slate-700 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeleteConfirmId(pos.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-2xl transition-colors border border-transparent hover:border-red-200"
                        title="حذف المركز"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. HIGH-IMPACT INFOGRAPHIC FINANCIAL TILES (Clean, Visual, Red/Green Color-Coded) */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                  
                  {/* TILE 1: RISK & STOP (Bold Crimson/Red Theme) */}
                  <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/50 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        الوقف والمخاطرة
                      </span>
                      {riskPct > 0 && (
                        <span className="text-[11px] font-black bg-rose-200/80 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-lg font-mono-num" dir="ltr">
                          -{riskPct.toFixed(1)}%
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">سعر الوقف</span>
                        <span className="font-black text-rose-600 dark:text-rose-400 font-mono-num text-lg block leading-tight" dir="ltr">
                          {metrics.currentStop % 1 === 0 ? metrics.currentStop : metrics.currentStop.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-rose-500/80 font-bold" dir="ltr">
                          {stopDistPct > 0 ? `-${stopDistPct.toFixed(1)}%` : 'مؤمن'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold block">أقصى خسارة</span>
                        <span className="font-black text-rose-600 dark:text-rose-400 font-mono-num text-lg block leading-tight" dir="ltr">
                          {riskAmount > 0 ? `-${formatEGP(Math.round(riskAmount), 0)}` : '0 EGP'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          عند كسر الوقف
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TILE 2: POSITION & ENTRY CAPITAL (Neutral / Blue Theme) */}
                  <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        رأس المال والدخول
                      </span>
                      <span className="text-[11px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-lg font-mono-num">
                        {metrics.openShares > 0 ? `${metrics.openShares.toLocaleString()} سهم` : 'مغلق'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">رأس المال الموظف</span>
                        <span className="font-black text-slate-900 dark:text-white font-mono-num text-lg block leading-tight" dir="ltr">
                          {formatEGP(Math.round(investedCapital), 0)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          القيمة الحالية
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">متوسط الشراء</span>
                        <span className="font-black text-blue-600 dark:text-blue-400 font-mono-num text-lg block leading-tight" dir="ltr">
                          {metrics.avgEntry % 1 === 0 ? metrics.avgEntry : metrics.avgEntry.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          المتوسط الموزون
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TILE 3: TARGET & PROFIT POTENTIAL (Bold Emerald/Green Theme) */}
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-900/50 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        الهدف والأرباح
                      </span>
                      {rrRatio ? (
                        <span className="text-[11px] font-black bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-lg font-mono-num" dir="ltr">
                          R:R 1:{rrRatio.toFixed(1)}
                        </span>
                      ) : targetDistPct > 0 ? (
                        <span className="text-[11px] font-black bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-lg font-mono-num" dir="ltr">
                          +{targetDistPct.toFixed(1)}%
                        </span>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block">الهدف المتوقع</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono-num text-lg block leading-tight" dir="ltr">
                          {pos.plan?.target ? (pos.plan.target % 1 === 0 ? pos.plan.target : pos.plan.target.toFixed(2)) : '—'}
                        </span>
                        <span className="text-[10px] text-emerald-600/80 font-bold" dir="ltr">
                          {pos.plan?.target && pos.plan.target > metrics.avgEntry 
                            ? `+${formatEGP(Math.round((pos.plan.target - metrics.avgEntry) * metrics.openShares), 0)}`
                            : targetDistPct > 0 ? `+${targetDistPct.toFixed(1)}%` : 'تتبع'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">الربح المحقق</span>
                        <span className={`font-black font-mono-num text-lg block leading-tight ${
                          metrics.realizedPnL > 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : metrics.realizedPnL < 0 
                              ? 'text-rose-600 dark:text-rose-400' 
                              : 'text-slate-600 dark:text-slate-400'
                        }`} dir="ltr">
                          {metrics.realizedPnL !== 0 
                            ? `${metrics.realizedPnL > 0 ? '+' : ''}${formatEGP(Math.round(metrics.realizedPnL), 0)}`
                            : '0 EGP'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {metrics.realizedPnL !== 0 ? 'مبيعات جزئية' : 'لا يوجد تخفيف'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 3. COMPACT PRICE TRACK & FOOTER BAR */}
                <div className="p-3.5 px-5 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Visual Infographic Price Progress Spectrum */}
                  <div className="flex-1 max-w-md space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-mono-num font-bold">
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                        وقف: {metrics.currentStop % 1 === 0 ? metrics.currentStop : metrics.currentStop.toFixed(2)}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                        دخول: {metrics.avgEntry % 1 === 0 ? metrics.avgEntry : metrics.avgEntry.toFixed(2)}
                      </span>
                      {pos.plan?.target && (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                          هدف: {pos.plan.target % 1 === 0 ? pos.plan.target : pos.plan.target.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {pos.plan?.target && pos.plan.target > metrics.currentStop && (
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner" dir="ltr">
                        <div 
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-l-full" 
                          style={{ width: `${Math.max(12, Math.min(45, (stopDistPct / (stopDistPct + targetDistPct || 1)) * 100))}%` }} 
                        />
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-r-full" 
                          style={{ width: `${Math.max(55, Math.min(88, (targetDistPct / (stopDistPct + targetDistPct || 1)) * 100))}%` }} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Expand Transactions Button */}
                  <div className="flex items-center gap-3">
                    {pos.journal?.lessonLearned && (
                      <span className="hidden xl:block font-handwriting text-xs text-slate-400 line-clamp-1 max-w-xs">
                        "{pos.journal.lessonLearned}"
                      </span>
                    )}

                    <button
                      onClick={() => setExpandedPositionId(isExpanded ? null : pos.id)}
                      className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all border shadow-xs ${
                        isExpanded
                          ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span>سجل الحركات المالية المباشرة</span>
                      <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-mono-num font-black">
                        {pos.transactions?.length || 0}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                </div>

                {/* 4. EXPANDABLE PROFESSIONAL TRANSACTION LEDGER TABLE */}
                {isExpanded && (
                  <div className="bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          جدول الحركات والصفقات الجزئية لـ {stockInfo?.nameAr || pos.symbol}
                        </h4>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">
                          توثيق دقيق لكل عملية شراء، تعزيز، أو بيع وتخفيف جزئي بالأسعار والكميات.
                        </p>
                      </div>

                      {metrics.isOpen && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTxModal({ pos, type: 'buy' })}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            + شراء / تعزيز
                          </button>
                          <button
                            onClick={() => setTxModal({ pos, type: 'sell' })}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            + بيع جزئي
                          </button>
                        </div>
                      )}
                    </div>

                    {(!pos.transactions || pos.transactions.length === 0) ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold text-center py-6">
                        لا توجد حركات مسجلة بعد في هذا المركز.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-black text-[11px]">
                            <tr>
                              <th className="py-3 px-4">نوع العملية</th>
                              <th className="py-3 px-3">التاريخ والوقت</th>
                              <th className="py-3 px-3 text-left">الكمية (الأسهم)</th>
                              <th className="py-3 px-3 text-left">سعر التنفيذ</th>
                              <th className="py-3 px-3 text-left">إجمالي القيمة</th>
                              <th className="py-3 px-3 text-left">الربح المحقق</th>
                              <th className="py-3 px-3">الملاحظات والسبب</th>
                              <th className="py-3 px-3 text-center">إجراء</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                            {pos.transactions.map((tx, idx) => {
                              const isBuy = tx.type === 'buy';
                              const txPnl = !isBuy && metrics.avgEntry > 0 ? (tx.price - metrics.avgEntry) * tx.shares : 0;

                              return (
                                <tr key={tx.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                  {/* Type */}
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border ${
                                      isBuy 
                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    }`}>
                                      {isBuy ? <Plus className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                      {isBuy ? 'شراء وتمركز' : 'بيع جزئي'}
                                    </span>
                                  </td>

                                  {/* Date */}
                                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                    {new Date(tx.date).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                                    <span className="text-[10px] text-slate-400 block font-mono-num" dir="ltr">
                                      {new Date(tx.date).toLocaleTimeString('ar-EG', { timeStyle: 'short' })}
                                    </span>
                                  </td>

                                  {/* Shares */}
                                  <td className="py-3 px-3 text-left font-mono-num font-black text-slate-900 dark:text-white" dir="ltr">
                                    {tx.shares.toLocaleString()} سهم
                                  </td>

                                  {/* Price */}
                                  <td className="py-3 px-3 text-left font-mono-num font-black text-slate-900 dark:text-white" dir="ltr">
                                    {tx.price.toFixed(2)} EGP
                                  </td>

                                  {/* Amount */}
                                  <td className="py-3 px-3 text-left font-mono-num font-black text-slate-900 dark:text-white" dir="ltr">
                                    {formatEGP(tx.amount)}
                                  </td>

                                  {/* Realized PnL for this tx */}
                                  <td className="py-3 px-3 text-left font-mono-num font-black" dir="ltr">
                                    {!isBuy && txPnl !== 0 ? (
                                      <span className={txPnl > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                        {txPnl > 0 ? '+' : ''}{formatEGP(txPnl)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 dark:text-slate-600">—</span>
                                    )}
                                  </td>

                                  {/* Note */}
                                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                                    {tx.note || <span className="text-slate-400 text-[11px]">—</span>}
                                  </td>

                                  {/* Delete */}
                                  <td className="py-3 px-3 text-center">
                                    <button
                                      onClick={() => deleteTransaction(pos.id, tx.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                      title="حذف هذه الحركة"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        
        /* ========================================================
           VIEW 2: PROFESSIONAL COMPACT FINANCIAL TABLE
           ======================================================== */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-black text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">السهم والشركة</th>
                  <th className="py-3.5 px-3">القطاع والحالة</th>
                  <th className="py-3.5 px-3 text-left">متوسط الدخول</th>
                  <th className="py-3.5 px-3 text-left">الوقف المتحرك</th>
                  <th className="py-3.5 px-3 text-left">الهدف</th>
                  <th className="py-3.5 px-3 text-left">الأسهم المفتوحة</th>
                  <th className="py-3.5 px-3 text-left">رأس المال والمخاطرة</th>
                  <th className="py-3.5 px-3 text-left">صافي الربح / الخسارة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredPositions.map((pos) => {
                  const metrics = computePositionMetrics(pos);
                  const isExpanded = expandedPositionId === pos.id;
                  const isRuleBreaker = pos.journal?.isRuleBreaker;
                  const stockInfo = getStockBySymbol(pos.symbol);
                  const sectorInfo = getSectorInfo(stockInfo?.sector || (pos.plan as any)?.sector);
                  const SectorIcon = sectorInfo.Icon;
                  const investedCapital = metrics.openShares * metrics.avgEntry;
                  const riskAmount = metrics.openShares > 0 && metrics.currentStop > 0 && metrics.avgEntry > metrics.currentStop 
                    ? (metrics.avgEntry - metrics.currentStop) * metrics.openShares 
                    : 0;

                  return (
                    <div key={pos.id} className="contents">
                      <tr 
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isExpanded ? 'bg-slate-50/60 dark:bg-slate-800/30' : ''
                        }`}
                      >
                        {/* Symbol & Company Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shadow-xs shrink-0 ${
                              metrics.isOpen 
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/20' 
                                : metrics.realizedPnL > 0 
                                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/20' 
                                  : 'bg-slate-700'
                            }`}>
                              <SectorIcon className="w-4.5 h-4.5 stroke-[2.2]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900 dark:text-white text-sm" dir="ltr">
                                  {pos.symbol}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block truncate max-w-[120px]">
                                {stockInfo?.nameAr || pos.plan?.strategy || 'تمركز'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Sector & Status */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center gap-1 ${
                              metrics.isOpen 
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                                : metrics.realizedPnL > 0 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                                  : metrics.realizedPnL < 0 
                                    ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' 
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}>
                              {metrics.isOpen ? '● نشطة' : metrics.realizedPnL > 0 ? '✓ ربح' : '✕ خسارة'}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border flex items-center gap-1 ${sectorInfo.badgeClass}`}>
                              <SectorIcon className="w-2.5 h-2.5" />
                              <span>{sectorInfo.label}</span>
                            </span>
                            {isRuleBreaker && (
                              <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                                3MS ⚠️
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Avg Entry */}
                        <td className="py-3 px-3 text-left font-mono-num font-black text-slate-900 dark:text-white" dir="ltr">
                          {metrics.avgEntry.toFixed(2)} EGP
                        </td>

                        {/* Trailing Stop */}
                        <td className="py-3 px-3 text-left font-mono-num font-black text-red-600 dark:text-red-400" dir="ltr">
                          {metrics.currentStop.toFixed(2)} EGP
                        </td>

                        {/* Target */}
                        <td className="py-3 px-3 text-left font-mono-num font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                          {pos.plan?.target ? `${pos.plan.target.toFixed(2)} EGP` : '—'}
                        </td>

                        {/* Shares */}
                        <td className="py-3 px-3 text-left font-mono-num text-slate-700 dark:text-slate-300" dir="ltr">
                          <span className="font-black text-slate-900 dark:text-white">{metrics.openShares}</span>
                          <span className="text-[10px] text-slate-400 block">من {metrics.totalBought}</span>
                        </td>

                        {/* Invested & Risk */}
                        <td className="py-3 px-3 text-left font-mono-num" dir="ltr">
                          <span className="font-black text-slate-900 dark:text-white block">
                            {formatEGP(investedCapital)}
                          </span>
                          {riskAmount > 0 && (
                            <span className="text-[10px] font-black text-red-500 block">
                              مخاطرة: -{formatEGP(riskAmount)}
                            </span>
                          )}
                        </td>

                        {/* Realized P&L */}
                        <td className="py-3 px-3 text-left font-mono-num font-black" dir="ltr">
                          <span className={`text-sm ${
                            metrics.realizedPnL > 0 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : metrics.realizedPnL < 0 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-slate-400'
                          }`}>
                            {metrics.realizedPnL > 0 ? '+' : ''}{formatEGP(metrics.realizedPnL)}
                          </span>
                        </td>

                        {/* Actions Toolbar */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {metrics.isOpen && (
                              <>
                                <button
                                  onClick={() => setTxModal({ pos, type: 'buy' })}
                                  className="p-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-300 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                                  title="تعزيز / شراء"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setTxModal({ pos, type: 'sell' })}
                                  className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-300 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                                  title="تخفيف / بيع جزئي"
                                >
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => setSelectedTradeId(pos.id)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                              title="الشارت والوقف"
                            >
                              <LineChart className="w-3.5 h-3.5 text-blue-500" />
                            </button>

                            <button
                              onClick={() => { setEditingTrade(pos); setIsNewTradeOpen(true); }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setExpandedPositionId(isExpanded ? null : pos.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors"
                              title="تفاصيل الحركات"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {deleteConfirmId === pos.id ? (
                              <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/60 p-0.5 rounded-lg border border-red-200 dark:border-red-800">
                                <button
                                  onClick={() => { deletePosition(pos.id); setDeleteConfirmId(null); }}
                                  className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-black rounded"
                                >
                                  تأكيد
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1 text-slate-400 hover:text-slate-700 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(pos.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                title="حذف المركز"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Transaction History in Table */}
                      {isExpanded && (
                        <tr key={`${pos.id}-drawer`} className="bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
                          <td colSpan={9} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-black text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                  سجل الحركات والصفقات المباشرة لـ {stockInfo?.nameAr || pos.symbol}
                                </h4>
                                {metrics.isOpen && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setTxModal({ pos, type: 'buy' })}
                                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors"
                                    >
                                      + شراء إضافي
                                    </button>
                                    <button
                                      onClick={() => setTxModal({ pos, type: 'sell' })}
                                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors"
                                    >
                                      + بيع جزئي
                                    </button>
                                  </div>
                                )}
                              </div>

                              {(!pos.transactions || pos.transactions.length === 0) ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold text-center py-2">
                                  لا توجد حركات مسجلة.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {pos.transactions.map((tx, idx) => {
                                    const isBuy = tx.type === 'buy';
                                    const txPnl = !isBuy && metrics.avgEntry > 0 ? (tx.price - metrics.avgEntry) * tx.shares : 0;

                                    return (
                                      <div 
                                        key={tx.id || idx}
                                        className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className={`p-1.5 rounded-lg ${isBuy ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'}`}>
                                            {isBuy ? <Plus className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                                          </span>
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-black text-slate-800 dark:text-white">
                                                {isBuy ? 'شراء' : 'بيع جزئي'}
                                              </span>
                                              <span className="font-mono-num font-black text-slate-900 dark:text-slate-200" dir="ltr">
                                                {tx.shares} @ {tx.price.toFixed(2)} EGP
                                              </span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">
                                              {new Date(tx.date).toLocaleDateString('ar-EG')}
                                              {tx.note && ` • ${tx.note}`}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <div className="text-left">
                                            <span className="font-mono-num font-black text-slate-800 dark:text-white" dir="ltr">
                                              {formatEGP(tx.amount)}
                                            </span>
                                            {!isBuy && txPnl !== 0 && (
                                              <span className={`block text-[10px] font-mono-num font-black ${txPnl > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
                                                {txPnl > 0 ? '+' : ''}{formatEGP(txPnl)}
                                              </span>
                                            )}
                                          </div>
                                          <button
                                            onClick={() => deleteTransaction(pos.id, tx.id)}
                                            className="text-slate-300 dark:text-slate-600 hover:text-red-500 p-1"
                                            title="حذف الحركة"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </div>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal 
        isOpen={isNewTradeOpen} 
        onClose={() => { setIsNewTradeOpen(false); setEditingTrade(null); }} 
        title={editingTrade ? "✏️ تعديل بيانات الصفقة" : "📝 توثيق مركز مالي جديد (3MS)"}
      >
        <NewTradeForm 
          initialData={editingTrade || draftTrade} 
          onClose={() => { setIsNewTradeOpen(false); setEditingTrade(null); }} 
        />
      </Modal>

      <Modal 
        isOpen={!!selectedTradeId} 
        onClose={() => setSelectedTradeId(null)} 
        title="📊 تفاصيل الصفقة، الشارت ومحرك الوقف المتحرك"
        maxWidth="max-w-[95vw] lg:max-w-[82vw]"
      >
        <ActiveTrades 
          tradeId={selectedTradeId!} 
          onClose={() => setSelectedTradeId(null)} 
        />
      </Modal>

      {/* Partial Transaction Modal */}
      <TransactionFormModal
        isOpen={!!txModal}
        onClose={() => setTxModal(null)}
        position={txModal?.pos || null}
        defaultType={txModal?.type || 'buy'}
      />

    </div>
  );
}
