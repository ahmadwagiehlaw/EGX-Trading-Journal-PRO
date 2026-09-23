import { useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { formatEGP } from '../utils/calculations';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  Trash2,
  Plus,
  Landmark,
  PiggyBank
} from 'lucide-react';

export default function CashLedger() {
  const { ledger, addLedgerEntry, deleteLedgerEntry, depositedInvestment, fixedIncome } = useTrades();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<'deposit' | 'withdrawal' | 'fixed_income_buy' | 'fixed_income_sell'>('deposit');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedLedger = [...ledger]
    .filter(e => e.portfolioType === 'investment') // We only care about investment portfolio for now as it's the main one
    .sort((a, b) => b.date - a.date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    
    setIsSubmitting(true);
    try {
      await addLedgerEntry({
        type,
        amount: Number(amount),
        portfolioType: 'investment',
        date: Date.now(),
        note: note.trim() || undefined
      });
      setAmount('');
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">سجل الخزينة ورأس المال</h2>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            تتبع عمليات الإيداع، السحب، وربط الشهادات وصناديق الدخل الثابت.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الإيداعات (الكاش المتوفر للتداول)</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">
              {formatEGP(depositedInvestment, 0)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
            <PiggyBank className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">رصيد صناديق الدخل الثابت المجنب</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">
              {formatEGP(fixedIncome, 0)}
            </p>
          </div>
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
                className={`py-3 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 transition-all border ${
                  type === 'deposit' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <ArrowDownLeft className="w-5 h-5" />
                إيداع نقدي
              </button>
              
              <button
                type="button"
                onClick={() => setType('withdrawal')}
                className={`py-3 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 transition-all border ${
                  type === 'withdrawal' 
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <ArrowUpRight className="w-5 h-5" />
                سحب نقدي
              </button>
              
              <button
                type="button"
                onClick={() => setType('fixed_income_buy')}
                className={`py-3 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 transition-all border ${
                  type === 'fixed_income_buy' 
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
                className={`py-3 rounded-2xl text-xs font-black flex flex-col items-center gap-1.5 transition-all border ${
                  type === 'fixed_income_sell' 
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <TrendingDown className="w-5 h-5" />
                استرداد شهادات
              </button>
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
                placeholder="مثال: إيداع بنكي، شراء وثائق..."
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
                    <th className="py-4 px-4 text-left">المبلغ</th>
                    <th className="py-4 px-4">التاريخ</th>
                    <th className="py-4 px-4">ملاحظات</th>
                    <th className="py-4 px-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {sortedLedger.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                        لا توجد حركات مسجلة في الخزينة بعد.
                      </td>
                    </tr>
                  ) : (
                    sortedLedger.map((entry) => {
                      const isAddition = entry.type === 'deposit' || entry.type === 'fixed_income_sell';
                      const isWithdrawal = entry.type === 'withdrawal' || entry.type === 'fixed_income_buy';
                      
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-5">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border inline-flex items-center gap-1.5 ${
                              entry.type === 'deposit' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                                : entry.type === 'withdrawal'
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
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
                          <td className="py-3.5 px-4 text-left font-mono-num font-black" dir="ltr">
                            <span className={
                              isAddition ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
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
