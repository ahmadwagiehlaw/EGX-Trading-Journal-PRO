const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes('if (!position || !metrics) return null;')) console.log(i, l);
  if (l.includes('export default function')) console.log(i, l);
});
