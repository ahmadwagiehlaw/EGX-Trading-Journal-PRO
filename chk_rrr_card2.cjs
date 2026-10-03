const fs = require('fs');
const wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const str = "1 : {rrr}";
const idx = wl.indexOf(str);
if (idx > -1) {
    console.log(wl.slice(idx - 200, idx + 200));
} else {
    console.log("Not found");
}
