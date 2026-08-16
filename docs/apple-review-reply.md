# Risposta ad App Store Review — Oralzon 1.0 (28)

Submission ID: f0c3bbda-439a-4cf0-b323-525e66ea2389

---

## Come usarla

Incolla il testo qui sotto come risposta al messaggio in App Store Connect,
**dopo** aver caricato la nuova build con il crash risolto. Rispondere prima
di avere la build pronta fa ripartire la revisione su un binario che crasha
ancora.

Il testo è in inglese perché è la lingua in cui la revisione è condotta.

---

## Testo da inviare

Hello,

Thank you for the detailed feedback. We have addressed both issues.

**Guideline 2.1(a) — Performance (crash)**

We identified and fixed the crash. Oralzon is a Capacitor application: product
images are uploaded through a standard HTML file input, which on iOS presents
the system options "Take Photo" and "Photo Library". The app was missing the
required purpose strings in Info.plist, so iOS terminated the process as soon
as the camera was invoked. This is why the crash was reproducible on the first
tap of "Take Photo" and why no application-level exception appeared in the log.

We have added NSCameraUsageDescription, NSPhotoLibraryUsageDescription,
NSPhotoLibraryAddUsageDescription and NSMicrophoneUsageDescription, each with a
specific explanation of why the app needs access. The flow has been retested on
iPad, including the exact steps described in your report.

**Guideline 2.1 — Information Needed (cookies)**

1. **Is the data collected by the app shared with any third-party data brokers?**

No. Oralzon does not share any collected data with data brokers. The data we
process is limited to what is required to operate a B2B marketplace: account
and billing details, orders, and invoices. Our only processors are the service
providers required to run the service — Supabase (hosting and database), Stripe
(payments), Resend (transactional email) and Google Analytics (aggregate
audience statistics) — and none of them receives data for brokerage or resale.

2. **Is the data collected by the app linked with third-party data for marketing
   or advertising purposes?**

No. Oralzon does not run advertising and does not perform behavioural
advertising of any kind. Google Analytics is configured with Google Signals
disabled and ad personalization signals disabled at the code level
(`allow_google_signals: false`, `allow_ad_personalization_signals: false`), and
the advertising consent categories (`ad_storage`, `ad_user_data`,
`ad_personalization`) are permanently denied regardless of the user's cookie
choice. IP anonymisation is enabled.

The app does show product recommendations, but these are derived exclusively
from the user's own activity within Oralzon (products viewed and purchased on
our own platform). No third-party data is used, and no data leaves the platform
for this purpose.

3. **When users access web content in the app, are cookies collected for
   tracking purposes by the app or service?**

No. The app does not collect cookies for tracking purposes as defined by Apple:
we do not link data collected in the app with third-party data for advertising,
and we do not share data with data brokers.

The cookies used are:
- **Strictly necessary**: authentication session and shopping cart. First-party
  only, no tracking.
- **Analytics (optional, consent-based)**: Google Analytics, used to measure
  aggregate usage of our own service. Consent Mode defaults to "denied" and is
  only granted if the user explicitly accepts through the in-app cookie banner.
  These are first-party analytics of our own service and are not used for
  advertising or shared for advertising purposes.

External payment pages open in the system browser (Stripe Checkout), outside
the app context.

Because we do not track users across apps or websites owned by other companies,
the app does not use the App Tracking Transparency framework, and our privacy
nutrition label declares no data used for tracking.

Please let us know if you need any further detail.

Kind regards,
Andrea Iannella — Oralzon

---

## Nota interna (non inviare)

Le tre affermazioni sui segnali pubblicitari sono state rese VERE NEL CODICE
prima di scrivere questa risposta, non solo nella configurazione del pannello
Google. Prima di questa modifica il banner concedeva `ad_storage`,
`ad_user_data` e `ad_personalization` quando l'utente accettava: la risposta
"non facciamo pubblicità" sarebbe stata vera solo perché nessun account Google
Ads risultava collegato — una condizione che si può cambiare dal pannello, per
errore, senza toccare il codice e senza che nessuno se ne accorga.

Ora quei tre segnali sono negati in modo permanente e indipendente dal
consenso. Se in futuro si volesse davvero fare pubblicità, la dichiarazione
resa qui ad Apple e la scheda privacy vanno riviste PRIMA, non dopo.
