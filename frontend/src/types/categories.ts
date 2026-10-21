export interface TalentCategoryMeta {
  id: string;
  name: string;
  nameEn: string;
  badge: string;
  tagline: string;
  description: string;
  priceGuide: string;
  features: string[];
  popularTasks: string[];
}

export const TALENT_CATEGORIES: TalentCategoryMeta[] = [
  {
    id: 'driver',
    name: '司机带车',
    nameEn: 'Driver with Vehicle',
    badge: '商务专车',
    tagline: '商务配车 • 专车接送 • 跨城考察',
    description: '提供别克GL8、丰田埃尔法等高品质商务配车与专业双语司导，涵盖机场专车接送、跨城长途出行、工厂考察通勤。',
    priceGuide: '160 - 260 USDT / 天',
    features: ['含高档商务车/油费/路桥费', '熟悉长三角与珠三角路况', '基础中英双语沟通', '严选驾龄8年以上兼职司导'],
    popularTasks: ['广深港跨城商务专车', '机场VIP全天接送', '东莞/佛山工厂通勤代驾', '多日长途考察租车包办'],
  },
  {
    id: 'guide',
    name: '私人导游',
    nameEn: 'Tour Guide & Companion',
    badge: '持证地陪',
    tagline: '深度文化向导 • 私人定制陪同 • 城市漫游',
    description: '持有国家导游资质的资深兼职地陪与涉外向导，为外籍商务人士或自由行游客量身规划城市文化动线、名胜讲解与特色美食探索。',
    priceGuide: '120 - 200 USDT / 天',
    features: ['国家中英文导游认证', '定制化私人行程动线', '历史人文与地道生活讲解', '兼具跨文化交际礼仪'],
    popularTasks: ['北京故宫长城私享地陪', '上海/杭州江南文化Citywalk', '西安兵马俑深度讲解', '商务考察空档定制一日游'],
  },
  {
    id: 'tech',
    name: '程序员',
    nameEn: 'Programmer & Cloud Dev',
    badge: '技术兼职',
    tagline: '全栈开发 • Cloudflare Workers • 微信生态 • Web3',
    description: '资深兼职架构师与全栈工程师，擅长边缘无服务计算、Web3智能合约、微信小程序及国内本地 API、短信、支付对接。',
    priceGuide: '35 - 60 USDT / 小时',
    features: ['Cloudflare Workers / Vue / Node.js', '微信小程序与中国本地服务集成', 'ERC20 / Pay3 / Web3 签名鉴权', '敏捷高质量交付源码'],
    popularTasks: ['国内服务 API 代理与中间件', '企业微信/小程序定制开发', '出海 Web3 独立站开发', '国内网络环境合规技术调试'],
  },
  {
    id: 'chinese_tutor',
    name: '中文老师',
    nameEn: 'Mandarin Chinese Tutor',
    badge: '对外汉语',
    tagline: '商务汉语 • HSK冲刺 • 沉浸式口语私教',
    description: '对外汉语（TCSOL）专业背景兼职教师，提供针对跨国高管与外籍人士的1对1定制化中文课程，包含线上私教与线下沉浸教学。',
    priceGuide: '25 - 45 USDT / 课时',
    features: ['对外汉语硕士/专业资格', '商务交际汉语速成方案', 'HSK 1-6 级考试针对性辅导', '中英双语双向教学'],
    popularTasks: ['外企外籍高管商务中文集训', '广交会展期应急日常口语', 'HSK 4-6 级保分冲刺', '中国商务谈判礼仪情景模拟'],
  },
  {
    id: 'translation',
    name: '商务翻译',
    nameEn: 'Business Interpreter',
    badge: '展会陪同',
    tagline: '广交会陪同 • 商务谈判 • 跨语境合同跟进',
    description: '熟悉国际贸易规则与商务礼仪的兼职陪同翻译，深度支持广交会、义乌小商品市场及工厂实地商务谈判与合同交涉。',
    priceGuide: '180 - 260 USDT / 天',
    features: ['英语/西语/阿语等多语种支持', '熟悉进出口外贸专业术语', '现场商务谈判应变能力强', '展会物料与合同快速翻译'],
    popularTasks: ['广交会春/秋季展期全程陪同', '义乌国际商贸城选品翻译', '供应商价格谈判与合同签署', '海外客户访华接待翻译'],
  },
  {
    id: 'inspection',
    name: '验厂验货',
    nameEn: 'Factory Audit & QC',
    badge: '品控专家',
    tagline: '实地验厂 • 产线抽检 • 监装集装箱',
    description: '常驻珠三角与长三角工业带的资深质检兼职专家，提供 ISO 合规核验、生产流程排查、样品抽检及集装箱监装出具详尽报告。',
    priceGuide: '200 - 320 USDT / 次',
    features: ['AQL 国际抽样标准执行', '全高清照片与视频留证', '24小时内交付专业中英报告', '覆盖广东/浙江/江苏工厂'],
    popularTasks: ['电子与数码产品出货前检验', '供应商资质与工厂真实性核查', '集装箱装柜现场监装', '产线过程质量（IPQC）抽查'],
  },
  {
    id: 'concierge',
    name: '本地代办',
    nameEn: 'Corporate Concierge',
    badge: '商务管家',
    tagline: '企业注册代办 • 银行预约 • 涉外公证',
    description: '为境外企业在华落地提供全流程兼职商务秘书与代办服务，包括 WFOE 公司核名设立、银行开户预约、法律公证代跑等。',
    priceGuide: '120 - 200 USDT / 事项',
    features: ['熟悉各地外资企业工商政策', '代跑行政大厅与涉外公证处', '专人点对点跟进反馈进度', '严格保密协议签署'],
    popularTasks: ['WFOE 外商独资企业注册代办', '银行涉外商业账户预约协助', '涉外授权书/公证文件代取', '会务与商务考察行程定制'],
  },
];
