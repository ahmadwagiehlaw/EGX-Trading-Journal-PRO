const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Remove all existing null checks
c = c.replace(/if \(\!position \|\| \!metrics\) return null;\n/g, "");

// Add it right after useMemo
const target = '}, [position]);';
c = c.replace(target, '}, [position]);\n\n  if (!position || !metrics) return null;');

// Now TypeScript will know position and metrics are not null for the entire rest of the component!
// This fixes everything except useEffect and callbacks that might capture earlier scope, but since they run after mount or user interaction, they can just use the narrowed type if they are declared AFTER the null check.
// BUT hooks (useState, useEffect) CANNOT be called after an early return!
// Ah!!! "Hooks must be called in the exact same order in every component render."
// So I CANNOT put `if (!position) return null;` BEFORE `useState`!
// That's why it was at line 80!

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
