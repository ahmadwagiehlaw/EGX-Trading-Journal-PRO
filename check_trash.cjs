const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
if (content.includes('Trash2')) {
  console.log('Trash2 found!');
}
