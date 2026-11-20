import { useMemo, useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { computePositionMetrics } from '../utils/calculations';
import { getStockBySymbol } from '../data/egxStocks';
import { 
  Activity, 
  ChevronUp, 
  ChevronDown, 
  PieChart, 
  ShieldCheck, 
  BarChart3,
  Lock,
  Wallet
} from 'lucide-react';

const fmtCompact = (n: number): [string, string] => {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1_000_000) return [sign + (a / 1_000_000).toFixed(2), 'مليون'];
  if (a >= 10_000) return [sign + (a / 1_000).toFixed(1), 'ألف'];
  return [sign + a.toLocaleString('en-US', { maximumFractionDigits: 0 }), ''];
};

const Amt = ({ v, plus = false, className = '' }: { v: number; plus?: boolean; className?: string }) => {
  const [num, unit] = fmtCompact(v);
  return (
    <span className={`whitespace-nowrap font-['Cairo'] ${className}`}>
      <span dir="ltr" className="inline-block">{plus && v > 0 ? '+' : ''}{num}</span>
      {unit && <span className="mr-1 font-bold">{unit}</span>}
    </span>
  );
};

export default function PortfolioSummary({ onSelectTrade }: { onSelectTrade?: (id: string) => void } = {}) {
  const { 
    filteredPositions, 
    commissionRate, 
    activeCapital, 
    fixedIncome, 
    winRate, 
    wonPositionsCount, 
    lostPositionsCount 
  } = useTrades();

  const [allocTab, setAllocTab] = useState<'stocks' | 'sectors' | 'strategy'>('stocks');
  const [hoveredAlloc, setHoveredAlloc] = useState<{ name: string; val: number; pct: number } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('egx_portfolio_summary_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('egx_portfolio_summary_collapsed', String(next));
      return next;
    });
  };

  const stats = useMemo(() => {
    let cost = 0;
    let mv = 0;
    let rPnL = 0;
    let uPnL = 0;
    let risk = 0;
    let openCount = 0;

    const tickerAlloc: Record<string, number> = {};
    const sectorAlloc: Record<string, number> = {};
    const strategyAlloc: Record<string, number> = {};
    const liveStockPerformances: { id: string; symbol: string; uPnL: number; uPct: number; val: number; nearStop: boolean; nearTarget: boolean }[] = [];
    const realizedTimeline: { date: number; pnl: number }[] = [];

    filteredPositions.forEach(p => {
      const m = computePositionMetrics(p, commissionRate);
      rPnL += m.netRealizedPnL;
      (m.realizedEvents || []).forEach(ev => {
        realizedTimeline.push({ date: ev.date, pnl: ev.netPnL });
      });

      if (m.isOpen) {
        openCount++;
        cost += m.openInvested;
        const val = m.openShares * m.currentPrice;
        mv += val;
        uPnL += m.netUnrealizedPnL;
        risk += m.openRisk;
        tickerAlloc[p.symbol] = val;

        const uPct = m.openInvested > 0 ? (m.netUnrealizedPnL / m.openInvested) * 100 : 0;
        const stopP = m.currentStop || 0;
        const targetP = (p.plan as any)?.targetPrice || (p.plan as any)?.target || 0;
        const nearStop = stopP > 0 && m.currentPrice > 0 && ((m.currentPrice - stopP) / m.currentPrice) <= 0.025;
        const nearTarget = targetP > 0 && m.currentPrice > 0 && ((targetP - m.currentPrice) / targetP) <= 0.03;

        liveStockPerformances.push({
          id: p.id,
          symbol: p.symbol,
          uPnL: m.netUnrealizedPnL,
          uPct,
          val,
          nearStop,
          nearTarget,
        });

        // Sector
        const stockInfo = getStockBySymbol(p.symbol);
        const sector = stockInfo?.sector || (p.plan as any)?.sector || 'أخرى';
        sectorAlloc[sector] = (sectorAlloc[sector] || 0) + val;

        // Strategy
        const strategy = p.portfolioType === 'speculation' ? 'مضاربة' : 'استثمار';
        strategyAlloc[strategy] = (strategyAlloc[strategy] || 0) + val;
      }
    });

    // Cumulative realized equity curve for mini sparkline
    realizedTimeline.sort((a, b) => a.date - b.date);
    const equityCurve: number[] = [0];
    let running = 0;
    realizedTimeline.forEach(ev => {
      running += ev.pnl;
      equityCurve.push(running);
    });
    if (uPnL !== 0) equityCurve.push(running + uPnL);

    // Sort live stock performances: highest gainers to losers
    liveStockPerformances.sort((a, b) => b.uPct - a.uPct);

    const netTotal = rPnL + uPnL;
    const exposurePct = activeCapital > 0 ? (mv / activeCapital) * 100 : 0;
    const cash = activeCapital - cost;
    const freeCash = Math.max(0, cash - fixedIncome);
    const riskPct = activeCapital > 0 ? (risk / activeCapital) * 100 : 0;

    const mapAlloc = (record: Record<string, number>) => Object.entries(record)
      .map(([name, val]) => ({ name, val, pct: activeCapital > 0 ? (val / activeCapital) * 100 : 0 }))
      .sort((a, b) => b.val - a.val);

    return {
      cost,
      mv,
      rPnL,
      uPnL,
      netTotal,
      exposurePct,
      cash,
      freeCash,
      fixedIncome,
      risk,
      riskPct,
      openCount,
      equityCurve,
      liveStockPerformances,
      allocList: mapAlloc(tickerAlloc),
      sectorAllocList: mapAlloc(sectorAlloc),
      strategyAllocList: mapAlloc(strategyAlloc)
    };
  }, [filteredPositions, commissionRate, activeCapital, fixedIncome]);

  if (stats.openCount === 0 && stats.rPnL === 0 && stats.uPnL === 0) return null;

  const currentAllocList = allocTab === 'stocks' 
    ? stats.allocList 
    : allocTab === 'sectors' 
    ? stats.sectorAllocList 
    : stats.strategyAllocList;

  const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-fuchsia-500'];
  const textColors = ['text-indigo-400', 'text-blue-400', 'text-amber-400', 'text-rose-400', 'text-purple-400', 'text-emerald-400', 'text-cyan-400', 'text-fuchsia-400'];

  return (
    <div className="w-full bg-slate-900/95 text-white rounded-3xl shadow-2xl border border-slate-800/80 overflow-hidden backdrop-blur-md transition-all duration-300 font-['Cairo']" dir="rtl">
      
      {/* Top Bar Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-slate-800/70 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-black tracking-tight text-slate-100 flex items-center gap-2">
            لوحة الأداء المالي والنبض اللحظي للمحفظة
          </h3>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-800/70 px-3 py-0.5 rounded-full border border-slate-700/50">
            <span className="text-blue-400 font-black">{stats.openCount} مراكز</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-black">{wonPositionsCount} رابحة</span>
            <span className="text-slate-600">-</span>
            <span className="text-rose-400 font-black">{lostPositionsCount} خاسرة</span>
          </div>
        </div>

        {/* Collapsed view summary values or Toggle button */}
        <div className="flex items-center gap-3">
          {isCollapsed && (
            <div className="flex items-center gap-3 text-xs font-black">
              <span className={`px-2.5 py-0.5 rounded-lg ${stats.netTotal >= 0 ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950/70 text-rose-400 border border-rose-800/50'}`}>
                الصافي: <Amt v={stats.netTotal} plus />
              </span>
              <span className="hidden md:inline text-slate-400">
                السوق: <span className="text-slate-200"><Amt v={stats.mv} /></span> ({stats.exposurePct.toFixed(0)}%)
              </span>
              <span className="hidden md:inline text-slate-400">
                كاش حر: <span className="text-emerald-400"><Amt v={stats.freeCash} /></span>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleCollapsed}
            className="px-2.5 py-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors border border-slate-800 flex items-center gap-1.5 text-xs font-bold"
            title={isCollapsed ? 'توسيع لوحة الأداء' : 'طي لوحة الأداء'}
          >
            {isCollapsed ? (
              <>
                <span>توسيع</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>طي</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Main Layout */}
      {!isCollapsed && (
        <div className="p-5 space-y-4 animate-in fade-in duration-200">
          
          {/* Top 3 Core Financial Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* PILLAR 1: NET PNL */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-600/60 transition-all relative overflow-hidden group">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">صافي الأداء الكلي (محقق + عائم)</span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
                  stats.netTotal >= 0 ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                }`} dir="ltr">
                  {activeCapital > 0 ? (stats.netTotal / activeCapital * 100).toFixed(2) : '0.00'}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className={`text-3xl font-black tracking-tight ${
                    stats.netTotal > 0 ? 'text-emerald-400' : stats.netTotal < 0 ? 'text-rose-400' : 'text-slate-200'
                  }`}>
                    <Amt v={stats.netTotal} plus />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">من رأس المال</span>
                </div>

                {/* Mini Equity Sparkline */}
                {stats.equityCurve.length >= 2 && (() => {
                  const pts = stats.equityCurve;
                  const min = Math.min(...pts);
                  const max = Math.max(...pts);
                  const span = max - min || 1;
                  const w = 104, h = 38;
                  const coords = pts.map((v, idx) => {
                    const x = (idx / (pts.length - 1)) * w;
                    const y = h - 4 - ((v - min) / span) * (h - 8);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  });
                  const linePath = `M ${coords.join(' L ')}`;
                  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;
                  const isPos = stats.netTotal >= 0;
                  const stroke = isPos ? '#34d399' : '#fb7185';
                  return (
                    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 overflow-visible">
                      <defs>
                        <linearGradient id="eqSparkGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
                          <stop offset="100%" stopColor={stroke} stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d={areaPath} fill="url(#eqSparkGrad)" />
                      <path d={linePath} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-700/40 text-xs font-bold">
                <div className="bg-slate-900/70 p-2 rounded-xl flex flex-col border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> محقق بالخزينة
                  </span>
                  <span className={`font-black text-sm ${stats.rPnL > 0 ? 'text-emerald-400' : stats.rPnL < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                    <Amt v={stats.rPnL} plus />
                  </span>
                </div>
                <div className="bg-slate-900/70 p-2 rounded-xl flex flex-col border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> غير محقق (عائم)
                  </span>
                  <span className={`font-black text-sm ${stats.uPnL > 0 ? 'text-blue-400' : stats.uPnL < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                    <Amt v={stats.uPnL} plus />
                  </span>
                </div>
              </div>
            </div>

            {/* PILLAR 2: LIQUIDITY & MARKET EXPOSURE */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-600/60 transition-all relative overflow-hidden">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">التعرض للسوق (قيمة الأسهم)</span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/60" dir="ltr">
                  {stats.exposurePct.toFixed(0)}% تعرض
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="text-3xl font-black tracking-tight text-slate-100">
                  <Amt v={stats.mv} />
                </div>

                {/* Semi-Circular Exposure Arc Gauge */}
                {(() => {
                  const pct = Math.min(100, Math.max(0, stats.exposurePct));
                  const arcLen = 100.53; // pi * r (r=32)
                  const strokeColor = pct > 80 ? '#f59e0b' : pct >= 50 ? '#3b82f6' : '#10b981';
                  const zoneLabel = pct > 80 ? 'هجومي' : pct >= 50 ? 'متوازن' : 'آمن';
                  return (
                    <div className="relative w-20 h-12 flex flex-col items-center justify-end shrink-0">
                      <svg viewBox="0 0 80 44" className="w-20 h-11 overflow-visible">
                        <path d="M 8 40 A 32 32 0 0 1 72 40" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                        <path
                          d="M 8 40 A 32 32 0 0 1 72 40"
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={arcLen}
                          strokeDashoffset={arcLen * (1 - pct / 100)}
                          style={{ filter: `drop-shadow(0 0 6px ${strokeColor}66)` }}
                        />
                      </svg>
                      <span className="absolute bottom-0 text-[10px] font-black text-slate-200 leading-none" dir="ltr">
                        {pct.toFixed(0)}% <span className="text-[8px] font-bold text-slate-400">{zoneLabel}</span>
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className={`grid ${stats.fixedIncome > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-2.5 border-t border-slate-700/40 text-xs font-bold`}>
                <div className="bg-slate-900/70 p-2 rounded-xl flex items-center justify-between border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-emerald-400" /> كاش اقتناص حر
                  </span>
                  <span className="font-black text-sm text-emerald-400">
                    <Amt v={stats.freeCash} />
                  </span>
                </div>
                {stats.fixedIncome > 0 && (
                  <div className="bg-slate-900/70 p-2 rounded-xl flex items-center justify-between border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-teal-400" /> دخل ثابت
                    </span>
                    <span className="font-black text-sm text-teal-300">
                      <Amt v={stats.fixedIncome} />
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PILLAR 3: RISK & DISCIPLINE */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-600/60 transition-all relative overflow-hidden">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> المخاطرة تحت الوقف
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60" dir="ltr">
                  {stats.riskPct.toFixed(2)}%
                </span>
              </div>

              <div className="mb-2.5 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-black tracking-tight text-amber-400">
                    {stats.risk > 0 ? (
                      <span>-<Amt v={stats.risk} /></span>
                    ) : (
                      '0 EGP'
                    )}
                  </div>
                  {(() => {
                    const heatState = stats.riskPct <= 2 ? { label: 'آمن 🟢', cls: 'text-emerald-400' }
                      : stats.riskPct <= 5 ? { label: 'متوسط 🟡', cls: 'text-amber-400' }
                      : { label: 'مرتفع 🔴', cls: 'text-rose-400' };
                    return <span className={`text-[10px] font-black ${heatState.cls}`}>حرارة المحفظة: {heatState.label}</span>;
                  })()}
                </div>
                {/* Portfolio Heat Bar (vs 5% safe ceiling) */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${stats.riskPct <= 2 ? 'bg-emerald-500' : stats.riskPct <= 5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.max(4, (stats.riskPct / 5) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-500">
                    <span>سقف الأمان المقترح: 5%</span>
                    <span dir="ltr">{stats.riskPct.toFixed(2)}% / 5.0%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-700/40 text-xs font-bold">
                <div className="bg-slate-900/70 p-2 rounded-xl flex flex-col border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 mb-0.5">نسبة الفوز بالصفقات</span>
                  <span className="font-black text-sm text-yellow-400" dir="ltr">
                    {winRate.toFixed(0)}% Win
                  </span>
                </div>
                <div className="bg-slate-900/70 p-2 rounded-xl flex flex-col border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 mb-0.5">التكلفة الإجمالية</span>
                  <span className="font-black text-sm text-slate-300">
                    <Amt v={stats.cost} />
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Dual Visual Section: (50% Allocation Bar | 50% Live Stock Performance Spectrum) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            
            {/* Left Card (50%): Allocation Breadth */}
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-black text-slate-200">توزيع أوزان المحفظة:</span>
                </div>
                
                <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-700/60 text-xs font-bold">
                  <button
                    onClick={() => setAllocTab('stocks')}
                    className={`px-3 py-1 rounded-lg transition-all ${allocTab === 'stocks' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    الأسهم
                  </button>
                  <button
                    onClick={() => setAllocTab('sectors')}
                    className={`px-3 py-1 rounded-lg transition-all ${allocTab === 'sectors' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    القطاعات
                  </button>
                  <button
                    onClick={() => setAllocTab('strategy')}
                    className={`px-3 py-1 rounded-lg transition-all ${allocTab === 'strategy' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    الاستراتيجية
                  </button>
                </div>
              </div>

              {/* Progress Allocation Bar with Interactive Hover Details */}
              <div className="space-y-1.5">
                <div className="w-full h-3.5 rounded-full flex overflow-hidden bg-slate-950 shadow-inner ring-1 ring-slate-800/80">
                  <div
                    style={{ width: `${activeCapital > 0 ? (stats.freeCash / activeCapital) * 100 : 0}%` }}
                    onMouseEnter={() => setHoveredAlloc({ name: 'كاش حر', val: stats.freeCash, pct: activeCapital > 0 ? (stats.freeCash / activeCapital) * 100 : 0 })}
                    onMouseLeave={() => setHoveredAlloc(null)}
                    className="bg-slate-600 border-r border-slate-900 hover:brightness-125 transition-all cursor-pointer"
                  />
                  {stats.fixedIncome > 0 && (
                    <div
                      style={{ width: `${activeCapital > 0 ? (stats.fixedIncome / activeCapital) * 100 : 0}%` }}
                      onMouseEnter={() => setHoveredAlloc({ name: 'دخل ثابت', val: stats.fixedIncome, pct: activeCapital > 0 ? (stats.fixedIncome / activeCapital) * 100 : 0 })}
                      onMouseLeave={() => setHoveredAlloc(null)}
                      className="bg-teal-500 border-r border-slate-900 hover:brightness-125 transition-all cursor-pointer"
                    />
                  )}
                  {currentAllocList.map((a, i) => (
                    <div
                      key={a.name}
                      style={{ width: `${a.pct}%` }}
                      onMouseEnter={() => setHoveredAlloc(a)}
                      onMouseLeave={() => setHoveredAlloc(null)}
                      className={`${colors[i % colors.length]} border-r border-slate-900 last:border-0 hover:brightness-125 transition-all cursor-pointer`}
                    />
                  ))}
                </div>
                {hoveredAlloc && (
                  <div className="flex items-center justify-between text-[11px] font-black bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-1 text-slate-200">
                    <span>{hoveredAlloc.name}</span>
                    <span dir="ltr" className="font-mono-num text-blue-400">
                      <Amt v={hoveredAlloc.val} /> ({hoveredAlloc.pct.toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                  <span>كاش حر</span>
                  <span dir="ltr" className="text-slate-300 font-black">
                    {(activeCapital > 0 ? (stats.freeCash / activeCapital) * 100 : 0).toFixed(1)}%
                  </span>
                </span>

                {stats.fixedIncome > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span>دخل ثابت</span>
                    <span dir="ltr" className="text-teal-400 font-black">
                      {(activeCapital > 0 ? (stats.fixedIncome / activeCapital) * 100 : 0).toFixed(1)}%
                    </span>
                  </span>
                )}

                {currentAllocList.slice(0, 5).map((a, i) => (
                  <span key={a.name} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`}></span>
                    <span className="text-slate-300 max-w-[90px] truncate" title={a.name}>{a.name}</span>
                    <span dir="ltr" className={`font-black ${textColors[i % colors.length]}`}>
                      {a.pct.toFixed(1)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Right Card (50%): Live Stock Profit/Loss Spectrum Bars */}
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-4 flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black text-slate-200">رادار أداء الأسهم اللحظي (ربح/خسارة عائمة):</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">مقارنة بمتوسط الدخول</span>
              </div>

              {stats.liveStockPerformances.length === 0 ? (
                <div className="text-center py-4 text-xs font-bold text-slate-500">
                  لا توجد صفقات مفتوحة حالياً.
                </div>
              ) : (
                <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1 custom-scrollbar">
                  {stats.liveStockPerformances.map((st) => {
                    const isWin = st.uPct >= 0;
                    const maxAbsPct = Math.max(...stats.liveStockPerformances.map(s => Math.abs(s.uPct)), 5);
                    const barWidth = Math.min(100, (Math.abs(st.uPct) / maxAbsPct) * 100);

                    return (
                      <button
                        key={st.symbol}
                        type="button"
                        onClick={() => onSelectTrade?.(st.id)}
                        className="w-full flex items-center gap-2.5 text-xs hover:bg-slate-800/70 px-2 py-1 rounded-xl transition-colors text-right"
                        title={`اضغط لفتح تفاصيل ${st.symbol}`}
                      >
                        <div className="w-24 flex items-center gap-1.5 shrink-0">
                          <span className="font-black text-slate-100 font-mono-num" dir="ltr">{st.symbol}</span>
                          {st.nearStop && (
                            <span className="text-[9px] font-black px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                              قرب الوقف
                            </span>
                          )}
                          {!st.nearStop && st.nearTarget && (
                            <span className="text-[9px] font-black px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                              قرب الهدف
                            </span>
                          )}
                        </div>
                        
                        {/* Diverging bar track with centerline */}
                        <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden relative flex items-center">
                          <div className="w-1/2 h-full flex justify-end border-l border-slate-700/60">
                            {!isWin && (
                              <div 
                                style={{ width: `${barWidth}%` }} 
                                className="h-full bg-gradient-to-l from-rose-500 to-rose-600 rounded-r-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" 
                              />
                            )}
                          </div>
                          <div className="w-1/2 h-full flex justify-start">
                            {isWin && (
                              <div 
                                style={{ width: `${barWidth}%` }} 
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-l-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                              />
                            )}
                          </div>
                        </div>

                        <div className="text-left flex items-center justify-end gap-1.5 shrink-0 whitespace-nowrap" dir="ltr">
                          <span className={`font-black font-mono-num ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isWin ? '+' : ''}{st.uPct.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                            (<Amt v={st.uPnL} plus />)
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
