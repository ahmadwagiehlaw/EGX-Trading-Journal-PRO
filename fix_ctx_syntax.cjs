const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

code = code.replace("    };\n    };\n    };edPnL,", "    };\n  }, []);\n\n  const {\n    totalRealizedPnL,");
code = code.replace("    };edPnL,", "    };\n  }, []);\n\n  const {\n    totalRealizedPnL,");

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log("Fixed corrupted const destructuring");
