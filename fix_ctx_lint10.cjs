const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const tIdx = code.indexOf('export function useTrades() {');
if (tIdx > -1) {
    const linesBefore = code.slice(0, tIdx).split('\n').length;
    const allLines = code.split('\n');
    const goodLines = allLines.slice(0, linesBefore - 1 + 7);
    code = goodLines.join('\n');
    
    // Now inject it correctly!
    const fbListen = `    // 5. Listen to weekly reviews
    const unsubWeekly = onSnapshot(collection(db, getPath('weekly_reviews')), (snapshot) => {
      const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview));
      reviews.sort((a, b) => b.weekEndDate - a.weekEndDate);
      setWeeklyReviews(reviews);
    }, handleError);`;

    const returnStr = 'return () => {\n      unsubTrades();';
    if (code.includes(returnStr)) {
        code = code.replace(returnStr, fbListen + '\n\n    ' + returnStr);
    }
    
    if (code.includes('unsubCapital();') && !code.includes('unsubWeekly();')) {
        code = code.replace('unsubCapital();', 'unsubCapital();\n      unsubWeekly();');
    }

    fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
    console.log("Fixed bottom and injected properly!");
}
