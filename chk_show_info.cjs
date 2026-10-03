const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const infoIdx = wl.indexOf('showPlaybookInfo &&');
if (infoIdx > -1) {
    console.log(wl.slice(infoIdx - 100, infoIdx + 800));
} else {
    console.log("Not found");
}
