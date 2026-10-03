const { execSync } = require('child_process');
const fileContent = execSync('git show 919c68e:src/components/ActiveTrades.tsx', { encoding: 'utf8' });
console.log(fileContent.indexOf('Core') > -1);
console.log(fileContent.indexOf('كور') > -1);
const lines = fileContent.split('\n');
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('كور') || lines[i].includes('ستالايت') || lines[i].includes('Satellite')) {
      console.log(lines[i]);
   }
}
