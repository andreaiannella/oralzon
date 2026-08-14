import { useTranslation } from 'react-i18next';
import { usePageSEO } from '../../lib/usePageSEO';
import { LegalDocumentPage } from '../components/LegalDocumentPage';
import { getLocalizedCondizioniVendita } from '../../lib/legalLocalization';

export function CondizioniVendita() {

  const { i18n } = useTranslation();
  // SEO: senza questa chiamata la pagina eredita i tag statici di
  // index.html, canonical compreso — che punta alla home e dice a Google
  // di trattare questa pagina come un duplicato della home.
  usePageSEO({
    title: "Condizioni di vendita — Oralzon",
    description: "Condizioni contrattuali applicate agli acquisti effettuati sul marketplace Oralzon tra acquirente e venditore.",
    language: i18n.language,
  });
  return <LegalDocumentPage doc={getLocalizedCondizioniVendita(i18n.language)} />;
}
