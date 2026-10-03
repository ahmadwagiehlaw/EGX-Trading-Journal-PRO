const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// 1. Remove the old AI Panel and Core Shares UI that I injected previously.
const aiStart = code.indexOf('{/* Smart Insights Panel */}');
if (aiStart > -1) {
    const aiEnd = code.indexOf('          {/* Position Metrics Grid */}', aiStart);
    if (aiEnd > -1) {
        code = code.slice(0, aiStart) + code.slice(aiEnd);
    } else {
        // Fallback: try to find the end of the AI panel by looking for its closing div
        const aiEndBackup = code.indexOf(')}', aiStart) + 2;
        code = code.slice(0, aiStart) + code.slice(aiEndBackup);
    }
}

const coreStart = code.indexOf('{/* Core Shares Indicator */}');
if (coreStart > -1) {
    const coreEnd = code.indexOf('{/* Quick Partial Transactions Row */}', coreStart);
    if (coreEnd > -1) {
        code = code.slice(0, coreStart) + code.slice(coreEnd);
    }
}

// Ensure they are fully gone
code = code.replace(/\{\/\* Smart Insights Panel \*\/\}[\s\S]*?\n\s*\n/g, '');
code = code.replace(/\{\/\* Core Shares Indicator \*\/\}[\s\S]*?\n\s*\n/g, '');

fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log("Cleaned up old AI and Core placements.");
