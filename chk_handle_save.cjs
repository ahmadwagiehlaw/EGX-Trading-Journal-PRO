const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const handleIdx = wl.indexOf('const handleSavePlan');
console.log(wl.slice(handleIdx - 50, handleIdx + 400));
