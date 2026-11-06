// User-provided US ASIN analysis; preserve missing evidence and source differences.
window.AI_COMPETITOR_SAMPLE = {
  version: 'B0FKB9CYXY-US-user-v1',
  scene: 'competitor_analysis',
  asin: 'B0FKB9CYXY',
  marketplace: 'US',
  status: 'partial',
  basicInfo: {
    productName: 'Mrsdry旅行装洗漱用品8件套（蓝色大号）',
    englishTitle: 'Mrsdry Travel Size Toiletries 8 Pack, TSA Approved 3oz Silicone Squeeze Bottles & Cream Jars with Clear Travel Bag',
    categoryPath: 'Beauty & Personal Care > Tools & Accessories > Refillable Containers > Kits',
    listingDate: '2025-05-02',
    priceUsd: 23.99,
    rating: 4.8,
    reviewCount: 436,
    estimatedSales30d: '估算：1448件/月（Sorftime月销量估算，非精确30天订单数）',
    bsrSmallCategoryRank: '27（Kits；Sorftime）',
    specifications: '8件装：4个3 fl oz（90 ml）硅胶挤压瓶、4个3 fl oz（90 ml）乳霜罐；附透明旅行收纳袋及标签贴纸。收纳袋尺寸约6.46 × 2.87 × 5.31英寸；商品包装尺寸约6.18 × 5.43 × 3.78英寸，重量约1.06磅。当前ASIN变体为Blue - Large。'
  },
  marketPosition: {
    targetUsers: '需要将洗发水、护发素、乳液或面霜分装携带的旅行及随身行李用户；适合希望用一套容器收纳多种日常洗护用品的人。',
    userPainPoints: '旅行时需要把常用洗护用品分装到便携容器中，减少携带大包装的负担。\n需要不同类型的容器分别盛放液体和膏霜类用品。\n希望容器便于灌装、取用和清洁，并能将多件用品集中收纳、区分内容物。',
    usageScenarios: '乘飞机旅行时携带洗发水、护发素及护肤用品。\n度假或短途出行时分装日常洗护用品。\n露营等需要便携携带个人洗护用品的场景。'
  },
  userFeedback: {
    coreNegativeReviews: '未获取到可核验的该ASIN用户评论样本，无法据此归纳真实差评或判断高频问题。',
    reviewImages: []
  },
  developmentAdvice: {
    differentiationDirection: '可针对液体瓶与膏霜罐的不同用途优化套装配置，并清晰标示各容器类型与容量，方便用户按用品选择。\n可进一步优化瓶罐开口与可清洁性，降低灌装和清理残留的操作负担；此为开发方向，并非已确认的竞品缺陷。\n可评估收纳袋分区或容器固定方式，减少多件容器在收纳和取用时混杂。\n可考虑提供更易辨认、耐用的内容物标签，方便旅行中快速区分不同容器。',
    remark: ''
  },
  dataQuality: {
    sourcesUsed: ['Sorftime product_detail（US，ASIN B0FKB9CYXY）', 'Sorftime product_content（US，ASIN B0FKB9CYXY）', 'Sorftime product_reviews（US，ASIN B0FKB9CYXY，Negative）', 'SellerSprite asin_detail（US，ASIN B0FKB9CYXY）'],
    fieldSources: {
      productName: '根据Sorftime商品原始标题翻译整理；AI分析',
      englishTitle: 'Sorftime product_detail，ASIN直接数据',
      categoryPath: 'SellerSprite asin_detail，ASIN直接数据',
      listingDate: 'Sorftime product_detail，ASIN直接数据',
      priceUsd: 'Sorftime product_detail，ASIN直接数据',
      rating: 'Sorftime product_detail，ASIN直接数据；与SellerSprite数据存在差异',
      reviewCount: 'Sorftime product_detail，ASIN直接数据；与SellerSprite数据存在差异',
      estimatedSales30d: 'Sorftime product_detail月销量估算；非精确30天订单数',
      bsrSmallCategoryRank: 'Sorftime product_detail，ASIN直接数据；SellerSprite返回的排名及小类名称不同',
      specifications: 'SellerSprite asin_detail及Sorftime product_detail、product_content；商品规格以商品页面描述为依据',
      targetUsers: '根据标题、商品五点描述及用途进行AI分析',
      userPainPoints: '根据商品用途、五点描述及配置进行AI分析；非实际评论归纳',
      usageScenarios: '根据商品标题及五点描述中的场景进行AI归纳',
      coreNegativeReviews: 'Sorftime product_reviews未返回该ASIN负面评论',
      reviewImages: '未获取到可确认与该ASIN评论关联的图片',
      differentiationDirection: '基于商品描述和规格提出的AI开发建议；不代表已验证的竞品缺陷'
    },
    missingFields: ['可核验的负面评论内容及评论图片'],
    warnings: [
      'Sorftime与SellerSprite返回的评分和评论数不一致：Sorftime为4.8星、436条；SellerSprite为4.6星、597条。基础信息采用Sorftime数据，需以Amazon页面实时数据复核。',
      'Sorftime返回小类排名27（Kits）；SellerSprite返回小类排名25（Refillable Cosmetic Container Kits），排名口径或采集时间可能不同，未混合使用。',
      'Sorftime仅返回该商品父类目Beauty & Personal Care及子类目Kits；categoryPath采用SellerSprite提供的完整层级。',
      '本次评论查询未取得可用负面评论样本，因此不对差评频率或具体问题作结论。'
    ]
  }
};
