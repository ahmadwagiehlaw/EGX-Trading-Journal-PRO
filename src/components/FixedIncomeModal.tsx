import { useState, useEffect } from 'react';
import { X, Landmark } from 'lucide-react';
import { useTrades } from '../context/TradeContext';

export default function FixedIncomeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { fixedIncome, updateFixedIncome } = useTrades();
  const [amount, setAmount] = useState(fixedIncome.toString());

  useEffect(() => {
    if (isOpen) {
      setAmount(fixedIncome.toString());
    }
  }, [isOpen, fixedIncome]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount >= 0) {
      updateFixedIncome(parsedAmount);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-cairo" dir="rtl">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">صناديق الدخل الثابت</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">تحديد المبلغ المجنب خارج الأسهم</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              المبلغ الإجمالي في الدخل الثابت (EGP)
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white font-black text-lg focus:border-amber-500 outline-none transition-colors"
                placeholder="0"
                dir="ltr"
                min="0"
                step="0.01"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">EGP</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
              هذا المبلغ سيتم خصمه من السيولة المتاحة (الكاش الحر) ولن يُحسب ضمن السيولة الجاهزة للتداول في الأسهم.
            </p>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-black text-sm transition-all transform active:scale-[0.98] shadow-md shadow-amber-500/20"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
