const { execSync } = require('child_process');
const fileContent = execSync('git show 919c68e:src/components/ActiveTrades.tsx', { encoding: 'utf8' });
console.log(fileContent.includes('Core'));
console.log(fileContent.includes('Satellite'));
