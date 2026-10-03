const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
console.log("Has Core UI:", code.includes('كمية الكور (Core)'));
console.log("Has AI UI:", code.includes('المستشار الذكي (AI)'));
