const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Fix missing imports
if (!code.includes('import WeeklyReviewModal')) {
    code = code.replace("import { computePositionMetrics, formatEGP } from '../utils/calculations';", "import { computePositionMetrics, formatEGP } from '../utils/calculations';\nimport WeeklyReviewModal from './WeeklyReviewModal';");
}

// Fix missing state
if (!code.includes('const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);')) {
    code = code.replace("const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'investment' | 'speculation'>('all');", "const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'investment' | 'speculation'>('all');\n  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);");
}

fs.writeFileSync('src/components/Dashboard.tsx', code, 'utf8');
console.log("Fixed missing imports and state in Dashboard.tsx");
