const fs = require('fs');
let code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

if (!code.includes('import WeeklyReviewTab from')) {
    code = code.replace("import PnLCalendar from './PnLCalendar';", "import PnLCalendar from './PnLCalendar';\nimport WeeklyReviewTab from './WeeklyReviewTab';");
}

const renderLogic = `      {/* TAB 5: WEEKLY REVIEW */}
      {activeSubTab === 'weekly_review' && (
        <WeeklyReviewTab />
      )}
    </div>
  );
}`;

if (!code.includes('activeSubTab === \'weekly_review\' && (')) {
    code = code.replace('    </div>\n  );\n}', renderLogic);
    fs.writeFileSync('src/components/Analytics.tsx', code, 'utf8');
    console.log("Integrated WeeklyReviewTab into Analytics.tsx");
}
