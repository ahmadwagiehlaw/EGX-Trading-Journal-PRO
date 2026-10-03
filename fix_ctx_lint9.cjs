const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// 1. Remove everything after the end of useTrades function
const validEnd = code.indexOf('return context;\n}');
if (validEnd > -1) {
    code = code.slice(0, validEnd + 18);
}

// 2. Add the listener inside the useEffect before return () => {
const fbListen = `\n    // 5. Listen to weekly reviews
    const unsubWeekly = onSnapshot(collection(db, getPath('weekly_reviews')), (snapshot) => {
      const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview));
      reviews.sort((a, b) => b.weekEndDate - a.weekEndDate);
      setWeeklyReviews(reviews);
    }, handleError);\n`;

const returnStr = 'return () => {\n      unsubTrades();';
if (code.includes(returnStr) && !code.includes('const unsubWeekly =')) {
    code = code.replace(returnStr, fbListen + '\n    ' + returnStr);
}

// 3. Make sure unsubWeekly is called inside the cleanup
if (code.includes('unsubCapital();') && !code.includes('unsubWeekly();')) {
    code = code.replace('unsubCapital();', 'unsubCapital();\n      unsubWeekly();');
}

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log('Fixed file end corruption and injected unsubWeekly perfectly');
