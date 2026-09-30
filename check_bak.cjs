const fs = require('fs');
const content = fs.readFileSync('ActiveTrades.tsx.bak', 'utf8');
if (content.includes('خسائر عائمة')) {
  console.log('Found in bak file');
}
