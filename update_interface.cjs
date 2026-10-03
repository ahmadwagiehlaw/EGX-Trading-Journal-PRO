const fs = require('fs');
let calc = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const targetStr = `  plan?: {
    strategy?: string;
    entryZone?: { min: number; max: number };
    target: number;
    stop: number;
    atr?: number;
    checklist?: { majorSR: boolean; bos: boolean; retest: boolean };
    images?: string[];
    makerPlan?: string;
  };`;

const replaceStr = `  plan?: {
    strategy?: string;
    entryZone?: { min: number; max: number };
    target: number; // T1 (Main Target)
    targets?: number[]; // [T2, T3, ...] optional additional targets for scaling out
    stop: number;
    timeStopDays?: number; // Optional max hold time in days
    atr?: number;
    checklist?: { majorSR: boolean; bos: boolean; retest: boolean };
    images?: string[];
    makerPlan?: string;
  };`;

calc = calc.replace(targetStr, replaceStr);
fs.writeFileSync('src/utils/calculations.ts', calc, 'utf8');
console.log('✓ Updated TickerPosition interface with targets array and timeStopDays');
