import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2 } from 'lucide-react';
import { callEdge } from '../../lib/edgeApi';
import { useToast } from '../../contexts/ToastContext';

/**
 * Cattura email per la newsletter — prima non esisteva alcun modo di
 * raccogliere contatti da chi visita ma non compra subito, restavano persi
 * per sempre. Solo raccolta indirizzi qui: l'invio delle campagne resta
 * fuori, va fatto con uno strumento dedicato (Brevo, Mailchimp, ecc.)
 * esportando la lista da Supabase.
 */
export function NewsletterSignup() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const result = await callEdge('/newsletter/subscribe', {
      body: { email: email.trim(), language: i18n.language, source: 'footer' },
    });
    setLoading(false);
    if (!result.success) { toast.error(t('newsletter.error')); return; }
    toast.success(result.alreadySubscribed ? t('newsletter.alreadySubscribed') : t('newsletter.success'));
    setEmail('');
  };

  return (
    <div className="border-b border-white/10 pb-8 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-white font-bold text-base">{t('newsletter.title')}</h3>
          <p className="text-sm text-oralzon-pale-mint/70 mt-1">{t('newsletter.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:min-w-[380px]">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('newsletter.placeholder')}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t('newsletter.subscribe')}
          </button>
        </form>
      </div>
    </div>
  );
}
