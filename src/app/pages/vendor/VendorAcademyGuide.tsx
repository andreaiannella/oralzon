import { Link, useParams, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ChevronLeft, Laptop } from 'lucide-react';
import { ACADEMY_GUIDES } from '../../../data/academyGuides';

function AcademyWebOnlyNotice() {
  return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
        <Laptop className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Oralzon Academy è disponibile sul sito web</h1>
      <p className="text-gray-500 text-sm">
        Apri oralzon.com dal browser del tuo telefono o computer per consultare le guide — questa sezione non è disponibile dentro l'app.
      </p>
    </div>
  );
}

export function VendorAcademyGuide() {
  if (Capacitor.isNativePlatform()) return <AcademyWebOnlyNotice />;

  const { slug } = useParams<{ slug: string }>();
  const guide = ACADEMY_GUIDES.find(g => g.slug === slug);

  if (!guide) return <Navigate to="/venditore/academy" replace />;

  return (
    <div className="max-w-2xl">
      <Link to="/venditore/academy" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-5">
        <ChevronLeft className="w-4 h-4" /> Tutte le guide
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
        <Link to="/venditore/academy" className="text-gray-500 hover:text-primary">← Tutte le guide</Link>
      </div>
    </div>
  );
}
