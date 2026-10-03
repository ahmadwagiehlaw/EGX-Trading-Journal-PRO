const fs = require('fs');
let dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const lines = dash.split('\n');

// Find line 108 (filter tabs) and show context
console.log(lines.slice(105, 135).join('\n'));
