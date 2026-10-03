const fs = require('fs');
let set = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const commIdx = set.indexOf('type="number"');
console.log(set.slice(commIdx - 200, commIdx + 1000));
