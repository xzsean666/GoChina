import { ref, computed } from 'vue';

export type Locale = 'zh' | 'en' | 'ja';

const currentLocale = ref<Locale>('zh');

const messages: Record<Locale, Record<string, string>> = {
  zh: {
    'nav.talents': '人才服务类别',
    'nav.contracts': '我的合约',
    'nav.inquiries': '客服咨询',
    'nav.plans': '订阅套餐',
    'nav.features': '核心特性',
    'nav.dashboard': '个人仪表盘',
    'nav.admin': '管理后台',
    'nav.login': '登录 / 注册',
    'nav.logout': '退出登录',
    'nav.theme': '切换主题',
    'hero.badge': '中国兼职人才库 • 按类别派单 • 客服统筹定制订单',
    'hero.title': 'GoChina 中国兼职用人与按单定制服务平台',
    'hero.subtitle': '按人才类别直接对接：司机带车、导游地陪、程序员研发、中文私教、商务翻译与验厂验货。由客服深度沟通需求并统筹兼职排期、整好定制订单，USDT/USDC 加密安全托管支付。',
    'hero.cta': '浏览人才类别与兼职库',
    'hero.cta_plans': '查看订阅套餐',
    'footer.desc': '面向未来的全球边缘服务交付与中国人才定制合约平台。基于 Cloudflare Workers 与 Pay3 去中心化支付引擎。',
    'footer.privacy': '隐私权政策',
    'footer.terms': '服务条款',
    'footer.rights': 'GoChina Portal. 保留所有权利。',
  },
  en: {
    'nav.talents': 'Talent Categories',
    'nav.contracts': 'My Contracts',
    'nav.inquiries': 'Inquiries',
    'nav.plans': 'Plans & Pricing',
    'nav.features': 'Features',
    'nav.dashboard': 'User Dashboard',
    'nav.admin': 'Admin Panel',
    'nav.login': 'Sign In / Register',
    'nav.logout': 'Sign Out',
    'nav.theme': 'Toggle Theme',
    'hero.badge': 'China Part-Time Talent Network • Category Matching • CS Custom Orders',
    'hero.title': 'GoChina Talent Categories & Custom Service Escrow',
    'hero.subtitle': 'Connect by talent category: Driver with vehicle, Tour guide, Programmer/developer, Chinese tutor, Business interpreter, and Factory inspection. Live support coordinates part-time specialists, finalizes your custom order, and settles via Pay3 crypto escrow.',
    'hero.cta': 'Explore Talent Categories',
    'hero.cta_plans': 'Explore Subscriptions',
    'footer.desc': 'Future-ready global edge talent & service fulfillment platform powered by Cloudflare Workers and Pay3 payment engine.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.rights': 'GoChina Portal. All rights reserved.',
  },
  ja: {
    'nav.talents': '人材カテゴリ一覧',
    'nav.contracts': 'マイ契約',
    'nav.inquiries': 'お問い合わせ',
    'nav.plans': '料金プラン',
    'nav.features': '特徴',
    'nav.dashboard': 'ダッシュボード',
    'nav.admin': '管理パネル',
    'nav.login': 'ログイン / 登録',
    'nav.logout': 'ログアウト',
    'nav.theme': 'テーマ切替',
    'hero.badge': '中国人材ネットワーク • カテゴリ別マッチング • サポート個別契約作成',
    'hero.title': 'GoChina 人材カテゴリ委託＆暗号資産エスクロー',
    'hero.subtitle': '専門カテゴリ（車付きドライバー、観光ガイド、プログラマー、中国語講師、ビジネス通訳、工場監査）ごとに直接ご相談。専任サポートが兼職人材のスケジュールを調整し、オーダーメイド契約を完結。USDT/USDCで安全決済。',
    'hero.cta': 'カテゴリと人材を見る',
    'hero.cta_plans': 'プランを見る',
    'footer.desc': 'Cloudflare Workers と Pay3 決済エンジンを活用したグローバルエッジサービス。',
    'footer.privacy': 'プライバシーポリシー',
    'footer.terms': '利用規約',
    'footer.rights': 'GoChina Portal. 全著作権所有。',
  },
};

export function useI18n() {
  function setLocale(locale: Locale) {
    currentLocale.value = locale;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lang', locale);
    }
  }

  function initLocale() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('lang') as Locale | null;
      if (saved && (saved === 'zh' || saved === 'en' || saved === 'ja')) {
        currentLocale.value = saved;
      }
    }
  }

  function t(key: string): string {
    const table = messages[currentLocale.value] || messages.zh;
    return table[key] || key;
  }

  return {
    locale: computed(() => currentLocale.value),
    setLocale,
    initLocale,
    t,
  };
}
