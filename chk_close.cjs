const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const closeIdx = code.indexOf('setIsModalOpen(false)');
console.log(code.slice(closeIdx - 100, closeIdx + 200));
