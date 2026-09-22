import { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Activity, 
  BookOpen, 
  Target, 
  Flame, 
  Plus, 
  ArrowUpRight,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { useTrades, type TickerPosition } from '../context/TradeContext';
import { computePositionMetrics, formatEGP } from '../utils/calculations';
import TransactionFormModal from './TransactionFormModal';

export default function Dashboard({ 
  onOpenTradingDesk,
  onNavigate 
}: { 
  onOpenTradingDesk?: (symbol?: string) => void;
  onNavigate?: (tab: string) => void;
}) {
  const { 
    capitalInvestment, 
    positions, 
    plans,
    totalRealizedPnL,
    winRate,
    openPositionsCount,
    totalOpenCapital,
    totalOpenRisk,
    disciplineScore,
  } = useTrades();

  const [selectedPosForTx, setSelectedPosForTx] = useState<{ pos: TickerPosition; type: 'buy' | 'sell' } | null>(null);

  // Active positions
  const activePositions = positions.filter(p => {
    const metrics = computePositionMetrics(p);
    return p.status === 'active' && metrics.openShares > 0;
  });

  // Ready plans
  const readyPlans = plans.filter(p => p.status === 'ready');
  const recentPlans = [...plans].slice(0, 4);

  // Purchasing power (Total capital minus open invested capital)
  const availableLiquidity = Math.max(0, capitalInvestment - totalOpenCapital);

  return (
    <div className="w-full space-y-6" dir="rtl">
      
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

      {/* Top 6 Global Computed KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* 1. Available Liquidity */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">السيولة المتاحة</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">
            {formatEGP(availableLiquidity)}
          </h3>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">من إجمالي {formatEGP(capitalInvestment)}</span>
        </div>

        {/* 2. Open Invested Capital */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">السيولة المقيدة</span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg md:text-xl font-black text-purple-700 dark:text-purple-400 font-mono-num" dir="ltr">
            {formatEGP(totalOpenCapital)}
          </h3>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">{openPositionsCount} مراكز مفتوحة</span>
        </div>

        {/* 3. Open Risk at Stop Loss */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">المخاطرة المفتوحة</span>
            <div className="p-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg md:text-xl font-black text-red-600 dark:text-red-400 font-mono-num" dir="ltr">
            {formatEGP(totalOpenRisk)}
          </h3>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">عند نقاط الوقف</span>
        </div>

        {/* 4. Realized P&L */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">الأرباح المحققة</span>
            <div className={`p-1.5 rounded-lg ${totalRealizedPnL >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'}`}>
              {totalRealizedPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <h3 className={`text-lg md:text-xl font-black font-mono-num ${totalRealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
            {totalRealizedPnL > 0 ? '+' : ''}{formatEGP(totalRealizedPnL)}
          </h3>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">من الصفقات المغلقة</span>
        </div>

        {/* 5. Win Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">نسبة النجاح</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg md:text-xl font-black text-blue-700 dark:text-blue-400 font-mono-num" dir="ltr">
            {winRate.toFixed(1)}%
          </h3>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">معدل الفوز</span>
        </div>

        {/* 6. Discipline Score */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">مؤشر الانضباط</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-lg md:text-xl font-black font-mono-num ${disciplineScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} dir="ltr">
            {disciplineScore}/100
          </h3>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">الالتزام بالقواعد</span>
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
                      className="p-4 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm transition-all space-y-3"
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

    </div>
  );
}
