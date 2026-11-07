import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const TRANSLATIONS: Record<string, Record<Language, string>> = {
  // Navigation / Tabs
  'orders': { en: 'Order Desk', hi: 'ऑर्डर डेस्क' },
  'dashboard': { en: 'Overview', hi: 'ओवरव्यू विश्लेषण' },
  'wallet': { en: 'Financials', hi: 'वित्तीय स्थिति' },
  'retailers': { en: 'Kirana Network', hi: 'किराना नेटवर्क' },
  'catalogue': { en: 'FMCG Catalogue', hi: 'उत्पाद सूची' },
  'schemes': { en: 'Trade Schemes', hi: 'व्यापार योजनाएं' },
  'export': { en: 'Tally Export', hi: 'टैली एक्सपोर्ट' },
  'beat': { en: 'My Beat', hi: 'मेरी बीट' },
  'punch': { en: 'Punch Order', hi: 'ऑर्डर पंच करें' },
  'performance': { en: 'Beat Targets', hi: 'बीट लक्ष्य' },
  'shop': { en: 'Catalogue', hi: 'दुकान कैटलॉग' },
  'ai-pad': { en: 'AI Order Pad', hi: 'एआई ऑर्डर पैड' },
  'my-orders': { en: 'My Orders', hi: 'मेरे ऑर्डर्स' },
  'credit': { en: 'Khata Ledger', hi: 'उधार खाता' },
  'cart': { en: 'Cart', hi: 'टोकरी' },

  // Badges & Labels
  'inStock': { en: 'In Stock', hi: 'स्टॉक में उपलब्ध' },
  'outOfStock': { en: 'Out of Stock', hi: 'स्टॉक समाप्त' },
  'inclGst': { en: 'Incl. GST', hi: 'जीएसटी सहित' },
  'mrp': { en: 'MRP', hi: 'एमआरपी' },
  'dealerRate': { en: 'Wholesale Rate', hi: 'थोक भाव' },
  'margin': { en: 'Margin', hi: 'मार्जिन' },
  'repeatOrder': { en: 'Repeat Order', hi: 'दोबारा आर्डर करें' },
  'taxInvoice': { en: 'Tax Invoice', hi: 'टैक्स इनवॉइस' },
  'signOut': { en: 'Sign Out', hi: 'लॉगआउट' },
  'search': { en: 'Search FMCG products, Kirana stores, SKUs...', hi: 'उत्पाद, बिस्कुट, तेल, किराना खोजें...' },
  'hubBadge': { en: 'Jabalpur Hub', hi: 'जबलपुर हब' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('supplysetu-lang') as Language;
      if (saved === 'hi' || saved === 'en') return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('supplysetu-lang', lang);
    }
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'hi' : 'en';
    setLanguage(next);
  };

  const t = (key: string, fallback?: string): string => {
    if (TRANSLATIONS[key] && TRANSLATIONS[key][language]) {
      return TRANSLATIONS[key][language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
