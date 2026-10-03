const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');
const lines = code.split('\n');

for (let i = lines.length - 30; i < lines.length; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
