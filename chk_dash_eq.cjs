const fs = require('fs');
const dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const eqIdx = dash.indexOf("رأس المال الحالي");
console.log(dash.slice(eqIdx - 100, eqIdx + 500));
