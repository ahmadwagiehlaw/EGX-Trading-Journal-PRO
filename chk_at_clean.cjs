const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

console.log(code.includes('كمية الكور (Core)'));
console.log(code.includes('المستشار الذكي (AI)'));
