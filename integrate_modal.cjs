const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

// 1. Add import
if (!wl.includes('ConceptsGuideModal')) {
    wl = wl.replace("import StockAutocomplete from './StockAutocomplete';", "import StockAutocomplete from './StockAutocomplete';\nimport ConceptsGuideModal from './ConceptsGuideModal';");
}

// 2. Change state name
wl = wl.replace("const [showPlaybookInfo, setShowPlaybookInfo] = useState(false);", "const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);");

// 3. Change button onClick
wl = wl.replace("onClick={() => setShowPlaybookInfo(!showPlaybookInfo)}", "onClick={() => setIsGuideModalOpen(true)}");

// 4. Remove old showPlaybookInfo inline div
const infoDivStart = wl.indexOf('{showPlaybookInfo &&');
if (infoDivStart > -1) {
    // Find the end of this div. It's roughly:
    // {showPlaybookInfo && (
    //   <div ...>
    //     ...
    //   </div>
    // )}
    const endStr = ')}';
    let divEnd = wl.indexOf(endStr, infoDivStart + 1000); // the div is long
    
    // Better way: regex replace
    wl = wl.replace(/\{showPlaybookInfo && \([\s\S]*?<\/\div>\s*\)\}/, '');
}

// 5. Add the modal rendering at the bottom of the component (just before the last closing div)
const lastDiv = wl.lastIndexOf('</div>');
wl = wl.slice(0, lastDiv) + `\n      <ConceptsGuideModal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} />\n    ` + wl.slice(lastDiv);

fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
console.log('✓ Integrated ConceptsGuideModal into Watchlist');
