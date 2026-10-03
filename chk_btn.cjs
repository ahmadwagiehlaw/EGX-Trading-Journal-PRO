const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

if (code.includes('فتح الشارت')) {
    console.log("Button still exists!");
    const idx = code.indexOf('فتح الشارت');
    console.log(code.slice(idx - 150, idx + 150));
} else {
    console.log("Button successfully removed.");
}
