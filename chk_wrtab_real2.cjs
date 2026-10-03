const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

const tIdx = code.indexOf('weeklyReviews.map');
console.log(code.slice(tIdx + 1200, tIdx + 2000));
