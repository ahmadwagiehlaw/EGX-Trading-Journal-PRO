import { useState } from 'react';
import { X, Landmark, Clock, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useTrades } from '../context/TradeContext';
import { formatEGP } from '../utils/calculations';

export default function LedgerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { ledger, addLedgerEntry, deleteLedgerEntry, depositedInvestment, depositedSpeculation } = useTrades();
  
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [portfolio, setPortfolio] = useState<'investment' | 'speculation'>('investment');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    setIsSubmitting(true);
    try {
      await addLedgerEntry({
        type,
        portfolioType: portfolio,
        amount: val,
        date: Date.now(),
        note: note.trim()
      });
      setAmount('');
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white">سجل الخزينة (السحب والإيداع)</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">إدارة رأس المال المودع الفعلي</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-center">
              <p className="text-xs font-black text-blue-600 dark:text-blue-400 mb-1">صافي إيداعات الاستثمار</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">{formatEGP(depositedInvestment, 0)}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30 text-center">
              <p className="text-xs font-black text-purple-600 dark:text-purple-400 mb-1">صافي إيداعات المضاربة</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">{formatEGP(depositedSpeculation, 0)}</p>
            </div>
          </div>

          {/* Add New Entry Form */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">تسجيل حركة جديدة</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('deposit')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    type === 'deposit' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ArrowDownToLine className="w-4 h-4" /> إيداع
                </button>
                <button
                  type="button"
                  onClick={() => setType('withdrawal')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    type === 'withdrawal' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ArrowUpFromLine className="w-4 h-4" /> سحب
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">المبلغ (EGP)</label>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">المحفظة</label>
                  <select
                    value={portfolio}
                    onChange={(e: any) => setPortfolio(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="investment">محفظة الاستثمار</option>
                    <option value="speculation">محفظة المضاربة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">ملاحظات (اختياري)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="سبب السحب أو الإيداع..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !amount}
                className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'تسجيل الحركة الماليـة'}
              </button>
            </form>
          </div>

          {/* Ledger History */}
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              سجل الحركات السابقة
            </h3>
            <div className="space-y-2">
              {ledger.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm font-bold border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  لا توجد حركات سحب أو إيداع مسجلة بعد.
                </div>
              ) : (
                ledger.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${entry.type === 'deposit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                        {entry.type === 'deposit' ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800 dark:text-white">
                            {entry.type === 'deposit' ? 'إيداع' : 'سحب'}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                            {entry.portfolioType === 'investment' ? 'استثمار' : 'مضاربة'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">
                          {new Date(entry.date).toLocaleDateString('ar-EG')} {entry.note && `- ${entry.note}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-black font-mono-num ${entry.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
                        {entry.type === 'deposit' ? '+' : '-'}{formatEGP(entry.amount, 0)}
                      </span>
                      <button onClick={() => deleteLedgerEntry(entry.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
