const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

if (wl.includes('CONFLUENCE_CRITERIA.map')) {
    console.log("Success");
} else {
    console.log("Failed");
}
