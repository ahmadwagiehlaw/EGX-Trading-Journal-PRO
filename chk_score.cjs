const fs = require('fs');
const wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const calcIdx = wl.indexOf('const calculateScore');
console.log(wl.slice(calcIdx - 100, calcIdx + 400));
