const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewModal.tsx', 'utf8');

const tIdx = code.indexOf('const handleSave');
console.log(code.slice(tIdx, tIdx + 800));
