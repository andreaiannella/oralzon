import { useTranslation } from 'react-i18next';
import { LegalDocumentPage } from '../components/LegalDocumentPage';
import { getLocalizedCondizioniVendita } from '../../lib/legalLocalization';

export function CondizioniVendita() {
  const { i18n } = useTranslation();
  return <LegalDocumentPage doc={getLocalizedCondizioniVendita(i18n.language)} />;
}
