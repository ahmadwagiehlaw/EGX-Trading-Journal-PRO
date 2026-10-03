const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const fbListen = `    // 5. Listen to weekly reviews
    const unsubWeekly = onSnapshot(collection(db, getPath('weekly_reviews')), (snapshot) => {
      const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview));
      reviews.sort((a, b) => b.weekEndDate - a.weekEndDate);
      setWeeklyReviews(reviews);
    }, handleError);`;

const returnIdx = code.indexOf('return () => {\n      unsubTrades();');
if (!code.includes('setWeeklyReviews(reviews)')) {
    code = code.slice(0, returnIdx) + fbListen + '\n\n    ' + code.slice(returnIdx);
    fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
    console.log("Added missing unsubWeekly block");
}
