const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

console.log(code.includes('Edit2'));
console.log(code.includes('formatEGP'));
console.log(code.indexOf('font-handwriting'));
