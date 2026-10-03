const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');
console.log(code.indexOf('Edit2'));
console.log(code.indexOf('<Edit2'));
