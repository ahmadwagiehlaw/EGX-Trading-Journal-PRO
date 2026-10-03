const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const convertIdx = wl.indexOf('onMoveToJournal');
console.log(wl.slice(convertIdx - 200, convertIdx + 600));
