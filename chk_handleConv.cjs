const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const handleConvIdx = wl.indexOf('handleConvertToTrade(');
console.log(wl.slice(handleConvIdx - 200, handleConvIdx + 200));
