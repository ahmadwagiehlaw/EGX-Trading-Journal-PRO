const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

const badEnd = '    </div>\n  );\n\n\n';
const goodEnd = `
      {isModalOpen && (
        <WeeklyReviewModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setReviewToEdit(null);
          }}
          reviewToEdit={reviewToEdit}
        />
      )}
    </div>
  );
}`;

code = code.replace(badEnd, goodEnd);
// Also just fallback if badEnd is slightly different
if (!code.includes('}')) {
    // we'll just append it?
}

fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
console.log("Fixed end block");
