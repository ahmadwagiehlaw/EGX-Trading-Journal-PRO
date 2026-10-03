const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

c = c.replace(/  \}, \[\]\);/g, "  }, [isSimulator]);");
// settings doc shouldn't be dynamic maybe? Actually let's make settings global, but maybe capital settings are affected? 
// The user doesn't want capital settings from there anymore, they want the Vault ledger.

fs.writeFileSync('src/context/TradeContext.tsx', c, 'utf8');
console.log('Fixed useEffect deps');
