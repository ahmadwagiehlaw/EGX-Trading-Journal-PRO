const fs = require('fs');
const dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const eqIdx = dash.indexOf("activeCapital");
const idx2 = dash.indexOf("activeCapital", eqIdx + 15);
if (idx2 > -1) {
    console.log(dash.slice(idx2 - 200, idx2 + 800));
}
