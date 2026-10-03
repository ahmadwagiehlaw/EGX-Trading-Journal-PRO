const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

const tIdx = code.indexOf('Trash2');
console.log(code.slice(tIdx - 400, tIdx + 400));
