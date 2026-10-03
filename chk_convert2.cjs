const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const convertIdx = wl.indexOf('convertPlanToPosition');
const nextIdx = wl.indexOf('convertPlanToPosition', convertIdx + 1);
const nextNextIdx = wl.indexOf('convertPlanToPosition', nextIdx + 1);

console.log(wl.slice(nextIdx - 100, nextIdx + 300));
console.log("----");
console.log(wl.slice(nextNextIdx - 100, nextNextIdx + 300));
