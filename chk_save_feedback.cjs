const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const anchor = `  const handleSavePlan = (updatedPlan: Plan) => {`;
const replace = `  const [isSaved, setIsSaved] = useState(false);

  const handleSavePlan = (updatedPlan: Plan) => {
    if (!updatedPlan.symbol) return;

    const min = Number(updatedPlan.entryZone?.min) || 0;
    const max = Number(updatedPlan.entryZone?.max) || min;

    const normalizedPlan: Plan = {
      ...updatedPlan,
      symbol: updatedPlan.symbol.toUpperCase(),
      entryZone: { min, max },
      entry: min,
    };

    const exists = plans.find(p => p.id === normalizedPlan.id);
    if (exists) {
      updatePlan(normalizedPlan.id, normalizedPlan);
    } else {
      addPlan(normalizedPlan);
    }
    
    // Show visual feedback instead of abrupt closing
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsModalOpen(false);
    }, 800);
  };`;

// Wait, the useState needs to be at the top level of the component!
