const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
if (content.includes('سجل صفقات السهم')) {
  console.log('YES! Restored correctly!');
} else {
  console.log('Failed to restore properly.');
}
