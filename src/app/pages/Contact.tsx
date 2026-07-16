import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, HelpCircle, Send, Store, ShoppingCart, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { callEdge } from '../../lib/edgeApi';

export function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res = await callEdge('/contact-form', { body: form });
      if (!res.success) throw new Error(res.error || t('contact.sendFailed'));
      setResult({ type: 'success', text: t('contact.messageSent') });
      setForm({ firstName: '', lastName: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setResult({ type: 'error', text: err.message || t('contact.sendFailedRetry') });
    } finally {
      setSending(false);
    }
  };

  const faqs = [
    { q: t('contact.faq1q'), a: t('contact.faq1a') },
    { q: t('contact.faq2q'), a: t('contact.faq2a') },
    { q: t('contact.faq3q'), a: t('contact.faq3a') },
    { q: t('contact.faq4q'), a: t('contact.faq4a') },
    { q: t('contact.faq5q'), a: t('contact.faq5a') },
    { q: t('contact.faq6q'), a: t('contact.faq6a') },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-accent via-white to-accent/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl mb-6">{t('contact.heroTitle')}</h1>
            <p className="text-xl text-muted-foreground">
              {t('contact.heroSubtitle')}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <div className="bg-white rounded-2xl p-8 border border-border">
              <h2 className="text-3xl mb-6">{t('contact.sendMessage')}</h2>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {result && (
                  <div className={`flex items-start gap-3 p-4 rounded-lg text-sm ${result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {result.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    {result.text}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block mb-2">{t('contact.firstName')}</label>
                    <input type="text" id="firstName" required value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      placeholder="Mario" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block mb-2">{t('contact.lastName')}</label>
                    <input type="text" id="lastName" required value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      placeholder="Rossi" />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2">{t('contact.email')}</label>
                  <input type="email" id="email" required value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    placeholder="mario.rossi@studio.it" />
                </div>

                <div>
                  <label htmlFor="subject" className="block mb-2">{t('contact.subject')}</label>
                  <select id="subject" value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                    <option value="">{t('contact.selectOption')}</option>
                    <option value="order">{t('contact.subjectOrder')}</option>
                    <option value="account">{t('contact.subjectAccount')}</option>
                    <option value="vendor">{t('contact.subjectVendor')}</option>
                    <option value="technical">{t('contact.subjectTechnical')}</option>
                    <option value="other">{t('contact.subjectOther')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block mb-2">{t('contact.message')}</label>
                  <textarea id="message" rows={6} required value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white resize-none"
                    placeholder={t('contact.messagePlaceholder')} />
                </div>

                <button type="submit" disabled={sending}
                  className="w-full px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {sending ? t('contact.sendingInProgress') : t('contact.sendMessageBtn')}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-border">
              <h2 className="text-2xl mb-6">{t('contact.directContact')}</h2>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1">{t('contact.email')}</h3>
                  <p className="text-muted-foreground">support@oralzon.com</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('contact.replyTime')}</p>
                </div>
              </div>
            </div>

            {/* Chiarimento marketplace */}
            <div className="bg-accent rounded-2xl p-8 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <Store className="w-6 h-6 text-primary flex-shrink-0" />
                <h3 className="text-xl">{t('contact.orderQuestionTitle')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('contact.orderQuestionDesc')}
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <ShoppingCart className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{t('contact.goToMyOrdersStep')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Store className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{t('contact.clickVendorNameStep')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{t('contact.useContactEmailStep')}</span>
                </div>
              </div>
              <Link to="/account/ordini" className="inline-block mt-5 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                {t('contact.goToMyOrdersBtn')}
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <h3 className="text-xl">{t('contact.howWeCanHelp')}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>{t('contact.helpTechnical')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>{t('contact.helpDisputes')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>{t('contact.helpVendorInfo')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>{t('contact.helpFeedback')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4">{t('contact.faqTitle')}</h2>
            <p className="text-xl text-muted-foreground">
              {t('contact.faqSubtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-border">
                <h3 className="mb-3">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
