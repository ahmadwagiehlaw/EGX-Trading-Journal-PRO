const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const lines = wl.split('\n');
for (let i = 505; i < 520; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
