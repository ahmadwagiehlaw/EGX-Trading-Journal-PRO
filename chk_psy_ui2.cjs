const fs = require('fs');
const code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const psyTab = code.indexOf('activeSubTab === \'psychology\' && (');
const nextTab = code.indexOf('activeSubTab === \'playbook\' && (');
console.log(code.slice(psyTab, nextTab > -1 ? nextTab : psyTab + 3000));
