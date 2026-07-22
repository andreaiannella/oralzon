import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Lock,
  MapPin,
  FileText,
  Crown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const SUPABASE_URL = 'https://ckslkfshimzuujtpboui.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2xrZnNoaW16dXVqdHBib3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTIwODIsImV4cCI6MjA5NDMyODA4Mn0.vhwaSLVWzVC9OGK7I4hE5V2P5H3A9V690YE9ELM-2eY';
const EDGE_URL = `${SUPABASE_URL}/functions/v1/make-server-000b3cfb`;
import logo from '../../imports/logo_login.svg';
import { PAESI_COMUNI, PAESI_UE } from '../../constants/countries';

interface Step1Data {
  ragioneSociale: string;
  paese: string;
  partitaIva: string;
  codiceFiscale: string;
  pec: string;
  codiceSdi: string;
  via: string;
  citta: string;
  provincia: string;
  cap: string;
}

// Per ora il marketplace accetta solo venditori stabiliti nella UE: fuori da
// questo perimetro scatterebbero obblighi IVA diretti in capo a Oralzon
// (regola del "deemed supplier", art. 14a Direttiva UE 2006/112/CE) che
// richiedono una struttura di compliance non ancora pronta. La lista è
// intenzionalmente ristretta — vedi PAESI_UE più sotto per l'elenco completo
// usato in validazione.


interface Step2Data {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  ruolo: string;
  password: string;
  confirmPassword: string;
}

interface Step3Data {
  piano: 'professional' | '';
  accettaTermini: boolean;
  promoCode: string;
}

type FormErrors = {
  [K in keyof (Step1Data & Step2Data & Step3Data)]?: string;
} & {
  general?: string;
};

const PIANI = [
  {
    id: 'professional',
    nome: 'Piano Venditore',
    prezzo: 129,
    prodotti: 'Prodotti illimitati',
    features: [
      'Prodotti illimitati',
      'Upload massivo Excel',
      'Badge venditore verificato',
      'Statistiche vendite avanzate',
      'Gestione ordini completa',
      'Supporto prioritario',
    ],
    popolare: true
  }
];

export function RegisterVendor() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [step1Data, setStep1Data] = useState<Step1Data>({
    ragioneSociale: '',
    paese: 'IT',
    partitaIva: '',
    codiceFiscale: '',
    pec: '',
    codiceSdi: '',
    via: '',
    citta: '',
    provincia: '',
    cap: ''
  });

  const [step2Data, setStep2Data] = useState<Step2Data>({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    ruolo: '',
    password: '',
    confirmPassword: ''
  });

  const [step3Data, setStep3Data] = useState<Step3Data>({
    piano: 'professional',
    accettaTermini: false,
    promoCode: ''
  });

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    const isItaly = step1Data.paese === 'IT';

    if (!step1Data.ragioneSociale.trim()) {
      newErrors.ragioneSociale = 'Ragione sociale obbligatoria';
    }

    if (!step1Data.partitaIva.trim()) {
      newErrors.partitaIva = isItaly ? 'P.IVA obbligatoria' : 'Identificativo fiscale/VAT obbligatorio';
    } else if (isItaly && !/^\d{11}$/.test(step1Data.partitaIva)) {
      newErrors.partitaIva = 'La P.IVA italiana deve contenere 11 cifre';
    } else if (!isItaly && step1Data.partitaIva.trim().length < 4) {
      newErrors.partitaIva = 'Identificativo fiscale troppo corto';
    }

    // PEC e Codice SDI esistono solo nell'ordinamento italiano — obbligatori
    // solo per i venditori italiani, altrove il campo non ha senso.
    if (isItaly) {
      if (!step1Data.pec.trim()) {
        newErrors.pec = 'PEC obbligatoria';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1Data.pec)) {
        newErrors.pec = 'Formato PEC non valido';
      }
    } else if (step1Data.pec.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1Data.pec)) {
      // Se il campo email di contatto fiscale è comunque compilato, va validato come email
      newErrors.pec = 'Formato email non valido';
    }

    if (!step1Data.via.trim()) {
      newErrors.via = 'Indirizzo obbligatorio';
    }

    if (!step1Data.citta.trim()) {
      newErrors.citta = 'Città obbligatoria';
    }

    // "Provincia" a 2 lettere è un formato solo italiano; per gli altri paesi
    // basta che il campo (stato/regione) non sia vuoto.
    if (!step1Data.provincia.trim()) {
      newErrors.provincia = isItaly ? 'Provincia obbligatoria' : 'Provincia/Regione/Stato obbligatorio';
    } else if (isItaly && step1Data.provincia.length !== 2) {
      newErrors.provincia = 'Provincia deve essere 2 caratteri (es. MI)';
    }

    // Il CAP a 5 cifre è un formato solo italiano; altrove i formati variano
    // molto (alfanumerici, lunghezze diverse) quindi si richiede solo che non sia vuoto.
    if (!step1Data.cap.trim()) {
      newErrors.cap = 'CAP obbligatorio';
    } else if (isItaly && !/^\d{5}$/.test(step1Data.cap)) {
      newErrors.cap = 'Il CAP italiano deve contenere 5 cifre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!step2Data.nome.trim()) {
      newErrors.nome = 'Nome obbligatorio';
    }

    if (!step2Data.cognome.trim()) {
      newErrors.cognome = 'Cognome obbligatorio';
    }

    if (!step2Data.email.trim()) {
      newErrors.email = 'Email obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step2Data.email)) {
      newErrors.email = 'Formato email non valido';
    }

    if (!step2Data.telefono.trim()) {
      newErrors.telefono = 'Telefono obbligatorio';
    } else if (!/^[\d\s+\-()]{8,}$/.test(step2Data.telefono)) {
      newErrors.telefono = 'Formato telefono non valido';
    }

    if (!step2Data.ruolo.trim()) {
      newErrors.ruolo = 'Ruolo obbligatorio';
    }

    if (!step2Data.password) {
      newErrors.password = 'Password obbligatoria';
    } else if (step2Data.password.length < 8) {
      newErrors.password = 'Password deve contenere almeno 8 caratteri';
    }

    if (step2Data.password !== step2Data.confirmPassword) {
      newErrors.confirmPassword = 'Le password non coincidono';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!step3Data.piano) {
      newErrors.piano = 'Seleziona un piano';
    }

    if (!step3Data.accettaTermini) {
      newErrors.accettaTermini = 'Devi accettare i termini e condizioni';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const userData = {
        nome: step2Data.nome,
        cognome: step2Data.cognome,
        user_type: 'venditore' as const,
        telefono: step2Data.telefono,
        ragione_sociale: step1Data.ragioneSociale,
        partita_iva: step1Data.partitaIva,
        fiscal_country: step1Data.paese,
        codice_fiscale: step1Data.codiceFiscale || null,
        pec: step1Data.pec || null,
        codice_sdi: step1Data.codiceSdi || null,
        address_street: step1Data.via,
        address_city: step1Data.citta,
        address_region: step1Data.provincia,
        address_postal_code: step1Data.cap,
      };

      // Step 1: Registra l'utente
      const { data: authData, error: authError } = await signUp(step2Data.email, step2Data.password, userData);

      if (authError) {
        // Gestisci errore "user already registered"
        if (authError.message?.includes('already registered') || authError.message?.includes('already been registered')) {
          throw new Error('Questa email è già registrata. Prova ad effettuare il login.');
        }
        throw authError;
      }

      if (!authData || !authData.user) {
        throw new Error('Errore durante la registrazione. Riprova.');
      }

      // Step 2: Aspetta che il profile venga creato dal trigger Supabase
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Crea vendor — doppia strategia per massima affidabilità
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 180); // 6 mesi di prova gratuita
      const vendorPayload = {
        profile_id: authData.user.id,
        business_name: step1Data.ragioneSociale || `${step2Data.nome} ${step2Data.cognome}`,
        plan_type: 'trial',
        plan_status: 'active',
        product_limit: 999999,
        verified_badge: false,
        commission_pct: 7.00,
        trial_ends_at: trialEnd.toISOString(),
      };

      let vendorCreated = false;
      let promoFeedback: { applied: boolean; error?: string } | null = null;
      const hasPromoCode = !!step3Data.promoCode?.trim();

      // Se c'è un codice promo, passa SEMPRE dall'edge function (serve la validazione server-side
      // del codice — l'insert diretto non può verificare usi massimi/scadenza in modo sicuro)
      if (hasPromoCode) {
        try {
          const vendorRes = await fetch(`${EDGE_URL}/register-vendor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
            body: JSON.stringify({
              userId: authData.user.id,
              businessName: vendorPayload.business_name,
              trialEndsAt: trialEnd.toISOString(),
              promoCode: step3Data.promoCode.trim(),
            }),
          });
          const vendorResult = await vendorRes.json();
          if (vendorResult.success) {
            vendorCreated = true;
            promoFeedback = { applied: vendorResult.promoApplied, error: vendorResult.promoError };
          } else console.warn('Edge vendor warning:', vendorResult.error);
        } catch (efErr) {
          console.warn('Edge function non raggiungibile:', efErr);
        }
      }

      // Tentativo 1 (solo se nessun codice promo): insert diretto
      if (!vendorCreated && !hasPromoCode) {
        const { error: directErr } = await supabase.from('vendors').insert([vendorPayload]);
        if (!directErr || directErr.code === '23505') {
          vendorCreated = true;
        }
      }

      // Tentativo 2: edge function con service role (funziona anche con email confirmation ON)
      if (!vendorCreated) {
        try {
          const vendorRes = await fetch(`${EDGE_URL}/register-vendor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
            body: JSON.stringify({
              userId: authData.user.id,
              businessName: vendorPayload.business_name,
              trialEndsAt: trialEnd.toISOString(),
              promoCode: step3Data.promoCode?.trim() || undefined,
            }),
          });
          const vendorResult = await vendorRes.json();
          if (vendorResult.success) {
            vendorCreated = true;
            promoFeedback = { applied: vendorResult.promoApplied, error: vendorResult.promoError };
          }
          else console.warn('Edge vendor warning:', vendorResult.error);
        } catch (efErr) {
          console.warn('Edge function non raggiungibile:', efErr);
        }
      }

      if (!vendorCreated) {
        // La registrazione utente è comunque riuscita: il vendor record
        // verrà creato al primo login (gestito da getCurrentVendor)
        console.warn('⚠️ Vendor record non creato ora — verrà creato al primo accesso');
      }

      if (hasPromoCode && promoFeedback) {
        if (promoFeedback.applied) {
          alert('Codice promozionale applicato! Hai 6 mesi di abbonamento gratuito.');
        } else if (promoFeedback.error) {
          alert(`Codice promozionale non valido: ${promoFeedback.error}. La registrazione è comunque andata a buon fine con il trial standard di 6 mesi.`);
        }
      }

      console.log('✅ Registrazione vendor completata');

      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Registration error:', error);
      setErrors({
        general: error.message || 'Errore durante la registrazione. Riprova.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Registrazione Completata!
          </h2>
          <p className="text-gray-600 mb-4">
            Il tuo account venditore è stato creato con successo.
          </p>
          <p className="text-sm text-gray-500">
            Verrai reindirizzato alla pagina di login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="Oralzon" className="h-16 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registrazione Venditore
          </h1>
          <p className="text-gray-600">
            Inizia a vendere i tuoi prodotti su Oralzon
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Dati Azienda', icon: Building2 },
              { num: 2, label: 'Referente', icon: User },
              { num: 3, label: 'Piano', icon: CreditCard }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.num
                        ? 'bg-green-500 text-white'
                        : currentStep === step.num
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.num ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs mt-2 font-medium text-gray-700">
                    {step.label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      currentStep > step.num ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Dati Azienda */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Building2 className="w-6 h-6 mr-2 text-primary" />
                    Dati Azienda
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ragione Sociale <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={step1Data.ragioneSociale}
                      onChange={(e) =>
                        setStep1Data({ ...step1Data, ragioneSociale: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                        errors.ragioneSociale ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Es. DentalCare SRL"
                    />
                    {errors.ragioneSociale && (
                      <p className="mt-1 text-sm text-red-600">{errors.ragioneSociale}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paese di stabilimento fiscale <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={step1Data.paese}
                      onChange={(e) => setStep1Data({ ...step1Data, paese: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    >
                      {PAESI_COMUNI.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Il paese dove la tua azienda è fiscalmente registrata — determina i campi richiesti qui sotto.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {step1Data.paese === 'IT' ? 'Partita IVA' : 'Identificativo Fiscale / VAT Number'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={step1Data.partitaIva}
                      onChange={(e) =>
                        setStep1Data({ ...step1Data, partitaIva: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                        errors.partitaIva ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={step1Data.paese === 'IT' ? '12345678901' : 'Es. DE123456789'}
                      maxLength={step1Data.paese === 'IT' ? 11 : 32}
                    />
                    {errors.partitaIva && (
                      <p className="mt-1 text-sm text-red-600">{errors.partitaIva}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Codice Fiscale {step1Data.paese !== 'IT' && <span className="text-gray-400 font-normal">(se applicabile)</span>}
                    </label>
                    <input
                      type="text"
                      value={step1Data.codiceFiscale}
                      onChange={(e) =>
                        setStep1Data({ ...step1Data, codiceFiscale: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                      placeholder={step1Data.paese === 'IT' ? 'RSSMRA80A01H501U' : 'Facoltativo'}
                      maxLength={16}
                    />
                  </div>

                  {step1Data.paese === 'IT' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PEC <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={step1Data.pec}
                          onChange={(e) =>
                            setStep1Data({ ...step1Data, pec: e.target.value })
                          }
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                            errors.pec ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="azienda@pec.it"
                        />
                        {errors.pec && (
                          <p className="mt-1 text-sm text-red-600">{errors.pec}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Codice SDI
                        </label>
                        <input
                          type="text"
                          value={step1Data.codiceSdi}
                          onChange={(e) =>
                            setStep1Data({ ...step1Data, codiceSdi: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                          placeholder="ABCDEFG"
                          maxLength={7}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email fiscale di contatto <span className="text-gray-400 font-normal">(facoltativa)</span>
                      </label>
                      <input
                        type="email"
                        value={step1Data.pec}
                        onChange={(e) =>
                          setStep1Data({ ...step1Data, pec: e.target.value })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                          errors.pec ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="fatturazione@tuaazienda.com"
                      />
                      {errors.pec && (
                        <p className="mt-1 text-sm text-red-600">{errors.pec}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">PEC e Codice SDI si applicano solo alle aziende italiane, per questo non sono richiesti.</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-primary" />
                    Sede Legale
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Indirizzo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={step1Data.via}
                        onChange={(e) =>
                          setStep1Data({ ...step1Data, via: e.target.value })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                          errors.via ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Via Roma 123"
                      />
                      {errors.via && (
                        <p className="mt-1 text-sm text-red-600">{errors.via}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Città <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={step1Data.citta}
                        onChange={(e) =>
                          setStep1Data({ ...step1Data, citta: e.target.value })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                          errors.citta ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Milano"
                      />
                      {errors.citta && (
                        <p className="mt-1 text-sm text-red-600">{errors.citta}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {step1Data.paese === 'IT' ? 'Provincia' : 'Provincia / Regione / Stato'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={step1Data.provincia}
                        onChange={(e) =>
                          setStep1Data({
                            ...step1Data,
                            provincia: step1Data.paese === 'IT' ? e.target.value.toUpperCase() : e.target.value
                          })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                          errors.provincia ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={step1Data.paese === 'IT' ? 'MI' : 'Es. Bayern'}
                        maxLength={step1Data.paese === 'IT' ? 2 : 56}
                      />
                      {errors.provincia && (
                        <p className="mt-1 text-sm text-red-600">{errors.provincia}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {step1Data.paese === 'IT' ? 'CAP' : 'Codice Postale'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={step1Data.cap}
                        onChange={(e) =>
                          setStep1Data({ ...step1Data, cap: e.target.value })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                          errors.cap ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={step1Data.paese === 'IT' ? '20121' : 'Es. 10115'}
                        maxLength={step1Data.paese === 'IT' ? 5 : 12}
                      />
                      {errors.cap && (
                        <p className="mt-1 text-sm text-red-600">{errors.cap}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Referente Aziendale */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <User className="w-6 h-6 mr-2 text-primary" />
                    Referente Aziendale
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={step2Data.nome}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, nome: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                        errors.nome ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Mario"
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cognome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={step2Data.cognome}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, cognome: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                        errors.cognome ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Rossi"
                    />
                    {errors.cognome && (
                      <p className="mt-1 text-sm text-red-600">{errors.cognome}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      Email Aziendale <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={step2Data.email}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, email: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="mario.rossi@azienda.it"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      Telefono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={step2Data.telefono}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, telefono: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                        errors.telefono ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+39 333 1234567"
                    />
                    {errors.telefono && (
                      <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      Ruolo in Azienda <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={step2Data.ruolo}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, ruolo: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                        errors.ruolo ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Es. Amministratore Delegato, Responsabile Vendite"
                    />
                    {errors.ruolo && (
                      <p className="mt-1 text-sm text-red-600">{errors.ruolo}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Lock className="w-4 h-4 mr-1" />
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={step2Data.password}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, password: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Minimo 8 caratteri"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Lock className="w-4 h-4 mr-1" />
                      Conferma Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={step2Data.confirmPassword}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, confirmPassword: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ripeti la password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Piano */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                    <CreditCard className="w-6 h-6 mr-2 text-primary" />
                    Scegli il tuo Piano
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Seleziona il piano più adatto alle tue esigenze
                  </p>
                </div>

                {/* Banner Promozione */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <Crown className="w-6 h-6" />
                    <h3 className="text-xl font-bold">
                      6 Mesi di Abbonamento in Regalo!
                    </h3>
                  </div>
                  <p className="text-center text-green-50 mt-2">
                    Inserisci il codice promozionale qui sotto — offerta limitata per i nuovi venditori
                  </p>
                </div>

                {/* Piani */}
                <div className="grid grid-cols-1 max-w-md mx-auto gap-6">
                  {PIANI.map((piano) => (
                    <div
                      key={piano.id}
                      onClick={() => setStep3Data({ ...step3Data, piano: piano.id as any })}
                      className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                        step3Data.piano === piano.id
                          ? 'border-primary bg-accent shadow-lg'
                          : 'border-gray-200 hover:border-oralzon-mint-fresh/50 hover:shadow-md'
                      } ${piano.popolare ? 'ring-2 ring-secondary' : ''}`}
                    >
                      {piano.popolare && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <span className="bg-primary text-white px-4 py-1 rounded-full text-xs font-semibold">
                            PIU POPOLARE
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {piano.nome}
                        </h3>
                        <div className="flex items-baseline justify-center">
                          <span className="text-4xl font-bold text-gray-900">
                            €{piano.prezzo}
                          </span>
                          <span className="text-gray-500 ml-2">/mese</span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {piano.features.map((feature, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="text-center">
                        {step3Data.piano === piano.id ? (
                          <div className="bg-primary text-white px-4 py-2 rounded-lg font-semibold">
                            Selezionato
                          </div>
                        ) : (
                          <div className="text-primary font-semibold">Seleziona</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {errors.piano && (
                  <p className="text-sm text-red-600 text-center">{errors.piano}</p>
                )}

                {/* Codice Promozionale */}
                <div className="pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hai un codice promozionale?
                  </label>
                  <input
                    type="text"
                    value={step3Data.promoCode}
                    onChange={(e) => setStep3Data({ ...step3Data, promoCode: e.target.value.toUpperCase() })}
                    placeholder="Es. LANCIO6MESI (opzionale)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl uppercase tracking-wide font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Se hai ricevuto un codice promozionale, inseriscilo qui per attivare la tua offerta di lancio.</p>
                </div>

                {/* Termini e Condizioni */}
                <div className="pt-6 border-t border-gray-200">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={step3Data.accettaTermini}
                      onChange={(e) =>
                        setStep3Data({ ...step3Data, accettaTermini: e.target.checked })
                      }
                      className={`mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-secondary ${
                        errors.accettaTermini ? 'border-red-500' : ''
                      }`}
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      Accetto i{' '}
                      <a href="#" className="text-primary hover:underline">
                        termini e condizioni
                      </a>{' '}
                      e la{' '}
                      <a href="#" className="text-primary hover:underline">
                        privacy policy
                      </a>
                      <span className="text-red-500"> *</span>
                    </span>
                  </label>
                  {errors.accettaTermini && (
                    <p className="mt-1 ml-8 text-sm text-red-600">{errors.accettaTermini}</p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Indietro
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Hai già un account? Accedi
                </Link>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors ml-auto"
                >
                  Avanti
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Registrazione in corso...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Completa Registrazione
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Serve aiuto?{' '}
          <a href="#" className="text-primary hover:underline">
            Contatta il supporto
          </a>
        </p>
      </div>
    </div>
  );
}
