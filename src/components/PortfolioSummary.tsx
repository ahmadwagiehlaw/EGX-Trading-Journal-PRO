import { useMemo } from 'react';
import { useTrades } from '../context/TradeContext';
import { computePositionMetrics } from '../utils/calculations';
import { Wallet, Clock, AlertTriangle, ShieldAlert, BarChart2, PieChart } from 'lucide-react';

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
  const { positions, commissionRate, activeCapital } = useTrades();

  const stats = useMemo(() => {
    let cost = 0;
    let mv = 0;
    let rPnL = 0;
    let uPnL = 0;
    let risk = 0;
    let wins = 0;
    let losses = 0;
    let openCount = 0;
    let holdDaysSum = 0;
    const tickerAlloc: Record<string, number> = {};

    positions.forEach(p => {
      const m = computePositionMetrics(p, commissionRate);
      rPnL += m.netRealizedPnL;
      
      if (m.isOpen) {
        openCount++;
        cost += m.openInvested;
        const val = m.openShares * m.currentPrice;
        mv += val;
        uPnL += m.netUnrealizedPnL;
        risk += m.openRisk;
        tickerAlloc[p.symbol] = val;
        
        if (p.journal?.openedDate) {
           holdDaysSum += (Date.now() - p.journal.openedDate) / 86400000;
        }
      }
      
      if (p.status === 'closed') {
        if (m.netRealizedPnL > 0) wins++;
        else if (m.netRealizedPnL < 0) losses++;
      }
    });

    const netTotal = rPnL + uPnL;
    const exposurePct = activeCapital > 0 ? (mv / activeCapital) * 100 : 0;
    const cash = activeCapital - cost;
    const avgHold = openCount > 0 ? holdDaysSum / openCount : 0;
    
    // Sort allocation
    const allocList = Object.entries(tickerAlloc)
      .map(([sym, val]) => ({ sym, val, pct: mv > 0 ? (val / mv) * 100 : 0 }))
      .sort((a, b) => b.val - a.val);
      
    const largest = allocList[0];

    return { cost, mv, rPnL, uPnL, netTotal, exposurePct, cash, avgHold, risk, wins, losses, openCount, allocList, largest };
  }, [positions, commissionRate, activeCapital]);

  if (stats.openCount === 0 && stats.rPnL === 0 && stats.uPnL === 0) return null;

  return (
    <div className="w-full bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 relative overflow-hidden" dir="rtl">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-black flex items-center gap-2 tracking-tight">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
          </div>
          أداء المحفظة الإجمالي
        </h2>
        <div className="px-3 py-1 bg-slate-800/80 border border-slate-700/50 rounded-full text-xs font-bold text-slate-300">
          <span className="text-blue-400">{stats.openCount}</span> مراكز مفتوحة
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 relative z-10">
        
        {/* Net Total */}
        <div className="col-span-1 lg:col-span-1 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 relative overflow-hidden group hover:border-slate-600 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-xs font-bold text-slate-400 block mb-2">الصافي (محقق + غير محقق)</span>
          <div className={`text-4xl font-black tracking-tighter ${stats.netTotal > 0 ? 'text-emerald-400' : stats.netTotal < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            <Amt v={stats.netTotal} plus />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>محقق: <Amt v={stats.rPnL} plus /></span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>غير محقق: <Amt v={stats.uPnL} plus /></span>
          </div>
        </div>

        {/* Exposure */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
          <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><PieChart className="w-3.5 h-3.5" />التعرض للسوق</span>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-black text-slate-100"><Amt v={stats.mv} /></div>
              <div className="text-xs text-slate-500 font-bold mt-1">التكلفة: <Amt v={stats.cost} /></div>
            </div>
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-700" />
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-indigo-500" strokeDasharray="125.6" strokeDashoffset={125.6 * (1 - Math.min(stats.exposurePct, 100)/100)} />
              </svg>
              <span className="absolute text-[10px] font-black text-white" dir="ltr">{stats.exposurePct.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Offensive Cash */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
          <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-emerald-400" />الكاش الهجومي</span>
          <div className="text-2xl font-black text-emerald-400"><Amt v={stats.cash} /></div>
          <div className="text-xs text-slate-500 font-bold mt-1">من رأس المال المتاح</div>
        </div>

        {/* Avg Hold */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
          <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" />متوسط الاحتفاظ</span>
          <div className="text-2xl font-black text-amber-400">{Math.round(stats.avgHold)} <span className="text-sm font-bold text-slate-400">يوم</span></div>
          <div className="text-xs text-slate-500 font-bold mt-1">للمراكز المفتوحة</div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        
        {/* Concentration Warning */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
          <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-rose-400" />تركز أكبر سهم</span>
          {stats.largest ? (
            <>
              <div className={`text-2xl font-black ${stats.largest.pct > 25 ? 'text-rose-400' : 'text-blue-400'}`} dir="ltr">
                {stats.largest.pct.toFixed(1)}% <span className="text-sm ml-1 text-slate-300 font-bold">{stats.largest.sym}</span>
              </div>
              {stats.largest.pct > 25 && (
                <div className="text-[10px] font-black text-rose-400/90 mt-1.5 bg-rose-500/10 px-2 py-1 rounded-lg inline-block border border-rose-500/20">خطر: تركز عالي يتجاوز 25%</div>
              )}
            </>
          ) : <span className="text-slate-600 font-black">-</span>}
        </div>

        {/* Open Risk */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
          <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-orange-400" />المخاطرة المفتوحة</span>
          <div className="text-2xl font-black text-orange-400">
             {activeCapital > 0 ? ((stats.risk / activeCapital)*100).toFixed(2) : '0.00'}%
          </div>
          <div className="text-xs text-slate-500 font-bold mt-1">لو ضُربت كل الوقوف: <Amt v={-stats.risk} /></div>
        </div>

        {/* Allocation Bar */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1.5"><PieChart className="w-3.5 h-3.5 text-indigo-400" />توزيع المحفظة المفتوحة</span>
          <div className="w-full h-3 rounded-full flex overflow-hidden bg-slate-900 mb-3 shadow-inner">
             {stats.allocList.map((a, i) => {
               const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500'];
               return <div key={a.sym} style={{ width: `${a.pct}%` }} className={`${colors[i%colors.length]} border-r border-slate-900 last:border-0 hover:opacity-80 transition-opacity`} title={`${a.sym}: ${a.pct.toFixed(1)}%`} />
             })}
             {stats.allocList.length === 0 && <div className="w-full h-full bg-slate-700" />}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-400">
             {stats.allocList.slice(0,4).map((a, i) => {
               const colors = ['text-indigo-400', 'text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400', 'text-purple-400'];
               return <span key={a.sym} className="bg-slate-900/50 px-1.5 py-0.5 rounded-md"><span className={`${colors[i%colors.length]} mr-1`}>●</span>{a.sym} <span dir="ltr">{a.pct.toFixed(0)}%</span></span>
             })}
             {stats.allocList.length > 4 && <span className="bg-slate-900/50 px-1.5 py-0.5 rounded-md">+{stats.allocList.length - 4} أخرى</span>}
          </div>
        </div>

      </div>
    </div>
  );
}
