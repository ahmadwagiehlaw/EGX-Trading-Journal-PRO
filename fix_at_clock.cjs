const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

at = at.replace("import { Clock, useState", "import { useState");

const lucideIdx = at.indexOf("from 'lucide-react'");
const slice = at.slice(0, lucideIdx);
if (!slice.includes('Clock,')) {
    at = at.replace("  Maximize2,", "  Clock,\n  Maximize2,");
}

fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
console.log("Fixed Clock import");
