const fs = require('fs');
let content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const targetStr = `              </p>
                )}
              </div>
            </div>

            {/* Plan vs Reality Visual Chart */}`;

// Wait, where did my badges end?
// In my script `phase2.cjs`:
// `                )}`
// So I will just replace `                )}` with `                )}\n              </div>`

const idx = content.indexOf('{error && isEditingHighestPrice && (');
if (idx !== -1) {
  const endIdx = content.indexOf(')}', idx + 10) + 2;
  content = content.slice(0, endIdx) + '\n              </div>' + content.slice(endIdx);
}

fs.writeFileSync('src/components/ActiveTrades.tsx', content, 'utf8');
console.log('Fixed missing div in header');
