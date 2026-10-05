import { useState, useMemo } from 'react';
// Recharts removed from Analytics
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  BrainCircuit, 
  Wallet,
  Activity,
  ShieldAlert,
  Award,
  AlertOctagon,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { useTrades } from '../context/TradeContext';
import { computePositionMetrics, formatEGP } from '../utils/calculations';
import PnLCalendar from './PnLCalendar';
import WeeklyReviewTab from './WeeklyReviewTab';

export default function Analytics() {
  const { 
        positions, 
    filteredPositions,
    activeCapital,
    activeOpenCapital,
    activeOpenRisk,
    openPositionsCount,
    commissionRate,
    profitFactor,
    maxDrawdown
  } = useTrades();
  const availableLiquidity = activeCapital - activeOpenCapital;
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'psychology' | 'playbook' | 'positions' | 'weekly_review'>('overview');

  // Closed positions metrics
  const positionsWithRealizedPnL = useMemo(() => {
    return filteredPositions.filter(pos => {
      const metrics = computePositionMetrics(pos, commissionRate);
      return pos.status === 'closed' || metrics.isFullyClosed || metrics.netRealizedPnL !== 0;
    });
  }, [positions, commissionRate]);

  // Strategy Playbook Analysis
  const strategyStats = useMemo(() => {
    const stats: Record<string, { count: number; won: number; pnl: number }> = {};
    positionsWithRealizedPnL.forEach(p => {
      const strategy = p.plan?.strategy || 'بدون استراتيجية';
      const pnl = computePositionMetrics(p, commissionRate).netRealizedPnL;
      if (!stats[strategy]) stats[strategy] = { count: 0, won: 0, pnl: 0 };
      stats[strategy].count += 1;
      stats[strategy].pnl += pnl;
      if (pnl > 0) stats[strategy].won += 1;
    });

    return Object.keys(stats).map(key => ({
      strategy: key,
      count: stats[key].count,
      pnl: stats[key].pnl,
      winRate: stats[key].count > 0 ? (stats[key].won / stats[key].count) * 100 : 0,
    })).sort((a, b) => b.pnl - a.pnl);
  }, [positionsWithRealizedPnL, commissionRate]);

  const wonPositions = filteredPositions.filter(p => computePositionMetrics(p, commissionRate).netRealizedPnL > 0);
  const lostPositions = filteredPositions.filter(p => computePositionMetrics(p, commissionRate).netRealizedPnL < 0);

  const winRate = positionsWithRealizedPnL.length > 0 
    ? ((wonPositions.length / positionsWithRealizedPnL.length) * 100).toFixed(1) 
    : '0.0';

  const totalGrossPnL = filteredPositions.reduce((sum, p) => sum + computePositionMetrics(p, commissionRate).realizedPnL, 0);
  const totalCommissionPaid = filteredPositions.reduce((sum, p) => sum + computePositionMetrics(p, commissionRate).totalCommission, 0);
  const totalNetPnL = filteredPositions.reduce((sum, p) => sum + computePositionMetrics(p, commissionRate).netRealizedPnL, 0);

  const totalGain = wonPositions.reduce((sum, p) => sum + computePositionMetrics(p, commissionRate).netRealizedPnL, 0);
  const totalLoss = lostPositions.reduce((sum, p) => sum + Math.abs(computePositionMetrics(p, commissionRate).netRealizedPnL), 0);

  const avgWin = wonPositions.length > 0 ? totalGain / wonPositions.length : 0;
  const avgLoss = lostPositions.length > 0 ? totalLoss / lostPositions.length : 0;
  const realRR = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : (avgWin > 0 ? '∞' : '0.00');
  const expectancy = ((parseFloat(winRate) / 100) * avgWin) - ((1 - (parseFloat(winRate) / 100)) * avgLoss);

  const ruleBreakerCount = positionsWithRealizedPnL.filter(p => p.journal?.isRuleBreaker).length;
  const disciplineScore = positionsWithRealizedPnL.length > 0 ? Math.max(0, 100 - (ruleBreakerCount * 12)) : 100;

  // Emotion Performance Analysis
  const behavioralDeviations = useMemo(() => {
    let costOfHope = 0;
    let costOfFear = 0;
    let disciplinedCount = 0;
    let totalAnalyzed = 0;

    positionsWithRealizedPnL.forEach(p => {
      const metrics = computePositionMetrics(p, commissionRate);
      const plan = p.plan;
      if (!plan || !metrics.isFullyClosed) return;
      
      totalAnalyzed++;
      let disciplined = true;

      // Extra loss from ignoring stop loss
      if (metrics.netRealizedPnL < 0 && plan.stop && plan.stop > 0) {
        if (metrics.avgExit < plan.stop) {
          disciplined = false;
          costOfHope += ((plan.stop - metrics.avgExit) * metrics.totalSold);
        }
      }
      
      // Early exit from winning trades
      if (metrics.netRealizedPnL > 0 && plan.target && plan.target > 0) {
        // We only consider it early exit if they missed out significantly (e.g. at least 1% below target)
        if (metrics.avgExit < (plan.target * 0.99)) {
          disciplined = false;
          costOfFear += ((plan.target - metrics.avgExit) * metrics.totalSold);
        }
      }
      
      if (disciplined) disciplinedCount++;
    });

    return {
      costOfHope,
      costOfFear,
      disciplinedCount,
      totalAnalyzed,
      disciplineRate: totalAnalyzed > 0 ? (disciplinedCount / totalAnalyzed) * 100 : 0
    };
  }, [positionsWithRealizedPnL, commissionRate]);

  const emotionStats = useMemo(() => {
    const stats: Record<string, { count: number; won: number; pnl: number }> = {
      confident: { count: 0, won: 0, pnl: 0 },
      neutral: { count: 0, won: 0, pnl: 0 },
      fomo: { count: 0, won: 0, pnl: 0 },
      fear: { count: 0, won: 0, pnl: 0 },
      greed: { count: 0, won: 0, pnl: 0 },
      revenge: { count: 0, won: 0, pnl: 0 },
    };

    positionsWithRealizedPnL.forEach(p => {
      const em = p.journal?.emotion || 'neutral';
      const pnl = computePositionMetrics(p, commissionRate).netRealizedPnL;
      if (!stats[em]) stats[em] = { count: 0, won: 0, pnl: 0 };
      stats[em].count += 1;
      stats[em].pnl += pnl;
      if (pnl > 0) stats[em].won += 1;
    });

    const labels: Record<string, string> = {
      confident: 'واثق ومنضبط 😎',
      neutral: 'طبيعي ومحايد 😐',
      fomo: 'فومو وخوف ضياع الفرصة 😰',
      fear: 'خوف وتردد 😨',
      greed: 'طمع وتأخير جني الربح 🤑',
      revenge: 'انتقام وتداول عاطفي 😡',
    };

    return Object.keys(stats).map(key => ({
      key,
      label: labels[key] || key,
      count: stats[key].count,
      pnl: stats[key].pnl,
      winRate: stats[key].count > 0 ? (stats[key].won / stats[key].count) * 100 : 0,
    })).filter(s => s.count > 0);
  }, [positionsWithRealizedPnL, commissionRate]);

  // Top Best and Worst Trades
  const bestTrade = useMemo(() => {
    if (positionsWithRealizedPnL.length === 0) return null;
    const sorted = [...positionsWithRealizedPnL].sort((a, b) => computePositionMetrics(b, commissionRate).netRealizedPnL - computePositionMetrics(a, commissionRate).netRealizedPnL);
    const top = sorted[0];
    const topPnL = computePositionMetrics(top, commissionRate).netRealizedPnL;
    return topPnL > 0 ? { pos: top, pnl: topPnL } : null;
  }, [positionsWithRealizedPnL, commissionRate]);

  const worstTrade = useMemo(() => {
    if (positionsWithRealizedPnL.length === 0) return null;
    const sorted = [...positionsWithRealizedPnL].sort((a, b) => computePositionMetrics(a, commissionRate).netRealizedPnL - computePositionMetrics(b, commissionRate).netRealizedPnL);
    const worst = sorted[0];
    const worstPnL = computePositionMetrics(worst, commissionRate).netRealizedPnL;
    return worstPnL < 0 ? { pos: worst, pnl: worstPnL } : null;
  }, [positionsWithRealizedPnL, commissionRate]);

  return (
    <div className="w-full space-y-6" dir="rtl">
      
      {/* Sub-Navigation Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          نظرة عامة ومنحنى الأداء
        </button>

        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'calendar'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          تقويم الأرباح الشهري (P&L Heatmap)
        </button>

        <button
          onClick={() => setActiveSubTab('psychology')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'psychology'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          التحليل النفسي
        </button>

        <button
          onClick={() => setActiveSubTab('playbook')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'playbook'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          أداء الاستراتيجيات (Playbook)
        </button>

        <button
          onClick={() => setActiveSubTab('weekly_review')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'weekly_review'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          مراجعة نهاية الأسبوع (Weekly Review)
        </button>
      </div>

      {/* TAB 1: OVERVIEW & EQUITY CURVE */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* 6 Core Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                <Percent className="w-5 h-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">نسبة النجاح (Win Rate)</p>
              <h3 className="text-xl font-black text-blue-700 dark:text-blue-400 font-mono-num mt-1" dir="ltr">{winRate}%</h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">{wonPositions.length} من {positionsWithRealizedPnL.length} صفقات</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${expectancy > 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-500'}`}>
                <Target className="w-5 h-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">توقع الربح (Expectancy)</p>
              <h3 className={`text-xl font-black font-mono-num mt-1 ${expectancy > 0 ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-700 dark:text-red-500'}`} dir="ltr">{expectancy > 0 ? '+' : ''}{expectancy.toFixed(2)}</h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5" title={`Real RR: 1:${realRR}`}>م. الربح - م. الخسارة للمتوسط</span>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${profitFactor >= 2 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500' : profitFactor >= 1 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-500'}`}>
                <Activity className="w-5 h-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">معامل الربح (Profit Factor)</p>
              <h3 className={`text-xl font-black font-mono-num mt-1 ${profitFactor >= 2 ? 'text-emerald-600 dark:text-emerald-500' : profitFactor >= 1 ? 'text-amber-600 dark:text-amber-500' : 'text-red-600 dark:text-red-500'}`} dir="ltr">
                {profitFactor > 90 ? 'بلا خسارة' : profitFactor.toFixed(2)}
              </h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">إجمالي الأرباح / إجمالي الخسائر</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${totalNetPnL >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-500'}`}>
                {totalNetPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">صافي الأرباح المحققة</p>
              <h3 className={`text-xl font-black font-mono-num mt-1 ${totalNetPnL >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`} dir="ltr">
                {totalNetPnL > 0 ? '+' : ''}{formatEGP(totalNetPnL)}
              </h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5" title={`العمولات: ${formatEGP(totalCommissionPaid)} | الإجمالي: ${formatEGP(totalGrossPnL)}`}>
                صافي بعد العمولات
              </span>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${maxDrawdown <= 10 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500' : maxDrawdown <= 20 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-500'}`}>
                <TrendingDown className="w-5 h-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">أقصى تراجع (Max DD)</p>
              <h3 className={`text-xl font-black font-mono-num mt-1 ${maxDrawdown <= 10 ? 'text-emerald-600 dark:text-emerald-500' : maxDrawdown <= 20 ? 'text-amber-600 dark:text-amber-500' : 'text-red-600 dark:text-red-500'}`} dir="ltr">
                {maxDrawdown.toFixed(1)}%
              </h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">من أعلى قمة للمحفظة</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">مؤشر الانضباط</p>
              <h3 className={`text-xl font-black font-mono-num mt-1 ${disciplineScore >= 80 ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-400'}`} dir="ltr">
                {disciplineScore}/100
              </h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">{ruleBreakerCount} صفقات مخالفة</span>
            </div>

          </div>

          {/* Active Portfolio Health (Moved from Dashboard) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 mt-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">السيولة والمخاطرة الحالية</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">السيولة المتاحة</span>
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">
                  {formatEGP(availableLiquidity)}
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">جاهزة للتداول</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">السيولة المقيدة</span>
                  <div className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-purple-700 dark:text-purple-400 font-mono-num" dir="ltr">
                  {formatEGP(activeOpenCapital)}
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">{openPositionsCount} مراكز مفتوحة</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">المخاطرة المفتوحة</span>
                  <div className="p-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-500 rounded-lg">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-red-600 dark:text-red-500 font-mono-num" dir="ltr">
                  {formatEGP(activeOpenRisk)}
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">عند نقاط الوقف الحالية</span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PNL CALENDAR */}
      {activeSubTab === 'calendar' && (
        <PnLCalendar />
      )}

      {/* TAB 3: PSYCHOLOGY & LESSONS */}
      {activeSubTab === 'psychology' && (
        <div className="space-y-6">
          
          {/* Behavioral Deviations (Cost of Emotions) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-indigo-600" />
              التحليل السلوكي وتكلفة المشاعر (Process vs Outcome)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30 flex flex-col justify-center">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">تكلفة التمسك بالأمل (Cost of Hope)</span>
                <span className="text-xl font-black text-red-700 dark:text-red-300 font-mono-num" dir="ltr">
                  -{formatEGP(behavioralDeviations.costOfHope)}
                </span>
                <p className="text-[10px] text-red-500 mt-2 font-medium">خسائر إضافية نتيجة عدم الالتزام بوقف الخسارة المحدد في الخطة.</p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex flex-col justify-center">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">تكلفة الخوف (Cost of Fear)</span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono-num" dir="ltr">
                  -{formatEGP(behavioralDeviations.costOfFear)}
                </span>
                <p className="text-[10px] text-amber-500 mt-2 font-medium">أرباح ضائعة نتيجة الخروج المبكر وجني الربح قبل الهدف المحدد.</p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">نسبة الانضباط (Discipline Rate)</span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono-num">
                  {behavioralDeviations.disciplineRate.toFixed(0)}%
                </span>
                <p className="text-[10px] text-emerald-600 mt-2 font-medium">
                  التزام تام بالخطة في {behavioralDeviations.disciplinedCount} من أصل {behavioralDeviations.totalAnalyzed} صفقة تم إغلاقها.
                </p>
              </div>

            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Emotion vs Win Rate Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-600" />
                تأثير الحالة النفسية على الأداء
              </h3>

              {emotionStats.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold py-8 text-center">
                  لم تسجل حالات نفسية كافية في الصفقات المغلقة بعد.
                </p>
              ) : (
                <div className="space-y-3">
                  {emotionStats.map((item) => (
                    <div key={item.key} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-800 dark:text-white">{item.label}</span>
                        <span className={`font-mono-num font-black ${item.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
                          {item.pnl > 0 ? '+' : ''}{formatEGP(item.pnl)} ({item.winRate.toFixed(0)}% Win)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${item.pnl >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`} 
                          style={{ width: `${Math.max(5, item.winRate)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Best Trade & Worst Trade Cards */}
            <div className="space-y-4">
              
              {/* Best Trade */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                    <Award className="w-5 h-5 text-emerald-600" />
                    أفضل صفقة منفذة (Best Winner)
                  </div>
                  {bestTrade && (
                    <span className="font-mono-num font-black text-lg text-emerald-700 dark:text-emerald-500" dir="ltr">
                      +{formatEGP(bestTrade.pnl)}
                    </span>
                  )}
                </div>
                {bestTrade ? (
                  <div>
                    <span className="text-xl font-black text-emerald-950 dark:text-emerald-200 font-mono-num" dir="ltr">
                      {bestTrade.pos.symbol}
                    </span>
                    <p className="text-xs text-emerald-700 dark:text-emerald-500 font-bold mt-1">
                      الاستراتيجية: {bestTrade.pos.plan?.strategy || 'تمركز ناجح'}
                    </p>
                    {bestTrade.pos.journal?.lessonLearned && (
                      <p className="font-handwriting text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                        "{bestTrade.pos.journal.lessonLearned}"
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-bold">لا توجد صفقات رابحة مغلقة بعد.</p>
                )}
              </div>

              {/* Worst Trade */}
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-black text-sm">
                    <AlertOctagon className="w-5 h-5 text-red-600" />
                    أكبر خسارة للتعلم منها (Worst Loser)
                  </div>
                  {worstTrade && (
                    <span className="font-mono-num font-black text-lg text-red-700 dark:text-red-500" dir="ltr">
                      {formatEGP(worstTrade.pnl)}
                    </span>
                  )}
                </div>
                {worstTrade ? (
                  <div>
                    <span className="text-xl font-black text-red-950 dark:text-red-200 font-mono-num" dir="ltr">
                      {worstTrade.pos.symbol}
                    </span>
                    <p className="text-xs text-red-700 dark:text-red-500 font-bold mt-1">
                      السبب أو الخطأ: {worstTrade.pos.journal?.mistake || 'ضرب وقف الخسارة'}
                    </p>
                    {worstTrade.pos.journal?.lessonLearned && (
                      <p className="font-handwriting text-xs text-red-600 dark:text-red-500 mt-1">
                        "{worstTrade.pos.journal.lessonLearned}"
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-red-600 font-bold">لا توجد صفقات خاسرة مسجلة.</p>
                )}
              </div>

            </div>

          </div>

          {/* Notebook Lessons Learned Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-handwriting text-2xl text-blue-800 dark:text-blue-400 mb-4 font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              مذكرات ودروس التداول التراكمية 📝
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {positionsWithRealizedPnL.filter(p => p.journal?.lessonLearned).slice(-6).reverse().map((p, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                    <span className="text-blue-600 dark:text-blue-400 font-black font-mono-num" dir="ltr">{p.symbol}</span>
                    <span>{p.journal?.openedDate ? new Date(p.journal.openedDate).toLocaleDateString('ar-EG') : ''}</span>
                  </div>
                  <p className="font-handwriting text-base text-slate-800 dark:text-slate-200 leading-relaxed font-bold">
                    "{p.journal?.lessonLearned}"
                  </p>
                </div>
              ))}

              {positionsWithRealizedPnL.filter(p => p.journal?.lessonLearned).length === 0 && (
                <p className="font-handwriting text-lg text-slate-400 col-span-2 text-center py-6">
                  لم تسجل أي دروس بعد.. عند إغلاق كل صفقة، دوّن ما تعلمته للمستقبل!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STRATEGY PLAYBOOK */}
      {activeSubTab === 'playbook' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-blue-600" />
              سجل أداء الاستراتيجيات (Playbook)
            </h3>
            
            {strategyStats.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-8 text-center">
                لم تسجل استراتيجيات كافية في الصفقات المغلقة بعد.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-black text-[11px]">
                    <tr>
                      <th className="py-3 px-4">الاستراتيجية</th>
                      <th className="py-3 px-3 text-center">عدد الصفقات</th>
                      <th className="py-3 px-3 text-center">نسبة النجاح</th>
                      <th className="py-3 px-3 text-left">صافي الربح / الخسارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {strategyStats.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                          {item.strategy}
                        </td>
                        <td className="py-3 px-3 text-center font-mono-num text-slate-700 dark:text-slate-300">
                          {item.count}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono-num font-black" dir="ltr">{item.winRate.toFixed(1)}%</span>
                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${item.winRate > 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${item.winRate}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-left font-mono-num font-black" dir="ltr">
                          <span className={`${item.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                            {item.pnl > 0 ? '+' : ''}{formatEGP(item.pnl)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: WEEKLY REVIEW */}
      {activeSubTab === 'weekly_review' && (
        <WeeklyReviewTab />
      )}
    </div>
  );
}
