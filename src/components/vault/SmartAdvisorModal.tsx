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
  Banknote,
  Target,
  Crosshair,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
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
  computeCashAmmo,
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
    if (settings.bankRate && settings.bankRate > 0 && settings.bankRate <= 100) return settings.bankRate;
    const saved = Number(localStorage.getItem('egx_vault_bank_rate'));
    return !isNaN(saved) && saved > 0 && saved <= 100 ? saved : 27;
  }, [open, settings.bankRate]);

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
  const baseLastNav = basePts[basePts.length - 1]?.nav ?? 0;
  const pShareRatio = baseLastNav > 0 ? Math.min(1, (split.partner[split.partner.length - 1]?.nav ?? 0) / baseLastNav) : 0;
  const lensFactor = effLens === 'total' ? 1 : effLens === 'partner' ? pShareRatio : 1 - pShareRatio;

  // حساب رادار الكاش الهجومي المتاح والذخيرة التكتيكية
  const cashAmmo = useMemo(
    () => computeCashAmmo(snapshots, cashflows, activePorts, scopeIds, lensFactor),
    [snapshots, cashflows, activePorts, scopeIds, lensFactor]
  );

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

  // التقييم الذكي الشامل للخزنة (0 - 100) مع بُعد انضباط السيولة والذخيرة الهجومية
  const healthScore = useMemo(() => {
    const retScore = Math.max(0, Math.min(100, Math.round(50 + (lastBench?.pTwr ?? 0) * 1.2)));
    const alpha30 = (lastBench?.pTwr ?? 0) - (lastBench?.egx30Pct ?? 0);
    const alphaBank = (lastBench?.pTwr ?? 0) - (lastBench?.bankPct ?? 0);
    const alphaScore = Math.max(0, Math.min(100, Math.round(60 + alpha30 * 1.2 + alphaBank * 0.6)));
    const safetyScore = Math.max(0, Math.min(100, Math.round(100 + fullStats.maxDD * 2.5)));
    const consistencyScore = Math.round(fullStats.winRate ?? 60);

    // تقييم انضباط الذخيرة النقدية الهجومية (Cash Ammo Readiness)
    const cp = cashAmmo.cashPct;
    const ammoScore =
      cp >= 12 && cp <= 30
        ? 96
        : cp >= 7 && cp < 12
        ? 78
        : cp > 30
        ? 85
        : cp > 0
        ? 55
        : 38;

    const total = Math.round(
      retScore * 0.25 +
      alphaScore * 0.25 +
      safetyScore * 0.2 +
      consistencyScore * 0.15 +
      ammoScore * 0.15
    );
    return { total, retScore, alphaScore, safetyScore, consistencyScore, ammoScore };
  }, [lastBench, fullStats, cashAmmo.cashPct]);

  // غرفة العمليات التكتيكية والتشخيص الذكي للسيولة والمخاطر (Smart Tactical Engine)
  const tacticalAnalysis = useMemo(() => {
    const peakNav = pts.reduce((m, x) => Math.max(m, x.nav), 0);
    const curNav = lastPt?.nav ?? fullStats.nav;
    const gapFromPeakAmt = Math.max(0, peakNav - curNav);
    const curDrawdownPct = peakNav > 0 ? ((curNav - peakNav) / peakNav) * 100 : 0; // سالب عند الهبوط
    const isNearPeak = curDrawdownPct > -4.5; // قريب من القمة التاريخية

    const cp = cashAmmo.cashPct;
    const cashEgp = cashAmmo.totalCash;
    const target15Total = Math.round(curNav * 0.15);
    const target20Total = Math.round(curNav * 0.2);
    const neededFor15 = cashAmmo.targetCash15Amt;
    const neededFor20 = cashAmmo.targetCash20Amt;

    // دفعات القنص الشرائية الثلاثية (3-Tranche Sniper Plan: 40% / 35% / 25%)
    const tranche1 = Math.round(cashEgp * 0.4);
    const tranche2 = Math.round(cashEgp * 0.35);
    const tranche3 = Math.max(0, cashEgp - tranche1 - tranche2);

    // توليد القرارات التنفيذية المختصرة والحاسمة (Executive Chips)
    const directives: {
      id: string;
      badge: string;
      title: string;
      body: string;
      actionMetric: string;
      tone: 'emerald' | 'amber' | 'rose' | 'sky';
    }[] = [];

    // 1. قرار السيولة الهجومية
    if (cp < 8 && isNearPeak) {
      directives.push({
        id: 'ammo-harvest',
        badge: 'جني سيولة ⚠️',
        title: `تخفيف مراكز لتوفير ${fmt(neededFor15)} ج.م كاش`,
        body: `المحفظة قرب القمة (${curDrawdownPct.toFixed(1)}%) والكاش (${cp.toFixed(1)}%).`,
        actionMetric: `المستهدف (15%): ${fmt(target15Total)} ج.م`,
        tone: 'rose',
      });
    } else if (cp < 8 && !isNearPeak) {
      directives.push({
        id: 'ammo-rebuild',
        badge: 'بناء ذخيرة 🛡️',
        title: `تجميع ${fmt(neededFor15)} ج.م كاش مع أول ارتداد`,
        body: `تراجع حالي (${curDrawdownPct.toFixed(1)}% / -${fmtCompact(gapFromPeakAmt)}) بسيولة (${cp.toFixed(1)}%).`,
        actionMetric: `درع السيولة (15%): ${fmt(target15Total)} ج.م`,
        tone: 'amber',
      });
    } else if (cp >= 12 && !isNearPeak) {
      directives.push({
        id: 'ammo-deploy',
        badge: 'قنص متدرج 🎯',
        title: `ضخ الكاش (${fmtCompact(cashEgp)}) على ٣ دفعات عند الدعوم`,
        body: `سيولة جاهزة (${cp.toFixed(1)}%) أثناء خصم سِعري (${curDrawdownPct.toFixed(1)}% عن القمة).`,
        actionMetric: `${fmtCompact(tranche1)} ← ${fmtCompact(tranche2)} ← ${fmtCompact(tranche3)}`,
        tone: 'emerald',
      });
    } else {
      directives.push({
        id: 'ammo-optimal',
        badge: 'جاهزية مثالية ✅',
        title: `توازن ممتاز بين الأسهم (${(100 - cp).toFixed(0)}%) والكاش (${cp.toFixed(0)}%)`,
        body: `ذخيرة متاحة (${fmt(cashEgp)} ج.م) جاهزة لأي فرص سوقية.`,
        actionMetric: `النطاق الذهبي: ${fmtCompact(target15Total)} - ${fmtCompact(target20Total)}`,
        tone: 'emerald',
      });
    }

    // 2. قرار التفوق المقارن (Alpha)
    const curAlphaBank = (lastBench?.pTwr ?? 0) - (lastBench?.bankPct ?? 0);
    const curAlpha30 = (lastBench?.pTwr ?? 0) - (lastBench?.egx30Pct ?? 0);
    if (curAlphaBank < 0) {
      directives.push({
        id: 'alpha-lag',
        badge: 'كفاءة العائد 📊',
        title: `أقل من عائد البنك بـ ${Math.abs(curAlphaBank).toFixed(1)}% في هذه الفترة`,
        body: `عائدك ${fmtPct(lastBench?.pTwr ?? 0)} مقابل ${fmtPct(lastBench?.bankPct ?? 0)} للبنك — قلّص الأسهم البطيئة.`,
        actionMetric: `مقابل EGX30: ${fmtSigned(curAlpha30, 1)}%`,
        tone: 'amber',
      });
    } else {
      directives.push({
        id: 'alpha-lead',
        badge: 'تفوق Alpha 🏆',
        title: `متفوق على البنك بـ +${curAlphaBank.toFixed(1)}% وعلى المؤشر بـ ${fmtSigned(curAlpha30, 1)}%`,
        body: `عائد الفترة ${fmtPct(lastBench?.pTwr ?? 0)} بصافي ربح ${fmtSigned(lastBench?.pProfit ?? 0)} ج.م.`,
        actionMetric: `حافظ على جني جزء من الأرباح كاش`,
        tone: 'sky',
      });
    }

    // 3. قرار تركز المحافظ
    const topPort = portRows[0];
    if (topPort && portRows.length > 1) {
      directives.push({
        id: 'port-conc',
        badge: 'توزيع القوة ⚖️',
        title: `«${topPort.portfolio.name}» تقود بـ ${topPort.share.toFixed(0)}% من المال و${Math.max(0, topPort.profitShare).toFixed(0)}% من الربح`,
        body: `خصص داخلها درع كاش هجومي لا يقل عن ${fmtCompact(Math.round(topPort.stats.nav * 0.15))} ج.م (15%).`,
        actionMetric: `أقصى هبوط للقائد: ${topPort.stats.maxDD.toFixed(1)}%`,
        tone: 'sky',
      });
    }

    return {
      peakNav,
      curNav,
      gapFromPeakAmt,
      curDrawdownPct,
      isNearPeak,
      neededFor15,
      neededFor20,
      tranche1,
      tranche2,
      tranche3,
      directives,
    };
  }, [pts, lastPt, fullStats, cashAmmo, lastBench, period, bankRate, portRows]);

  // بيانات رادار الكفاءة الـ 5 أبعاد (Pentagon Radar)
  const radarData = useMemo(
    () => [
      { subject: 'العائد', score: healthScore.retScore, fullMark: 100 },
      { subject: 'التفوق Alpha', score: healthScore.alphaScore, fullMark: 100 },
      { subject: 'الأمان', score: healthScore.safetyScore, fullMark: 100 },
      { subject: 'الاتساق', score: healthScore.consistencyScore, fullMark: 100 },
      { subject: 'الكاش', score: healthScore.ammoScore, fullMark: 100 },
    ],
    [healthScore]
  );

  // بيانات مقارنة المحافظ الجرافيكية (Capital Share vs Profit Share)
  const portChartData = useMemo(
    () =>
      portRows.map(r => ({
        name: r.portfolio.name,
        capitalShare: Math.round(r.share),
        profitShare: Math.round(Math.max(0, r.profitShare)),
      })),
    [portRows]
  );
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

    const directivesHtml = tacticalAnalysis.directives
      .map(
        d => `
        <div class="kpi-box" style="border-right:4px solid ${
          d.tone === 'emerald' ? '#10b981' : d.tone === 'rose' ? '#e11d48' : d.tone === 'amber' ? '#f59e0b' : '#0284c7'
        };margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;font-weight:900;color:#0f172a;">${d.title}</span>
            <span style="font-size:10px;font-weight:900;color:#475569;background:#e2e8f0;padding:2px 8px;border-radius:8px;">${d.badge}</span>
          </div>
          <div style="font-size:11px;font-weight:600;color:#475569;margin-top:4px;">${d.body}</div>
          <div style="font-size:11px;font-weight:900;color:#059669;margin-top:4px;" dir="ltr">${d.actionMetric}</div>
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
            <div class="kpi-label">الذخيرة الهجومية (كاش متاح)</div>
            <div class="kpi-val" dir="ltr" style="color:#059669;">${fmt(cashAmmo.totalCash)} ج.م (${cashAmmo.cashPct.toFixed(1)}%)</div>
            <div class="kpi-sub">${cashAmmo.postureLabel} · المستثمر: ${fmt(cashAmmo.totalInvested)} ج.م</div>
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
          <div class="section-title">١. التوصيات التكتيكية وإدارة السيولة الهجومية</div>
          ${directivesHtml}
        </div>

        <div class="section">
          <div class="section-title">٢. مصفوفة المقارنة المرجعية عبر كل الفترات (محفظتك مقابل البنك و EGX30 و EGX70)</div>
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
          <div class="section-title">٣. كفاءة المحافظ وتوزيع القوة (Attribution Analysis)</div>
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
          <div class="section-title">٤. إسقاط الثروة المستقبلي المتوقع (بناءً على معدل النمو السنوي المركب ${projections.cagrRate.toFixed(1)}%)</div>
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

        {/* Modal Body — Visual-First Executive Graphical Dashboard */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Row 1: 5-Axis Radar Chart + Live Multi-Line Race Chart (Portfolio vs Bank vs EGX30/70) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* 1. Pentagon Health Radar Chart (4 cols) */}
            <div className="lg:col-span-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  رادار الكفاءة الشامل ({periodLabel})
                </span>
                <span dir="ltr" className="rounded-xl bg-emerald-500/15 px-2.5 py-0.5 text-sm font-black text-emerald-500 tabular-nums">
                  {healthScore.total}/100
                </span>
              </div>

              <div dir="ltr" className="h-48 -my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="52%" outerRadius="72%" data={radarData}>
                    <PolarGrid stroke="#94a3b8" strokeOpacity={0.22} />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                    />
                    <Radar
                      name="تقييم المحفظة"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="#10b981"
                      fillOpacity={0.28}
                    />
                    <Tooltip
                      content={
                        <ChartTip
                          rows={p => [{ name: String(p.subject ?? ''), value: `${p.score}%`, color: '#10b981' }]}
                        />
                      }
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* 5 Mini Score Pills */}
              <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-black pt-1 border-t border-slate-100 dark:border-slate-800">
                {[
                  { k: 'العائد', v: healthScore.retScore, c: 'text-emerald-500' },
                  { k: 'Alpha', v: healthScore.alphaScore, c: 'text-sky-500' },
                  { k: 'الأمان', v: healthScore.safetyScore, c: 'text-amber-500' },
                  { k: 'الاتساق', v: healthScore.consistencyScore, c: 'text-purple-500' },
                  { k: 'الكاش', v: healthScore.ammoScore, c: 'text-teal-500' },
                ].map(x => (
                  <div key={x.k} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 py-1">
                    <div className="text-[9px] text-slate-400">{x.k}</div>
                    <div dir="ltr" className={x.c}>{x.v}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Live Cumulative Performance Race Chart: Portfolio vs Bank vs EGX30 vs EGX70 (8 cols) */}
            <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    سباق العائد التراكمي الحي ({periodLabel}): محفظتك مقابل البنك ({bankRate}%) و EGX30 و EGX70
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black" dir="ltr">
                  <span className="rounded-lg bg-emerald-500/15 text-emerald-500 px-2 py-0.5">
                    محفظتك: {fmtPct(lastBench?.pTwr ?? 0)}
                  </span>
                  <span className="rounded-lg bg-amber-500/15 text-amber-500 px-2 py-0.5">
                    البنك: {fmtPct(lastBench?.bankPct ?? 0)}
                  </span>
                  <span className="rounded-lg bg-sky-500/15 text-sky-500 px-2 py-0.5">
                    EGX30: {fmtPct(lastBench?.egx30Pct ?? 0)}
                  </span>
                  <span className="rounded-lg bg-pink-500/15 text-pink-500 px-2 py-0.5">
                    EGX70: {fmtPct(lastBench?.egx70Pct ?? 0)}
                  </span>
                </div>
              </div>

              <div dir="ltr" className="h-44 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={benchSeries} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="advMyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={d => String(d).slice(5)}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                    />
                    <YAxis
                      orientation="right"
                      tickFormatter={v => `${Number(v).toFixed(0)}%`}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      width={42}
                    />
                    <Tooltip
                      content={
                        <ChartTip
                          rows={p => [
                            { name: 'محفظتك (TWR)', value: `${fmtPct(+p.pTwr)} (${fmtSigned(+p.pProfit)} ج.م)`, color: '#10b981' },
                            { name: `عائد البنك (${bankRate}%)`, value: `${fmtPct(+p.bankPct)} (${fmtSigned(+p.bankProfit)} ج.م)`, color: '#f59e0b' },
                            { name: 'مؤشر EGX30', value: `${fmtPct(+p.egx30Pct)} (${fmtSigned(+p.egx30Profit)} ج.م)`, color: '#0ea5e9' },
                            { name: 'مؤشر EGX70', value: `${fmtPct(+p.egx70Pct)} (${fmtSigned(+p.egx70Profit)} ج.م)`, color: '#ec4899' },
                          ]}
                        />
                      }
                    />
                    <Area type="monotone" dataKey="pTwr" stroke="#10b981" strokeWidth={2.6} fill="url(#advMyGrad)" dot={false} />
                    <Area type="monotone" dataKey="bankPct" stroke="#f59e0b" strokeWidth={1.8} strokeDasharray="4 4" fill="none" dot={false} />
                    <Area type="monotone" dataKey="egx30Pct" stroke="#0ea5e9" strokeWidth={1.8} fill="none" dot={false} />
                    <Area type="monotone" dataKey="egx70Pct" stroke="#ec4899" strokeWidth={1.5} strokeOpacity={0.85} fill="none" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Compact Executive KPI Strip under the Race Chart */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] font-black">
                <div className="rounded-xl bg-purple-500/[0.07] px-2.5 py-1.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-purple-500" />
                    رافعة الشراكة
                  </span>
                  <b dir="ltr" className="text-purple-600 dark:text-purple-400">
                    {leverage.multiplier.toFixed(2)}x (+{fmtCompact(leverage.extraLeverageGain)})
                  </b>
                </div>
                <div className="rounded-xl bg-emerald-500/[0.07] px-2.5 py-1.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">حزام أمان الشريك</span>
                  <b dir="ltr" className="text-emerald-500">
                    +{fmtCompact(leverage.bufferAmt)} ({leverage.coveragePct.toFixed(0)}%)
                  </b>
                </div>
                <div className="rounded-xl bg-amber-500/[0.07] px-2.5 py-1.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-amber-500" />
                    TWR مقابل ROI
                  </span>
                  <b dir="ltr" className={tone(timingSkill.diff)}>
                    {fmtPct(timingSkill.twr, 1)} / {fmtPct(timingSkill.roi, 1)}
                  </b>
                </div>
                <div className="rounded-xl bg-sky-500/[0.07] px-2.5 py-1.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">سرعة الربح</span>
                  <b dir="ltr" className={tone(fullStats.profit)}>
                    {fullStats.days >= 15 ? `${fmtSigned(Math.round((fullStats.profit / fullStats.days) * 30))}/شهر` : '—'}
                  </b>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Visual Tactical Cash Gauge + Concise Final Decisions (No Verbose Text) */}
          <div className="rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.05] via-white to-sky-500/[0.04] dark:from-emerald-500/[0.08] dark:via-slate-900 dark:to-sky-500/[0.06] p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <Crosshair className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  رادار السيولة الهجومية والقرارات التنفيذية الحاسمة
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {cashAmmo.byPortfolio.map(bp => (
                  <span
                    key={bp.portfolioId}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 px-2 py-0.5 text-[10px] font-black"
                  >
                    <i className="w-1.5 h-1.5 rounded-full" style={{ background: bp.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{bp.portfolioName}:</span>
                    <b dir="ltr" className={bp.cashAmount > 0 ? 'text-emerald-500' : 'text-slate-400'}>
                      {bp.cashAmount > 0 ? `${fmtCompact(bp.cashAmount)} (${bp.cashPct.toFixed(0)}%)` : '0 كاش'}
                    </b>
                  </span>
                ))}
                <span
                  className={cx(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-black border',
                    cashAmmo.posture === 'depleted'
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/25'
                      : cashAmmo.posture === 'defensive'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                      : cashAmmo.posture === 'optimal'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                      : 'bg-sky-500/10 text-sky-500 border-sky-500/25'
                  )}
                >
                  {cashAmmo.postureLabel}
                </span>
              </div>
            </div>

            {/* Visual Cash Ammo Bar + 3 Sniper Tranches in One Sleek Strip */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 p-3">
              <div className="lg:col-span-6 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                    <Banknote className="w-4 h-4 text-emerald-500" />
                    الذخيرة النقدية ({lensLabel}): <b dir="ltr" className="text-emerald-500">{fmt(cashAmmo.totalCash)} ج.م ({cashAmmo.cashPct.toFixed(1)}%)</b>
                  </span>
                  <span dir="ltr" className="text-[10px] text-slate-400">
                    الأسهم: {fmtCompact(cashAmmo.totalInvested)} ({(100 - cashAmmo.cashPct).toFixed(1)}%)
                  </span>
                </div>
                <div className="relative h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex" dir="ltr">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, cashAmmo.cashPct)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-amber-400 pointer-events-none"
                    style={{ left: '15%' }}
                    title="المنطقة الذهبية (15%)"
                  />
                </div>
              </div>

              <div className="lg:col-span-6">
                {cashAmmo.totalCash >= 5000 ? (
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black">
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-2">
                      <div className="text-slate-400">🎯 دفعة قنص 1 (40%)</div>
                      <div dir="ltr" className="text-xs text-emerald-500 mt-0.5">{fmt(tacticalAnalysis.tranche1)} ج.م</div>
                    </div>
                    <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 py-1.5 px-2">
                      <div className="text-slate-400">🎯 دفعة قنص 2 (35%)</div>
                      <div dir="ltr" className="text-xs text-sky-500 mt-0.5">{fmt(tacticalAnalysis.tranche2)} ج.م</div>
                    </div>
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 py-1.5 px-2">
                      <div className="text-slate-400">🛡️ احتياطي (25%)</div>
                      <div dir="ltr" className="text-xs text-amber-500 mt-0.5">{fmt(tacticalAnalysis.tranche3)} ج.م</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2 flex items-center justify-between text-xs font-black">
                    <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      المطلوب لبلوغ درع السيولة الهجومي (15% - 20%):
                    </span>
                    <b dir="ltr" className="text-slate-900 dark:text-white">
                      {fmt(cashAmmo.targetCash15Amt)} ← {fmt(cashAmmo.targetCash20Amt)} ج.م
                    </b>
                  </div>
                )}
              </div>
            </div>

            {/* 3 Concise Executive Decision Cards Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {tacticalAnalysis.directives.map(d => (
                <div
                  key={d.id}
                  className={cx(
                    'rounded-2xl border p-3 flex flex-col justify-between gap-1.5',
                    d.tone === 'emerald'
                      ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                      : d.tone === 'rose'
                      ? 'border-rose-500/30 bg-rose-500/[0.05]'
                      : d.tone === 'amber'
                      ? 'border-amber-500/30 bg-amber-500/[0.05]'
                      : 'border-sky-500/30 bg-sky-500/[0.04]'
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cx(
                        'rounded-lg px-2 py-0.5 text-[10px] font-black',
                        d.tone === 'emerald'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : d.tone === 'rose'
                          ? 'bg-rose-500/15 text-rose-500'
                          : d.tone === 'amber'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-sky-500/15 text-sky-500'
                      )}
                    >
                      {d.badge}
                    </span>
                    <span dir="ltr" className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      {d.actionMetric}
                    </span>
                  </div>
                  <div className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                    {d.title}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {d.body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Multi-Period Benchmark Matrix (1M · 3M · 6M · 1Y · All) */}
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

          {/* Row 4: Portfolio Attribution BarChart + 3-Year Wealth Projection Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Portfolio Efficiency & Contribution Visual Chart + Compact Pills */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  <Layers className="w-4 h-4 text-orange-500" />
                  كفاءة المحافظ: حصة رأس المال مقابل حصة الربح
                </span>
                <span className="text-[10px] font-bold text-slate-400">مقارنة جرافيكية</span>
              </div>

              <div dir="ltr" className="h-44 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 800 }} axisLine={false} tickLine={false} />
                    <YAxis orientation="right" tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={38} />
                    <Tooltip
                      content={
                        <ChartTip
                          rows={p => [
                            { name: 'حصة رأس المال', value: `${p.capitalShare}%`, color: '#6366f1' },
                            { name: 'حصة صناعة الربح', value: `${p.profitShare}%`, color: '#10b981' },
                          ]}
                        />
                      }
                    />
                    <Bar dataKey="capitalShare" name="حصة المال" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="profitShare" name="حصة الربح" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] font-black">
                {portRows.map((r, i) => (
                  <div key={r.portfolio.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1 truncate">
                      <i className="w-2 h-2 rounded-full shrink-0" style={{ background: r.portfolio.color }} />
                      <span className="truncate">{i === 0 ? '👑 ' : ''}{r.portfolio.name}</span>
                    </span>
                    <b dir="ltr" className={tone(r.stats.profit)}>{fmtCompact(r.stats.profit)}</b>
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
