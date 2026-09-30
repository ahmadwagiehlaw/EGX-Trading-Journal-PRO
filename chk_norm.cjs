const fs = require('fs');
let content = '';
try { content = fs.readFileSync('src/context/TradeContext.tsx', 'utf8'); } catch(e) {}
let idx = content.split('\n').findIndex(l => l.includes('function normalizePosition'));
if (idx === -1) {
  content = fs.readFileSync('src/utils/calculations.ts', 'utf8');
  idx = content.split('\n').findIndex(l => l.includes('function normalizePosition'));
}
console.log(content.split('\n').slice(idx, idx + 40).join('\n'));
