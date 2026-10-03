const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (!code.includes('const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);')) {
    code = code.replace("const [isFixedIncomeModalOpen, setIsFixedIncomeModalOpen] = useState(false);", "const [isFixedIncomeModalOpen, setIsFixedIncomeModalOpen] = useState(false);\n  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);");
    fs.writeFileSync('src/components/Dashboard.tsx', code, 'utf8');
    console.log("Injected isReviewModalOpen successfully");
}
