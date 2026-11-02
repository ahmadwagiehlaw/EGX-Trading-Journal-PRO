import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Sparkles,
  Printer,
  Trophy,
  ShieldCheck,
  Layers,
  Users,
  Scale,
  Rocket,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useVault } from './VaultContext';
import type { Period, BenchmarksState } from './calc';
import {
  PERIODS,
  buildSeries,
  partnerSplit,
  computeStats,
  windowSeries,
  comparePortfolios,
  loadCachedBenchmarks,
  fetchEgxBenchmarks,
  buildBenchmarkSeries,
  fmt,
  fmtCompact,
  fmtPct,
  fmtSigned,
  fmtDate,
} from './calc';
import { ChartTip, Segmented, cx, tone } from './ui';

type Lens = 'total' | 'mine' | 'partner';

interface SmartAdvisorModalProps {
  open: boolean;
  onClose: () => void;
  initialLens?: Lens;
  scopeIds: string[];
  scopeLabel: string;
}

export function SmartAdvisorModal({
  open,
  onClose,
  initialLens = 'total',
  scopeIds,
  scopeLabel,
}: SmartAdvisorModalProps) {
  const { settings, snapshots, cashflows } = useVault();
  const [period, setPeriod] = useState<Period>('All');
  const [lens, setLens] = useState<Lens>(initialLens);
  const [bench, setBench] = useState<BenchmarksState>(() => loadCachedBenchmarks());
  const bankRate = useMemo(() => {
    const saved = Number(localStorage.getItem('egx_vault_bank_rate'));
    return !isNaN(saved) && saved > 0 && saved <= 100 ? saved : 27;
  }, [open]);

  useEffect(() => {
    if (open) {
      setLens(initialLens);
      fetchEgxBenchmarks().then(setBench);
    }
  }, [open, initialLens]);

  const activePorts = useMemo(() => settings.portfolios.filter(p => p.active), [settings.portfolios]);
  const basePts = useMemo(() => buildSeries(snapshots, cashflows, scopeIds), [snapshots, cashflows, scopeIds]);
  const split = useMemo(() => partnerSplit(basePts, settings.partner), [basePts, settings.partner]);
  const partnerOn = settings.partner.enabled;
  const effLens: Lens = partnerOn ? lens : 'total';
  const pts = effLens === 'total' ? basePts : effLens === 'partner' ? split.partner : split.mine;

  // سلسلة الفترة المختارة
  const winData = useMemo(() => windowSeries(pts, period, 'ltr'), [pts, period]);
  const benchSeries = useMemo(
    () => buildBenchmarkSeries(winData, bench, bankRate, 'ltr'),
    [winData, bench, bankRate]
  );

  const firstPt = winData[0];
  const lastPt = winData[winData.length - 1];
  const lastBench = benchSeries[benchSeries.length - 1];

  // إحصائيات السلسلة الكاملة والفترة المختارة
  const fullStats = useMemo(() => computeStats(pts), [pts]);
  const portRows = useMemo(
    () => comparePortfolios(snapshots, cashflows, activePorts).sort((a, b) => b.score - a.score),
    [snapshots, cashflows, activePorts]
  );

  // مصفوفة المقارنة عبر جميع الفترات (1M, 3M, 6M, 1Y, All)
  const matrixRows = useMemo(() => {
    return (['1M', '3M', '6M', '1Y', 'All'] as Period[]).map(p => {
      const w = windowSeries(pts, p, 'ltr');
      const b = buildBenchmarkSeries(w, bench, bankRate, 'ltr');
      const last = b[b.length - 1];
      return {
        period: p,
        label: p === 'All' ? 'منذ البداية' : p,
        myPct: last?.pTwr ?? 0,
        myProfit: last?.pProfit ?? 0,
        bankPct: last?.bankPct ?? 0,
        bankProfit: last?.bankProfit ?? 0,
        egx30Pct: last?.egx30Pct ?? 0,
        egx30Profit: last?.egx30Profit ?? 0,
        egx70Pct: last?.egx70Pct ?? 0,
        egx70Profit: last?.egx70Profit ?? 0,
      };
    });
  }, [pts, bench, bankRate]);

  // تحليل رافعة الشراكة (Partnership Leverage)
  const leverage = useMemo(() => {
    const totalLast = basePts[basePts.length - 1];
    const totalNav = totalLast?.nav ?? 0;
    const totalDep = totalLast?.deposits ?? 0;
    const totalProfit = totalLast?.profit ?? 0;
    const partnerCap = settings.partner.enabled ? (settings.partner.partnerCapital ?? 570000) : 0;
    const partnerProfitSharePct = settings.partner.enabled ? (settings.partner.profitShare ?? 40) : 0;
    const myProfitSharePct = 100 - partnerProfitSharePct;

    const myCap = Math.max(0, totalDep - partnerCap);
    const myCapSharePct = totalDep > 0 ? (myCap / totalDep) * 100 : 100;
    const multiplier = myCapSharePct > 0 ? myProfitSharePct / myCapSharePct : 1;

    // ربح المستخدم الفعلي بنسبة 60% مقابل لو كان يربح على قدر حصة رأس ماله فقط
    const myTheoreticalProfitAt60 = Math.max(0, totalProfit * (myProfitSharePct / 100));
    const myUnleveragedProfit = Math.max(0, totalProfit * (myCapSharePct / 100));
    const extraLeverageGain = Math.max(0, myTheoreticalProfitAt60 - myUnleveragedProfit);
    const coveragePct = partnerCap > 0 ? (totalNav / partnerCap) * 100 : 100;
    const bufferAmt = Math.max(0, totalNav - partnerCap);

    return {
      myCap,
      partnerCap,
      myCapSharePct,
      myProfitSharePct,
      multiplier,
      extraLeverageGain,
      coveragePct,
      bufferAmt,
    };
  }, [basePts, settings.partner]);

  // تحليل مهارة توقيت السيولة (TWR vs Simple ROI)
  const timingSkill = useMemo(() => {
    const twr = fullStats.twrPct;
    const roi = fullStats.retPct;
    const diff = roi - twr;
    return { twr, roi, diff };
  }, [fullStats]);

  // التقييم الذكي الشامل للخزنة (0 - 100)
  const healthScore = useMemo(() => {
    const retScore = Math.max(0, Math.min(100, Math.round(50 + (lastBench?.pTwr ?? 0) * 1.2)));
    const alpha30 = (lastBench?.pTwr ?? 0) - (lastBench?.egx30Pct ?? 0);
    const alphaBank = (lastBench?.pTwr ?? 0) - (lastBench?.bankPct ?? 0);
    const alphaScore = Math.max(0, Math.min(100, Math.round(60 + alpha30 * 1.2 + alphaBank * 0.6)));
    const safetyScore = Math.max(0, Math.min(100, Math.round(100 + fullStats.maxDD * 2.5)));
    const consistencyScore = Math.round(fullStats.winRate ?? 60);
    const total = Math.round(retScore * 0.3 + alphaScore * 0.3 + safetyScore * 0.2 + consistencyScore * 0.2);
    return { total, retScore, alphaScore, safetyScore, consistencyScore };
  }, [lastBench, fullStats]);

  // محاكاة وإسقاط الثروة المستقبلي (6M, 1Y, 2Y, 3Y)
  const projections = useMemo(() => {
    const startNav = lastPt?.nav ?? fullStats.nav;
    const cagrRate = Math.max(15, Math.min(85, fullStats.annualized ?? 35));
    const horizons = [
      { label: 'الآن', years: 0 },
      { label: 'بعد 6 شهور', years: 0.5 },
      { label: 'بعد سنة', years: 1 },
      { label: 'بعد سنتين', years: 2 },
      { label: 'بعد 3 سنوات', years: 3 },
    ];
    return {
      cagrRate,
      data: horizons.map(h => ({
        name: h.label,
        actual: Math.round(startNav * Math.pow(1 + cagrRate / 100, h.years)),
        balanced: Math.round(startNav * Math.pow(1.35, h.years)),
        bank: Math.round(startNav * Math.pow(1 + bankRate / 100, h.years)),
      })),
    };
  }, [lastPt, fullStats, bankRate]);

  if (!open) return null;

  const lensLabel = effLens === 'total' ? 'إجمالي الخزنة' : effLens === 'mine' ? 'حصتي الخالصة' : `حصة ${settings.partner.name}`;
  const periodLabel = period === 'All' ? 'منذ البداية' : `فترة ${period}`;

  const handlePrintReport = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    const curRow = matrixRows.find(r => r.period === period) ?? matrixRows[matrixRows.length - 1];
    const diffBankPct = curRow.myPct - curRow.bankPct;
    const diffBankEgp = curRow.myProfit - curRow.bankProfit;
    const diff30Pct = curRow.myPct - curRow.egx30Pct;
    const diff30Egp = curRow.myProfit - curRow.egx30Profit;
    const diff70Pct = curRow.myPct - curRow.egx70Pct;
    const diff70Egp = curRow.myProfit - curRow.egx70Profit;

    const matrixHtml = matrixRows
      .map(
        r => `
        <tr>
          <td style="font-weight:900;background:#f8fafc;">${r.label}</td>
          <td dir="ltr" style="font-weight:900;color:${r.myPct >= 0 ? '#059669' : '#e11d48'};">${fmtPct(r.myPct)} (${fmtSigned(r.myProfit)} ج.م)</td>
          <td dir="ltr" style="color:#d97706;font-weight:700;">${fmtPct(r.bankPct)}</td>
          <td dir="ltr" style="color:#0284c7;font-weight:700;">${fmtPct(r.egx30Pct)}</td>
          <td dir="ltr" style="color:#db2777;font-weight:700;">${fmtPct(r.egx70Pct)}</td>
          <td dir="ltr" style="font-weight:900;color:${r.myPct - r.egx30Pct >= 0 ? '#059669' : '#e11d48'};">
            ${r.myPct - r.egx30Pct >= 0 ? '✓ تفوق ' : 'أقل بـ '}${fmtPct(r.myPct - r.egx30Pct, 1)}
          </td>
        </tr>`
      )
      .join('');

    const portsHtml = portRows
      .map(
        (p, idx) => `
        <tr>
          <td style="font-weight:900;">${idx === 0 ? '👑 ' : ''}${p.portfolio.name}</td>
          <td dir="ltr" style="font-weight:800;">${fmt(p.stats.nav)} ج.م (${p.share.toFixed(1)}%)</td>
          <td dir="ltr" style="font-weight:800;color:${p.stats.profit >= 0 ? '#059669' : '#e11d48'};">${fmtSigned(p.stats.profit)} ج.م</td>
          <td dir="ltr" style="font-weight:800;color:${p.stats.twrPct >= 0 ? '#059669' : '#e11d48'};">${fmtPct(p.stats.twrPct)}</td>
          <td dir="ltr" style="color:#e11d48;font-weight:700;">${p.stats.maxDD.toFixed(1)}%</td>
          <td style="font-weight:900;color:#4f46e5;">${p.score}/100</td>
        </tr>`
      )
      .join('');

    const projHtml = projections.data
      .slice(1)
      .map(
        d => `
        <div class="kpi-box">
          <div class="kpi-label">${d.name}</div>
          <div class="kpi-val" dir="ltr" style="color:#059669;">${fmt(d.actual)} ج.م</div>
          <div class="kpi-sub" dir="ltr">متوازن (35%): ${fmt(d.balanced)} ج.م</div>
        </div>`
      )
      .join('');

    win.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>تقرير المستشار المالي الذكي - ${scopeLabel} (${lensLabel})</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;900&display=swap');
          * { box-sizing: border-box; font-family: 'Cairo', sans-serif; }
          body { margin: 0; padding: 28px; background: #fff; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: 900; margin: 0; color: #0f172a; }
          .subtitle { font-size: 12px; font-weight: 700; color: #64748b; margin-top: 4px; }
          .score-badge { background: #0f172a; color: #fff; padding: 10px 18px; border-radius: 16px; text-align: center; }
          .score-num { font-size: 24px; font-weight: 900; color: #10b981; line-height: 1; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .kpi-box { border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 14px; background: #f8fafc; }
          .kpi-label { font-size: 11px; font-weight: 700; color: #64748b; }
          .kpi-val { font-size: 18px; font-weight: 900; margin-top: 4px; }
          .kpi-sub { font-size: 10px; font-weight: 700; color: #475569; margin-top: 3px; }
          .section { margin-bottom: 22px; }
          .section-title { font-size: 14px; font-weight: 900; color: #0f172a; margin-bottom: 10px; padding-right: 10px; border-right: 4px solid #f97316; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; }
          th { background: #0f172a; color: #fff; font-weight: 800; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">تقرير المستشار المالي الذكي — EGX Pro Vault</h1>
            <div class="subtitle">النطاق: ${scopeLabel} · العدسة: ${lensLabel} · الفترة: ${periodLabel} (${firstPt ? fmtDate(firstPt.date) : ''} ← ${lastPt ? fmtDate(lastPt.date) : ''})</div>
          </div>
          <div class="score-badge">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;">تقييم الكفاءة الشامل</div>
            <div class="score-num">${healthScore.total}/100</div>
          </div>
        </div>

        <div class="grid-4">
          <div class="kpi-box">
            <div class="kpi-label">القيمة السوقية الحالية</div>
            <div class="kpi-val" dir="ltr">${fmt(lastPt?.nav ?? 0)} ج.م</div>
            <div class="kpi-sub" dir="ltr">صافي الإيداعات: ${fmt(lastPt?.deposits ?? 0)} ج.م</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">أداء الفترة (${periodLabel})</div>
            <div class="kpi-val" dir="ltr" style="color:${curRow.myProfit >= 0 ? '#059669' : '#e11d48'};">${fmtSigned(curRow.myProfit)} ج.م</div>
            <div class="kpi-sub" dir="ltr">نسبة النمو: ${fmtPct(curRow.myPct)}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">مقارنة بالبنك (${bankRate}%)</div>
            <div class="kpi-val" dir="ltr" style="color:${diffBankPct >= 0 ? '#059669' : '#e11d48'};">${diffBankPct >= 0 ? 'متفوق بـ ' : 'أقل بـ '}${fmtPct(Math.abs(diffBankPct), 1)}</div>
            <div class="kpi-sub" dir="ltr">فارق الجنيه: ${fmtSigned(diffBankEgp)} ج.م</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">مقارنة بمؤشر EGX30</div>
            <div class="kpi-val" dir="ltr" style="color:${diff30Pct >= 0 ? '#059669' : '#e11d48'};">${diff30Pct >= 0 ? 'متفوق بـ ' : 'أقل بـ '}${fmtPct(Math.abs(diff30Pct), 1)}</div>
            <div class="kpi-sub" dir="ltr">فارق الجنيه: ${fmtSigned(diff30Egp)} ج.م | EGX70: ${fmtPct(diff70Pct, 1)} (${fmtSigned(diff70Egp)})</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">١. مصفوفة المقارنة المرجعية عبر كل الفترات (محفظتك مقابل البنك و EGX30 و EGX70)</div>
          <table>
            <thead>
              <tr>
                <th>الفترة</th>
                <th>أداء محفظتك</th>
                <th>عائد البنك (${bankRate}%)</th>
                <th>مؤشر EGX30</th>
                <th>مؤشر EGX70</th>
                <th>حسم التفوق مقابل السوق (Alpha)</th>
              </tr>
            </thead>
            <tbody>${matrixHtml}</tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">٢. كفاءة المحافظ وتوزيع القوة (Attribution Analysis)</div>
          <table>
            <thead>
              <tr>
                <th>المحفظة</th>
                <th>القيمة السوقية والحصة</th>
                <th>صافي الربح الكلي</th>
                <th>العائد الزماني (TWR)</th>
                <th>أقصى هبوط</th>
                <th>تقييم الجودة</th>
              </tr>
            </thead>
            <tbody>${portsHtml}</tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">٣. إسقاط الثروة المستقبلي المتوقع (بناءً على معدل النمو السنوي المركب ${projections.cagrRate.toFixed(1)}%)</div>
          <div class="grid-4">${projHtml}</div>
        </div>

        <script>window.onload = () => { setTimeout(() => window.print(), 350); };</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-[2rem] border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-2xl overflow-hidden">
        {/* Top Executive Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black">المستشار المالي الذكي</h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-black text-emerald-300">
                  تقييم {healthScore.total}/100
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                {scopeLabel} · {lensLabel} · {firstPt && lastPt ? `${fmtDate(firstPt.date)} ← ${fmtDate(lastPt.date)}` : ''}
              </p>
            </div>
          </div>

          {/* Controls: Period + Lens + Print + Close */}
          <div className="flex flex-wrap items-center gap-2">
            {partnerOn && (
              <div className="inline-flex rounded-xl bg-white/10 p-0.5 text-[11px] font-black">
                {([
                  ['total', 'الإجمالي'],
                  ['mine', 'حصتي'],
                  ['partner', settings.partner.name],
                ] as const).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLens(v)}
                    className={cx(
                      'rounded-lg px-2.5 py-1 transition',
                      effLens === v ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}

            <Segmented
              size="sm"
              value={period}
              onChange={setPeriod}
              options={PERIODS.map(p => ({ v: p, label: p === 'All' ? 'الكل' : p }))}
            />

            <button
              type="button"
              onClick={handlePrintReport}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التقرير</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/10 p-2 text-slate-300 hover:bg-white/20 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body — Scrollable Graphical Dashboard */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Row 1: Overall Health Radar Bars + Partnership Leverage + Cashflow Timing */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. Health Score Breakdown */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  مؤشر كفاءة الإدارة ({periodLabel})
                </span>
                <span dir="ltr" className="text-lg font-black text-emerald-500 tabular-nums">
                  {healthScore.total}/100
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'قوة العائد والنمو', val: healthScore.retScore, color: 'bg-emerald-500' },
                  { label: 'التفوق على السوق والبنك (Alpha)', val: healthScore.alphaScore, color: 'bg-sky-500' },
                  { label: 'حماية رأس المال والهبوط', val: healthScore.safetyScore, color: 'bg-amber-500' },
                  { label: 'الاتساق الشهري ونسبة الفوز', val: healthScore.consistencyScore, color: 'bg-purple-500' },
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-black">
                      <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                      <span dir="ltr" className="text-slate-900 dark:text-white tabular-nums">{item.val}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" dir="ltr">
                      <div className={cx('h-full rounded-full transition-all duration-700', item.color)} style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Partnership Leverage & Safety Multiplier */}
            <div className="rounded-3xl border border-purple-500/25 bg-gradient-to-br from-purple-500/[0.06] via-white to-white dark:from-purple-500/[0.08] dark:via-slate-900 dark:to-slate-900 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                  <Users className="w-4 h-4 text-purple-500" />
                  رافعة الشراكة ومضاعف أرباحك
                </span>
                <span dir="ltr" className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-black text-purple-600 dark:text-purple-300">
                  {leverage.multiplier.toFixed(2)}x مضاعف
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/80 dark:bg-slate-800/70 p-2.5 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] font-bold text-slate-400">حصتك في رأس المال</div>
                  <div dir="ltr" className="text-base font-black text-slate-900 dark:text-white text-right mt-0.5">
                    {leverage.myCapSharePct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] font-black text-emerald-500 mt-0.5">
                    مقابل {leverage.myProfitSharePct}% من الأرباح!
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-500/10 p-2.5 border border-emerald-500/25">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">ربحك الإضافي من الرافعة</div>
                  <div dir="ltr" className="text-base font-black text-emerald-600 dark:text-emerald-400 text-right mt-0.5">
                    +{fmtCompact(leverage.extraLeverageGain)} ج.م
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                    فوق عائد رأس مالك المنفرد
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 px-3 py-2 flex items-center justify-between text-[11px] font-black">
                <span className="text-slate-500 dark:text-slate-400">حزام الأمان فوق رأس مال الشريك</span>
                <b dir="ltr" className="text-emerald-500">
                  +{fmt(leverage.bufferAmt)} ج.م ({leverage.coveragePct.toFixed(0)}%)
                </b>
              </div>
            </div>

            {/* 3. Cashflow Timing & Velocity */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                  <Scale className="w-4 h-4 text-amber-500" />
                  كفاءة توقيت السيولة والإيداعات
                </span>
                <span
                  dir="ltr"
                  className={cx(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-black',
                    timingSkill.diff >= 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
                  )}
                >
                  {fmtPct(timingSkill.diff, 1)} فارق التوقيت
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                  <div className="text-[10px] font-bold text-slate-400">عائد الاستراتيجية (TWR)</div>
                  <div dir="ltr" className={cx('text-base font-black text-right mt-0.5', tone(timingSkill.twr))}>
                    {fmtPct(timingSkill.twr)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                  <div className="text-[10px] font-bold text-slate-400">عائد المال الصافي (ROI)</div>
                  <div dir="ltr" className={cx('text-base font-black text-right mt-0.5', tone(timingSkill.roi))}>
                    {fmtPct(timingSkill.roi)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 px-3 py-2 flex items-center justify-between text-[11px] font-black">
                <span className="text-slate-500 dark:text-slate-400">متوسط سرعة الربح الشهري</span>
                <b dir="ltr" className={tone(fullStats.profit)}>
                  {fullStats.days >= 15 ? `${fmtSigned(Math.round((fullStats.profit / fullStats.days) * 30))} ج.م/شهر` : '—'}
                </b>
              </div>
            </div>
          </div>

          {/* Row 2: Multi-Period Benchmark Matrix (1M · 3M · 6M · 1Y · All) */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  مصفوفة الحسم الشاملة: محفظتك مقابل البنك ({bankRate}%) و EGX30 و EGX70 عبر كل الفترات
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">اضغط على أي فترة لمطابقتها</span>
            </div>

            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full min-w-[680px] text-center text-xs font-black border-separate border-spacing-y-1.5">
                <thead>
                  <tr className="text-[11px] text-slate-400">
                    <th className="py-1.5 px-3 text-right">الفترة الزمنية</th>
                    <th className="py-1.5 px-3 text-emerald-500">أداء محفظتك</th>
                    <th className="py-1.5 px-3 text-amber-500">عائد البنك ({bankRate}%)</th>
                    <th className="py-1.5 px-3 text-sky-500">مؤشر EGX30</th>
                    <th className="py-1.5 px-3 text-pink-500">مؤشر EGX70</th>
                    <th className="py-1.5 px-3">حكم التفوق أمام البنك</th>
                    <th className="py-1.5 px-3">حكم التفوق أمام EGX30</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map(r => {
                    const beatBank = r.myPct >= r.bankPct;
                    const beat30 = r.myPct >= r.egx30Pct;
                    const isSel = r.period === period;
                    return (
                      <tr
                        key={r.period}
                        onClick={() => setPeriod(r.period)}
                        className={cx(
                          'cursor-pointer rounded-2xl transition',
                          isSel
                            ? 'bg-slate-900/5 dark:bg-white/10 ring-1 ring-amber-500/40'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <td className="py-2.5 px-3 text-right rounded-r-2xl font-black text-slate-900 dark:text-white">
                          {r.label}
                        </td>
                        <td dir="ltr" className={cx('py-2.5 px-3 tabular-nums', tone(r.myPct))}>
                          <div>{fmtPct(r.myPct)}</div>
                          <div className="text-[10px] opacity-75">{fmtSigned(r.myProfit)} ج.م</div>
                        </td>
                        <td dir="ltr" className="py-2.5 px-3 tabular-nums text-amber-600 dark:text-amber-400">
                          <div>{fmtPct(r.bankPct)}</div>
                          <div className="text-[10px] opacity-75">{fmtSigned(r.bankProfit)} ج.م</div>
                        </td>
                        <td dir="ltr" className={cx('py-2.5 px-3 tabular-nums', tone(r.egx30Pct))}>
                          <div>{fmtPct(r.egx30Pct)}</div>
                          <div className="text-[10px] opacity-75">{fmtSigned(r.egx30Profit)} ج.م</div>
                        </td>
                        <td dir="ltr" className={cx('py-2.5 px-3 tabular-nums', tone(r.egx70Pct))}>
                          <div>{fmtPct(r.egx70Pct)}</div>
                          <div className="text-[10px] opacity-75">{fmtSigned(r.egx70Profit)} ج.م</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            dir="ltr"
                            className={cx(
                              'inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-black',
                              beatBank ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                            )}
                          >
                            {beatBank ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {beatBank ? `متفوق +${(r.myPct - r.bankPct).toFixed(1)}%` : `البنك +${(r.bankPct - r.myPct).toFixed(1)}%`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 rounded-l-2xl">
                          <span
                            dir="ltr"
                            className={cx(
                              'inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-black',
                              beat30 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                            )}
                          >
                            {beat30 ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {beat30 ? `متفوق +${(r.myPct - r.egx30Pct).toFixed(1)}%` : `المؤشر +${(r.egx30Pct - r.myPct).toFixed(1)}%`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 3: Portfolio Attribution Bars + 3-Year Wealth Projection Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Portfolio Efficiency & Contribution */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  <Layers className="w-4 h-4 text-orange-500" />
                  تشخيص المحافظ (القائد ومساهمة الربح)
                </span>
                <span className="text-[10px] font-bold text-slate-400">حصة المال مقابل حصة الربح</span>
              </div>

              <div className="space-y-3">
                {portRows.map((r, i) => (
                  <div key={r.portfolio.id} className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <i className="w-2.5 h-2.5 rounded-full" style={{ background: r.portfolio.color }} />
                        <span className="text-xs font-black text-slate-900 dark:text-white">{r.portfolio.name}</span>
                        {i === 0 && <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-black text-amber-500">👑 القائد</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-black">
                        <span dir="ltr" className={tone(r.stats.profit)}>{fmtSigned(r.stats.profit)} ج.م</span>
                        <span dir="ltr" className="rounded-lg bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 text-[10px]">
                          تقييم {r.score}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-black">
                      <div className="rounded-xl bg-white dark:bg-slate-900 px-2.5 py-1.5 flex justify-between">
                        <span className="text-slate-400">حصة المال</span>
                        <b dir="ltr">{r.share.toFixed(1)}%</b>
                      </div>
                      <div className="rounded-xl bg-white dark:bg-slate-900 px-2.5 py-1.5 flex justify-between">
                        <span className="text-slate-400">حصة الربح</span>
                        <b dir="ltr" className="text-emerald-500">{Math.max(0, r.profitShare).toFixed(1)}%</b>
                      </div>
                      <div className="rounded-xl bg-white dark:bg-slate-900 px-2.5 py-1.5 flex justify-between">
                        <span className="text-slate-400">أقصى هبوط</span>
                        <b dir="ltr" className="text-rose-500">{r.stats.maxDD.toFixed(1)}%</b>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. 3-Year Wealth Projection Chart */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  <Rocket className="w-4 h-4 text-emerald-500" />
                  إسقاط الثروة المستقبلي ({lensLabel})
                </span>
                <span dir="ltr" className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-500">
                  CAGR {projections.cagrRate.toFixed(1)}%
                </span>
              </div>

              <div dir="ltr" className="h-52 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projections.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis orientation="right" tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                    <Tooltip
                      content={
                        <ChartTip
                          rows={p => [
                            { name: `بوتيرتك (${projections.cagrRate.toFixed(0)}%)`, value: `${fmt(+p.actual)} ج.م`, color: '#10b981' },
                            { name: 'نمو متوازن (35%)', value: `${fmt(+p.balanced)} ج.م`, color: '#0ea5e9' },
                            { name: `عائد البنك (${bankRate}%)`, value: `${fmt(+p.bank)} ج.م`, color: '#f59e0b' },
                          ]}
                        />
                      }
                    />
                    <Bar dataKey="actual" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="balanced" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="bank" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black">
                <div className="rounded-xl bg-emerald-500/10 py-1.5 text-emerald-600 dark:text-emerald-400">
                  بعد سنة: <b dir="ltr">{fmtCompact(projections.data[2].actual)}</b>
                </div>
                <div className="rounded-xl bg-sky-500/10 py-1.5 text-sky-600 dark:text-sky-400">
                  بعد سنتين: <b dir="ltr">{fmtCompact(projections.data[3].actual)}</b>
                </div>
                <div className="rounded-xl bg-purple-500/10 py-1.5 text-purple-600 dark:text-purple-400">
                  بعد 3 سنوات: <b dir="ltr">{fmtCompact(projections.data[4].actual)}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
