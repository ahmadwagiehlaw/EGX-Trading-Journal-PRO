const fs = require('fs');

// 8. Add the Core/Satellite Health Gauge to Dashboard
let dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Add coreStats to destructured useTrades
dash = dash.replace(
  `  } = useTrades();`,
  `    coreStats,
    coreSatelliteTarget,
  } = useTrades();`
);

// Find a good insertion spot — after the portfolio filter tabs or near the top summary cards
// Look for where investment portfolio metrics are shown
const anchor = `{/* Active Positions */}`;
const anchorIdx = dash.indexOf(anchor);
if (anchorIdx === -1) {
  console.log('Could not find anchor. Searching for alternatives...');
  const lines = dash.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('activePositions') || l.includes('portfolioFilter') || l.includes('مراكز مفتوحة')) {
      console.log(`${i+1}: ${l.trim()}`);
    }
  });
} else {
  console.log('✓ Found anchor at char', anchorIdx);
}
