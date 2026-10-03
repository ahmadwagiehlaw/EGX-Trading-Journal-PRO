const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = code.split('\n');

let targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return () => {')) {
    targetIdx = i;
    break;
  }
}

if (targetIdx > -1) {
    const fbListen = `    // 5. Listen to weekly reviews
    const unsubWeekly = onSnapshot(collection(db, getPath('weekly_reviews')), (snapshot) => {
      const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview));
      reviews.sort((a, b) => b.weekEndDate - a.weekEndDate);
      setWeeklyReviews(reviews);
    }, handleError);`;
    
    lines.splice(targetIdx, 0, fbListen, '');
    code = lines.join('\n');
    fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
    console.log("Injected by line number perfectly");
}
