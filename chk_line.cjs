const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 375; i < 395; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
