const { execSync } = require('child_process');
const log = execSync('git log --pretty=oneline src/components/ActiveTrades.tsx', { encoding: 'utf8' });
console.log(log);
