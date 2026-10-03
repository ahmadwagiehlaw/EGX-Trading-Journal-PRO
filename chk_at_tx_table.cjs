const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('<table className="w-full text-right">');
console.log(code.slice(tIdx - 400, tIdx));
