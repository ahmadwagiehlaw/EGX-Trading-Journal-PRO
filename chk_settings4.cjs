const fs = require('fs');
let s = fs.readFileSync('src/components/Settings.tsx', 'utf8');
// Find the actual anchor in the existing file for the dangerous zone
const patterns = ['حذف', 'خطر', 'Clear', 'danger', 'Danger', 'Export', 'تصدير'];
const lines = s.split('\n');
lines.forEach((l, i) => {
  for (const p of patterns) {
    if (l.includes(p)) console.log(`${i+1}: ${l.trim()}`);
  }
});
