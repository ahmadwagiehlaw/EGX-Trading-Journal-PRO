const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const sIdx = code.indexOf('const generateInsights');
const eIdx = code.indexOf('return insights;', sIdx) + 20;
console.log(code.slice(sIdx, eIdx));
