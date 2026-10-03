const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// 1. Remove the dangling unsubWeekly block at the end
const dangleStart = code.indexOf('const unsubWeekly = onSnapshot');
if (dangleStart > -1) {
    const dangleEnd = code.indexOf('}, handleError);', dangleStart) + 16;
    code = code.slice(0, dangleStart) + code.slice(dangleEnd);
}

// 2. Inject it inside the correct useEffect block
const fbListen = `    // 5. Listen to weekly reviews
    const unsubWeekly = onSnapshot(collection(db, getPath('weekly_reviews')), (snapshot) => {
      const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview));
      reviews.sort((a, b) => b.weekEndDate - a.weekEndDate);
      setWeeklyReviews(reviews);
    }, handleError);`;

const correctCleanupIdx = code.indexOf('return () => {\n      unsubTrades();');
const correctCleanupBlock = code.slice(correctCleanupIdx, correctCleanupIdx + 150);

if (!code.includes('unsubWeekly();') && correctCleanupIdx > -1) {
    code = code.replace(correctCleanupBlock, fbListen + '\n\n    return () => {\n      unsubTrades();\n      unsubPlans();\n      unsubCapital();\n      unsubWeekly();\n      if (unsubLedger) unsubLedger();\n    };\n  }, []);');
} else if (code.includes('unsubWeekly();')) {
    // If it's already there in cleanup but listener is missing
    const insertIdx = code.indexOf('return () => {\n      unsubTrades();');
    code = code.slice(0, insertIdx) + fbListen + '\n\n    ' + code.slice(insertIdx);
}

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log('Fixed unsubWeekly placement');
