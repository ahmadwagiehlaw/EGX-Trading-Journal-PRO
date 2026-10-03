const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const rrrStr = `RR {rrr}
                  </span>`;

const newRrrStr = `RR {rrr}
                  </span>
                  {parseFloat(rrr) < 2 && parseFloat(rrr) > 0 && (
                    <span className="text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded-md border border-rose-100 dark:border-rose-900" title="العائد للمخاطرة ضعيف (أقل من 2)">
                      ⚠️
                    </span>
                  )}`;

wl = wl.replace(rrrStr, newRrrStr);
fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
