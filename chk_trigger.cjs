const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = wl.indexOf('جاهزة للتنفيذ');
console.log(wl.slice(tIdx - 400, tIdx + 300));
