const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

const tIdx = code.indexOf('setReviewToEdit(review)');
console.log(code.slice(tIdx - 400, tIdx + 400));
