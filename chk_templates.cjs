const fs = require('fs');
const wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = wl.indexOf('const PLAYBOOK_TEMPLATES');
console.log(wl.slice(tIdx, tIdx + 1200));
