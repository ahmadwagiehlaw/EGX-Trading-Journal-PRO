const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('Trailing Stop Adjustment Input'));
let end = idx;
while (end < lines.length && !lines[end].includes('({metrics.isOpen && (')) {
  end++;
  if (lines[end].includes('قاعدة ستيف بيرنز #30')) {
    end += 3;
    break;
  }
}
console.log('Blue box starts at', idx, 'ends at', end);
console.log(lines.slice(idx - 2, end + 2).join('\n'));
