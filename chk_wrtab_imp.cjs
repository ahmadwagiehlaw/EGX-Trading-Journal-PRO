const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

const tIdx = code.indexOf('import {');
console.log(code.slice(tIdx, tIdx + 300));
