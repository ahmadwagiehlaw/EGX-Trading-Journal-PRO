const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const tIdx = code.indexOf('<WeeklyReviewModal');
console.log(code.slice(tIdx - 100, tIdx + 200));
