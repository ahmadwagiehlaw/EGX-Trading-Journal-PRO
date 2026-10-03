const fs = require('fs');
let roadmap = fs.readFileSync('C:\\Users\\ahmed\\.gemini\\antigravity\\brain\\d6f5dce2-59b9-4b9b-8462-7a96cb31d7fd\\EGX_Pro_Master_Roadmap.md', 'utf8');

// Insert Risk/Reward and Dashboard metrics into the roadmap
const additionalGaps = `
## المرحلة الخامسة: قيود ومؤشرات إدارة المخاطر المتقدمة (Risk & Metrics Upgrades)
تمت إضافة هذه المرحلة بناءً على مراجعة دقيقة للفجوات الاستراتيجية في التطبيق:

* [ ] **1. العائد للمخاطرة (Risk/Reward Ratio) في خطط التداول:**
  * حساب الـ R:R تلقائياً عند إدخال الدخول والوقف والهدف.
  * عرض تحذير باللون الأحمر إذا كانت النسبة أقل من (1:2) لمنع التداول العشوائي.
* [ ] **2. مقياس السيولة مقابل الأسهم (Cash vs Equity Exposure):**
  * إضافة رسم بياني دائري (Pie Chart) أو شريط في لوحة القيادة يعرض نسبة "الكاش المتاح" مقابل "الأموال المستثمرة".
  * يساعد مدير المحفظة على تفادي الاحتفاظ بكاش 100% في قمة السوق، أو عدم توفر سيولة للتعديل.
* [ ] **3. الضرائب والانزلاق السعري (Taxes & Slippage):**
  * ترقية إعدادات العمولات لتشمل الضرائب (دمغة، أرباح رأسمالية) والانزلاق السعري (Slippage) في السوق المصري، لحساب صافي الربح بدقة تامة.
* [ ] **4. سقف المخاطرة الكلي (Global Risk Tolerance):**
  * تحديد نسبة أقصى مخاطرة مسموحة في الصفقة الواحدة (مثال 2%) في الإعدادات.
  * إطلاق إنذار تلقائي إذا حاول المتداول شراء كمية تتجاوز هذه القاعدة.
* [ ] **5. مؤشر توقع الربح (Expectancy):**
  * عرض مؤشر توقع الربح (متوسط ربح الصفقة الرابحة مقارنة بمتوسط خسارة الصفقة الخاسرة) في لوحة القيادة إلى جانب "نسبة النجاح".

---
`;

const splitPoint = roadmap.indexOf("## 🛠 التوصيات البرمجية والمعمارية");
if (splitPoint > -1) {
    const newRoadmap = roadmap.slice(0, splitPoint) + additionalGaps + roadmap.slice(splitPoint);
    fs.writeFileSync('C:\\Users\\ahmed\\.gemini\\antigravity\\brain\\d6f5dce2-59b9-4b9b-8462-7a96cb31d7fd\\EGX_Pro_Master_Roadmap.md', newRoadmap, 'utf8');
    console.log("✓ Updated roadmap with Phase 5");
} else {
    console.log("Error finding split point");
}
