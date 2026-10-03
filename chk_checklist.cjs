const fs = require('fs');
const wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const checklistIdx = wl.indexOf('قائمة التحقق');
console.log(wl.slice(checklistIdx - 200, checklistIdx + 1200));
