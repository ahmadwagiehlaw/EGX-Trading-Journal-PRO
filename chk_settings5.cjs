const fs = require('fs');
let s = fs.readFileSync('src/components/Settings.tsx', 'utf8');
// Make sure Target is in the imports
const hasTarget = s.includes('Target') && s.includes("from 'lucide-react'");
console.log('Has Target import:', hasTarget);
const importLine = s.split('\n').find(l => l.includes("from 'lucide-react'"));
console.log('Lucide import:', importLine);
