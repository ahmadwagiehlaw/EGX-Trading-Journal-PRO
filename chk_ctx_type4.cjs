const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const tIdx = code.indexOf('export interface TradeContextType {');
const endIdx = code.indexOf('export const TradeContext = createContext', tIdx);
console.log(code.slice(tIdx, endIdx));
