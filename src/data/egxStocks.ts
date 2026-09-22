export interface EGXStock {
  symbol: string;
  nameAr: string;
  nameEn: string;
  sector: string;
}

export const EGX_STOCKS: EGXStock[] = [
  // EGX 30 & Main Blue Chips
  { symbol: 'COMI', nameAr: 'البنك التجاري الدولي (مصر)', nameEn: 'Commercial International Bank (CIB)', sector: 'بنوك' },
  { symbol: 'HRHO', nameAr: 'المجموعة المالية هيرميس القابضة', nameEn: 'EFG Holding', sector: 'خدمات مالية' },
  { symbol: 'TMGH', nameAr: 'مجموعة طلعت مصطفى القابضة', nameEn: 'Talaat Moustafa Group', sector: 'عقارات' },
  { symbol: 'SWDY', nameAr: 'السويدي إلكتريك', nameEn: 'Elsewedy Electric', sector: 'صناعي' },
  { symbol: 'MFPC', nameAr: 'مصر لإنتاج الأسمدة - موبكو', nameEn: 'Misr Fertilizers Production Company (MOPCO)', sector: 'كيماويات' },
  { symbol: 'ABUK', nameAr: 'أبو قير للأسمدة والصناعات الكيماوية', nameEn: 'Abu Qir Fertilizers', sector: 'كيماويات' },
  { symbol: 'EKHO', nameAr: 'القابضة المصرية الكويتية', nameEn: 'Egypt Kuwait Holding (USD)', sector: 'استثمار' },
  { symbol: 'EKHOA', nameAr: 'القابضة المصرية الكويتية (بالجنيه)', nameEn: 'Egypt Kuwait Holding (EGP)', sector: 'استثمار' },
  { symbol: 'ETEL', nameAr: 'المصرية للاتصالات (وي)', nameEn: 'Telecom Egypt', sector: 'اتصالات' },
  { symbol: 'FWRY', nameAr: 'فوري لتكنولوجيا البنوك والمدفوعات', nameEn: 'Fawry for Banking Technology', sector: 'تكنولوجيا' },
  { symbol: 'EFIH', nameAr: 'إي فاينانس للاستثمارات المالية والرقمية', nameEn: 'e-finance for Digital and Financial Investments', sector: 'تكنولوجيا' },
  { symbol: 'ESRS', nameAr: 'حديد عز', nameEn: 'Ezz Steel', sector: 'مواد أساسية' },
  { symbol: 'ORAS', nameAr: 'أوراسكوم كونستراكشون', nameEn: 'Orascom Construction', sector: 'مقاولات' },
  { symbol: 'ORWE', nameAr: 'النساجون الشرقيون للسجاد', nameEn: 'Oriental Weavers', sector: 'منسوجات' },
  { symbol: 'EAST', nameAr: 'الشركة الشرقية - إيسترن كومباني', nameEn: 'Eastern Company', sector: 'أغذية ومشروبات' },
  { symbol: 'ESRP', nameAr: 'إيسترن كومباني - الشرقية للدخان', nameEn: 'Eastern Tobacco Co', sector: 'صناعي' },
  
  // Pharma & Healthcare
  { symbol: 'PHAR', nameAr: 'الشركة المصرية الدولية للصناعات الدوائية (إيبيكو)', nameEn: 'Egyptian International Pharma (EIPICO)', sector: 'رعاية صحية' },
  { symbol: 'ISPH', nameAr: 'ابن سينا فارما', nameEn: 'Ibnsina Pharma', sector: 'رعاية صحية' },
  { symbol: 'RMDA', nameAr: 'العاشر من رمضان للصناعات الدوائية (راميدا)', nameEn: 'Tenth of Ramadan Pharma (Rameda)', sector: 'رعاية صحية' },
  { symbol: 'MPCI', nameAr: 'ممفيس للأدوية والصناعات الكيماوية', nameEn: 'Memphis Pharmaceuticals', sector: 'رعاية صحية' },
  { symbol: 'AXPH', nameAr: 'الإسكندرية للأدوية والصناعات الكيماوية', nameEn: 'Alexandria Pharmaceuticals', sector: 'رعاية صحية' },
  { symbol: 'NIPH', nameAr: 'النيل للأدوية والصناعات الكيماوية', nameEn: 'Nile Pharmaceuticals', sector: 'رعاية صحية' },
  { symbol: 'CLHO', nameAr: 'كليوباترا للمستشفيات', nameEn: 'Cleopatra Hospital Company', sector: 'رعاية صحية' },
  { symbol: 'SPMD', nameAr: 'سبيد ميديكال', nameEn: 'Speed Medical', sector: 'رعاية صحية' },
  { symbol: 'IDHC', nameAr: 'المجموعة الدولية للرعاية الصحية', nameEn: 'Integrated Diagnostics Holdings (IDH)', sector: 'رعاية صحية' },
  { symbol: 'ICID', nameAr: 'الدولية للصناعات الطبية (إيكميد)', nameEn: 'International Medical Industries (ICMED)', sector: 'رعاية صحية' },

  // Food & Beverages
  { symbol: 'EFID', nameAr: 'إيديتا للصناعات الغذائية', nameEn: 'Edita Food Industries', sector: 'أغذية ومشروبات' },
  { symbol: 'JUFO', nameAr: 'جهينة للصناعات الغذائية', nameEn: 'Juhayna Food Industries', sector: 'أغذية ومشروبات' },
  { symbol: 'DOMT', nameAr: 'الصناعات الغذائية العربية (دومتي)', nameEn: 'Arabian Food Industries (Domty)', sector: 'أغذية ومشروبات' },
  { symbol: 'OLFI', nameAr: 'عبور لاند للصناعات الغذائية', nameEn: 'Obour Land for Food Industries', sector: 'أغذية ومشروبات' },
  { symbol: 'POUL', nameAr: 'القاهرة للدواجن', nameEn: 'Cairo Poultry', sector: 'أغذية ومشروبات' },
  { symbol: 'DAPH', nameAr: 'الدلتا للسكر', nameEn: 'Delta Sugar', sector: 'أغذية ومشروبات' },
  { symbol: 'MOED', nameAr: 'المنصورة للدواجن', nameEn: 'Mansoura Poultry', sector: 'أغذية ومشروبات' },
  { symbol: 'SNFC', nameAr: 'الشرقية الوطنية للأمن الغذائي', nameEn: 'Sharkia National Food Security', sector: 'أغذية ومشروبات' },
  { symbol: 'AJWA', nameAr: 'أجواء للصناعات الغذائية', nameEn: 'Ajwa for Food Industries', sector: 'أغذية ومشروبات' },
  { symbol: 'COSG', nameAr: 'القاهرة للزيوت والصابون', nameEn: 'Cairo Oils & Soap', sector: 'أغذية ومشروبات' },
  { symbol: 'ZEOT', nameAr: 'الزيوت المستخلصة ومنتجاتها', nameEn: 'Extracted Oils', sector: 'أغذية ومشروبات' },
  { symbol: 'SMPP', nameAr: 'مطاحن ومخابز شمال القاهرة', nameEn: 'North Cairo Flour Mills', sector: 'أغذية ومشروبات' },
  { symbol: 'MBSC', nameAr: 'مطاحن مصر الوسطى', nameEn: 'Middle Egypt Flour Mills', sector: 'أغذية ومشروبات' },
  { symbol: 'SPHT', nameAr: 'مطاحن ومخابز جنوب القاهرة والجيزة', nameEn: 'South Cairo & Giza Flour Mills', sector: 'أغذية ومشروبات' },
  { symbol: 'WCDF', nameAr: 'مطاحن ومخابز الإسكندرية', nameEn: 'Alexandria Flour Mills', sector: 'أغذية ومشروبات' },
  { symbol: 'CSAG', nameAr: 'مطاحن ومخابز غرب ووسط الدلتا', nameEn: 'Middle & West Delta Flour Mills', sector: 'أغذية ومشروبات' },

  // Real Estate & Construction
  { symbol: 'HELI', nameAr: 'مصر الجديدة للإسكان والتعمير', nameEn: 'Heliopolis Housing', sector: 'عقارات' },
  { symbol: 'MNHD', nameAr: 'مدينة مصر للإسكان والتعمير', nameEn: 'Madinet Masr Housing', sector: 'عقارات' },
  { symbol: 'PHDC', nameAr: 'بالم هيلز للتعمير', nameEn: 'Palm Hills Developments', sector: 'عقارات' },
  { symbol: 'OCDI', nameAr: 'السادس من أكتوبر للتنمية والاستثمار (سوديك)', nameEn: 'SODIC', sector: 'عقارات' },
  { symbol: 'ORHD', nameAr: 'أوراسكوم للتنمية مصر', nameEn: 'Orascom Development Egypt', sector: 'عقارات' },
  { symbol: 'ARAB', nameAr: 'المطورون العرب القابضة', nameEn: 'Arab Developers Holding', sector: 'عقارات' },
  { symbol: 'ACAMD', nameAr: 'القاهرة للإسكان والتعمير', nameEn: 'Cairo Housing & Development', sector: 'عقارات' },
  { symbol: 'ELSH', nameAr: 'الشمس للإسكان والتعمير', nameEn: 'El Shams Housing & Urbanization', sector: 'عقارات' },
  { symbol: 'ZMID', nameAr: 'زهراء المعادي للاستثمار والتعمير', nameEn: 'Zahraa Maadi Investment & Development', sector: 'عقارات' },
  { symbol: 'UNIT', nameAr: 'المتحدة للإسكان والتعمير', nameEn: 'United Housing & Development', sector: 'عقارات' },
  { symbol: 'PORT', nameAr: 'بورتو جروب القابضة (أسماك)', nameEn: 'Porto Group Holding', sector: 'عقارات' },
  { symbol: 'AMER', nameAr: 'عامر جروب القابضة', nameEn: 'Amer Group Holding', sector: 'عقارات' },
  { symbol: 'MENA', nameAr: 'مينا للاستثمار السياحي والعقاري', nameEn: 'Mena Touristic & Real Estate', sector: 'عقارات' },
  { symbol: 'UEGC', nameAr: 'الصعيد العامة للمقاولات والاستثمار', nameEn: 'Upper Egypt Contracting', sector: 'مقاولات' },
  { symbol: 'GDCO', nameAr: 'الجيزة العامة للمقاولات والاستثمار', nameEn: 'Giza General Contracting', sector: 'مقاولات' },
  { symbol: 'NCCW', nameAr: 'النصر للأعمال المدنية', nameEn: 'Al Nasr Civil Works', sector: 'مقاولات' },

  // Banking & Financial Services
  { symbol: 'CIEB', nameAr: 'بنك كريدي أجريكول مصر', nameEn: 'Credit Agricole Egypt', sector: 'بنوك' },
  { symbol: 'ADIB', nameAr: 'مصرف أبوظبي الإسلامي - مصر', nameEn: 'Abu Dhabi Islamic Bank - Egypt', sector: 'بنوك' },
  { symbol: 'FAIT', nameAr: 'بنك فيصل الإسلامي المصري', nameEn: 'Faisal Islamic Bank of Egypt', sector: 'بنوك' },
  { symbol: 'QNBA', nameAr: 'بنك قطر الوطني الأهلي', nameEn: 'QNB Alahli', sector: 'بنوك' },
  { symbol: 'HDBK', nameAr: 'بنك التعمير والإسكان', nameEn: 'Housing & Development Bank', sector: 'بنوك' },
  { symbol: 'SAIB', nameAr: 'بنك الشركة المصرفية العربية الدولية (saib)', nameEn: 'Societe Arabe Internationale de Banque', sector: 'بنوك' },
  { symbol: 'EGBE', nameAr: 'البنك المصري لتنمية الصادرات (EBank)', nameEn: 'Export Development Bank of Egypt', sector: 'بنوك' },
  { symbol: 'BTFH', nameAr: 'بلتون المالية القابضة', nameEn: 'Beltone Financial Holding', sector: 'خدمات مالية' },
  { symbol: 'CCAP', nameAr: 'القلعة للاستشارات المالية', nameEn: 'Qalaa Holdings', sector: 'استثمار' },
  { symbol: 'BINV', nameAr: 'بي إنفستمنتس القابضة', nameEn: 'B Investments Holding', sector: 'استثمار' },
  { symbol: 'VALU', nameAr: 'فاليو لخدمات التمويل الاستهلاكي', nameEn: 'valU', sector: 'خدمات مالية' },
  { symbol: 'OFH', nameAr: 'أوراسكوم المالية القابضة', nameEn: 'Orascom Financial Holding', sector: 'خدمات مالية' },
  { symbol: 'OIH', nameAr: 'أوراسكوم للاستثمار القابضة', nameEn: 'Orascom Investment Holding', sector: 'استثمار' },
  { symbol: 'AIND', nameAr: 'العربية للاستثمارات والتنمية القابضة', nameEn: 'Arabia Investments Holding', sector: 'استثمار' },

  // Energy, Chemicals & Oil
  { symbol: 'AMOC', nameAr: 'الإسكندرية للزيوت المعدنية (أموك)', nameEn: 'Alexandria Mineral Oils Co (AMOC)', sector: 'طاقة وبترول' },
  { symbol: 'SKPC', nameAr: 'سيدي كرير للبتروكيماويات (سيدبك)', nameEn: 'Sidi Kerir Petrochemicals', sector: 'كيماويات' },
  { symbol: 'TAQA', nameAr: 'طاقة عربية', nameEn: 'TAQA Arabia', sector: 'طاقة وبترول' },
  { symbol: 'EGCH', nameAr: 'الصناعات الكيماوية المصرية (كيما)', nameEn: 'Egyptian Chemical Industries (KIMA)', sector: 'كيماويات' },
  { symbol: 'MICH', nameAr: 'مصر للكيماويات', nameEn: 'Misr Chemical Industries', sector: 'كيماويات' },
  { symbol: 'MOIL', nameAr: 'الخدمات الملاحية والبترولية (ماريديف)', nameEn: 'Maridive & Oil Services', sector: 'طاقة وبترول' },

  // Industrial & Basic Materials
  { symbol: 'EGAL', nameAr: 'مصر للألومنيوم', nameEn: 'Egypt Aluminium', sector: 'مواد أساسية' },
  { symbol: 'ATQA', nameAr: 'مصر الوطنية للصلب - عتاقة', nameEn: 'Misr National Steel (Ataqa)', sector: 'مواد أساسية' },
  { symbol: 'IRON', nameAr: 'الحديد والصلب المصرية', nameEn: 'Egyptian Iron & Steel', sector: 'مواد أساسية' },
  { symbol: 'IRAX', nameAr: 'الحديد والصلب للمناجم والمحاجر', nameEn: 'Iron and Steel for Mines and Quarries', sector: 'مواد أساسية' },
  { symbol: 'ARCC', nameAr: 'العربية للأسمنت', nameEn: 'Arabian Cement', sector: 'صناعي' },
  { symbol: 'SCEM', nameAr: 'سيناء للأسمنت', nameEn: 'Sinai Cement', sector: 'صناعي' },
  { symbol: 'MCQE', nameAr: 'مصر للأسمنت - قنا', nameEn: 'Misr Cement Qena', sector: 'صناعي' },
  { symbol: 'SVCE', nameAr: 'جنوب الوادي للأسمنت', nameEn: 'South Valley Cement', sector: 'صناعي' },
  { symbol: 'DSCW', nameAr: 'دايس للملابس الجاهزة', nameEn: 'Dice Sport & Casual Wear', sector: 'منسوجات' },
  { symbol: 'KABO', nameAr: 'النصر للملابس والمنسوجات (كابو)', nameEn: 'El Nasr Clothing & Textiles (KABO)', sector: 'منسوجات' },
  { symbol: 'UNIP', nameAr: 'يونيفرسال لصناعة مواد التعبئة والتغليف', nameEn: 'Universal Company for Paper Packaging', sector: 'صناعي' },

  // Transport & Logistics & Automotive
  { symbol: 'ALCN', nameAr: 'الإسكندرية لتداول الحاويات والبضائع', nameEn: 'Alexandria Containers & Goods', sector: 'نقل وشحن' },
  { symbol: 'GBCO', nameAr: 'جي بي كوربوريشن (غبور)', nameEn: 'GB Corp', sector: 'سيارات' },
  { symbol: 'AUTO', nameAr: 'أوتو موبيلتي', nameEn: 'Auto Mobility', sector: 'سيارات' },

  // Technology & Telecom
  { symbol: 'RAYA', nameAr: 'راية القابضة للاستثمارات المالية', nameEn: 'Raya Holding', sector: 'تكنولوجيا' },
  { symbol: 'RACC', nameAr: 'راية لخدمات مراكز الاتصالات', nameEn: 'Raya Contact Center', sector: 'تكنولوجيا' },
  { symbol: 'VERT', nameAr: 'فيرتيكا للبرمجيات', nameEn: 'Vertika for Software', sector: 'تكنولوجيا' },

  // Tourism & Education
  { symbol: 'EPCO', nameAr: 'المصرية للمنتجعات السياحية', nameEn: 'Egyptian Resorts Company', sector: 'سياحة وترفيه' },
  { symbol: 'ROTO', nameAr: 'الرواد للسياحة (رواد)', nameEn: 'Rowad Tourism', sector: 'سياحة وترفيه' },
  { symbol: 'EGTS', nameAr: 'المصرية للمشروعات السياحية والعالمية', nameEn: 'Egyptian Tourism Resorts', sector: 'سياحة وترفيه' },
  { symbol: 'TALM', nameAr: 'تعليم لخدمات الإدارة', nameEn: 'Taaleem Management Services', sector: 'خدمات تعليمية' },
  { symbol: 'CIRA', nameAr: 'القاهرة للاستثمار والتنمية العقارية (سيرا للتعليم)', nameEn: 'CIRA Education', sector: 'خدمات تعليمية' },
  { symbol: 'ELEC', nameAr: 'القاهرة للخدمات التعليمية', nameEn: 'Cairo Educational Services', sector: 'خدمات تعليمية' }
];

export function searchEGXStocks(query: string): EGXStock[] {
  if (!query || query.trim() === '') return EGX_STOCKS.slice(0, 10);
  const q = query.trim().toLowerCase();

  return EGX_STOCKS.filter(stock => 
    stock.symbol.toLowerCase().includes(q) ||
    stock.nameAr.toLowerCase().includes(q) ||
    stock.nameEn.toLowerCase().includes(q) ||
    stock.sector.toLowerCase().includes(q)
  );
}

export function getStockBySymbol(symbol: string): EGXStock | undefined {
  if (!symbol) return undefined;
  return EGX_STOCKS.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
}
