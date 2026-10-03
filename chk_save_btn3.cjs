const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const saveIdx = wl.indexOf('حفظ الخطة');
console.log(wl.slice(saveIdx - 400, saveIdx + 100));
