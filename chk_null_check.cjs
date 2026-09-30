const fs = require('fs');
let content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('if (!position || !metrics) return null;')) console.log(i, l);
});
