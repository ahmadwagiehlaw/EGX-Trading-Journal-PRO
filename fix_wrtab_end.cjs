const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

// I will just put the modal right before the final closing tag of the component return.
// Currently it looks like:
// 92: 
// 93:     </div>
// 94:   );
// 95:       {isModalOpen && ( ...

// Let's remove the modal from the end
const badModal = `      {isModalOpen && (
        <WeeklyReviewModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setReviewToEdit(null);
          }}
          reviewToEdit={reviewToEdit}
        />
      )}`;

if (code.includes(badModal)) {
    code = code.replace(badModal, "");
}

// And insert it correctly inside the main wrapping <div> of the component
code = code.replace("    </div>\n  );\n}", badModal + "\n    </div>\n  );\n}");

fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
console.log("Fixed return syntax");
