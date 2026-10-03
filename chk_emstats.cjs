const fs = require('fs');
const code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const emStats = code.indexOf('const emotionStats');
console.log(code.slice(emStats, emStats + 800));
