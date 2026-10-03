const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const lines = wl.split('\n');
for(let i=440; i<450; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
