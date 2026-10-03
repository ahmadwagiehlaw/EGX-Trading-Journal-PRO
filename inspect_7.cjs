const fs = require('fs');
// Check Settings.tsx structure
const settings = fs.readFileSync('src/components/Settings.tsx', 'utf8');
const lines = settings.split('\n');
// Find the structure
const idx = lines.findIndex(l => l.includes('export default function Settings'));
console.log(lines.slice(idx, idx + 50).join('\n'));
