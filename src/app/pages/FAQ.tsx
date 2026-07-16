import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function FAQ() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen(open === key ? null : key);

  const faqs = [
    { cat: t('faqPage.catCustomers'), items: [
      { q: t('faqPage.c1q'), a: t('faqPage.c1a') },
      { q: t('faqPage.c2q'), a: t('faqPage.c2a') },
      { q: t('faqPage.c3q'), a: t('faqPage.c3a') },
      { q: t('faqPage.c4q'), a: t('faqPage.c4a') },
      { q: t('faqPage.c5q'), a: t('faqPage.c5a') },
      { q: t('faqPage.c6q'), a: t('faqPage.c6a') },
      { q: t('faqPage.c7q'), a: t('faqPage.c7a') },
    ]},
    { cat: t('faqPage.catVendors'), items: [
      { q: t('faqPage.v1q'), a: t('faqPage.v1a') },
      { q: t('faqPage.v2q'), a: t('faqPage.v2a') },
      { q: t('faqPage.v3q'), a: t('faqPage.v3a') },
      { q: t('faqPage.v4q'), a: t('faqPage.v4a') },
      { q: t('faqPage.v5q'), a: t('faqPage.v5a') },
      { q: t('faqPage.v6q'), a: t('faqPage.v6a') },
    ]},
    { cat: t('faqPage.catProducts'), items: [
      { q: t('faqPage.p1q'), a: t('faqPage.p1a') },
      { q: t('faqPage.p2q'), a: t('faqPage.p2a') },
      { q: t('faqPage.p3q'), a: t('faqPage.p3a') },
    ]},
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('faqPage.pageTitle')}</h1>
        <p className="text-gray-500">{t('faqPage.pageSubtitle')}</p>
      </div>
      <div className="space-y-8">
        {faqs.map(section => (
          <div key={section.cat}>
            <h2 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-primary/20">{section.cat}</h2>
            <div className="space-y-2">
              {section.items.map((item, i) => {
                const key = `${section.cat}-${i}`;
                const isOpen = open === key;
                return (
                  <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-sm text-gray-900">{item.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </button>
                    {isOpen && <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{item.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 p-6 bg-primary/5 rounded-2xl text-center">
        <p className="font-medium text-gray-900 mb-2">{t('faqPage.noAnswerFound')}</p>
        <p className="text-sm text-gray-500 mb-4">{t('faqPage.teamAvailable')}</p>
        <a href="mailto:support@oralzon.com" className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          {t('faqPage.contactUs')}
        </a>
      </div>
    </div>
  );
}
