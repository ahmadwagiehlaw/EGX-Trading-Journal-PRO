const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = code.indexOf('filteredPlans.map(');
const endIdx = code.indexOf('</div>', code.indexOf('عرض وتعديل التفاصيل', tIdx)) + 6;
console.log(code.slice(tIdx, endIdx));
