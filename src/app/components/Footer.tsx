import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Facebook, Linkedin, ChevronUp, Apple, Play } from 'lucide-react';
import logoFooter from '../../imports/logo_mobile_footer.png';
import { useAuth } from '../../contexts/AuthContext';

// App ancora in revisione su App Store / Google Play: appena pubblicata,
// incolla qui i due link reali (es. https://apps.apple.com/app/id...) e i
// pulsanti nel footer diventano cliccabili da soli, ovunque compaiano —
// nessun altro punto del codice da toccare.
const APP_STORE_URL: string | null = null;
const PLAY_STORE_URL: string | null = null;

// Badge "scarica l'app" in stile store ufficiale, ma con la palette
// Oralzon invece del solito nero piatto — coerente col resto del footer.
// Finché APP_STORE_URL/PLAY_STORE_URL sono null (app in revisione), il
// badge resta visibile ma non cliccabile, con una piccola etichetta
// "Prossimamente" al posto del link.
function StoreBadge({ href, icon, eyebrow, label }: { href: string | null; icon: ReactNode; eyebrow: string; label: string }) {
  const content = (
    <div className={`flex items-center gap-2.5 bg-black/25 border border-white/15 rounded-xl px-3.5 py-2 transition-colors ${href ? 'hover:border-secondary/60 hover:bg-black/35' : 'opacity-70'}`}>
      {icon}
      <div className="text-left leading-tight">
        <p className="text-[9px] uppercase tracking-wide text-white/50">{href ? eyebrow : 'Prossimamente'}</p>
        <p className="text-sm font-semibold text-white -mt-0.5">{label}</p>
      </div>
    </div>
  );
  if (!href) return <div aria-disabled="true">{content}</div>;
  return <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${eyebrow} ${label}`}>{content}</a>;
}

export function Footer() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const isVendor = (profile as any)?.user_type === 'venditore';
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const year = new Date().getFullYear();

  return (
    <footer>
      <button onClick={scrollToTop}
        className="w-full bg-primary hover:bg-secondary text-white py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2">
        {t('footer.backToTop')} <ChevronUp className="w-4 h-4" />
      </button>

      <div className="bg-oralzon-steel-ink text-oralzon-pale-mint/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
            {/* Conoscici */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm">{t('footer.aboutUs')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/chi-siamo" className="hover:text-secondary transition-colors">{t('footer.whoWeAre')}</Link></li>
                <li><Link to="/blog" className="hover:text-secondary transition-colors">{t('footer.blog')}</Link></li>
                <li><Link to="/contatti" className="hover:text-secondary transition-colors">{t('footer.contacts')}</Link></li>
              </ul>
            </div>

            {/* Vendi */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm">{t('footer.earnWithUs')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/diventa-venditore" className="hover:text-secondary transition-colors">{t('footer.sellOnDental')}</Link></li>
                <li><Link to="/pricing-venditori" className="hover:text-secondary transition-colors">{t('footer.plansAndPrices')}</Link></li>
              </ul>
            </div>

            {/* Pagamenti */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm">{t('footer.paymentsShipping')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/metodi-pagamento" className="hover:text-secondary transition-colors">{t('footer.paymentMethods')}</Link></li>
                <li><Link to="/info-spedizione" className="hover:text-secondary transition-colors">{t('footer.shippingInfo')}</Link></li>
                <li><Link to="/resi" className="hover:text-secondary transition-colors">{t('footer.returnsRefunds')}</Link></li>
              </ul>
            </div>

            {/* Assistenza */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm">{t('footer.customerSupport')}</h3>
              <ul className="space-y-2 text-sm">
                {isVendor ? (
                  <li><Link to="/venditore/dashboard" className="hover:text-secondary transition-colors">{t('nav.vendorDashboard')}</Link></li>
                ) : (
                  <>
                    <li><Link to="/account/profilo" className="hover:text-secondary transition-colors">{t('nav.account')}</Link></li>
                    <li><Link to="/account/ordini" className="hover:text-secondary transition-colors">{t('nav.myOrders')}</Link></li>
                  </>
                )}
                <li><Link to="/faq" className="hover:text-secondary transition-colors">{t('footer.faq')}</Link></li>
                <li><Link to="/contatti" className="hover:text-secondary transition-colors">{t('footer.contacts')}</Link></li>
              </ul>
            </div>

            {/* Legale */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm">{t('footer.dentalClean')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-secondary transition-colors">{t('footer.privacyPolicy')}</Link></li>
                <li><Link to="/cookie" className="hover:text-secondary transition-colors">{t('footer.cookiePolicy')}</Link></li>
                <li><Link to="/termini" className="hover:text-secondary transition-colors">{t('footer.termsOfService')}</Link></li>
                <li><Link to="/condizioni-vendita" className="hover:text-secondary transition-colors">{t('footer.conditionsOfSale')}</Link></li>
              </ul>
            </div>

            {/* Scarica l'app */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-white font-bold mb-4 text-sm">Scarica l'app</h3>
              <div className="flex flex-row md:flex-col gap-2.5">
                <StoreBadge
                  href={APP_STORE_URL}
                  icon={<Apple className="w-6 h-6 text-white flex-shrink-0" />}
                  eyebrow="Scarica su"
                  label="App Store"
                />
                <StoreBadge
                  href={PLAY_STORE_URL}
                  icon={<Play className="w-6 h-6 text-white flex-shrink-0 fill-white" />}
                  eyebrow="Disponibile su"
                  label="Google Play"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={logoFooter} alt="Oralzon" className="h-10 w-auto" />
              </div>
              <p className="text-xs text-oralzon-pale-mint/60 text-center">
                © {year} Oralzon — Marketplace B2B per prodotti odontoiatrici professionali. Tutti i diritti riservati.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://www.linkedin.com/company/oralzon" target="_blank" rel="noopener noreferrer"
                  className="hover:text-secondary transition-colors" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="https://www.facebook.com/oralzon" target="_blank" rel="noopener noreferrer"
                  className="hover:text-secondary transition-colors" aria-label="Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="mailto:support@oralzon.com" className="hover:text-secondary transition-colors" aria-label="Email">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
