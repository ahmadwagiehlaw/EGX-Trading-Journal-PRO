const fs = require('fs');
const code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const psyTab = code.indexOf('activeSubTab === \'psychology\' && (');
const gridIdx = code.indexOf('<div className="grid md:grid-cols-2 gap-6">', psyTab);

console.log(code.slice(psyTab, gridIdx + 100));
