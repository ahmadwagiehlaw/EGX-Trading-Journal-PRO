const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

wl = wl.replace(
  /setIsModalOpen\(false\);\s*};\s*const handleDelete/,
  `setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsModalOpen(false);
    }, 1000);
  };

  const handleDelete`
);

fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
console.log('Fixed handleSavePlan');
