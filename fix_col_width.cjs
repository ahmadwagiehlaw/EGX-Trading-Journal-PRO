const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

if (code.includes('lg:w-[360px]')) {
    code = code.replace('lg:w-[360px]', 'lg:w-[420px]');
    fs.writeFileSync('src/components/Watchlist.tsx', code, 'utf8');
    console.log("Increased right column width to 420px on LG");
}
