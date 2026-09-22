import { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Activity,
  BookOpen,
  Target,
  Flame, 
  Layers,
  Edit2,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useTrades, type TickerPosition } from '../context/TradeContext';
import { computePositionMetrics, formatEGP } from '../utils/calculations';
import TransactionFormModal from './TransactionFormModal';
import LedgerModal from './LedgerModal';
import FixedIncomeModal from './FixedIncomeModal';

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
    totalOpenCapital,
    totalOpenRisk,
    depositedInvestment,
    fixedIncome,
  } = useTrades();

  const [selectedPosForTx, setSelectedPosForTx] = useState<{ pos: TickerPosition; type: 'buy' | 'sell' } | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isFixedIncomeModalOpen, setIsFixedIncomeModalOpen] = useState(false);

  // Active positions
  const activePositions = positions.filter(p => {
    const metrics = computePositionMetrics(p);
    return p.status === 'active' && metrics.openShares > 0;
  });

  // Closed positions for Equity Curve
  const closedPositions = positions.filter(p => {
    const metrics = computePositionMetrics(p);
    return p.status === 'closed' || metrics.isFullyClosed;
  });

  // Equity Curve Timeline Data
  const equityData = closedPositions.sort((a, b) => {
    const dateA = a.journal?.closedDate || a.journal?.openedDate || 0;
    const dateB = b.journal?.closedDate || b.journal?.openedDate || 0;
    return dateA - dateB;
  }).reduce((acc, p, idx) => {
    const pnl = computePositionMetrics(p).netRealizedPnL;
    const currentEquity = idx === 0 ? depositedInvestment + pnl : acc[idx - 1].equity + pnl;
    acc.push({
      trade: p.symbol || `#${idx + 1}`,
      equity: currentEquity,
      pnl,
    });
    return acc;
  }, [] as { trade: string; equity: number; pnl: number }[]);

  if (equityData.length === 0) {
    equityData.push({ trade: 'بداية', equity: depositedInvestment, pnl: 0 });
  }

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

      {/* Capital & Ledger Banner */}
      <div className="bg-slate-900 rounded-2xl p-4 md:p-5 shadow-sm text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-bold mb-0.5">القيمة السوقية للمحفظة الاستثمارية (Equity)</span>
            <span className="text-xl md:text-2xl font-black font-mono-num tracking-tight">
              {formatEGP(capitalInvestment)}
            </span>
            <span className="text-emerald-400 text-[10px] font-bold mt-1 bg-emerald-400/10 px-2 py-0.5 rounded-md inline-block w-fit">
              منها {formatEGP(depositedInvestment, 0)} رأس مال مودع
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsLedgerOpen(true)}
          className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
        >
          <Activity className="w-4 h-4" />
          سجل السحب والإيداع
        </button>
      </div>

      {/* Visual Portfolio Health (Replaces old hollow numbers) */}
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
                  <span className="text-slate-600 dark:text-slate-400" dir="ltr">{formatEGP(Math.max(0, availableLiquidity))}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (Math.max(0, availableLiquidity) / (capitalInvestment || 1)) * 100)}%` }}></div>
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
                  <span className="text-slate-600 dark:text-slate-400" dir="ltr">{formatEGP(fixedIncome)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (fixedIncome / (capitalInvestment || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-purple-600">السيولة المقيدة (أسهم)</span>
                  <span className="text-slate-600 dark:text-slate-400" dir="ltr">{formatEGP(totalOpenCapital)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (totalOpenCapital / (capitalInvestment || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-rose-600">المخاطرة المفتوحة (At Risk)</span>
                  <span className="text-slate-600 dark:text-slate-400" dir="ltr">{formatEGP(totalOpenRisk)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (totalOpenRisk / (capitalInvestment || 1)) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Equity Curve */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[280px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-black text-slate-800 dark:text-white">منحنى نمو رأس المال (Equity)</h3>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquityDashboard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="trade" hide />
                <YAxis 
                  domain={['dataMin', 'dataMax']} 
                  hide 
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  formatter={(value: any) => [formatEGP(Number(value) || 0, 0), 'القيمة السوقية']}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorEquityDashboard)" 
                />
              </AreaChart>
            </ResponsiveContainer>
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
