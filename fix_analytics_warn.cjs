const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');
c = c.replace(/const \[posTableFilter, setPosTableFilter\] = useState<'all' \| 'investment' \| 'speculation'>\('all'\);\n/g, '');
fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Fixed Analytics.tsx');
