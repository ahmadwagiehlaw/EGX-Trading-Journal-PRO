const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewModal.tsx', 'utf8');

// Replace props
code = code.replace("interface Props {\n  isOpen: boolean;\n  onClose: () => void;\n}", "interface Props {\n  isOpen: boolean;\n  onClose: () => void;\n  reviewToEdit?: import('../context/TradeContext').WeeklyReview | null;\n}");

code = code.replace("export default function WeeklyReviewModal({ isOpen, onClose }: Props) {", "export default function WeeklyReviewModal({ isOpen, onClose, reviewToEdit }: Props) {");

// Add updateWeeklyReview to useTrades
code = code.replace("const { addWeeklyReview, positions, commissionRate } = useTrades();", "const { addWeeklyReview, updateWeeklyReview, positions, commissionRate } = useTrades();");

// Update useEffect for initializing
const oldUseEffect = `  useEffect(() => {
    if (isOpen) {
      setEndDate(new Date().toISOString().split('T')[0]);
      setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setWhatWentWell('');
      setWhatWentWrong('');
      setFocusNextWeek('');
    }
  }, [isOpen]);`;

const newUseEffect = `  useEffect(() => {
    if (isOpen) {
      if (reviewToEdit) {
        setStartDate(new Date(reviewToEdit.weekStartDate).toISOString().split('T')[0]);
        setEndDate(new Date(reviewToEdit.weekEndDate).toISOString().split('T')[0]);
        setWhatWentWell(reviewToEdit.whatWentWell);
        setWhatWentWrong(reviewToEdit.whatWentWrong);
        setFocusNextWeek(reviewToEdit.focusNextWeek);
      } else {
        setEndDate(new Date().toISOString().split('T')[0]);
        setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setWhatWentWell('');
        setWhatWentWrong('');
        setFocusNextWeek('');
      }
    }
  }, [isOpen, reviewToEdit]);`;

code = code.replace(oldUseEffect, newUseEffect);

// Fix currentStats to calculate active/closed properly
const oldStats = `    // Find positions closed in this date range
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
    };`;

const newStats = `    // Find positions with any transactions in this date range
    let realizedPnL = 0;
    let won = 0;
    let closedCount = 0;
    let openedCount = 0;

    positions.forEach(p => {
      const metrics = computePositionMetrics(p, commissionRate);
      const txsInPeriod = (p.transactions || []).filter(t => t.date >= startTime && t.date <= endTime);
      
      if (txsInPeriod.length > 0) {
        // If the very first buy was in this period
        const firstTx = [...(p.transactions||[])].sort((a,b)=>a.date-b.date)[0];
        if (firstTx && firstTx.date >= startTime && firstTx.date <= endTime) openedCount++;
        
        // If the position was fully closed in this period
        if (p.status === 'closed' && p.journal?.closedDate && p.journal.closedDate >= startTime && p.journal.closedDate <= endTime) {
          closedCount++;
          realizedPnL += metrics.netRealizedPnL;
          if (metrics.netRealizedPnL > 0) won++;
        }
      }
    });

    // If editing, use the historical saved stats unless they want to recalculate
    if (reviewToEdit && reviewToEdit.weekStartDate === startTime && reviewToEdit.weekEndDate === endTime) {
      return {
        tradesCount: reviewToEdit.tradesCount, // legacy
        openedCount,
        closedCount,
        pnl: reviewToEdit.pnl,
        winRate: reviewToEdit.winRate
      };
    }

    return {
      tradesCount: closedCount, // backward compatibility
      openedCount,
      closedCount,
      pnl: realizedPnL,
      winRate: closedCount > 0 ? (won / closedCount) * 100 : 0
    };`;

code = code.replace(oldStats, newStats);

// Update handleSave
const oldHandleSave = `  const handleSave = () => {
    if (!whatWentWell || !whatWentWrong || !focusNextWeek) {
      alert('يرجى تعبئة جميع حقول التأمل الذاتي!');
      return;
    }
    
    addWeeklyReview({
      weekStartDate: new Date(startDate).getTime(),
      weekEndDate: new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1),
      pnl: currentStats.pnl,
      winRate: currentStats.winRate,
      tradesCount: currentStats.tradesCount,
      whatWentWell,
      whatWentWrong,
      focusNextWeek,
    });
    
    onClose();
  };`;

const newHandleSave = `  const handleSave = () => {
    if (!whatWentWell || !whatWentWrong || !focusNextWeek) {
      alert('يرجى تعبئة جميع حقول التأمل الذاتي!');
      return;
    }
    
    const payload = {
      weekStartDate: new Date(startDate).getTime(),
      weekEndDate: new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1),
      pnl: currentStats.pnl,
      winRate: currentStats.winRate,
      tradesCount: currentStats.closedCount,
      whatWentWell,
      whatWentWrong,
      focusNextWeek,
    };

    if (reviewToEdit) {
      updateWeeklyReview(reviewToEdit.id, payload);
    } else {
      addWeeklyReview(payload);
    }
    
    onClose();
  };`;

code = code.replace(oldHandleSave, newHandleSave);

// Update UI title and button
code = code.replace("<h2>مراجعة نهاية الأسبوع</h2>", "<h2>{reviewToEdit ? 'تعديل المراجعة الأسبوعية' : 'مراجعة نهاية الأسبوع'}</h2>");
code = code.replace(">حفظ المراجعة</button>", ">{reviewToEdit ? 'حفظ التعديلات' : 'حفظ المراجعة'}</button>");

// Add openedCount to UI
const uiOldStats = `<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex gap-6 justify-center">`;
const uiNewStats = `<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-wrap gap-6 justify-center text-center">
            <div>
              <p className="text-[10px] text-slate-500 font-bold mb-1">تم فتح</p>
              <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-sm">{(currentStats as any).openedCount || 0} صفقات</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold mb-1">تم إغلاق</p>
              <span className="font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-sm">{currentStats.tradesCount} صفقات</span>
            </div>`;

code = code.replace(uiOldStats + "\n            <div className=\"flex items-center gap-2 font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm\">", uiNewStats);
// Delete old tradesCount div
code = code.replace(`            <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm">
              <span>{currentStats.tradesCount} صفقة</span>
            </div>`, ``);


fs.writeFileSync('src/components/WeeklyReviewModal.tsx', code, 'utf8');
console.log("Updated WeeklyReviewModal");
