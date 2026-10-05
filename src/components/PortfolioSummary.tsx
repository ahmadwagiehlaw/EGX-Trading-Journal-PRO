import { useMemo, useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { computePositionMetrics } from '../utils/calculations';
import { getStockBySymbol } from '../data/egxStocks';
import { Wallet, Clock, AlertTriangle, ShieldAlert, BarChart2, PieChart, TrendingUp, TrendingDown, Target, Activity, Infinity as InfinityIcon, LayoutTemplate } from 'lucide-react';
import { AreaChart, Area, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const fmtCompact = (n: number): [string, string] => {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1_000_000) return [sign + (a / 1_000_000).toFixed(2), 'مليون'];
  if (a >= 10_000) return [sign + (a / 1_000).toFixed(1), 'ألف'];
  return [sign + a.toLocaleString('en-US', { maximumFractionDigits: 0 }), ''];
};

const Amt = ({ v, plus = false, className = '' }: { v: number; plus?: boolean, className?: string }) => {
  const [num, unit] = fmtCompact(v);
  return (
    <span className={`whitespace-nowrap ${className}`}>
      <span dir="ltr" className="inline-block">{plus && v > 0 ? '+' : ''}{num}</span>{unit && <span className="mr-1 font-bold">{unit}</span>}
    </span>
  );
};

export default function PortfolioSummary() {
  const { positions, commissionRate, activeCapital, fixedIncome, equityData, winRate, profitFactor, maxDrawdown, wonPositionsCount, lostPositionsCount } = useTrades();

  const [allocTab, setAllocTab] = useState<'stocks' | 'sectors' | 'strategy'>('stocks');

  const stats = useMemo(() => {
    let cost = 0;
    let mv = 0;
    let rPnL = 0;
    let uPnL = 0;
    let risk = 0;
    let openCount = 0;
    let holdDaysWeightedSum = 0;
    
    let totalWinAmt = 0;
    let totalLossAmt = 0;
    let winCount = 0;
    let lossCount = 0;

    const tickerAlloc: Record<string, number> = {};
    const sectorAlloc: Record<string, number> = {};
    const strategyAlloc: Record<string, number> = {};
    const stockPnL: { sym: string, uPnL: number, uPct: number }[] = [];

    positions.forEach(p => {
      const m = computePositionMetrics(p, commissionRate);
      rPnL += m.netRealizedPnL;
      
      if (p.status === 'closed') {
        if (m.netRealizedPnL > 0) {
          totalWinAmt += m.netRealizedPnL;
          winCount++;
        } else if (m.netRealizedPnL < 0) {
          totalLossAmt += Math.abs(m.netRealizedPnL);
          lossCount++;
        }
      }
      
      if (m.isOpen) {
        openCount++;
        cost += m.openInvested;
        const val = m.openShares * m.currentPrice;
        mv += val;
        uPnL += m.netUnrealizedPnL;
        risk += m.openRisk;
        tickerAlloc[p.symbol] = val;
        
        // Sector Allocation
        const stockInfo = getStockBySymbol(p.symbol);
        const sector = stockInfo?.sector || (p.plan as any)?.sector || 'أخرى';
        sectorAlloc[sector] = (sectorAlloc[sector] || 0) + val;
        
        // Strategy Allocation
        const strategy = p.portfolioType === 'speculation' ? 'مضاربة' : 'استثمار';
        strategyAlloc[strategy] = (strategyAlloc[strategy] || 0) + val;

        stockPnL.push({
          sym: p.symbol,
          uPnL: m.netUnrealizedPnL,
          uPct: m.openInvested > 0 ? (m.netUnrealizedPnL / m.openInvested) * 100 : 0
        });
        
        if (p.journal?.openedDate) {
           const days = (Date.now() - p.journal.openedDate) / 86400000;
           holdDaysWeightedSum += days * m.openInvested;
        }
      }
    });

    const netTotal = rPnL + uPnL;
    const exposurePct = activeCapital > 0 ? (mv / activeCapital) * 100 : 0;
    const cash = activeCapital - cost;
    const freeCash = Math.max(0, cash - fixedIncome);
    const avgHold = cost > 0 ? holdDaysWeightedSum / cost : 0;
    
    const avgWin = winCount > 0 ? totalWinAmt / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLossAmt / lossCount : 0;
    const riskReward = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 99 : 0);
    
    const mapAlloc = (record: Record<string, number>) => Object.entries(record)
      .map(([name, val]) => ({ name, val, pct: activeCapital > 0 ? (val / activeCapital) * 100 : 0 }))
      .sort((a, b) => b.val - a.val);

    const allocList = mapAlloc(tickerAlloc);
    const sectorAllocList = mapAlloc(sectorAlloc);
    const strategyAllocList = mapAlloc(strategyAlloc);
      
    stockPnL.sort((a, b) => b.uPct - a.uPct);
    const largest = allocList[0];

    return { cost, mv, rPnL, uPnL, netTotal, exposurePct, cash, freeCash, fixedIncome, avgHold, risk, openCount, allocList, sectorAllocList, strategyAllocList, largest, riskReward, stockPnL };
  }, [positions, commissionRate, activeCapital, fixedIncome]);

  if (stats.openCount === 0 && stats.rPnL === 0 && stats.uPnL === 0) return null;

  const getProfitFactorLabel = (pf: number) => {
    if (pf >= 3) return { text: 'ممتاز', color: 'text-emerald-400' };
    if (pf >= 2) return { text: 'جيد جداً', color: 'text-emerald-400' };
    if (pf >= 1.5) return { text: 'جيد', color: 'text-blue-400' };
    if (pf >= 1) return { text: 'مقبول', color: 'text-amber-400' };
    return { text: 'ضعيف', color: 'text-rose-400' };
  };

  const pfLabel = getProfitFactorLabel(profitFactor);
  
  const renderAllocationBar = (list: { name: string, val: number, pct: number }[]) => {
    const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-fuchsia-500'];
    const textColors = ['text-indigo-400', 'text-blue-400', 'text-amber-400', 'text-rose-400', 'text-purple-400', 'text-emerald-400', 'text-cyan-400', 'text-fuchsia-400'];
    
    return (
      <>
        <div className="w-full h-3.5 rounded-full flex overflow-hidden bg-slate-900 mb-4 shadow-inner">
           <div style={{ width: `${activeCapital > 0 ? (stats.freeCash/activeCapital)*100 : 0}%` }} className="bg-slate-600 border-r border-slate-900 hover:opacity-80 transition-opacity" title={`سيولة حرة: ${activeCapital > 0 ? (stats.freeCash/activeCapital)*100 : 0}%`} />
           <div style={{ width: `${activeCapital > 0 ? (stats.fixedIncome/activeCapital)*100 : 0}%` }} className="bg-teal-500 border-r border-slate-900 hover:opacity-80 transition-opacity" title={`دخل ثابت: ${activeCapital > 0 ? (stats.fixedIncome/activeCapital)*100 : 0}%`} />
           {list.map((a, i) => (
             <div key={a.name} style={{ width: `${a.pct}%` }} className={`${colors[i%colors.length]} border-r border-slate-900 last:border-0 hover:opacity-80 transition-opacity`} title={`${a.name}: ${a.pct.toFixed(1)}%`} />
           ))}
        </div>
        
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-slate-400">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600"></span>سيولة حرة <span dir="ltr">{(activeCapital > 0 ? (stats.freeCash/activeCapital)*100 : 0).toFixed(1)}%</span></span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500"></span>دخل ثابت <span dir="ltr">{(activeCapital > 0 ? (stats.fixedIncome/activeCapital)*100 : 0).toFixed(1)}%</span></span>
           
           {list.slice(0,5).map((a, i) => (
             <span key={a.name} className="flex items-center gap-1">
               <span className={`w-2 h-2 rounded-full ${colors[i%colors.length]}`}></span>
               <span className="max-w-[80px] truncate" title={a.name}>{a.name}</span> 
               <span dir="ltr" className={textColors[i%colors.length]}>{a.pct.toFixed(1)}%</span>
             </span>
           ))}
           {list.length > 5 && <span className="flex items-center gap-1 text-slate-500">+{list.length - 5} أخرى</span>}
        </div>
      </>
    );
  };

  return (
    <div className="w-full bg-slate-900/95 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 relative overflow-hidden" dir="rtl">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-xl font-black tracking-tight">أداء المحفظة الإجمالي</h2>
        </div>
        <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-full text-xs font-bold text-slate-300 flex items-center gap-2">
          <PieChart className="w-3.5 h-3.5 text-blue-400" />
          <span><span className="text-blue-400">{stats.openCount}</span> مراكز مفتوحة</span>
          <span className="text-slate-500 mx-1">•</span>
          <span className="text-emerald-400">{wonPositionsCount} رابحة</span>
          <span className="text-slate-500 mx-1">-</span>
          <span className="text-rose-400">{lostPositionsCount} خاسرة</span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 relative z-10">
        <div className="w-full xl:w-1/3 flex flex-col gap-4">
          <div className="flex-1 bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 flex flex-col hover:border-slate-600 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-sm font-bold text-slate-400 block mb-1">صافي الأداء الكلي (محقق + غير محقق)</span>
                <div className={`text-5xl font-black tracking-tighter ${stats.netTotal > 0 ? 'text-emerald-400' : stats.netTotal < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  <Amt v={stats.netTotal} plus />
                </div>
              </div>
              <div className="text-left" dir="ltr">
                <span className="text-xs font-bold text-slate-400 block mb-1">من رأس المال</span>
                <span className={`text-lg font-black ${stats.netTotal > 0 ? 'text-emerald-400' : stats.netTotal < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {activeCapital > 0 ? (stats.netTotal / activeCapital * 100).toFixed(2) : '0.00'}%
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-[150px] relative -mx-2">
              <span className="text-[10px] font-bold text-slate-500 absolute top-0 right-4 z-10 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> منحنى الربح المحقق التراكمي</span>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#3b82f6' }}
                    formatter={(val: any) => [`${Number(val).toFixed(0)} EGP`, 'الربح التراكمي']}
                    labelFormatter={() => ''}
                  />
                  <Area type="monotone" dataKey="pnl" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPnl)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>محقق</span>
                <span className={`text-lg font-black ${stats.rPnL > 0 ? 'text-emerald-400' : stats.rPnL < 0 ? 'text-rose-400' : 'text-slate-200'}`} dir="ltr">
                  {stats.rPnL > 0 ? '+' : ''}{stats.rPnL.toLocaleString(undefined, {maximumFractionDigits:0})}
                </span>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>غير محقق</span>
                <div className="flex items-end justify-between" dir="ltr">
                  <span className={`text-lg font-black ${stats.uPnL > 0 ? 'text-blue-400' : stats.uPnL < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                    <Amt v={stats.uPnL} plus />
                  </span>
                  <span className={`text-[10px] font-bold pb-1 ${stats.uPnL > 0 ? 'text-blue-400/80' : stats.uPnL < 0 ? 'text-rose-400/80' : 'text-slate-500'}`}>
                    ({stats.cost > 0 ? (stats.uPnL / stats.cost * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-2/3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
            <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><PieChart className="w-3.5 h-3.5 text-indigo-400" />التعرض للسوق (أسهم)</span>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-black text-slate-100"><Amt v={stats.mv} /></div>
                <div className="text-[10px] text-slate-500 font-bold mt-1">التكلفة: <Amt v={stats.cost} /></div>
              </div>
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-700/50" />
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-indigo-500" strokeDasharray="125.6" strokeDashoffset={125.6 * (1 - Math.min(stats.exposurePct, 100)/100)} />
                </svg>
                <span className="absolute text-[10px] font-black text-white" dir="ltr">{stats.exposurePct.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
            <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-emerald-400" />الكاش الهجومي</span>
            <div className="text-2xl font-black text-emerald-400"><Amt v={stats.cash} /></div>
            <div className="text-[10px] text-slate-500 font-bold mt-1.5 flex items-center gap-2">
               <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>دخل ثابت <Amt v={stats.fixedIncome}/></span>
               <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>حر <Amt v={stats.freeCash}/></span>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
            <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" />متوسط الاحتفاظ</div>
            </span>
            <div className="text-2xl font-black text-slate-100">{Math.round(stats.avgHold)} <span className="text-sm font-bold text-slate-400">يوم</span></div>
            <div className="text-[10px] text-slate-500 font-bold mt-1">مرجح بحجم كل مركز</div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
            <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-yellow-500" />نسبة النجاح</span>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{wonPositionsCount} رابحة</span>
                <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>{lostPositionsCount} خاسرة</span>
              </div>
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-700/50" />
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-yellow-500" strokeDasharray="125.6" strokeDashoffset={125.6 * (1 - winRate/100)} />
                </svg>
                <span className="absolute text-[10px] font-black text-white" dir="ltr">{winRate.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-400 block mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-400" />العائد للمخاطرة</span>
            <div className="w-full flex items-center gap-1 mb-1">
               <div className="h-1.5 bg-rose-500 rounded-l-full" style={{ width: '33%' }}></div>
               <div className="h-1.5 bg-emerald-500 rounded-r-full" style={{ width: '67%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-300">
               <span className="text-rose-400">1</span>
               <span className="text-emerald-400">{stats.riskReward > 90 ? '∞' : stats.riskReward.toFixed(1)}</span>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><InfinityIcon className="w-3.5 h-3.5 text-purple-400" />معامل الربحية</span>
            <div className="flex justify-between items-end">
              <div className={`text-2xl font-black ${pfLabel.color}`} dir="ltr">
                {profitFactor > 90 ? '∞' : profitFactor.toFixed(2)}
              </div>
              <span className={`text-[10px] font-bold ${pfLabel.color} bg-white/5 px-2 py-1 rounded-md`}>{pfLabel.text}</span>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
            <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-orange-400" />المخاطرة المفتوحة</span>
            <div className="text-2xl font-black text-slate-100" dir="ltr">
               {activeCapital > 0 ? ((stats.risk / activeCapital)*100).toFixed(2) : '0.00'}%
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-1">لو ضُربت كل الوقوف: <Amt v={-stats.risk} /></div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
            <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-rose-400" />أقصى تراجع</span>
            <div className="text-2xl font-black text-slate-100" dir="ltr">
               -{maxDrawdown.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-1">من القمة على الربح المحقق</div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
            <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-blue-400" />تركز أكبر سهم</span>
            {stats.largest ? (
              <>
                <div className={`text-2xl font-black ${stats.largest.pct > 25 ? 'text-rose-400' : 'text-slate-100'}`} dir="ltr">
                  {stats.largest.pct.toFixed(1)}%
                </div>
                <div className="text-[10px] font-bold mt-1 flex items-center justify-between">
                  <span className="text-slate-400">{stats.largest.name}</span>
                  {stats.largest.pct > 25 && <span className="text-rose-400 bg-rose-500/10 px-1.5 rounded">خطر</span>}
                </div>
              </>
            ) : <span className="text-slate-600 font-black">-</span>}
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4 relative z-10">
        
        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600 transition-colors">
          <span className="text-xs font-bold text-slate-400 block mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5"><BarChart2 className="w-4 h-4 text-emerald-400" />ربحية كل سهم (غير محقق)</div>
          </span>
          <div className="space-y-3">
             {stats.stockPnL.length > 0 ? stats.stockPnL.slice(0,5).map(s => (
               <div key={s.sym} className="flex items-center gap-3">
                 <span className={`w-12 text-xs font-black text-right ${s.uPct > 0 ? 'text-emerald-400' : s.uPct < 0 ? 'text-rose-400' : 'text-slate-400'}`} dir="ltr">
                   {s.uPct > 0 ? '+' : ''}{s.uPct.toFixed(1)}%
                 </span>
                 <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden flex items-center">
                    <div className="w-full flex h-full">
                       <div className="flex-1 flex justify-end">
                         {s.uPct < 0 && <div className="h-full bg-rose-500 rounded-l-full" style={{ width: `${Math.min(Math.abs(s.uPct)*2, 100)}%` }}></div>}
                       </div>
                       <div className="w-px bg-slate-700 h-full"></div>
                       <div className="flex-1 flex justify-start">
                         {s.uPct > 0 && <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: `${Math.min(s.uPct*2, 100)}%` }}></div>}
                       </div>
                    </div>
                 </div>
                 <span className="w-12 text-[10px] font-bold text-slate-300">{s.sym}</span>
               </div>
             )) : (
               <div className="text-xs text-slate-600 text-center py-4">لا توجد مراكز مفتوحة</div>
             )}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600 transition-colors flex flex-col justify-start">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><LayoutTemplate className="w-4 h-4 text-indigo-400" />توزيع المحفظة</span>
            <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
              <button 
                onClick={() => setAllocTab('stocks')} 
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-colors ${allocTab === 'stocks' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                الأسهم
              </button>
              <button 
                onClick={() => setAllocTab('sectors')} 
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-colors ${allocTab === 'sectors' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                القطاعات
              </button>
              <button 
                onClick={() => setAllocTab('strategy')} 
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-colors ${allocTab === 'strategy' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                الاستراتيجية
              </button>
            </div>
          </div>
          
          <div className="flex flex-col justify-center flex-1">
             {allocTab === 'stocks' && renderAllocationBar(stats.allocList)}
             {allocTab === 'sectors' && renderAllocationBar(stats.sectorAllocList)}
             {allocTab === 'strategy' && renderAllocationBar(stats.strategyAllocList)}
          </div>
        </div>

      </div>
    </div>
  );
}
