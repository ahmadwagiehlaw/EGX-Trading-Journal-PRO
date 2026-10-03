const fs = require('fs');
const code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const contentIdx = code.indexOf('activeSubTab === \'psychology\' && (');
if (contentIdx > -1) {
    console.log(code.slice(contentIdx, contentIdx + 1500));
} else {
    console.log("Not found");
}
