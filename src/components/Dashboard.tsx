import { memo, useState, useMemo } from 'react';
import { 
  Wallet, 
  Activity, 
  BookOpen, 
  Target, 
  Flame, 
  Layers, 
  Edit2, 
  Plus, 
  ArrowUpRight,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useTrades, type TickerPosition } from '../context/TradeContext';
import { computePositionMetrics, formatEGP } from '../utils/calculations';
import { getStockBySymbol } from '../data/egxStocks';
import WeeklyReviewModal from './WeeklyReviewModal';
import TransactionFormModal from './TransactionFormModal';
import LedgerModal from './LedgerModal';
import FixedIncomeModal from './FixedIncomeModal';

export default memo(function Dashboard({ 
  onOpenTradingDesk,
  onNavigate,
  onOpenTrade
}: { 
  onOpenTradingDesk?: (symbol?: string) => void;
  onNavigate?: (tab: string) => void;
  onOpenTrade?: (id: string) => void;
}) {
  const { 
    fixedIncome,
    plans,
    portfolioFilter,
    setPortfolioFilter,
    activeCapital,
    activeDeposited,
    activeOpenCapital,
    activeOpenRisk,
    filteredPositions,
    coreStats,
    coreSatelliteTarget,
    weeklyReviews,
    equityData
  } = useTrades();

  const [selectedPosForTx, setSelectedPosForTx] = useState<{ pos: TickerPosition; type: 'buy' | 'sell' } | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isFixedIncomeModalOpen, setIsFixedIncomeModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Smart Chart Mode Toggle: 'distribution' | 'sectors' | 'risk_weight' | 'growth'
  const [chartMode, setChartMode] = useState<'distribution' | 'sectors' | 'risk_weight' | 'growth'>('distribution');

  // Active positions
  const activePositions = filteredPositions.filter(p => {
    const metrics = computePositionMetrics(p);
    return p.status === 'active' && metrics.openShares > 0;
  });

  // 1. Sector Allocation Data
  const sectorData = useMemo(() => {
    const map: Record<string, { name: string; value: number; count: number }> = {};
    activePositions.forEach(p => {
      const m = computePositionMetrics(p);
      const stockInfo = getStockBySymbol(p.symbol);
      const sector = stockInfo?.sector || (p.plan as any)?.sector || 'أخرى';
      const val = m.openShares * m.currentPrice;
      if (!map[sector]) {
        map[sector] = { name: sector, value: 0, count: 0 };
      }
      map[sector].value += val;
      map[sector].count += 1;
    });

    const list = Object.values(map).sort((a, b) => b.value - a.value);
    return list;
  }, [activePositions]);

  // Colors for Sector Pie
  const SECTOR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  // 2. Performance Distribution (P&L per Open Stock)
  const stockPerformanceData = useMemo(() => {
    return activePositions.map(p => {
      const m = computePositionMetrics(p);
      const uPnL = m.netUnrealizedPnL;
      const cost = m.openInvested;
      const pct = cost > 0 ? (uPnL / cost) * 100 : 0;
      return {
        symbol: p.symbol,
        pnl: Math.round(uPnL),
        pct: Number(pct.toFixed(1)),
        isPositive: uPnL >= 0,
        shares: m.openShares,
        val: Math.round(m.openShares * m.currentPrice)
      };
    }).sort((a, b) => b.pnl - a.pnl);
  }, [activePositions]);

  // 3. Weight & Position Size per Open Stock
  const stockWeightData = useMemo(() => {
    return activePositions.map(p => {
      const m = computePositionMetrics(p);
      const val = m.openShares * m.currentPrice;
      const weight = activeCapital > 0 ? (val / activeCapital) * 100 : 0;
      return {
        symbol: p.symbol,
        weight: Number(weight.toFixed(1)),
        val: Math.round(val),
        risk: Math.round(m.openRisk)
      };
    }).sort((a, b) => b.weight - a.weight);
  }, [activePositions, activeCapital]);

  // 4. Chronological Realized Profit Progression (filtered by active portfolio)
  const profitTimelineData = useMemo(() => {
    if (!equityData || equityData.length === 0) return [];
    
    // Filter by active portfolio filter
    const filtered = equityData.filter((item: any) => {
      if (portfolioFilter === 'all') return true;
      return item.portfolioType === portfolioFilter;
    });

    if (filtered.length === 0) return [];

    // Recalculate running cumulative PnL for filtered events
    let runningCumulative = 0;
    return filtered.map((item: any) => {
      runningCumulative += item.tradePnL;
      return {
        ...item,
        cumulativePnL: runningCumulative
      };
    });
  }, [equityData, portfolioFilter]);

  const totalFilteredRealizedPnL = useMemo(() => {
    return profitTimelineData.length > 0 ? profitTimelineData[profitTimelineData.length - 1].cumulativePnL : 0;
  }, [profitTimelineData]);

  // Ready plans
  const readyPlans = plans.filter(p => p.status === 'ready');
  const recentPlans = [...plans].slice(0, 4);

  // Purchasing power (Total capital minus open invested capital)
  const availableLiquidity = Math.max(0, activeCapital - activeOpenCapital);

  return (
    <div className="w-full space-y-6" dir="rtl">
      
      {/* Global Portfolio Filter Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          متابعة وتقييم الأداء
        </h1>
        
        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full md:w-auto">
          <button 
            onClick={() => setPortfolioFilter('all')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${portfolioFilter === 'all' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            المحفظة الكلية
          </button>
          <button 
            onClick={() => setPortfolioFilter('investment')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${portfolioFilter === 'investment' ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            الاستثمار
          </button>
          <button 
            onClick={() => setPortfolioFilter('speculation')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${portfolioFilter === 'speculation' ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            المضاربة
          </button>
        </div>
      </div>

      <WeeklyReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />

      {/* Quick Action Banner for Weekly Review */}
      {(!weeklyReviews || weeklyReviews.length === 0 || (Date.now() - weeklyReviews[0].createdAt > 4 * 24 * 60 * 60 * 1000)) && (
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
           <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-2xl shrink-0">
                 <Activity className="w-6 h-6 text-indigo-100" />
              </div>
              <div>
                 <h3 className="text-white font-black text-lg">حان وقت التقييم والمراجعة!</h3>
                 <p className="text-indigo-200 text-xs font-bold mt-1 max-w-lg leading-relaxed">
                   استمرارية النجاح تتطلب المراجعة. وثّق أداءك، صفقاتك، وأخطاءك للفترة المنقضية، وحدد نقطة تركيزك للمرحلة القادمة.
                 </p>
              </div>
           </div>
           <button 
             onClick={() => setIsReviewModalOpen(true)}
             className="shrink-0 w-full md:w-auto px-6 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-black text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
           >
             <Layers className="w-4 h-4" />
             إجراء المراجعة الآن
           </button>
        </div>
      )}

      {/* Core & Satellite Health Gauge — only shows when viewing investment portfolio */}
      {portfolioFilter === 'investment' && coreStats.totalInvestmentCapital > 0 && (
        <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row items-center gap-4 shadow-sm transition-all ${
          coreStats.isBalanced
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/40'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${coreStats.isBalanced ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
            <span className="text-xl">{coreStats.isBalanced ? '⚖️' : '⚠️'}</span>
          </div>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`text-sm font-black ${coreStats.isBalanced ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                {coreStats.isBalanced
                  ? 'توازن Core & Satellite ✓ محفظتك الاستثمارية في المسار الصحيح'
                  : `⚠️ تنبيه: أسهم Satellite (${coreStats.satellitePercent.toFixed(1)}%) تجاوزت الحد الاستراتيجي — الهدف: Core ${coreSatelliteTarget}%`}
              </span>
              <div className="flex items-center gap-3 shrink-0 text-xs font-bold">
                <span className="text-indigo-600 dark:text-indigo-400">Core {coreStats.corePercent.toFixed(1)}%</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-amber-600 dark:text-amber-400">Satellite {coreStats.satellitePercent.toFixed(1)}%</span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full flex">
                <div className="bg-indigo-500 transition-all duration-700 ease-in-out" style={{ width: `${Math.min(100, coreStats.corePercent)}%` }} />
                <div className="bg-amber-400 transition-all duration-700 ease-in-out" style={{ width: `${Math.min(100, coreStats.satellitePercent)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Heat / Ready Plans Banner */}
      {readyPlans.length > 0 && (
        <div className="bg-gradient-to-l from-orange-600 via-amber-600 to-red-600 rounded-2xl p-4 md:p-5 shadow-sm text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base md:text-lg">🔥 توجد ({readyPlans.length}) خطط جاهزة للتنفيذ فوراً!</h3>
              <p className="text-orange-100 text-xs font-medium mt-0.5">
                وصلت الأسهم المستهدفة لنطاق الدخول المحدد. راجع الشروط وانقض على الفرصة بانضباط.
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate?.('قائمة المراقبة')}
            className="w-full sm:w-auto bg-white text-orange-700 px-5 py-2.5 rounded-xl font-black text-xs hover:bg-orange-50 transition-all shadow-sm shrink-0"
          >
            استعراض الخطط الجاهزة
          </button>
        </div>
      )}

      {/* Capital & Ledger Banner */}
      <div className="bg-slate-900 rounded-2xl p-4 md:p-5 shadow-sm text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-bold mb-0.5">القيمة السوقية للمحفظة الاستثمارية (Equity)</span>
            <span className="text-xl md:text-2xl font-black font-mono-num tracking-tight">
              {formatEGP(activeCapital)}
            </span>
            <span className="text-emerald-400 text-[10px] font-bold mt-1 bg-emerald-400/10 px-2 py-0.5 rounded-md inline-block w-fit">
              منها {formatEGP(activeDeposited, 0)} رأس مال مودع
            </span>
          </div>
        </div>
        <button 
          onClick={() => onNavigate?.('الخزينة')}
          className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
        >
          <Activity className="w-4 h-4" />
          إدارة الخزينة
        </button>
      </div>

      {/* Visual Portfolio Health & Multi-View Charts Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Allocation Bar */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-black text-slate-800 dark:text-white">توزيع المحفظة</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-emerald-600">السيولة المتاحة للتداول (كاش)</span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono-num" dir="ltr">{formatEGP(Math.max(0, availableLiquidity))}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (Math.max(0, availableLiquidity) / (activeCapital || 1)) * 100)}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5 items-center">
                  <span className="text-amber-600 flex items-center gap-1">
                    صناديق دخل ثابت / مجنب
                    <button 
                      onClick={() => setIsFixedIncomeModalOpen(true)}
                      className="text-slate-400 hover:text-amber-600 transition-colors bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 p-1 rounded"
                      title="تعديل قيمة الدخل الثابت"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono-num" dir="ltr">{formatEGP(fixedIncome)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (fixedIncome / (activeCapital || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-purple-600">السيولة المقيدة (أسهم)</span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono-num" dir="ltr">{formatEGP(activeOpenCapital)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-purple-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (activeOpenCapital / (activeCapital || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-rose-600">المخاطرة المفتوحة (At Risk)</span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono-num" dir="ltr">{formatEGP(activeOpenRisk)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-rose-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (activeOpenRisk / (activeCapital || 1)) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SMART MULTI-VIEW CHARTS HUB */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[300px]">
          
          {/* Header & View Toggles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-black text-slate-800 dark:text-white text-sm md:text-base">
                {chartMode === 'distribution' && 'خريطة أرباح وخسائر الأسهم المفتوحة'}
                {chartMode === 'sectors' && 'توزيع السيولة والقطاعات النشطة'}
                {chartMode === 'risk_weight' && 'أوزان المراكز والمخاطرة المفتوحة بالأسهم'}
                {chartMode === 'growth' && (profitTimelineData.length > 0 ? `تطور الأرباح المحققة التراكمية (${formatEGP(totalFilteredRealizedPnL)})` : 'تطور الأرباح المحققة التراكمية')}
              </h3>
            </div>

            {/* Toggles - Stock Performance as #1 */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black self-stretch sm:self-auto justify-between gap-1">
              <button
                onClick={() => setChartMode('distribution')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartMode === 'distribution'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="أرباح وخسائر الأسهم المفتوحة"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                أداء الأسهم
              </button>

              <button
                onClick={() => setChartMode('sectors')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartMode === 'sectors'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="توزيع القطاعات"
              >
                <PieIcon className="w-3.5 h-3.5" />
                القطاعات
              </button>

              <button
                onClick={() => setChartMode('risk_weight')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartMode === 'risk_weight'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="أوزان الأسهم ومخاطرتها"
              >
                <Layers className="w-3.5 h-3.5" />
                أوزان الأسهم
              </button>

              <button
                onClick={() => setChartMode('growth')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartMode === 'growth'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="تطور الأرباح المحققة التراكمية ونتائج الصفقات"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                تطور الأرباح
              </button>
            </div>
          </div>
          
          {/* Chart Content Body */}
          <div className="flex-1 w-full min-h-[200px] pt-3" dir="ltr">
            
            {/* VIEW 1: SECTORS PIE / BARS */}
            {chartMode === 'sectors' && (
              <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-4">
                {sectorData.length === 0 ? (
                  <div className="w-full h-44 flex items-center justify-center text-slate-400 text-xs font-bold">
                    لا توجد أسهم مفتوحة حالياً لحساب توزيع القطاعات
                  </div>
                ) : (
                  <>
                    <div className="w-full md:w-1/2 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sectorData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={4}
                          >
                            {sectorData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                            formatter={(val: any) => [`${formatEGP(Number(val))}`, 'القيمة']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full md:w-1/2 flex flex-col justify-center space-y-2 pr-2" dir="rtl">
                      {sectorData.slice(0, 4).map((s, idx) => {
                        const pct = activeOpenCapital > 0 ? (s.value / activeOpenCapital) * 100 : 0;
                        return (
                          <div key={s.name} className="flex items-center justify-between text-xs font-black">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}></span>
                              <span className="text-slate-700 dark:text-slate-300">{s.name} ({s.count})</span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 font-mono-num" dir="ltr">
                              {pct.toFixed(1)}% ({formatEGP(s.value, 0)})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* VIEW 2: INDIVIDUAL STOCKS PNL DISTRIBUTION */}
            {chartMode === 'distribution' && (
              <div className="w-full h-48">
                {stockPerformanceData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                    لا توجد أسهم مفتوحة لعرض توزيع الأداء
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockPerformanceData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="symbol" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(val: any, _: any, item: any) => [
                          `${formatEGP(Number(val))} (${item.payload.pct}%)`, 
                          'الربح/الخسارة غير المحققة'
                        ]}
                      />
                      <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                        {stockPerformanceData.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.isPositive ? '#10b981' : '#f43f5e'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* VIEW 3: STOCKS WEIGHT & RISK DISTRIBUTION */}
            {chartMode === 'risk_weight' && (
              <div className="w-full h-48">
                {stockWeightData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                    لا توجد أسهم مفتوحة لحساب الأوزان
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockWeightData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="symbol" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(val: any, _: any, item: any) => [
                          `${val}% (${formatEGP(item.payload.val, 0)}) | المخاطرة: ${formatEGP(item.payload.risk, 0)}`, 
                          'وزن السهم من رأس المال'
                        ]}
                      />
                      <Bar dataKey="weight" radius={[6, 6, 0, 0]} fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* VIEW 4: REALIZED PROFIT PROGRESSION */}
            {chartMode === 'growth' && (
              <div className="w-full h-48">
                {profitTimelineData.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-bold gap-1 text-center px-4">
                    <TrendingUp className="w-6 h-6 text-slate-400/50 mb-1" />
                    <span>لم يتم تسجيل صفقات بيع أو أرباح محققة بعد في هذا القسم</span>
                    <span className="text-[10px] text-slate-500">عند إغلاق الصفقات أو جني الأرباح الجزئية، سيظهر هنا مسار أرباحك التراكمية وتفاصيل كل صفقة</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={profitTimelineData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis 
                        dataKey="symbol" 
                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        yAxisId="cumulative"
                        orientation="right"
                        tick={{ fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} 
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis 
                        yAxisId="trade"
                        orientation="left"
                        hide
                      />
                      <ReferenceLine yAxisId="cumulative" y={0} stroke="#64748b" strokeDasharray="3 3" />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(val: any, name: any) => {
                          if (name === 'الأرباح التراكمية') return [formatEGP(Number(val) || 0, 0), '📈 الأرباح التراكمية في الخزينة'];
                          if (name === 'نتيجة الصفقة') return [formatEGP(Number(val) || 0, 0), '💰 صافي ربح/خسارة الصفقة'];
                          return [val, name];
                        }}
                        labelFormatter={(label, items) => {
                          const item = items?.[0]?.payload;
                          return `${label} ${item?.formattedDate ? `(${item.formattedDate})` : ''}`;
                        }}
                      />
                      <Bar 
                        yAxisId="trade" 
                        dataKey="tradePnL" 
                        name="نتيجة الصفقة" 
                        radius={[4, 4, 0, 0]}
                      >
                        {profitTimelineData.map((entry, index) => (
                          <Cell key={`trade-bar-${index}`} fill={entry.tradePnL >= 0 ? '#10b981' : '#f43f5e'} opacity={0.75} />
                        ))}
                      </Bar>
                      <Line 
                        yAxisId="cumulative" 
                        type="monotone" 
                        dataKey="cumulativePnL" 
                        name="الأرباح التراكمية"
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        dot={{ fill: '#10b981', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Main Grid: Active Positions & Watchlist Plans */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Active Ticker Positions (7 Cols) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white">المراكز المفتوحة النشطة</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">التمركزات، متوسطات الأسعار ونقاط الوقف المتحرك</p>
                </div>
              </div>

              <button 
                onClick={() => onNavigate?.('سجل الصفقات')} 
                className="text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
              >
                عرض الكل
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Active Position Cards */}
            <div className="space-y-3">
              {activePositions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/30">
                  <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">لا توجد مراكز مفتوحة حالياً.</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    قم بتنفيذ إحدى خطط المراقبة أو تسجيل شراء جديد لتبدأ المتابعة.
                  </p>
                </div>
              ) : (
                activePositions.map(pos => {
                  const metrics = computePositionMetrics(pos);
                  return (
                    <div 
                      key={pos.id}
                      className="p-4 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm transition-all space-y-3 cursor-pointer"
                      onClick={() => onOpenTrade?.(pos.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                            {pos.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-base text-slate-900 dark:text-white" dir="ltr">{pos.symbol}</h4>
                              <span className="text-[11px] bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md font-bold">
                                {metrics.openShares} سهم
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {pos.transactions?.length || 1} حركات مالية
                            </span>
                          </div>
                        </div>

                        {/* Quick Partial Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedPosForTx({ pos, type: 'buy' })}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                            title="شراء إضافي"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            تعزيز
                          </button>
                          <button
                            onClick={() => setSelectedPosForTx({ pos, type: 'sell' })}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                            title="بيع جزئي"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            جني ربح
                          </button>
                        </div>
                      </div>

                      {/* Financial Metrics Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-center text-xs">
                        <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">متوسط الدخول</span>
                          <span className="font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">
                            {metrics.avgEntry.toFixed(2)} EGP
                          </span>
                        </div>
                        <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">الوقف المتحرك</span>
                          <span className="font-black text-red-600 dark:text-red-400 font-mono-num" dir="ltr">
                            {metrics.currentStop.toFixed(2)} EGP
                          </span>
                        </div>
                        <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">السيولة المقيدة</span>
                          <span className="font-black text-purple-700 dark:text-purple-400 font-mono-num" dir="ltr">
                            {formatEGP(metrics.openInvested)}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">المخاطرة</span>
                          <span className="font-black text-red-600 dark:text-red-400 font-mono-num" dir="ltr">
                            {formatEGP(metrics.openRisk)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Watchlist Plans & Quick Launch (5 Cols) */}
        <div className="xl:col-span-5 space-y-4">
          
          {/* Quick Action Banner */}
          <div className="bg-slate-900 dark:bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">غرفة العمليات والحاسبة 🎯</h3>
                <p className="text-xs text-slate-300 dark:text-slate-400 mt-0.5">حساب المخاطرة وتجهيز الصفقات</p>
              </div>
              <button 
                onClick={() => onOpenTradingDesk?.()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md shadow-blue-600/30"
              >
                فتح غرفة العمليات
              </button>
            </div>
          </div>

          {/* Watchlist Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                أحدث خطط المراقبة
              </h3>
              <button 
                onClick={() => onNavigate?.('قائمة المراقبة')} 
                className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline"
              >
                عرض الكل ({plans.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {recentPlans.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                  <Target className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500">لا توجد خطط مراقبة حالياً.</p>
                </div>
              ) : (
                recentPlans.map(plan => {
                  const entryMin = plan.entryZone?.min ?? plan.entry ?? 0;
                  const entryMax = plan.entryZone?.max ?? plan.entry ?? entryMin;
                  return (
                    <div 
                      key={plan.id}
                      onClick={() => onOpenTradingDesk?.(plan.symbol)}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 rounded-full bg-orange-500"></div>
                        <div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white" dir="ltr">
                            {plan.symbol}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block line-clamp-1">
                            {plan.strategy || 'بدون استراتيجية'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 border ${
                          plan.status === 'ready' 
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                        }`}>
                          {plan.status === 'ready' ? 'جاهز' : 'متابعة'}
                        </span>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 font-mono-num" dir="ltr">
                          {entryMin === entryMax ? `${entryMin.toFixed(2)}` : `${entryMin.toFixed(2)} - ${entryMax.toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Transaction Modal (for quick partial buys/sells) */}
      <TransactionFormModal 
        isOpen={!!selectedPosForTx}
        onClose={() => setSelectedPosForTx(null)}
        position={selectedPosForTx?.pos || null}
        defaultType={selectedPosForTx?.type || 'buy'}
      />

      <LedgerModal 
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
      />

      <FixedIncomeModal 
        isOpen={isFixedIncomeModalOpen} 
        onClose={() => setIsFixedIncomeModalOpen(false)} 
      />
    </div>
  );
}
)

