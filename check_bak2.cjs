const fs = require('fs');
const content = fs.readFileSync('ActiveTrades.tsx.bak', 'utf8');
if (content.includes('تحديث يدوي')) {
  console.log('Yes! تحديث يدوي in bak');
}
