const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Fix the malformed line 280: })()}            )} should be })()}
at = at.replace("                  })()}            )}\r\n", "                  })()}\r\n");

fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
console.log('Fixed');
