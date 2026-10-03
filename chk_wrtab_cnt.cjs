const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

const tIdx = code.indexOf('review.tradesCount');
console.log(code.slice(tIdx - 100, tIdx + 100));
