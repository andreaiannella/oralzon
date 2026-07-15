import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Facebook, Linkedin, ChevronUp } from 'lucide-react';
import logoFooter from '../../imports/logo_mobile_footer.png';
import { useAuth } from '../../contexts/AuthContext';

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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
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
