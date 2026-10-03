const fs = require('fs');
const ntf = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');

// Find portfolio type selector in the form JSX
const idx = ntf.indexOf('مضاربة');
if (idx !== -1) {
  console.log(ntf.slice(Math.max(0, idx-300), idx+300));
}
