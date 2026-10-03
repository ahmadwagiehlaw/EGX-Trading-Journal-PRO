const fs = require('fs');

const fixJSXEnd = (file) => {
    let code = fs.readFileSync(file, 'utf8');
    // We will just find the ConfirmModal and place it right before the final `</div>\n  );\n}`
    // If it's already there but messy, let's clean it.
    
    // Remove the modal entirely first
    const modalStart = code.indexOf('<ConfirmModal');
    if (modalStart > -1) {
        const modalEnd = code.indexOf('/>', modalStart) + 2;
        code = code.slice(0, modalStart) + code.slice(modalEnd);
    }
    
    // Now insert it cleanly
    const endStr = '    </div>\n  );\n}';
    let modalUI = "";
    if (file.includes('Settings')) {
       modalUI = `\n      <ConfirmModal
        isOpen={confirmReset}
        title="مسح جميع البيانات"
        message="تحذير: سيتم مسح جميع الصفقات والخطط والمراجعات من السحابة نهائياً. لا يمكن التراجع عن هذه الخطوة!"
        type="danger"
        confirmText="نعم، امسح كل شيء"
        onConfirm={executeClearData}
        onCancel={() => setConfirmReset(false)}
      />\n`;
    } else {
       modalUI = `\n      <ConfirmModal
        isOpen={confirmInsufficient}
        title="سيولة غير كافية"
        message="السيولة المتاحة في المحفظة لا تكفي لإتمام هذه الصفقة بالكامل. هل تريد المتابعة والسماح برصيد سالب (Margin)؟"
        type="warning"
        confirmText="متابعة والسماح بالسالب"
        onConfirm={executeSaveFromPending}
        onCancel={() => {
          setConfirmInsufficient(false);
          setPendingSavePayload(null);
        }}
      />\n`;
    }
    
    // Clean up any broken ends
    code = code.replace(/<\/div>\s*<\/div>\s*\);\s*}/g, '    </div>\n  );\n}');
    code = code.replace(/<\/div>\s*\);\s*}/g, '    </div>\n  );\n}');
    
    const insertTarget = '    </div>\n  );\n}';
    code = code.replace(insertTarget, modalUI + insertTarget);
    
    // Actually wait, sometimes the final div has different indentation.
    // I'll just use lastIndexOf('</div>') but wrap the whole thing in a fragment! No, it has a main div.
    fs.writeFileSync(file, code, 'utf8');
};

fixJSXEnd('src/components/Settings.tsx');
fixJSXEnd('src/components/TransactionFormModal.tsx');
console.log("Fixed ends");
