const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// 1. Add WeeklyReview Interface
const wrInterface = `export interface WeeklyReview {
  id: string;
  weekStartDate: number;
  weekEndDate: number;
  pnl: number;
  winRate: number;
  tradesCount: number;
  whatWentWell: string;
  whatWentWrong: string;
  focusNextWeek: string;
  createdAt: number;
}`;

if (!code.includes('export interface WeeklyReview')) {
    code = code.replace("export interface Plan {", wrInterface + "\n\nexport interface Plan {");
}

// 2. Add to TradeContextType
const wrType = `  weeklyReviews: WeeklyReview[];
  addWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => Promise<void>;
  deleteWeeklyReview: (id: string) => Promise<void>;`;

if (!code.includes('weeklyReviews: WeeklyReview[];')) {
    code = code.replace("  // Positions (Primary Ticker-centric model)", "  // Weekly Reviews\n" + wrType + "\n\n  // Positions (Primary Ticker-centric model)");
}

// 3. Add to TradeProvider defaults
const wrDefaults = `  weeklyReviews: [],
  addWeeklyReview: async () => {},
  deleteWeeklyReview: async () => {},`;

if (!code.includes('weeklyReviews: [],')) {
    code = code.replace("  filteredPositions: [],", "  filteredPositions: [],\n" + wrDefaults);
}

// 4. State & Add/Delete functions in Provider
const wrStateFn = `  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);

  const addWeeklyReview = async (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => {
    const colRef = collection(db, getPath('weekly_reviews'));
    const docRef = doc(colRef);
    const newReview = { ...review, createdAt: Date.now() };
    await setDoc(docRef, newReview);
  };

  const deleteWeeklyReview = async (id: string) => {
    await deleteDoc(doc(db, getPath('weekly_reviews'), id));
  };`;

if (!code.includes('const [weeklyReviews, setWeeklyReviews]')) {
    code = code.replace("const [positions, setPositions] = useState<TickerPosition[]>([]);", "const [positions, setPositions] = useState<TickerPosition[]>([]);\n" + wrStateFn);
}

// 5. Firebase Snapshot
const wrSnapshot = `    // 5. Listen to weekly reviews
    const unsubWeekly = onSnapshot(collection(db, getPath('weekly_reviews')), (snapshot) => {
      const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview));
      reviews.sort((a, b) => b.weekEndDate - a.weekEndDate);
      setWeeklyReviews(reviews);
    }, handleError);`;

if (!code.includes('unsubWeekly = onSnapshot')) {
    const returnIdx = code.indexOf('return () => {\n      unsubTrades();');
    code = code.slice(0, returnIdx) + wrSnapshot + "\n\n    " + code.slice(returnIdx);
    code = code.replace("unsubLedger();\n    };\n  }, []);", "unsubLedger();\n      unsubWeekly();\n    };\n  }, []);");
}

// 6. Export in contextValue
if (!code.includes('weeklyReviews,\n    addWeeklyReview,\n    deleteWeeklyReview,')) {
    code = code.replace("    filteredPositions,", "    filteredPositions,\n    weeklyReviews,\n    addWeeklyReview,\n    deleteWeeklyReview,");
    code = code.replace("activeOpenRisk, filteredPositions,", "activeOpenRisk, filteredPositions, weeklyReviews,");
}

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log('Restored Weekly Reviews properly into TradeContext');
