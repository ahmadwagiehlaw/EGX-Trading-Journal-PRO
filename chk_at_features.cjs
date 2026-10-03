const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

console.log("Includes AI Insights? ", code.includes('AI Insights'));
console.log("Includes handleSaveCoreShares? ", code.includes('handleSaveCoreShares'));
console.log("Includes coreStats? ", code.includes('coreStats'));
