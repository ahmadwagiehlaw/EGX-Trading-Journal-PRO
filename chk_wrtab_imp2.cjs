const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');
const lines = code.split('\n');
for (let i = 0; i < 10; i++) console.log(lines[i]);
