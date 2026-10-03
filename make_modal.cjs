const fs = require('fs');

const modalContent = `import { useState, useMemo, useEffect } from 'react';
import { X, CheckCircle, AlertOctagon, Target, Calendar } from 'lucide-react';
import { useTrades } from '../context/TradeContext';
import { computePositionMetrics, formatEGP } from '../utils/calculations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeeklyReviewModal({ isOpen, onClose }: Props) {
  const { addWeeklyReview, positions, commissionRate } = useTrades();

  // Initialize dates: Today and 7 days ago
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [focusNextWeek, setFocusNextWeek] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setEndDate(new Date().toISOString().split('T')[0]);
      setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setWhatWentWell('');
      setWhatWentWrong('');
      setFocusNextWeek('');
    }
  }, [isOpen]);

  // Auto-calculate stats for the selected date range
  const currentStats = useMemo(() => {
    const startTime = new Date(startDate).getTime();
    // End time includes the whole day
    const endTime = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
    
    // Find positions closed in this date range
    const recentClosed = positions.filter(p => {
      if (p.status !== 'closed') return false;
      const lastTx = p.transactions && p.transactions.length > 0 ? [...p.transactions].sort((a,b)=>b.date - a.date)[0] : null;
      if (!lastTx) return false;
      return lastTx.date >= startTime && lastTx.date <= endTime;
    });

    let pnl = 0;
    let won = 0;
    
    recentClosed.forEach(p => {
      const metrics = computePositionMetrics(p, commissionRate);
      pnl += metrics.netRealizedPnL;
      if (metrics.netRealizedPnL > 0) won++;
    });

    return {
      tradesCount: recentClosed.length,
      pnl,
      winRate: recentClosed.length > 0 ? (won / recentClosed.length) * 100 : 0
    };
  }, [positions, commissionRate, startDate, endDate]);

  const handleSave = () => {
    if (!whatWentWell || !whatWentWrong || !focusNextWeek) {
      alert('يرجى تعبئة جميع حقول التأمل الذاتي!');
      return;
    }
    
    addWeeklyReview({
      weekStartDate: new Date(startDate).getTime(),
      weekEndDate: new Date(endDate).getTime(),
      pnl: currentStats.pnl,
      winRate: currentStats.winRate,
      tradesCount: currentStats.tradesCount,
      whatWentWell,
      whatWentWrong,
      focusNextWeek
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-900/20">
          <div>
            <h2 className="text-lg font-black text-indigo-900 dark:text-indigo-300">مُحرر المراجعة والتقييم</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">راجع أداءك بموضوعية، وتعلم من أخطائك.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Date Picker */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
             <div className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300">
               <Calendar className="w-5 h-5 text-indigo-500" />
               حدد فترة المراجعة:
             </div>
             <div className="flex items-center gap-3">
               <div className="flex flex-col">
                 <label className="text-[10px] font-bold text-slate-500 mb-1">من تاريخ</label>
                 <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-500" />
               </div>
               <div className="flex flex-col">
                 <label className="text-[10px] font-bold text-slate-500 mb-1">إلى تاريخ</label>
                 <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-500" />
               </div>
             </div>
          </div>

          {/* Auto Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500">صفقات أغلقت في الفترة</span>
              <div className="text-xl font-black text-slate-800 dark:text-white font-mono-num">{currentStats.tradesCount}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500">صافي الربح / الخسارة</span>
              <div className={\`text-xl font-black font-mono-num \${currentStats.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}\`} dir="ltr">
                {currentStats.pnl > 0 ? '+' : ''}{formatEGP(currentStats.pnl)}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500">نسبة الصفقات الرابحة</span>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono-num" dir="ltr">
                {currentStats.winRate.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400 mb-2">
                <CheckCircle className="w-4 h-4" /> ما الذي قمت به بشكل صحيح في هذه الفترة؟ (نقاط القوة)
              </label>
              <textarea 
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 min-h-[90px]"
                placeholder="مثال: التزمت بوقف الخسارة تماماً، ولم أطارد الأسهم المرتفعة..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-black text-rose-700 dark:text-rose-400 mb-2">
                <AlertOctagon className="w-4 h-4" /> ما هي الأخطاء التي وقعت فيها؟ (التحديات)
              </label>
              <textarea 
                value={whatWentWrong}
                onChange={(e) => setWhatWentWrong(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 min-h-[90px]"
                placeholder="مثال: بعت إحدى الصفقات الرابحة مبكراً بسبب الخوف، وضيعت ربحاً كبيراً..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-black text-blue-700 dark:text-blue-400 mb-2">
                <Target className="w-4 h-4" /> ما هو تركيزي وهدفي للمرحلة القادمة؟
              </label>
              <textarea 
                value={focusNextWeek}
                onChange={(e) => setFocusNextWeek(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-h-[90px]"
                placeholder="مثال: التركيز على قطاع البنوك، وعدم الدخول إلا بشروط القائمة (Score >= 8)..."
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-black text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            إلغاء
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl font-black text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
          >
            حفظ المراجعة
          </button>
        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/WeeklyReviewModal.tsx', modalContent, 'utf8');
console.log('Created WeeklyReviewModal');
