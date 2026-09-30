const fs = require('fs');
const content = fs.readFileSync('ActiveTrades.tsx.bak', 'utf8');
if (content.includes('سجل صفقات السهم')) {
  console.log('Yes! سجل صفقات السهم is in the bak file!');
}
