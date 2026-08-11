import { useTranslation } from 'react-i18next';
import { Fragment } from 'react';
import type { LegalDocument } from '../../data/legalContent';

// Converte "testo **grassetto** altro testo" in nodi React con <strong> per
// le parti tra **, senza dover scrivere JSX misto nei dati — così il
// contenuto resta testo puro traducibile, non markup React.
function renderWithBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// Pagina generica per un documento legale (Termini di Servizio, Condizioni
// di Vendita) — riceve il documento già localizzato nella lingua corrente
// (vedi lib/legalLocalization.ts) e si occupa solo del rendering, identico
// per entrambi i documenti.
export function LegalDocumentPage({ doc }: { doc: LegalDocument }) {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
      <p className="text-gray-500 text-sm mb-8">{t('legalPages.lastUpdated')}: {doc.lastUpdated}</p>
      <div className="bg-accent border border-oralzon-mint-fresh/30 rounded-lg p-3 text-xs text-oralzon-steel-ink mb-6">{t('legalPages.italianNotice')}</div>
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        {doc.sections.map((section, i) => (
          <section key={i}>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{section.heading}</h2>
            {section.paragraphs?.map((p, j) => (
              <p key={j} className={j > 0 ? 'mt-2' : ''}>{renderWithBold(p)}</p>
            ))}
            {section.bullets && (
              <ul className="list-disc pl-6 space-y-1">
                {section.bullets.map((b, j) => (
                  <li key={j}>{renderWithBold(b)}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
