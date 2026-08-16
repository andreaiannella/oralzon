# Dati societari mancanti nei documenti legali

**Stato: in sospeso.** Deciso il 16/08/2026 di pubblicare temporaneamente con
il solo nome "Oralzon" per non bloccare la revisione Apple.

---

## Cosa manca

Nei quattro documenti legali (Privacy Policy, Cookie Policy, Termini di
Servizio, Condizioni di Vendita), in tutte e 8 le lingue, il titolare è
indicato come **"Oralzon"** — un marchio, non un soggetto giuridico.

Mancano tre dati:

| Dato | Dove si trova già |
|---|---|
| Denominazione o nome e cognome | Registrazione Stripe |
| Indirizzo della sede | Registrazione Stripe |
| Partita IVA | Registrazione Stripe |

Non serve una società costituita: se l'attività è una ditta individuale, il
titolare del trattamento è la persona fisica, con il proprio nome, indirizzo
e partita IVA.

## Perché va completato

**GDPR, art. 13(1)(a).** L'informativa deve indicare identità e contatti del
titolare del trattamento. Serve a permettere all'interessato di esercitare i
propri diritti e, se necessario, di presentare reclamo al Garante — cose che
non si possono fare contro un marchio.

**D.Lgs. 70/2003, art. 7.** Chi presta servizi online deve rendere
accessibili in modo facile, diretto e permanente denominazione, sede e
partita IVA.

**App Store.** In App Store Connect vanno dichiarati nome e indirizzo del
venditore, che compaiono sulla scheda pubblica dell'app. Se lì risulta un
soggetto e nell'informativa nessuno, l'incoerenza è visibile.

## Rischio noto e accettato

Questa versione può non superare la revisione Apple: togliere le parentesi
quadre migliora l'aspetto ma non cambia la sostanza per chi legge —
l'informativa resta priva di un titolare identificabile.

Se la revisione dovesse essere rifiutata di nuovo per questo motivo, la
soluzione è quella descritta sopra e richiede mezz'ora di lavoro.

## Come completarlo

I tre dati compaiono in un unico punto per lingua. Cercare `**Oralzon**`
nei file seguenti e sostituire con la frase completa:

- `src/data/legalContent.ts` (italiano)
- `src/data/legalTranslations/{en,de,es,fr,nl,pl,pt}.ts`
- `src/app/pages/Privacy.tsx`

Esempio, italiano:

> Il gestore della piattaforma è **Nome Cognome**, con sede in **Via …, CAP
> Città**, P.IVA **IT01234567890**, contattabile all'indirizzo
> support@oralzon.com.

## Nota sull'indirizzo

Se la sede coincide con l'abitazione e si preferisce non pubblicarla, le vie
praticabili sono la domiciliazione presso un centro servizi o la sede presso
lo studio del commercialista. Va deciso **prima** del lancio: cambiare la
sede dichiarata a piattaforma avviata comporta l'aggiornamento di Stripe,
delle fatture già emesse e dei documenti legali.
