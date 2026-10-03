const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// Add WeeklyReview interface
const interfaceInjection = `export interface WeeklyReview {
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
}

export interface Plan {`;
code = code.replace('export interface Plan {', interfaceInjection);

// Add state to TradeContextType
const typeInjection = `  weeklyReviews: WeeklyReview[];
  addWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => Promise<void>;
  deleteWeeklyReview: (id: string) => Promise<void>;
  positions: TickerPosition[];`;
code = code.replace('  positions: TickerPosition[];', typeInjection);

// Add default values to context
const defaultInjection = `  weeklyReviews: [],
  addWeeklyReview: async () => {},
  deleteWeeklyReview: async () => {},
  positions: [],`;
code = code.replace('  positions: [],', defaultInjection);

// Add implementations in the Provider
const implInjection = `const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);

  // Load reviews from local storage for now (or Firebase later)
  useEffect(() => {
    const saved = localStorage.getItem('egx_weekly_reviews');
    if (saved) {
      try {
        setWeeklyReviews(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const addWeeklyReview = async (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => {
    const newReview: WeeklyReview = {
      ...review,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    };
    const updated = [newReview, ...weeklyReviews];
    setWeeklyReviews(updated);
    localStorage.setItem('egx_weekly_reviews', JSON.stringify(updated));
  };

  const deleteWeeklyReview = async (id: string) => {
    const updated = weeklyReviews.filter(r => r.id !== id);
    setWeeklyReviews(updated);
    localStorage.setItem('egx_weekly_reviews', JSON.stringify(updated));
  };

  const addPosition`;

code = code.replace('const addPosition', implInjection);

// Return in provider value
const valInjection = `    weeklyReviews,
    addWeeklyReview,
    deleteWeeklyReview,
    addPosition,`;
code = code.replace('    addPosition,', valInjection);

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log('Added WeeklyReview to TradeContext');
