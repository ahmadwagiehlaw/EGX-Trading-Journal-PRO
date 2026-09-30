const fs = require('fs');
const original = fs.readFileSync('original_calc.ts', 'utf8');
const current = fs.readFileSync('src/utils/calculations.ts', 'utf8');

// Extract everything from `export interface Transaction` down to `export function simulatePositionMetrics` from original
const origLines = original.split('\n');
const startIdx = origLines.findIndex(l => l.includes('export interface Transaction'));
const endIdx = origLines.findIndex(l => l.includes('export function simulatePositionMetrics'));
let origInterfaces = origLines.slice(startIdx, endIdx).join('\n');

// Add the 'dividend' | 'split' | 'bonus', linkedBuyId, portfolioType to Transaction in origInterfaces
origInterfaces = origInterfaces.replace(/type: 'buy' \| 'sell';/, "type: 'buy' | 'sell' | 'dividend' | 'split' | 'bonus';");
origInterfaces = origInterfaces.replace(/amount: number;/, "amount: number;\n  linkedBuyId?: string;\n  portfolioType?: 'investment' | 'speculation';");
origInterfaces = origInterfaces.replace(/mistake\?: string;/, "mistake?: string;\n  executionRating?: number;\n  setup?: string[];\n  ruleBreaker?: boolean;");

// Now replace the block in current
const curLines = current.split('\n');
const curStartIdx = curLines.findIndex(l => l.includes('export interface Transaction'));
const curEndIdx = curLines.findIndex(l => l.includes('export function simulatePositionMetrics'));

curLines.splice(curStartIdx, curEndIdx - curStartIdx, origInterfaces);

fs.writeFileSync('src/utils/calculations.ts', curLines.join('\n'), 'utf8');
console.log('Restored FULL rich interfaces');
