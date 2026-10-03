const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('<table className="w-full text-right" dir="rtl">');
console.log(code.slice(tIdx, tIdx + 1500));
