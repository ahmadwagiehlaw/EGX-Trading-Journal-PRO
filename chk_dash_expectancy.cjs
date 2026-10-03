const fs = require('fs');
const dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const eqIdx = dash.indexOf("Win Rate");
if (eqIdx > -1) {
    console.log(dash.slice(eqIdx - 100, eqIdx + 1000));
} else {
    const eqIdx2 = dash.indexOf("نسبة النجاح");
    if (eqIdx2 > -1) {
        console.log(dash.slice(eqIdx2 - 100, eqIdx2 + 1000));
    }
}
