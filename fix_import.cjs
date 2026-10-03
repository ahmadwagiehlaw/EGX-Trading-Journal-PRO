const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

if (!code.includes('AdvancedRealTimeChart')) {
  code = code.replace("import { useState, memo } from 'react';", "import { useState, memo } from 'react';\nimport { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';");
  fs.writeFileSync('src/components/Watchlist.tsx', code, 'utf8');
  console.log("Imported AdvancedRealTimeChart");
}
