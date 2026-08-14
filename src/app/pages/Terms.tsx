import { useTranslation } from 'react-i18next';
import { usePageSEO } from '../../lib/usePageSEO';
import { LegalDocumentPage } from '../components/LegalDocumentPage';
import { getLocalizedTermini } from '../../lib/legalLocalization';

export function Terms() {

  const { i18n } = useTranslation();
  // SEO: senza questa chiamata la pagina eredita i tag statici di
  // index.html, canonical compreso — che punta alla home e dice a Google
  // di trattare questa pagina come un duplicato della home.
  usePageSEO({
    title: "Termini di servizio — Oralzon",
    description: "Condizioni d'uso della piattaforma Oralzon per acquirenti e venditori professionali.",
    language: i18n.language,
  });
  return <LegalDocumentPage doc={getLocalizedTermini(i18n.language)} />;
}
