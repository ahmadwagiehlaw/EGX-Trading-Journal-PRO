const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

if (!code.includes('updateWeeklyReview')) {
    const sIdx = code.indexOf('const deleteWeeklyReview');
    const updateFunc = `  const updateWeeklyReview = async (id: string, data: Partial<WeeklyReview>) => {
    await updateDoc(doc(db, getPath('weekly_reviews'), id), data);
  };\n\n`;
    code = code.slice(0, sIdx) + updateFunc + code.slice(sIdx);
    
    // add to contextValue
    const cvIdx = code.indexOf('deleteWeeklyReview,');
    code = code.slice(0, cvIdx) + 'updateWeeklyReview,\n    ' + code.slice(cvIdx);
    
    // add to TradeContextType
    const tyIdx = code.indexOf('deleteWeeklyReview: (id: string) => Promise<void>;');
    code = code.slice(0, tyIdx) + 'updateWeeklyReview: (id: string, data: Partial<WeeklyReview>) => Promise<void>;\n  ' + code.slice(tyIdx);
    
    fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
    console.log("Added updateWeeklyReview to TradeContext");
} else {
    console.log("updateWeeklyReview already exists");
}
