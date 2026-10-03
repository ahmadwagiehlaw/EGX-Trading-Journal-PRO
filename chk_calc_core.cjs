const fs = require('fs');
let code = fs.readFileSync('src/utils/calculations.ts', 'utf8');

if (code.includes('coreShares')) {
    console.log("coreShares is in calculations.ts");
    const tIdx = code.indexOf('coreShares');
    console.log(code.slice(tIdx - 100, tIdx + 100));
} else {
    console.log("coreShares is NOT in calculations.ts!");
}
