const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewModal.tsx', 'utf8');
const sIdx = code.indexOf('const computeWeekStats');
console.log(code.slice(sIdx, sIdx + 1000));
