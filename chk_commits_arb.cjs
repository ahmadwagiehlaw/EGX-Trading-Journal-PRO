const { execSync } = require('child_process');
const fileContent = execSync('git show 919c68e:src/components/ActiveTrades.tsx', { encoding: 'utf8' });
console.log(fileContent.includes('دفعات'));
console.log(fileContent.includes('Open Lots'));
