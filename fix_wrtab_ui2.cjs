const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

const targetStr = "{review.tradesCount} صفقة";
const newStr = `إغلاق {review.tradesCount} | فتح {(review as any).openedCount || 0}`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
console.log("Updated counts in WeeklyReviewTab");
