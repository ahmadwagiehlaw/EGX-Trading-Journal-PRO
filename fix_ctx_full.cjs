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
const returnCleanupIdx = code.indexOf('return () => {\n      unsubTrades();');
const returnCleanupBlock = code.slice(returnCleanupIdx, returnCleanupIdx + 200);
if (code.includes('unsubCapital();')) {
  code = code.replace(returnCleanupBlock, fbListen + '\n\n    return () => {\n      unsubTrades();\n      unsubPlans();\n      unsubCapital();\n      unsubWeekly();\n      if (unsubLedger) unsubLedger();\n    };\n  }, []);');
}

// 2. Remove the old localStorage useEffect for weekly reviews
const oldEffectStart = code.indexOf('// Load reviews from local storage for now');
const oldEffectEnd = code.indexOf('}, []);', oldEffectStart) + 7;
if (oldEffectStart > -1) {
  code = code.slice(0, oldEffectStart) + code.slice(oldEffectEnd);
}

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
if (oldAddStart > -1) {
  code = code.slice(0, oldAddStart) + newAdd + '\n\n  ' + code.slice(oldAddEnd + 4);
}

// 4. Remove 'trades' from TradeContextType
code = code.replace("  trades: Trade[]; // Legacy backward-compatibility alias\n", "");

// 5. Remove 'positionToLegacyTrade' function
const legFnStart = code.indexOf('function positionToLegacyTrade(pos: TickerPosition): Trade {');
if (legFnStart > -1) {
    const legFnEnd = code.indexOf('return legacy;\n}', legFnStart) + 17;
    code = code.slice(0, legFnStart) + code.slice(legFnEnd);
}

// 6. Remove 'trades' from the dependencies of the main useMemo for contextValue
code = code.replace("positions, trades, profitFactor", "positions, profitFactor");
// Also remove 'trades: any[]' or 'trades' from the actual value return
code = code.replace(/^[ \t]*trades,[ \t]*$/m, "");

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log('Migrated Weekly Reviews to Firebase Firestore and cleaned up Context');
