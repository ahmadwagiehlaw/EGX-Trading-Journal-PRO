const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

// 1. Remove duplicate imports and wrong lines at the top
code = code.replace("  const [reviewToEdit, setReviewToEdit] = useState<any>(null);\n  const [isModalOpen, setIsModalOpen] = useState(false);\nconst { weeklyReviews } = useTrades();", "  const { weeklyReviews } = useTrades();\n  const [reviewToEdit, setReviewToEdit] = useState<any>(null);");

// 2. Remove the dangling block at the end
const endBlockIdx = code.indexOf('  );\n}                      <button');
if (endBlockIdx > -1) {
    code = code.slice(0, endBlockIdx + 5);
}

// 3. Remove the modalUI injected outside
const modalIdx = code.indexOf('{isModalOpen && (\n        <WeeklyReviewModal ');
if (modalIdx > -1) {
    code = code.slice(0, modalIdx);
}

fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
console.log("Cleaned WeeklyReviewTab.tsx");
