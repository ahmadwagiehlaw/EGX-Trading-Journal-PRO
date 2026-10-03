const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

// Find the Card rendering logic
const cardStart = code.indexOf('filteredPlans.map(item => (');
console.log(code.slice(cardStart, cardStart + 2000));
