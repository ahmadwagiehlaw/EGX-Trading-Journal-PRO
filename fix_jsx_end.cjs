const fs = require('fs');

const fixEnd = (file) => {
    let code = fs.readFileSync(file, 'utf8');
    
    // Extract the modal UI
    let modalUI = "";
    const modalStart = code.indexOf('<ConfirmModal');
    if (modalStart > -1) {
        // Find the matching />
        const modalEnd = code.indexOf('/>', modalStart) + 2;
        modalUI = code.slice(modalStart, modalEnd);
        // Remove it from current location
        code = code.slice(0, modalStart) + code.slice(modalEnd);
    }
    
    // Clean up trailing spaces or newlines at the end of the file
    code = code.trim();
    
    // The file should end with </div>\n  );\n}
    // We will inject the modal inside the main div before the closing of the return
    // Wait, the easiest way is to find the LAST `</div>` before the `)`
    
    // Find `  );`
    const returnEnd = code.lastIndexOf('  );');
    if (returnEnd > -1) {
        // Find the </div> right before it
        const divEnd = code.lastIndexOf('</div>', returnEnd);
        if (divEnd > -1) {
            code = code.slice(0, divEnd) + "\n      " + modalUI + "\n    " + code.slice(divEnd);
        }
    }
    fs.writeFileSync(file, code, 'utf8');
};

fixEnd('src/components/Settings.tsx');
fixEnd('src/components/TransactionFormModal.tsx');
console.log("Fixed component endings");
