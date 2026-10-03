const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Remove everything from line 264 to 279 (the leftover toggle) using line-based approach
const lines = at.split('\n');

// Find the exact block to remove by looking for the specific CRLF pattern
const startIdx = lines.findIndex(l => l.includes("position!.portfolioType === 'investment' && metrics!.isOpen && (") && 
  !l.includes('coreShares') && !l.includes('corePercent'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.trim() === ')}');

if (startIdx !== -1 && endIdx !== -1) {
  console.log(`Removing lines ${startIdx+1} to ${endIdx+1}`);
  lines.splice(startIdx, endIdx - startIdx + 1);
  fs.writeFileSync('src/components/ActiveTrades.tsx', lines.join('\n'), 'utf8');
  console.log('✓ Removed leftover toggle');
} else {
  console.log(`Not found - startIdx=${startIdx}, endIdx=${endIdx}`);
  // Try direct string replace
  at = at.replace(/\{position!\.portfolioType === 'investment' && metrics!\.isOpen && \(\r?\n\s*<button[\s\S]*?🏛 Core'\}\r?\n\s*<\/button>\r?\n\s*\)\}/g, '');
  fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
  console.log('✓ Regex remove done');
}
