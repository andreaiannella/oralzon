import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User, Phone, Building, Eye, EyeOff, AlertCircle, CheckCircle,
  FileText, MapPin, CreditCard, Check, Building2, Hash, Mail as MailIcon,
  Banknote, Wallet, ChevronRight, ChevronLeft, Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../imports/logo_login.svg';
import { PAESI_COMUNI } from '../../constants/countries';

const SUPABASE_URL = 'https://ckslkfshimzuujtpboui.supabase.co';
const EDGE_URL = `${SUPABASE_URL}/functions/v1/make-server-000b3cfb`;

type PaymentMethod = 'bonifico' | 'carta' | 'paypal';

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Step 1 - Dati Personali
    nome: '',
    cognome: '',
    email: '',
    telefono: '',

    // Step 2 - Dati Azienda & Spedizione
    ragioneSociale: '',
    partitaIva: '',
    codiceFiscale: '',
    pec: '',
    codiceSdi: '',
    indirizzoSpedizione: {
      via: '',
      citta: '',
      provincia: '',
      cap: '',
      paese: 'IT'
    },
    usaSameAddress: true,
    indirizzoFatturazione: {
      via: '',
      citta: '',
      provincia: '',
      cap: '',
      paese: 'IT'
    },

    // Step 3 - Crea Account
    password: '',
    confirmPassword: '',
    metodoPagamento: '' as PaymentMethod | '',
    acceptTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNextStep = () => {
    setError('');

    // Validate current step
    if (currentStep === 1) {
      if (!formData.nome || !formData.cognome || !formData.email || !formData.telefono) {
        setError(t('register.errFillRequired'));
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError(t('register.errInvalidEmail'));
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.ragioneSociale || !formData.partitaIva) {
        setError(t('register.errFillCompanyFields'));
        return;
      }
      if (formData.indirizzoSpedizione.paese === 'IT' && (!formData.codiceFiscale || !formData.pec)) {
        setError(t('register.errFillCompanyFields'));
        return;
      }
      if (!formData.indirizzoSpedizione.via || !formData.indirizzoSpedizione.citta ||
          !formData.indirizzoSpedizione.provincia || !formData.indirizzoSpedizione.cap) {
        setError(t('register.errFillShippingAddress'));
        return;
      }
      // CAP a 5 cifre e Provincia a 2 lettere sono formati italiani — per
      // gli altri paesi i formati variano troppo per una validazione rigida
      // uguale, basta che il campo non sia vuoto (già verificato sopra).
      if (formData.indirizzoSpedizione.paese === 'IT') {
        if (formData.indirizzoSpedizione.provincia.length !== 2) {
          setError(t('register.errProvinceLength'));
          return;
        }
        if (formData.indirizzoSpedizione.cap.length !== 5 || !/^\d{5}$/.test(formData.indirizzoSpedizione.cap)) {
          setError(t('register.errZipLength'));
          return;
        }
      }
      if (!formData.usaSameAddress) {
        if (!formData.indirizzoFatturazione.via || !formData.indirizzoFatturazione.citta ||
            !formData.indirizzoFatturazione.provincia || !formData.indirizzoFatturazione.cap) {
          setError(t('register.errFillBillingAddress'));
          return;
        }
        if (formData.indirizzoFatturazione.paese === 'IT') {
          if (formData.indirizzoFatturazione.provincia.length !== 2) {
            setError(t('register.errBillingProvinceLength'));
            return;
          }
          if (formData.indirizzoFatturazione.cap.length !== 5 || !/^\d{5}$/.test(formData.indirizzoFatturazione.cap)) {
            setError(t('register.errBillingZipLength'));
            return;
          }
        }
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate Step 3
    if (!formData.password || !formData.confirmPassword) {
      setError(t('register.errEnterPassword'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('register.errPasswordMismatch'));
      return;
    }
    if (formData.password.length < 6) {
      setError(t('register.errPasswordTooShort'));
      return;
    }
    if (false) {
      setError(''); // metodo pagamento rimosso
      return;
    }
    if (!formData.acceptTerms) {
      setError(t('register.errAcceptTerms'));
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await signUp(formData.email, formData.password, {
        nome: formData.nome,
        cognome: formData.cognome,
        telefono: formData.telefono,
        ragione_sociale: formData.ragioneSociale,
        partita_iva: formData.partitaIva,
        codice_fiscale: formData.codiceFiscale,
        pec: formData.pec,
        codice_sdi: formData.codiceSdi || null,
        indirizzo_spedizione_via: formData.indirizzoSpedizione.via,
        indirizzo_spedizione_citta: formData.indirizzoSpedizione.citta,
        indirizzo_spedizione_provincia: formData.indirizzoSpedizione.provincia,
        indirizzo_spedizione_cap: formData.indirizzoSpedizione.cap,
        indirizzo_spedizione_paese: formData.indirizzoSpedizione.paese,
        indirizzo_fatturazione_via: formData.usaSameAddress ? formData.indirizzoSpedizione.via : formData.indirizzoFatturazione.via,
        indirizzo_fatturazione_citta: formData.usaSameAddress ? formData.indirizzoSpedizione.citta : formData.indirizzoFatturazione.citta,
        indirizzo_fatturazione_provincia: formData.usaSameAddress ? formData.indirizzoSpedizione.provincia : formData.indirizzoFatturazione.provincia,
        indirizzo_fatturazione_cap: formData.usaSameAddress ? formData.indirizzoSpedizione.cap : formData.indirizzoFatturazione.cap,
        indirizzo_fatturazione_paese: formData.usaSameAddress ? formData.indirizzoSpedizione.paese : formData.indirizzoFatturazione.paese,
        
        user_type: 'cliente',
      });

      if (signUpError) {
        // Gestisci errore "user already registered"
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already been registered')) {
          throw new Error(t('register.errEmailAlreadyRegistered'));
        }
        throw signUpError;
      }

      setSuccess(true);

      // Email di benvenuto (fire-and-forget, non blocca la UX).
      // Usa il token di sessione se disponibile; il server invia SOLO all'email
      // dell'utente autenticato. Se non c'è ancora sessione (flusso con conferma
      // email), salta silenziosamente: l'email di benvenuto non è critica.
      const welcomeToken = data?.session?.access_token;
      if (welcomeToken) {
        fetch(`${EDGE_URL}/welcome-customer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${welcomeToken}` },
          body: JSON.stringify({ name: formData.nome }),
        }).catch(() => {});

        // Verifica automatica su VIES per i clienti non italiani: serve per
        // poter applicare correttamente il reverse charge sulle vendite B2B
        // intra-UE più avanti. Fire-and-forget: se fallisce (es. VIES
        // temporaneamente non raggiungibile) non blocca la registrazione —
        // il venditore vedrà semplicemente "P.IVA non ancora verificata" e
        // potrà riprovare più tardi.
        if (formData.indirizzoSpedizione.paese !== 'IT' && formData.partitaIva) {
          fetch(`${EDGE_URL}/vies/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${welcomeToken}` },
            body: JSON.stringify({ country: formData.indirizzoSpedizione.paese, vatNumber: formData.partitaIva, target: 'profile' }),
          }).catch(() => {});
        }
      }

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('register.errGenericRegistration'));
    } finally {
      setLoading(false);
    }
  };

  const paymentOptions = [
    {
      id: 'bonifico' as PaymentMethod,
      icon: Banknote,
      title: 'Bonifico Bancario',
      subtitle: '30 giorni',
      description: 'Pagamento dilazionato'
    },
    {
      id: 'carta' as PaymentMethod,
      icon: CreditCard,
      title: 'Carta di Credito',
      subtitle: 'Immediato',
      description: 'Pagamento istantaneo'
    },
    {
      id: 'paypal' as PaymentMethod,
      icon: Wallet,
      title: 'PayPal',
      subtitle: 'Immediato',
      description: 'Pagamento sicuro'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-white to-accent/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src={logo} alt="Oralzon" className="h-12 w-auto mx-auto mb-4" />
            <h2 className="text-3xl mb-2">{t('register.pageTitle')}</h2>
            <p className="text-muted-foreground">{t('register.pageSubtitle')}</p>
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                    ${currentStep === step ? 'bg-primary text-white scale-110' : ''}
                    ${currentStep > step ? 'bg-green-500 text-white' : ''}
                    ${currentStep < step ? 'bg-gray-200 text-gray-500' : ''}
                  `}>
                    {currentStep > step ? <Check className="w-5 h-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`
                      w-16 sm:w-24 h-1 mx-2 transition-all
                      ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between max-w-md mx-auto mt-2">
              <span className="text-xs text-muted-foreground w-20 text-center">{t('register.stepPersonal')}</span>
              <span className="text-xs text-muted-foreground w-20 text-center">{t('register.stepCompany')}</span>
              <span className="text-xs text-muted-foreground w-20 text-center">{t('register.stepAccount')}</span>
            </div>
          </div>

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-800">
                  {t('register.accountCreatedSuccess')}
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* STEP 1 - Dati Personali */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {t('register.personalDataTitle')}
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-2">{t('checkout.firstName')} *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">{t('checkout.lastName')} *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.cognome}
                        onChange={(e) => setFormData({...formData, cognome: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">{t('checkout.email')} *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">{t('checkout.phone')} *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {t('auth.next')}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* STEP 2 - Dati Azienda & Spedizione */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {t('register.companyDataStepTitle')}
                </h3>

                {/* Dati Azienda */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase">{t('register.companyDataTitle')}</h4>

                  <div>
                    <label className="block text-sm mb-2">{t('register.companyName')} *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.ragioneSociale}
                        onChange={(e) => setFormData({...formData, ragioneSociale: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">{formData.indirizzoSpedizione.paese === 'IT' ? t('register.vatNumber') : 'Identificativo Fiscale / VAT Number'} *</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={formData.partitaIva}
                          onChange={(e) => setFormData({...formData, partitaIva: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          placeholder={formData.indirizzoSpedizione.paese === 'IT' ? '' : 'Es. DE123456789'}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm mb-2">{t('register.taxCode')} {formData.indirizzoSpedizione.paese !== 'IT' && <span className="text-muted-foreground font-normal">({t('register.optional')})</span>}{formData.indirizzoSpedizione.paese === 'IT' && ' *'}</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={formData.codiceFiscale}
                          onChange={(e) => setFormData({...formData, codiceFiscale: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          required={formData.indirizzoSpedizione.paese === 'IT'}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">{t('register.pecLabel')} {formData.indirizzoSpedizione.paese !== 'IT' && <span className="text-muted-foreground font-normal">({t('register.optional')})</span>}{formData.indirizzoSpedizione.paese === 'IT' && ' *'}</label>
                      <div className="relative">
                        <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          value={formData.pec}
                          onChange={(e) => setFormData({...formData, pec: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          required={formData.indirizzoSpedizione.paese === 'IT'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm mb-2">{t('register.sdiCode')}</label>
                      <input
                        type="text"
                        value={formData.codiceSdi}
                        onChange={(e) => setFormData({...formData, codiceSdi: e.target.value})}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        placeholder={t('register.optional')}
                      />
                    </div>
                  </div>
                </div>

                {/* Indirizzo Spedizione */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {t('register.shippingAddressTitle')}
                  </h4>

                  <div>
                    <label className="block text-sm mb-2">Paese *</label>
                    <select
                      value={formData.indirizzoSpedizione.paese}
                      onChange={(e) => {
                        const paese = e.target.value;
                        setFormData({
                          ...formData,
                          indirizzoSpedizione: { ...formData.indirizzoSpedizione, paese },
                          // Se "stesso indirizzo per fatturazione" è attivo,
                          // il paese di fatturazione segue quello di spedizione
                          indirizzoFatturazione: formData.usaSameAddress ? { ...formData.indirizzoFatturazione, paese } : formData.indirizzoFatturazione,
                        });
                      }}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    >
                      {PAESI_COMUNI.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">{t('register.streetAddress')} *</label>
                    <input
                      type="text"
                      value={formData.indirizzoSpedizione.via}
                      onChange={(e) => setFormData({
                        ...formData,
                        indirizzoSpedizione: {...formData.indirizzoSpedizione, via: e.target.value}
                      })}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm mb-2">{t('checkout.city')} *</label>
                      <input
                        type="text"
                        value={formData.indirizzoSpedizione.citta}
                        onChange={(e) => setFormData({
                          ...formData,
                          indirizzoSpedizione: {...formData.indirizzoSpedizione, citta: e.target.value}
                        })}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">{formData.indirizzoSpedizione.paese === 'IT' ? t('checkout.province') : 'Provincia / Regione'} *</label>
                      <input
                        type="text"
                        value={formData.indirizzoSpedizione.provincia}
                        onChange={(e) => setFormData({
                          ...formData,
                          indirizzoSpedizione: {...formData.indirizzoSpedizione, provincia: formData.indirizzoSpedizione.paese === 'IT' ? e.target.value.toUpperCase() : e.target.value}
                        })}
                        className={`w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white ${formData.indirizzoSpedizione.paese === 'IT' ? 'uppercase' : ''}`}
                        maxLength={formData.indirizzoSpedizione.paese === 'IT' ? 2 : 40}
                        placeholder={formData.indirizzoSpedizione.paese === 'IT' ? 'MI' : ''}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">{formData.indirizzoSpedizione.paese === 'IT' ? t('checkout.zipCode') : 'Codice Postale'} *</label>
                      <input
                        type="text"
                        value={formData.indirizzoSpedizione.cap}
                        onChange={(e) => setFormData({
                          ...formData,
                          indirizzoSpedizione: {...formData.indirizzoSpedizione, cap: e.target.value}
                        })}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        maxLength={formData.indirizzoSpedizione.paese === 'IT' ? 5 : 12}
                        placeholder={formData.indirizzoSpedizione.paese === 'IT' ? '20100' : ''}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Checkbox Stesso Indirizzo */}
                <div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.usaSameAddress}
                      onChange={(e) => setFormData({...formData, usaSameAddress: e.target.checked})}
                      className="mt-1 rounded"
                    />
                    <span className="text-sm">
                                            {t('register.sameAddressForBilling')}
                    </span>
                  </label>
                </div>

                {/* Indirizzo Fatturazione (condizionale) */}
                {!formData.usaSameAddress && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                                            {t('register.billingAddressTitle')}
                    </h4>

                    <div>
                      <label className="block text-sm mb-2">Paese *</label>
                      <select
                        value={formData.indirizzoFatturazione.paese}
                        onChange={(e) => setFormData({
                          ...formData,
                          indirizzoFatturazione: { ...formData.indirizzoFatturazione, paese: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      >
                        {PAESI_COMUNI.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm mb-2">{t('register.streetAddress')} *</label>
                      <input
                        type="text"
                        value={formData.indirizzoFatturazione.via}
                        onChange={(e) => setFormData({
                          ...formData,
                          indirizzoFatturazione: {...formData.indirizzoFatturazione, via: e.target.value}
                        })}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm mb-2">{t('checkout.city')} *</label>
                        <input
                          type="text"
                          value={formData.indirizzoFatturazione.citta}
                          onChange={(e) => setFormData({
                            ...formData,
                            indirizzoFatturazione: {...formData.indirizzoFatturazione, citta: e.target.value}
                          })}
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-2">{formData.indirizzoFatturazione.paese === 'IT' ? t('checkout.province') : 'Provincia / Regione'} *</label>
                        <input
                          type="text"
                          value={formData.indirizzoFatturazione.provincia}
                          onChange={(e) => setFormData({
                            ...formData,
                            indirizzoFatturazione: {...formData.indirizzoFatturazione, provincia: formData.indirizzoFatturazione.paese === 'IT' ? e.target.value.toUpperCase() : e.target.value}
                          })}
                          className={`w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white ${formData.indirizzoFatturazione.paese === 'IT' ? 'uppercase' : ''}`}
                          maxLength={formData.indirizzoFatturazione.paese === 'IT' ? 2 : 40}
                          placeholder={formData.indirizzoFatturazione.paese === 'IT' ? 'MI' : ''}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-2">{formData.indirizzoFatturazione.paese === 'IT' ? t('checkout.zipCode') : 'Codice Postale'} *</label>
                        <input
                          type="text"
                          value={formData.indirizzoFatturazione.cap}
                          onChange={(e) => setFormData({
                            ...formData,
                            indirizzoFatturazione: {...formData.indirizzoFatturazione, cap: e.target.value}
                          })}
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          maxLength={formData.indirizzoFatturazione.paese === 'IT' ? 5 : 12}
                          placeholder={formData.indirizzoFatturazione.paese === 'IT' ? '20100' : ''}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                                        {t('auth.back')}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    Continua
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 - Account & Metodo Pagamento */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  {t('auth.createAccountBtn')}
                </h3>

                {/* Password */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-2">{t('auth.password')} *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-10 pr-12 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t('register.minChars')}</p>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">{t('auth.confirmPassword')} *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="w-full pl-10 pr-12 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>



                {/* Termini e Condizioni */}
                <div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({...formData, acceptTerms: e.target.checked})}
                      className="mt-1 rounded"
                      required
                      disabled={loading}
                    />
                    <span className="text-sm text-muted-foreground">
                      {t('register.acceptPrefix')} <Link to="/termini" className="text-primary hover:underline">{t('register.termsLink')}</Link> {t('register.andThe')} <Link to="/privacy" className="text-primary hover:underline">{t('register.privacyLink')}</Link> *
                    </span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                                        {t('auth.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('auth.creating') : t('auth.createAccountBtn')}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Login Link */}
          <div className="text-center mt-6 pt-6 border-t">
            <p className="text-muted-foreground">
                            {t('auth.alreadyAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                        {t('auth.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
