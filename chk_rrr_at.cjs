const fs = require('fs');
const at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const rrrIdx = at.indexOf("متوسط سعر الدخول");
console.log(at.slice(rrrIdx - 200, rrrIdx + 200));
