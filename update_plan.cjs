const fs = require('fs');
let ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const oldPlanStr = `export interface Plan {
  id: string;
  symbol: string;
  strategy: string;
    checklist?: Record<string, boolean>;
    setupScore?: number;
  entry?: number; // legacy single entry
  entryZone: {
    min: number;
    max: number;
  };
  target: number;
  stop: number;
  atr?: number;
  status: 'waiting' | 'ready';
  updates: PlanUpdate[];
  createdAt?: number;
}`;

const newPlanStr = `export interface Plan {
  id: string;
  symbol: string;
  strategy: string;
    checklist?: Record<string, boolean>;
    setupScore?: number;
  entry?: number; // legacy single entry
  entryZone: {
    min: number;
    max: number;
  };
  target: number; // T1
  targets?: number[]; // [T2, T3]
  stop: number;
  timeStopDays?: number;
  atr?: number;
  status: 'waiting' | 'ready';
  updates: PlanUpdate[];
  createdAt?: number;
}`;

ctx = ctx.replace(oldPlanStr, newPlanStr);
fs.writeFileSync('src/context/TradeContext.tsx', ctx, 'utf8');
console.log('Updated Plan interface');
