const fs = require('fs');
const code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const psyIdx = code.indexOf('activeSubTab === \'psychology\'');
const nextIdx = code.indexOf(')}', psyIdx);

if (psyIdx > -1) {
    console.log(code.slice(psyIdx - 100, psyIdx + 1200));
}
