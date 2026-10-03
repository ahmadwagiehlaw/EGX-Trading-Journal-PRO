const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const oldOnChange = `                              onChange={(e) => {
                                const newChecklist = { ...selectedPlan.checklist };
                                newChecklist[crit.id] = e.target.checked;
                                setSelectedPlan({ ...selectedPlan, checklist: newChecklist });
                              }}`;

const newOnChange = `                              onChange={(e) => {
                                const newChecklist = { ...selectedPlan.checklist };
                                newChecklist[crit.id] = e.target.checked;
                                
                                // Auto-downgrade status if score drops below 6
                                let tempPlan = { ...selectedPlan, checklist: newChecklist };
                                if (calculateScore(tempPlan) < 6 && tempPlan.status === 'ready') {
                                  tempPlan.status = 'waiting';
                                }
                                
                                setSelectedPlan(tempPlan);
                              }}`;

wl = wl.replace(oldOnChange, newOnChange);
fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
console.log('✓ Updated Checklist onChange for auto-downgrade');
