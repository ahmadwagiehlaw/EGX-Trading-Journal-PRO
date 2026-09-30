const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const target = '{/* Quick Partial Transactions Row */}';
const idx = c.indexOf(target);
if (idx !== -1) {
  // Check if there is a </div> right before it
  const before = c.slice(idx - 20, idx);
  console.log('Before:', JSON.stringify(before));
  
  if (!before.includes('</div>')) {
    c = c.slice(0, idx) + '</div>\n\n          ' + c.slice(idx);
    fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
    console.log('Added </div>');
  }
}
