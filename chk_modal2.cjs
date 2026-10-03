const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const modalRenderStart = code.indexOf('isModalOpen');
console.log(code.slice(modalRenderStart, modalRenderStart + 600));
const allModals = code.split('\n').filter(line => line.includes('fixed inset-0'));
console.log("\nFound fixed overlays:");
console.log(allModals);
