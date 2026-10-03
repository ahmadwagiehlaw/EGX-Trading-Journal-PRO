const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const lines = code.split('\n');
let str = '';
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('Left Column')) str += `Line ${i}: ${lines[i]}\n`;
   if (lines[i].includes('Right Column')) str += `Line ${i}: ${lines[i]}\n`;
   if (lines[i].includes('Header / Ticker Summary')) str += `Line ${i}: ${lines[i]}\n`;
   if (lines[i].includes('Trailing Stop Engine')) str += `Line ${i}: ${lines[i]}\n`;
   if (lines[i].includes('Live TradingView Chart')) str += `Line ${i}: ${lines[i]}\n`;
   if (lines[i].includes('Transactions History')) str += `Line ${i}: ${lines[i]}\n`;
   if (lines[i].includes('Partial Transaction Modal')) str += `Line ${i}: ${lines[i]}\n`;
}
console.log(str);
