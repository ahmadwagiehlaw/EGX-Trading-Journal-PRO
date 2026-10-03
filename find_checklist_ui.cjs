const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const uiStart = wl.indexOf('قائمة التحقق (Confluence Checklist)');
if (uiStart > -1) {
    const endStr = '</div>';
    // We want to replace the whole checklist block. Let's just find the exact block and replace it.
    // I'll grab from '<div className="flex justify-between items-center mb-3">' that precedes the checklist label
    // to the end of the mapping.
    console.log(wl.slice(uiStart - 200, uiStart + 1200));
} else {
    console.log("Not found");
}
