const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const helpIdx = wl.indexOf('شرح الاستراتيجيات');
console.log(wl.slice(helpIdx - 200, helpIdx + 200));
