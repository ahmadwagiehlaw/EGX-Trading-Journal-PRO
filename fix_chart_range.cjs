const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// 1. Fix Plan vs Reality Chart Dynamic Range
const oldChartRangeCode = `                  const minP = position!.plan.stop;
                  const maxP = position!.plan.target;
                  const range = maxP - minP;
                  const entryPercent = Math.max(0, Math.min(100, ((metrics!.avgEntry - minP) / range) * 100));
                  const trailingStopPercent = Math.max(0, Math.min(100, ((currentStop - minP) / range) * 100));
                  const currentPercent = Math.max(0, Math.min(100, ((metrics!.currentPrice - minP) / range) * 100));`;

const newChartRangeCode = `                  const rawMin = position!.plan.stop;
                  const rawMax = position!.plan.target;
                  // Dynamic range to prevent stacking/clamping when prices go out of bounds
                  const chartMin = Math.min(rawMin, metrics!.avgEntry, metrics!.currentPrice, currentStop, rawMax);
                  const chartMax = Math.max(rawMax, metrics!.avgEntry, metrics!.currentPrice, currentStop, rawMin);
                  const range = chartMax - chartMin || 1; // avoid division by zero
                  
                  const getPercent = (val: number) => ((val - chartMin) / range) * 100;
                  
                  const stopPercent = getPercent(rawMin);
                  const targetPercent = getPercent(rawMax);
                  const entryPercent = getPercent(metrics!.avgEntry);
                  const trailingStopPercent = getPercent(currentStop);
                  const currentPercent = getPercent(metrics!.currentPrice);`;

c = c.replace(oldChartRangeCode, newChartRangeCode);

// Also fix the markers to use the new calculated percents instead of '0%' and '100%'
c = c.replace(/style=\{\{ right: '0%', transform: 'translateX\(50\%\)', bottom: '100%', marginBottom: '14px' \}\}/g, 
  "style={{ right: `${stopPercent}%`, transform: 'translateX(50%)', bottom: '100%', marginBottom: '14px' }}");
c = c.replace(/style=\{\{ right: '100%', transform: 'translateX\(50\%\)', bottom: '100%', marginBottom: '14px' \}\}/g, 
  "style={{ right: `${targetPercent}%`, transform: 'translateX(50%)', bottom: '100%', marginBottom: '14px' }}");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Chart range fixed');
