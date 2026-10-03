const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const lines = wl.split('\n');
lines.forEach((l, i) => {
    if (l.includes('isSaved')) {
        console.log(`${i+1}: ${l.trim()}`);
    }
});
