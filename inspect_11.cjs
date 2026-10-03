const fs = require('fs');
const ntf = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');
const lines = ntf.split('\n');
// Search for portfolio type selector
lines.forEach((l, i) => {
  if (l.includes("portfolio") || l.includes("Portfolio") || l.includes("استثمار") || l.includes("investment")) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
