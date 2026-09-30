const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('Trailing Stop Adjustment Input'));

let end = start;
// find the matching closing brace/div
// looking for the end of the conditional {metrics.isOpen && ( ... )}
// It should be followed by `{/* Chart / Ledger toggle */}`
while (end < lines.length && !lines[end].includes('{/* Chart / Ledger toggle */}')) {
  end++;
}

console.log('Removing lines from', start, 'to', end - 1);
lines.splice(start - 1, end - start + 1); // remove the comment and the block

fs.writeFileSync('src/components/ActiveTrades.tsx', lines.join('\n'), 'utf8');
console.log('Removed blue box');
