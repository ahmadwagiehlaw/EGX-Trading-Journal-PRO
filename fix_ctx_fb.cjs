const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// 1. Add snapshot listener for weeklyReviews
const fbListen = `    // 4. Listen to weekly reviews
    const unsubWeekly = onSnapshot(collection(db, getPath('weekly_reviews')), (snapshot) => {
      const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview));
      reviews.sort((a, b) => b.weekEndDate - a.weekEndDate);
      setWeeklyReviews(reviews);
    }, handleError);`;

// Insert it right before the return () => { ... } inside the big useEffect
const returnCleanupIdx = code.indexOf('return () => {');
const returnCleanupBlock = code.slice(returnCleanupIdx, returnCleanupIdx + 300);

const newReturnBlock = `return () => {
      unsubTrades();
      unsubPlans();
      unsubCapital();
      unsubWeekly();
    };`;

if (code.includes('unsubCapital();') && !code.includes('unsubWeekly()')) {
  code = code.replace(returnCleanupBlock, newReturnBlock);
  code = code.replace(newReturnBlock, fbListen + '\n\n    ' + newReturnBlock);
}

// 2. Remove the old localStorage useEffect
const oldEffect = `  // Load reviews from local storage for now (or Firebase later)
  useEffect(() => {
    const saved = localStorage.getItem('egx_weekly_reviews');
    if (saved) {
      try {
        setWeeklyReviews(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);`;
code = code.replace(oldEffect, '');

// 3. Update addWeeklyReview & deleteWeeklyReview to use Firebase
const newAdd = `  const addWeeklyReview = async (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => {
    const colRef = collection(db, getPath('weekly_reviews'));
    const docRef = doc(colRef);
    const newReview = { ...review, createdAt: Date.now() };
    await setDoc(docRef, newReview);
  };

  const deleteWeeklyReview = async (id: string) => {
    await deleteDoc(doc(db, getPath('weekly_reviews'), id));
  };`;

const oldAddStart = code.indexOf('const addWeeklyReview = async (review: Omit<WeeklyReview, \'id\' | \'createdAt\'>) => {');
const oldAddEnd = code.indexOf('const addPosition = async') - 4; // Right before addPosition
const oldAddBlock = code.slice(oldAddStart, oldAddEnd);

if (oldAddBlock.includes('localStorage.setItem')) {
  code = code.replace(oldAddBlock, newAdd + '\n\n');
}

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log('Migrated Weekly Reviews to Firebase Firestore');
