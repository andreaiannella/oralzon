import { Link, useParams, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { getLocalizedGuideBySlug } from '../../../lib/academyLocalization';
import { AcademyWebOnlyNotice } from './VendorAcademy';

export function VendorAcademyGuide() {
  const { t, i18n } = useTranslation();
  if (Capacitor.isNativePlatform()) return <AcademyWebOnlyNotice />;

  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getLocalizedGuideBySlug(slug, i18n.language) : undefined;

  if (!guide) return <Navigate to="/venditore/academy" replace />;

  return (
    <div className="max-w-2xl">
      <Link to="/venditore/academy" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-5">
        <ChevronLeft className="w-4 h-4" /> {t('vendor.academyAllGuides')}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{guide.title}</h1>
      <p className="text-gray-500 mb-8">{guide.description}</p>

      <div className="space-y-8">
        {guide.sections.map((section, i) => (
          <div key={i}>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{section.heading}</h2>
            <div className="space-y-3">
              {section.paragraphs.map((p, j) => (
                <p key={j} className="text-gray-600 leading-relaxed text-sm">{p}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between text-sm">
        <Link to="/venditore/academy" className="text-gray-500 hover:text-primary">← {t('vendor.academyAllGuides')}</Link>
      </div>
    </div>
  );
}
