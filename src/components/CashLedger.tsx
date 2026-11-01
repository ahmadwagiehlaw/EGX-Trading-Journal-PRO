import { useState, useMemo } from 'react';
import { useTrades } from '../context/TradeContext';
import { formatEGP, computePositionMetrics } from '../utils/calculations';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Trash2,
  Plus,
  Landmark,
  PiggyBank,
  Coins,
  BadgeDollarSign,
  PieChart,
  ArrowRightLeft
} from 'lucide-react';

export default function CashLedger() {
  const {
    ledger,
    addLedgerEntry,
    deleteLedgerEntry,
    depositedInvestment,
    depositedSpeculation,
    fixedIncome,
    positions,
    commissionRate,
    portfolioFilter,
    setPortfolioFilter
  } = useTrades();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<'deposit' | 'withdrawal' | 'fixed_income_buy' | 'fixed_income_sell'>('deposit');
  const [entryPortfolio, setEntryPortfolio] = useState<'investment' | 'speculation'>('investment');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Portfolio Filter View (all | investment | speculation)
  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'investment' | 'speculation'>(
    portfolioFilter || 'investment'
  );

  // Financial Pillars Calculations based on selected Tab
  const { netPrincipal, profitBank, openInvestedCost, liveMarketValue, totalUnrealizedPnL, targetFixedIncome } = useMemo(() => {
    let cost = 0;
    let mv = 0;
    let uPnL = 0;

    const filteredPositions = positions.filter(p => {
      if (activeLedgerTab === 'all') return p.status === 'active';
      return p.portfolioType === activeLedgerTab && p.status === 'active';
    });

    filteredPositions.forEach(p => {
      const m = computePositionMetrics(p, commissionRate);
      cost += m.openInvested;
      mv += m.openShares * m.currentPrice;
      uPnL += m.netUnrealizedPnL;
    });

    // Net Principal
    let principal = 0;
    if (activeLedgerTab === 'investment') principal = depositedInvestment;
    else if (activeLedgerTab === 'speculation') principal = depositedSpeculation;
    else principal = depositedInvestment + depositedSpeculation;

    // Realized Profit
    let realizedProfit = 0;
    positions.forEach(p => {
      if (activeLedgerTab === 'all' || p.portfolioType === activeLedgerTab) {
        const m = computePositionMetrics(p, commissionRate);
        realizedProfit += m.netRealizedPnL;
      }
    });

    const fi = activeLedgerTab === 'speculation' ? 0 : fixedIncome;

    return {
      netPrincipal: principal,
      profitBank: realizedProfit,
      openInvestedCost: cost,
      liveMarketValue: mv,
      totalUnrealizedPnL: uPnL,
      targetFixedIncome: fi
    };
  }, [positions, commissionRate, activeLedgerTab, depositedInvestment, depositedSpeculation, fixedIncome]);

  // Free Trading Cash = (Deposited + Realized Profits) - Fixed Income - Open Invested Cost
  const freeTradingCash = Math.max(0, (netPrincipal + profitBank) - targetFixedIncome - openInvestedCost);

  // Total Portfolio NAV = Free Trading Cash + Fixed Income + Live Stock Market Value
  const totalPortfolioNAV = freeTradingCash + targetFixedIncome + liveMarketValue;

  const sortedLedger = [...ledger]
    .filter(e => {
      if (activeLedgerTab === 'all') return true;
      return e.portfolioType === activeLedgerTab;
    })
    .sort((a, b) => b.date - a.date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await addLedgerEntry({
        type,
        amount: Number(amount),
        portfolioType: entryPortfolio,
        date: Date.now(),
        note: note.trim() || undefined
      });
      setAmount('');
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Action for Reinvesting / Moving to Fixed Income
  const handleQuickHarvestToFixedIncome = () => {
    if (profitBank <= 0) return;
    setType('fixed_income_buy');
    setEntryPortfolio('investment');
    setAmount(Math.floor(profitBank).toString());
    setNote('تأمين وتجنيب أرباح محققة في شهادات دخل ثابت');
  };

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header & Portfolio Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">المركز المالي وإدارة الخزينة</h2>
            </div>
            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              تتبع وفصل أموال المنصات (ثاندر الاستثمارية، مباشر للمضاربة، وسيولة هيرميس والدخل الثابت).
            </p>
          </div>
        </div>

        {/* Portfolio Filter Selector */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setActiveLedgerTab('all'); setPortfolioFilter('all'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${activeLedgerTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              الكل
            </button>
            <button
              onClick={() => { setActiveLedgerTab('investment'); setPortfolioFilter('investment'); setEntryPortfolio('investment'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${activeLedgerTab === 'investment'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              استثمار (ثاندر)
            </button>
            <button
              onClick={() => { setActiveLedgerTab('speculation'); setPortfolioFilter('speculation'); setEntryPortfolio('speculation'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${activeLedgerTab === 'speculation'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              مضاربة (مباشر)
            </button>
          </div>

          {profitBank > 0 && activeLedgerTab !== 'speculation' && (
            <button
              onClick={handleQuickHarvestToFixedIncome}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-black text-xs shadow-sm shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
              title="تجنيب الأرباح لشهادات"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              تجنيب ({formatEGP(profitBank, 0)})
            </button>
          )}
        </div>
      </div>

      {/* 4 Financial Pillars Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Pillar 1: Net Principal Deposited */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400">١. أصل رأس المال المودع</span>
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">
              {formatEGP(netPrincipal, 0)}
            </p>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              (صافي الإيداعات - المسحوبات)
            </p>
          </div>
        </div>

        {/* Pillar 2: Realized Profit Bank */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400">٢. بنك الأرباح المحققة المجنية</span>
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className={`text-2xl font-black font-mono-num ${profitBank >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
              {profitBank >= 0 ? '+' : ''}{formatEGP(profitBank, 0)}
            </p>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              أرباح التخارجات الجزئية والكوبونات
            </p>
          </div>
        </div>

        {/* Pillar 3: Total NAV (Live Equity) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400">٣. القيمة السوقية للمحفظة (NAV)</span>
            <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">
              {formatEGP(totalPortfolioNAV, 0)}
            </p>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              متأثرة بالصعود/الهبوط غير المحقق ({totalUnrealizedPnL >= 0 ? '+' : ''}{formatEGP(totalUnrealizedPnL, 0)})
            </p>
          </div>
        </div>

        {/* Pillar 4: Free Cash */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">٤. كاش الاقتناص الحر المتاح</span>
            <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono-num" dir="ltr">
              {formatEGP(freeTradingCash, 0)}
            </p>
            <p className="text-[11px] font-bold text-indigo-500/80 dark:text-indigo-400/80 mt-1">
              جاهز لاقتناص الفرص فوراً
            </p>
          </div>
        </div>

      </div>

      {/* Sub-Banner for Fixed Income & Locked Stock Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">رصيد صناديق الدخل الثابت والشهادات</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">
                {formatEGP(fixedIncome, 0)}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            مجنب ومحمي
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">تكلفة الأسهم النشطة المفتوحة</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">
                {formatEGP(openInvestedCost, 0)}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            سوق الأسهم
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ADD FORM */}
        <div className="xl:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5 sticky top-24">
            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Plus className="w-5 h-5 text-indigo-500" />
              إضافة حركة جديدة
            </h3>

            {/* Type Selector (Toggles) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('deposit')}
                className={`py-3 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 transition-all border ${type === 'deposit'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-500 border-emerald-200 dark:border-emerald-800 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
              >
                <ArrowDownLeft className="w-5 h-5" />
                إيداع نقدي
              </button>

              <button
                type="button"
                onClick={() => setType('withdrawal')}
                className={`py-3 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 transition-all border ${type === 'withdrawal'
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-500 border-rose-200 dark:border-rose-800 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
              >
                <ArrowUpRight className="w-5 h-5" />
                سحب نقدي
              </button>

              <button
                type="button"
                onClick={() => setType('fixed_income_buy')}
                className={`py-3 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 transition-all border ${type === 'fixed_income_buy'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
              >
                <TrendingUp className="w-5 h-5" />
                شراء شهادات
              </button>

              <button
                type="button"
                onClick={() => setType('fixed_income_sell')}
                className={`py-3 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 transition-all border ${type === 'fixed_income_sell'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
              >
                <TrendingDown className="w-5 h-5" />
                استرداد شهادات
              </button>
            </div>

            {/* Target Portfolio Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">المنصة / نوع المحفظة المستهدفة</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEntryPortfolio('investment')}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${entryPortfolio === 'investment'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                  استثمار (ثاندر)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryPortfolio('speculation')}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${entryPortfolio === 'speculation'
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                  مضاربة (مباشر)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">المبلغ (EGP)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono-num font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-left"
                dir="ltr"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">ملاحظات (اختياري)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="مثال: إيداع بنكي ثاندر، كاش هيرميس..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !amount}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'جاري الإضافة...' : 'تأكيد وحفظ الحركة'}
            </button>
          </form>
        </div>

        {/* LEDGER TABLE */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-black text-[11px]">
                  <tr>
                    <th className="py-4 px-5">نوع الحركة</th>
                    <th className="py-4 px-3">المحفظة</th>
                    <th className="py-4 px-4 text-left">المبلغ</th>
                    <th className="py-4 px-4">التاريخ</th>
                    <th className="py-4 px-4">ملاحظات</th>
                    <th className="py-4 px-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {sortedLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                        لا توجد حركات مسجلة في الخزينة بعد.
                      </td>
                    </tr>
                  ) : (
                    sortedLedger.map((entry) => {
                      const isAddition = entry.type === 'deposit' || entry.type === 'fixed_income_sell';

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-5">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border inline-flex items-center gap-1.5 ${entry.type === 'deposit'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-500 border-emerald-200 dark:border-emerald-800'
                                : entry.type === 'withdrawal'
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-500 border-rose-200 dark:border-rose-800'
                                  : entry.type === 'fixed_income_buy'
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              }`}>
                              {entry.type === 'deposit' && <ArrowDownLeft className="w-3.5 h-3.5" />}
                              {entry.type === 'withdrawal' && <ArrowUpRight className="w-3.5 h-3.5" />}
                              {entry.type === 'fixed_income_buy' && <TrendingUp className="w-3.5 h-3.5" />}
                              {entry.type === 'fixed_income_sell' && <TrendingDown className="w-3.5 h-3.5" />}

                              {entry.type === 'deposit' ? 'إيداع نقدي' :
                                entry.type === 'withdrawal' ? 'سحب نقدي' :
                                  entry.type === 'fixed_income_buy' ? 'شراء دخل ثابت' : 'استرداد دخل ثابت'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${entry.portfolioType === 'speculation'
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              }`}>
                              {entry.portfolioType === 'speculation' ? 'مضاربة' : 'استثمار'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-left font-mono-num font-black" dir="ltr">
                            <span className={
                              isAddition ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'
                            }>
                              {isAddition ? '+' : '-'}{formatEGP(entry.amount)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {new Date(entry.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono-num" dir="ltr">
                                {new Date(entry.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-bold">
                            {entry.note || <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {deleteConfirmId === entry.id ? (
                              <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/50 p-1 rounded-xl border border-red-200 dark:border-red-800">
                                <button
                                  onClick={() => { deleteLedgerEntry(entry.id); setDeleteConfirmId(null); }}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-lg transition-colors"
                                >
                                  تأكيد
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(entry.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
