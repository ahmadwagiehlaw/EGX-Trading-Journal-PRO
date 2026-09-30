const fs = require('fs');
const content = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
if (content.includes('deleteTransaction')) {
  console.log('deleteTransaction exists!');
} else {
  console.log('deleteTransaction DOES NOT exist!');
}
