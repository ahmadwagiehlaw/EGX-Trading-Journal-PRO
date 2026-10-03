const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const tIdx = code.indexOf('function Dashboard');
if (tIdx > -1) {
    console.log(code.slice(tIdx, tIdx + 1000));
} else {
    const tIdx2 = code.indexOf('const Dashboard');
    console.log(code.slice(tIdx2, tIdx2 + 1000));
}
