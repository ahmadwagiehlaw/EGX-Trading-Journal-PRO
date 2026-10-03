const fs = require('fs');
let c = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('export default function TransactionFormModal'));
console.log(lines.slice(idx, idx + 20).join('\n'));
