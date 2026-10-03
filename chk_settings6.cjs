const fs = require('fs');
let s = fs.readFileSync('src/components/Settings.tsx', 'utf8');
const lines = s.split('\n');
const importLine = lines.findIndex(l => l.includes("from 'lucide-react'"));
console.log(lines.slice(Math.max(0, importLine - 5), importLine + 2).join('\n'));
