const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewModal.tsx', 'utf8');

const startIdx = code.indexOf('const handleSave = () => {');
const endIdx = code.indexOf('};', startIdx) + 2;

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
      openedCount: currentStats.openedCount,
      closedCount: currentStats.closedCount,
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

code = code.slice(0, startIdx) + newHandleSave + code.slice(endIdx);
fs.writeFileSync('src/components/WeeklyReviewModal.tsx', code, 'utf8');
console.log("Fixed handleSave");
