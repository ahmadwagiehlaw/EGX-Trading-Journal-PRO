import { useMemo } from 'react';
import { Activity, Banknote, TrendingUp, TrendingDown, Gauge, Clock, Trophy, ShieldAlert, Layers, Crown, AlertTriangle } from 'lucide-react';
import { useTrades } from '../context/TradeContext';
import { computePositionMetrics } from '../utils/calculations';

// Compact Arabic number: 371,505 -> "371.5 ألف"
function Amt({ v, plus = false }: { v: number; plus?: boolean }) {
  const a = Math.abs(v);
  const sign = v < 0 ? '-' : plus && v > 0 ? '+' : '';
  let num: string;
  let unit = '';
  if (a >= 1_000_000) { num = (a / 1_000_000).toFixed(2); unit = 'مليون'; }
  else if (a >= 10_000) { num = (a / 1_000).toFixed(1); unit = 'ألف'; }
  else num = a.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return (
    <span className="whitespace-nowrap">
      <span dir="ltr" className="inline-block">{sign}{num}</span>
      {unit && <span className="mr-1">{unit}</span>}
    </span>
  );
}

const PALETTE = ['bg-indigo-400', 'bg-sky-400', 'bg-emerald-400', 'bg-amber-400', 'bg-fuchsia-400', 'bg-rose-400', 'bg-teal-400', 'bg-violet-400'];

export default function PortfolioSummary() {
  const { filteredPositions, activeCapital, commissionRate } = useTrades();

  const s = useMemo(() => {
    let cost = 0, mv = 0, unrealized = 0, realized = 0, risk = 0;
    let wDays = 0, wCost = 0;
    let wins = 0, losses = 0, openCount = 0, inProfit = 0, inLoss = 0;
    let best: { sym: string; pct: number } | null = null;
    let worst: { sym: string; pct: number } | null = null;
    const alloc: { sym: string; value: number }[] = [];

    filteredPositions.forEach(p => {
      const m = computePositionMetrics(p, commissionRate);
      realized += m.netRealizedPnL;
      if (m.isFullyClosed) { if (m.netRealizedPnL > 0) wins++; else if (m.netRealizedPnL < 0) losses++; }
      if (!m.isOpen) return;

      openCount++;
      const c = m.openShares * m.avgEntry;
      const v = m.openShares * m.currentPrice;
      cost += c; mv += v; unrealized += m.netUnrealizedPnL;
      alloc.push({ sym: p.symbol, value: v });
      if (m.netUnrealizedPnL >= 0) inProfit++; else inLoss++;

      const stop = m.currentStop;
      if (stop > 0 && stop < m.avgEntry) risk += (m.avgEntry - stop) * m.openShares;

      const buys = (p.transactions || []).filter(t => t.type === 'buy').map(t => t.date).filter(Boolean);
      if (buys.length) {
        const d = Math.max(0, Math.floor((Date.now() - Math.min(...buys)) / 86400000));
        wDays += d * c; wCost += c;
      }
      const pct = c > 0 ? (m.netUnrealizedPnL / c) * 100 : 0;
      if (!best || pct > best.pct) best = { sym: p.symbol, pct };
      if (!worst || pct < worst.pct) worst = { sym: p.symbol, pct };
    });

    alloc.sort((a, b) => b.value - a.value);
    const total = realized + unrealized;
    const closedCount = wins + losses;
    return {
      cost, mv, unrealized, realized, total, risk, openCount, inProfit, inLoss,
      avgDays: wCost > 0 ? Math.round(wDays / wCost) : null,
      winRate: closedCount > 0 ? (wins / closedCount) * 100 : null,
      wins, losses, best: best as { sym: string; pct: number } | null, worst: worst as { sym: string; pct: number } | null, alloc,
    };
  }, [filteredPositions, commissionRate]);

  const cap = activeCapital > 0 ? activeCapital : 0;
  const exposurePct = cap > 0 ? (s.mv / cap) * 100 : 0;
  const totalPct = cap > 0 ? (s.total / cap) * 100 : 0;
  const riskPct = cap > 0 ? (s.risk / cap) * 100 : 0;
  const unrealizedPct = s.cost > 0 ? (s.unrealized / s.cost) * 100 : 0;
  const cashPct = Math.max(0, 100 - exposurePct);
  const up = s.total >= 0;

  const tile = 'rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-2.5 backdrop-blur-sm flex flex-col gap-1.5 min-w-0';
  const lbl = 'flex items-center gap-1.5 text-[11px] font-bold text-slate-300 whitespace-nowrap';

  return (
    <section dir="rtl" className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-lg">
      <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className={`pointer-events-none absolute -bottom-24 -right-10 h-56 w-56 rounded-full blur-3xl ${up ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`} />

      <div className="relative flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-100">
          <Activity className="w-4 h-4 text-indigo-300" />
          أداء المحفظة الإجمالي
        </h2>
        <span className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-[11px] font-black whitespace-nowrap">
          <Layers className="w-3.5 h-3.5 text-sky-300" />
          {s.openCount} مراكز مفتوحة
          <span className="text-emerald-300">· {s.inProfit} رابحة</span>
          <span className="text-rose-300">· {s.inLoss} خاسرة</span>
        </span>
      </div>

      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
        {/* Hero: total net performance */}
        <div className="rounded-2xl bg-white/[0.07] border border-white/10 p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold text-slate-300 mb-1">صافي الأداء الكلي (محقق + غير محقق)</div>
            <div className={`flex items-center gap-2 text-4xl font-black leading-none ${up ? 'text-emerald-300' : 'text-rose-300'}`}>
              {up ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
              <Amt v={s.total} plus />
            </div>
            <div className={`mt-1.5 text-sm font-black ${up ? 'text-emerald-300/90' : 'text-rose-300/90'}`} dir="ltr">
              {cap > 0 ? `${totalPct > 0 ? '+' : ''}${totalPct.toFixed(2)}% من رأس المال` : ''}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-black/20 px-2.5 py-2">
              <div className={lbl}><Banknote className="w-3.5 h-3.5 text-emerald-300" />محقق</div>
              <div className={`text-sm font-black ${s.realized >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}><Amt v={s.realized} plus /></div>
            </div>
            <div className="rounded-xl bg-black/20 px-2.5 py-2">
              <div className={lbl}><TrendingUp className="w-3.5 h-3.5 text-sky-300" />غير محقق</div>
              <div className={`text-sm font-black ${s.unrealized >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                <Amt v={s.unrealized} plus /> <span className="text-[10px] opacity-80" dir="ltr">({unrealizedPct > 0 ? '+' : ''}{unrealizedPct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className={tile}>
            <div className={lbl}><Gauge className="w-3.5 h-3.5 text-indigo-300" />التعرض للسوق</div>
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-lg font-black" dir="ltr">{exposurePct.toFixed(1)}%</span>
              <span className="text-[10px] text-slate-400">من رأس المال</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-l from-indigo-400 to-sky-400" style={{ width: `${Math.min(100, exposurePct)}%` }} />
            </div>
          </div>

          <div className={tile}>
            <div className={lbl}><Layers className="w-3.5 h-3.5 text-sky-300" />القيمة السوقية</div>
            <div className="text-lg font-black"><Amt v={s.mv} /></div>
            <div className="text-[10px] text-slate-400 whitespace-nowrap">التكلفة: <Amt v={s.cost} /></div>
          </div>

          <div className={tile}>
            <div className={lbl}><Clock className="w-3.5 h-3.5 text-amber-300" />متوسط الاحتفاظ</div>
            <div className="text-lg font-black whitespace-nowrap">{s.avgDays === null ? '—' : <>{s.avgDays} <span className="text-xs font-bold text-slate-300">يوم</span></>}</div>
            <div className="text-[10px] text-slate-400 whitespace-nowrap">مرجّح بحجم كل مركز</div>
          </div>

          <div className={tile}>
            <div className={lbl}><Trophy className="w-3.5 h-3.5 text-yellow-300" />نسبة النجاح</div>
            <div className="text-lg font-black whitespace-nowrap" dir="ltr">{s.winRate === null ? '—' : s.winRate.toFixed(0) + '%'}</div>
            <div className="text-[10px] text-slate-400 whitespace-nowrap">{s.wins} رابحة · {s.losses} خاسرة (مغلقة)</div>
          </div>

          <div className={tile}>
            <div className={lbl}><ShieldAlert className="w-3.5 h-3.5 text-rose-300" />المخاطرة المفتوحة</div>
            <div className="text-lg font-black whitespace-nowrap" dir="ltr">{riskPct.toFixed(2)}%</div>
            <div className="text-[10px] text-slate-400 whitespace-nowrap">لو ضُربت كل الوقوف: <Amt v={-s.risk} /></div>
          </div>

          <div className={tile}>
            <div className={lbl}><Crown className="w-3.5 h-3.5 text-emerald-300" />الأفضل / الأسوأ</div>
            <div className="flex items-center justify-between gap-2 text-xs font-black whitespace-nowrap">
              <span className="text-emerald-300" dir="ltr">{s.best ? `${s.best.sym} ${s.best.pct > 0 ? '+' : ''}${s.best.pct.toFixed(1)}%` : '—'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-rose-300 whitespace-nowrap">
              <AlertTriangle className="w-3 h-3" />
              <span dir="ltr">{s.worst ? `${s.worst.sym} ${s.worst.pct > 0 ? '+' : ''}${s.worst.pct.toFixed(1)}%` : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation bar */}
      {s.alloc.length > 0 && cap > 0 && (
        <div className="relative mt-4">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
            {s.alloc.map((a, i) => (
              <div key={a.sym} className={`${PALETTE[i % PALETTE.length]} h-full`} style={{ width: `${(a.value / cap) * 100}%` }} title={`${a.sym}: ${((a.value / cap) * 100).toFixed(1)}%`} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-300">
            {s.alloc.map((a, i) => (
              <span key={a.sym} className="flex items-center gap-1 whitespace-nowrap">
                <span className={`h-2 w-2 rounded-full ${PALETTE[i % PALETTE.length]}`} />
                {a.sym}
                <span className="text-slate-400" dir="ltr">{((a.value / cap) * 100).toFixed(1)}%</span>
              </span>
            ))}
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full bg-white/25" />
              سيولة
              <span className="text-slate-400" dir="ltr">{cashPct.toFixed(1)}%</span>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
