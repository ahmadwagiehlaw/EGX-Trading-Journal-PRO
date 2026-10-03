const fs = require('fs');
// Check TransactionFormModal
const tfm = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const lines = tfm.split('\n');
lines.forEach((l, i) => {
  if (l.includes("portfolioType") || l.includes("استثمار") || l.includes("مضاربة") || l.includes("specul")) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
