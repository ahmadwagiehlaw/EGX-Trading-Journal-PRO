const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Find the exact closing of trailing stop cards grid
const idx = at.indexOf("{/* Quick Partial Transactions Row */}");
if (idx === -1) { console.log("Anchor not found"); process.exit(1); }

// Check what's right before it
const before = at.slice(Math.max(0, idx - 200), idx);
console.log("Before anchor:", JSON.stringify(before));
