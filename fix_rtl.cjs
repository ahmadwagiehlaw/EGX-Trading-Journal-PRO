const fs = require('fs');
let content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Replace left: with right: in the markers!
// But wait, the track width needs to be right: 0 instead of left: 0 if we want it to start from the right?
// Actually the track is 100% width, so it doesn't matter.
// But the gradient was: `bg-gradient-to-l from-emerald-500 via-blue-400 to-rose-500`
// "from-emerald" (Target) is on the RIGHT currently (`to-l` means it goes towards left, so emerald is on the right, rose is on the left).
// If Target is on the LEFT (100% right), then emerald should be on the left, rose on the right.
// So `bg-gradient-to-r from-emerald-500 via-blue-400 to-rose-500`
// Wait, `bg-gradient-to-r from-emerald-500` means it starts on the left (emerald) and goes to the right (rose).
// That perfectly matches Target on the left and Stop on the right!

content = content.replace("bg-gradient-to-l from-emerald-500 via-blue-400 to-rose-500", "bg-gradient-to-r from-emerald-500 via-blue-400 to-rose-500");

// The Initial Stop Marker
content = content.replace(/style=\{\{ left: '0%',/g, "style={{ right: '0%', transform: 'translateX(50%)',");
content = content.replace(/className="absolute flex flex-col items-center -ml-4"/g, "className=\"absolute flex flex-col items-center\"");

// The Target Marker
content = content.replace(/style=\{\{ left: '100%',/g, "style={{ right: '100%', transform: 'translateX(50%)',");
content = content.replace(/className="absolute flex flex-col items-center -mr-4"/g, "className=\"absolute flex flex-col items-center\"");

// The Entry Marker
content = content.replace(/style=\{\{ left: `\$\{entryPercent\}%`,/g, "style={{ right: `${entryPercent}%`, transform: 'translateX(50%)',");
content = content.replace(/className="absolute flex flex-col items-center -ml-2"/g, "className=\"absolute flex flex-col items-center\"");

// The Trailing Stop Marker
content = content.replace(/style=\{\{ left: `\$\{trailingStopPercent\}%`,/g, "style={{ right: `${trailingStopPercent}%`, transform: 'translateX(50%)',");

// The Current Price Marker
content = content.replace(/style=\{\{ left: `\$\{currentPercent\}%`,/g, "style={{ right: `${currentPercent}%`, transform: 'translateX(50%)',");

fs.writeFileSync('src/components/ActiveTrades.tsx', content, 'utf8');
console.log('Fixed RTL layout for chart');
