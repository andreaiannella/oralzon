import { useTranslation } from 'react-i18next';
import { LegalDocumentPage } from '../components/LegalDocumentPage';
import { getLocalizedTermini } from '../../lib/legalLocalization';

export function Terms() {
  const { i18n } = useTranslation();
  return <LegalDocumentPage doc={getLocalizedTermini(i18n.language)} />;
}
