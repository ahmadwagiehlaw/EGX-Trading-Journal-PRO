const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

const targetStr = "<span>{review.tradesCount} صفقة</span>";
const newStr = `<span>فتح: {(review as any).openedCount || 0}</span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span>إغلاق: {review.tradesCount}</span>`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newStr);
    fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
    console.log("Updated WeeklyReviewTab UI for counts");
} else {
    console.log("Could not find targetStr in WeeklyReviewTab");
}
