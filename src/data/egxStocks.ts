export interface EGXStock {
  symbol: string;
  nameAr: string;
  nameEn: string;
  sector: string;
}

export const EGX_STOCKS: EGXStock[] = [
  // EGX 30 & Blue Chips
  { symbol: 'COMI', nameAr: 'البنك التجاري الدولي (مصر)', nameEn: 'Commercial International Bank', sector: 'بنوك' },
  { symbol: 'HRHO', nameAr: 'المجموعة المالية هيرميس القابضة', nameEn: 'EFG Holding', sector: 'خدمات مالية' },
  { symbol: 'TMGH', nameAr: 'مجموعة طلعت مصطفى القابضة', nameEn: 'Talaat Moustafa Group', sector: 'عقارات' },
  { symbol: 'SWDY', nameAr: 'السويدي إلكتريك', nameEn: 'Elsewedy Electric', sector: 'صناعي' },
  { symbol: 'MFPC', nameAr: 'مصر لإنتاج الأسمدة - موبكو', nameEn: 'Misr Fertilizers Production Company (MOPCO)', sector: 'كيماويات' },
  { symbol: 'ABUK', nameAr: 'أبو قير للأسمدة والصناعات الكيماوية', nameEn: 'Abu Qir Fertilizers', sector: 'كيماويات' },
  { symbol: 'EKHO', nameAr: 'القابضة المصرية الكويتية', nameEn: 'Egypt Kuwait Holding', sector: 'استثمار' },
  { symbol: 'ETEL', nameAr: 'المصرية للاتصالات (وي)', nameEn: 'Telecom Egypt', sector: 'اتصالات' },
  { symbol: 'FWRY', nameAr: 'فوري لتكنولوجيا البنوك والمدفوعات', nameEn: 'Fawry for Banking Technology', sector: 'تكنولوجيا' },
  { symbol: 'EFIH', nameAr: 'إي فاينانس للاستثمارات المالية والرقمية', nameEn: 'e-finance for Digital and Financial Investments', sector: 'تكنولوجيا' },
  { symbol: 'ESRS', nameAr: 'حديد عز', nameEn: 'Ezz Steel', sector: 'مواد أساسية' },
  { symbol: 'ORAS', nameAr: 'أوراسكوم كونستراكشون', nameEn: 'Orascom Construction', sector: 'مقاولات' },
  { symbol: 'ORWE', nameAr: 'النساجون الشرقيون للسجاد', nameEn: 'Oriental Weavers', sector: 'منسوجات' },
  { symbol: 'JUFO', nameAr: 'جهينة للصناعات الغذائية', nameEn: 'Juhayna Food Industries', sector: 'أغذية ومشروبات' },
  { symbol: 'DOMT', nameAr: 'الصناعات الغذائية العربية (دومتي)', nameEn: 'Arabian Food Industries (Domty)', sector: 'أغذية ومشروبات' },
  { symbol: 'HELI', nameAr: 'مصر الجديدة للإسكان والتعمير', nameEn: 'Heliopolis Housing', sector: 'عقارات' },
  { symbol: 'MNHD', nameAr: 'مدينة مصر للإسكان والتعمير', nameEn: 'Madinet Masr Housing', sector: 'عقارات' },
  { symbol: 'PHDC', nameAr: 'بالم هيلز للتعمير', nameEn: 'Palm Hills Developments', sector: 'عقارات' },
  { symbol: 'OCDI', nameAr: 'السادس من أكتوبر للتنمية والاستثمار (سوديك)', nameEn: 'SODIC', sector: 'عقارات' },
  { symbol: 'AMOC', nameAr: 'الإسكندرية للزيوت المعدنية (أموك)', nameEn: 'Alexandria Mineral Oils Co (AMOC)', sector: 'طاقة وبترول' },
  { symbol: 'SKPC', nameAr: 'سيدي كرير للبتروكيماويات (سيدبك)', nameEn: 'Sidi Kerir Petrochemicals', sector: 'كيماويات' },
  { symbol: 'ISPH', nameAr: 'ابن سينا فارما', nameEn: 'Ibnsina Pharma', sector: 'رعاية صحية' },
  { symbol: 'CIEB', nameAr: 'بنك كريدي أجريكول مصر', nameEn: 'Credit Agricole Egypt', sector: 'بنوك' },
  { symbol: 'ADIB', nameAr: 'مصرف أبوظبي الإسلامي - مصر', nameEn: 'Abu Dhabi Islamic Bank - Egypt', sector: 'بنوك' },
  { symbol: 'FAIT', nameAr: 'بنك فيصل الإسلامي المصري', nameEn: 'Faisal Islamic Bank of Egypt', sector: 'بنوك' },
  { symbol: 'QNBA', nameAr: 'بنك قطر الوطني الأهلي', nameEn: 'QNB Alahli', sector: 'بنوك' },
  { symbol: 'HDBK', nameAr: 'بنك التعمير والإسكان', nameEn: 'Housing & Development Bank', sector: 'بنوك' },
  { symbol: 'ALCN', nameAr: 'الإسكندرية لتداول الحاويات والبضائع', nameEn: 'Alexandria Containers & Goods', sector: 'نقل وشحن' },
  { symbol: 'GBCO', nameAr: 'جي بي كوربوريشن (غبور)', nameEn: 'GB Corp', sector: 'سيارات' },
  { symbol: 'AUTO', nameAr: 'أوتو موبيلتي', nameEn: 'Auto Mobility', sector: 'سيارات' },
  { symbol: 'EGAL', nameAr: 'مصر للألومنيوم', nameEn: 'Egypt Aluminium', sector: 'مواد أساسية' },
  { symbol: 'BTFH', nameAr: 'بلتون المالية القابضة', nameEn: 'Beltone Financial Holding', sector: 'خدمات مالية' },
  { symbol: 'CCAP', nameAr: 'القلعة للاستشارات المالية', nameEn: 'Qalaa Holdings', sector: 'استثمار' },
  { symbol: 'POUL', nameAr: 'القاهرة للدواجن', nameEn: 'Cairo Poultry', sector: 'أغذية' },
  { symbol: 'OLFI', nameAr: 'عبور لاند للصناعات الغذائية', nameEn: 'Obour Land for Food Industries', sector: 'أغذية ومشروبات' },
  { symbol: 'EPCO', nameAr: 'المصرية للمنتجعات السياحية', nameEn: 'Egyptian Resorts Company', sector: 'سياحة وترفيه' },
  { symbol: 'TALM', nameAr: 'تعليم لخدمات الإدارة', nameEn: 'Taaleem Management Services', sector: 'خدمات تعليمية' },
  { symbol: 'CLHO', nameAr: 'كليوباترا للمستشفيات', nameEn: 'Cleopatra Hospital Company', sector: 'رعاية صحية' },
  { symbol: 'RMDA', nameAr: 'العاشر من رمضان للصناعات الدوائية (راميدا)', nameEn: 'Rameda', sector: 'أدوية' },
  { symbol: 'DSCW', nameAr: 'دايس للملابس الجاهزة', nameEn: 'Dice Sport & Casual Wear', sector: 'منسوجات' },
  { symbol: 'ARAB', nameAr: 'المطورون العرب القابضة', nameEn: 'Arab Developers Holding', sector: 'عقارات' },
  { symbol: 'ACAMD', nameAr: 'القاهرة للإسكان والتعمير', nameEn: 'Cairo Housing & Development', sector: 'عقارات' },
  { symbol: 'ORHD', nameAr: 'أوراسكوم للتنمية مصر', nameEn: 'Orascom Development Egypt', sector: 'عقارات وسياحة' },
  { symbol: 'RAYA', nameAr: 'راية القابضة للاستثمارات المالية', nameEn: 'Raya Holding', sector: 'تكنولوجيا' },
  { symbol: 'RACC', nameAr: 'راية لخدمات مراكز الاتصالات', nameEn: 'Raya Contact Center', sector: 'تكنولوجيا' }
];

export function searchEGXStocks(query: string): EGXStock[] {
  if (!query || query.trim() === '') return EGX_STOCKS.slice(0, 8);
  const q = query.trim().toLowerCase();

  return EGX_STOCKS.filter(stock => 
    stock.symbol.toLowerCase().includes(q) ||
    stock.nameAr.includes(query.trim()) ||
    stock.nameEn.toLowerCase().includes(q) ||
    stock.sector.includes(query.trim())
  );
}

export function getStockBySymbol(symbol: string): EGXStock | undefined {
  if (!symbol) return undefined;
  return EGX_STOCKS.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
}
