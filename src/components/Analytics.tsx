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

export default function Analytics() {
  const { 
    positions, 
    capitalInvestment,
    totalOpenCapital,
    totalOpenRisk,
    openPositionsCount
  } = useTrades();
  const availableLiquidity = capitalInvestment - totalOpenCapital;
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'psychology'>('overview');

  // Closed positions metrics
  const closedPositions = useMemo(() => {
    return positions.filter(pos => {
      const metrics = computePositionMetrics(pos);
      return pos.status === 'closed' || metrics.isFullyClosed;
    });
  }, [positions]);

  const wonPositions = closedPositions.filter(p => computePositionMetrics(p).realizedPnL > 0);
  const lostPositions = closedPositions.filter(p => computePositionMetrics(p).realizedPnL < 0);

  const winRate = closedPositions.length > 0 
    ? ((wonPositions.length / closedPositions.length) * 100).toFixed(1) 
    : '0.0';

  const totalGrossPnL = closedPositions.reduce((sum, p) => sum + computePositionMetrics(p).realizedPnL, 0);
  const totalCommissionPaid = closedPositions.reduce((sum, p) => sum + computePositionMetrics(p).totalCommission, 0);
  const totalNetPnL = closedPositions.reduce((sum, p) => sum + computePositionMetrics(p).netRealizedPnL, 0);

  const totalGain = wonPositions.reduce((sum, p) => sum + computePositionMetrics(p).realizedPnL, 0);
  const totalLoss = lostPositions.reduce((sum, p) => sum + Math.abs(computePositionMetrics(p).realizedPnL), 0);

  const avgWin = wonPositions.length > 0 ? totalGain / wonPositions.length : 0;
  const avgLoss = lostPositions.length > 0 ? totalLoss / lostPositions.length : 0;
  const realRR = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : (avgWin > 0 ? '∞' : '0.00');

  const ruleBreakerCount = closedPositions.filter(p => p.journal?.isRuleBreaker).length;
  const disciplineScore = closedPositions.length > 0 ? Math.max(0, 100 - (ruleBreakerCount * 12)) : 100;

  // Emotion Performance Analysis
  const emotionStats = useMemo(() => {
    const stats: Record<string, { count: number; won: number; pnl: number }> = {
      confident: { count: 0, won: 0, pnl: 0 },
      neutral: { count: 0, won: 0, pnl: 0 },
      fomo: { count: 0, won: 0, pnl: 0 },
      fear: { count: 0, won: 0, pnl: 0 },
      greed: { count: 0, won: 0, pnl: 0 },
      revenge: { count: 0, won: 0, pnl: 0 },
    };

    closedPositions.forEach(p => {
      const em = p.journal?.emotion || 'neutral';
      const pnl = computePositionMetrics(p).realizedPnL;
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
  }, [closedPositions]);

  // Top Best and Worst Trades
  const bestTrade = useMemo(() => {
    if (closedPositions.length === 0) return null;
    const sorted = [...closedPositions].sort((a, b) => computePositionMetrics(b).realizedPnL - computePositionMetrics(a).realizedPnL);
    const top = sorted[0];
    const topPnL = computePositionMetrics(top).realizedPnL;
    return topPnL > 0 ? { pos: top, pnl: topPnL } : null;
  }, [closedPositions]);

  const worstTrade = useMemo(() => {
    if (closedPositions.length === 0) return null;
    const sorted = [...closedPositions].sort((a, b) => computePositionMetrics(a).realizedPnL - computePositionMetrics(b).realizedPnL);
    const worst = sorted[0];
    const worstPnL = computePositionMetrics(worst).realizedPnL;
    return worstPnL < 0 ? { pos: worst, pnl: worstPnL } : null;
  }, [closedPositions]);

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
          التحليل النفسي والمذكرات
        </button>
      </div>

      {/* TAB 1: OVERVIEW & EQUITY CURVE */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Core Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                <Percent className="w-5 h-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">نسبة النجاح (Win Rate)</p>
              <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono-num mt-1" dir="ltr">{winRate}%</h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">{wonPositions.length} رابحة من {closedPositions.length}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">العائد الفعلي للمخاطرة</p>
              <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono-num mt-1" dir="ltr">1 : {realRR}</h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">متوسط الربح / متوسط الخسارة</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${totalNetPnL >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                {totalNetPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">صافي الأرباح (بعد العمولات)</p>
              <h3 className={`text-2xl font-black font-mono-num mt-1 ${totalNetPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
                {totalNetPnL > 0 ? '+' : ''}{formatEGP(totalNetPnL)}
              </h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                العمولات: {formatEGP(totalCommissionPaid)} | الإجمالي: {formatEGP(totalGrossPnL)}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">مؤشر الانضباط النفسي</p>
              <h3 className={`text-2xl font-black font-mono-num mt-1 ${disciplineScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} dir="ltr">
                {disciplineScore} / 100
              </h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">{ruleBreakerCount} صفقات استثنائية</span>
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
                  {formatEGP(totalOpenCapital)}
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">{openPositionsCount} مراكز مفتوحة</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">المخاطرة المفتوحة</span>
                  <div className="p-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-red-600 dark:text-red-400 font-mono-num" dir="ltr">
                  {formatEGP(totalOpenRisk)}
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
                          className={`h-full rounded-full transition-all ${item.pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} 
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
                    <span className="font-mono-num font-black text-lg text-emerald-700 dark:text-emerald-400" dir="ltr">
                      +{formatEGP(bestTrade.pnl)}
                    </span>
                  )}
                </div>
                {bestTrade ? (
                  <div>
                    <span className="text-xl font-black text-emerald-950 dark:text-emerald-200 font-mono-num" dir="ltr">
                      {bestTrade.pos.symbol}
                    </span>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                      الاستراتيجية: {bestTrade.pos.plan?.strategy || 'تمركز ناجح'}
                    </p>
                    {bestTrade.pos.journal?.lessonLearned && (
                      <p className="font-handwriting text-xs text-emerald-600 dark:text-emerald-400 mt-1">
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
                    <span className="font-mono-num font-black text-lg text-red-700 dark:text-red-400" dir="ltr">
                      {formatEGP(worstTrade.pnl)}
                    </span>
                  )}
                </div>
                {worstTrade ? (
                  <div>
                    <span className="text-xl font-black text-red-950 dark:text-red-200 font-mono-num" dir="ltr">
                      {worstTrade.pos.symbol}
                    </span>
                    <p className="text-xs text-red-700 dark:text-red-400 font-bold mt-1">
                      السبب أو الخطأ: {worstTrade.pos.journal?.mistake || 'ضرب وقف الخسارة'}
                    </p>
                    {worstTrade.pos.journal?.lessonLearned && (
                      <p className="font-handwriting text-xs text-red-600 dark:text-red-400 mt-1">
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
              {closedPositions.filter(p => p.journal?.lessonLearned).slice(-6).reverse().map((p, idx) => (
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

              {closedPositions.filter(p => p.journal?.lessonLearned).length === 0 && (
                <p className="font-handwriting text-lg text-slate-400 col-span-2 text-center py-6">
                  لم تسجل أي دروس بعد.. عند إغلاق كل صفقة، دوّن ما تعلمته للمستقبل!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
