const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const insightsLogicStart = code.indexOf('const generateInsights = () => {');
const insightsLogicEnd = code.indexOf('return insights;', insightsLogicStart);

let insightsLogic = code.slice(insightsLogicStart, insightsLogicEnd);

// Add a default insight if empty
insightsLogic += `
    // 5. Default/Neutral Insight
    if (insights.length === 0) {
      insights.push({ type: 'info', text: 'التمركز مستقر ضمن النطاق الآمن حالياً. حافظ على التزامك بالخطة المحددة وراقب مستويات الدعم والمقاومة.' });
    }
    `;

code = code.slice(0, insightsLogicStart) + insightsLogic + code.slice(insightsLogicEnd);
fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log('Added default insight');
