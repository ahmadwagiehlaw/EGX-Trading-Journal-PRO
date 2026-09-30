const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const start = c.indexOf('{/* Trailing Stop Adjustment Input */}');
if (start !== -1) {
  // It closes right before {/* Quick Partial Transactions Row */}
  const endMarker = '{/* Quick Partial Transactions Row */}';
  const end = c.indexOf(endMarker, start);
  
  if (end !== -1) {
    // Find the closing div of the blue box. There is a `</div>\n            )}\n          </div>\n\n          {/* Quick`
    // Wait, the blue box is wrapped in `{metrics!.isOpen && ( ... )}`
    // So the end of it is `)}\n`
    // But there's also a `</div>` for the Left Column!
    // If I just slice out the blue box:
    const blueBoxCodeStart = start;
    const blueBoxCodeEnd = c.indexOf(')}', start) + 2; // this is the end of the conditionally rendered blue box
    
    c = c.slice(0, blueBoxCodeStart) + c.slice(blueBoxCodeEnd);
    fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
    console.log('Blue box removed successfully');
  }
}
