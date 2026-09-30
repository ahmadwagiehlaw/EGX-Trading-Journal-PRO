const fs = require('fs');
let content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
if (content.startsWith('?')) {
  content = content.substring(1);
  fs.writeFileSync('src/components/ActiveTrades.tsx', content, 'utf8');
  console.log('Removed ?');
}
