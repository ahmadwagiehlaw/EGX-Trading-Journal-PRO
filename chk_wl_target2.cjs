const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const targetIdx = wl.indexOf('الهدف الأساسي');
console.log(wl.slice(targetIdx - 500, targetIdx + 500));
