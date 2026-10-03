const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('import {');
const endIdx = code.indexOf('} from \'lucide-react\';', tIdx);

let importStr = code.slice(tIdx, endIdx);
if (!importStr.includes('X')) importStr += ',\n  X';
if (!importStr.includes('Pencil')) importStr += ',\n  Pencil';
if (!importStr.includes('Sparkles')) importStr += ',\n  Sparkles';

code = code.slice(0, tIdx) + importStr + code.slice(endIdx);
fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log("Fixed icon imports");
