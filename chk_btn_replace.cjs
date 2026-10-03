const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const btnIdx = wl.indexOf('حفظ الخطة');
console.log(wl.slice(btnIdx - 400, btnIdx + 200));
