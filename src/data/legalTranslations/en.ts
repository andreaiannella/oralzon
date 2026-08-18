import type { LegalDocument } from '../legalContent';

export const EN_LEGAL: { termini: LegalDocument; condizioni: LegalDocument } = {
  termini: {
    title: "Terms of Service",
    lastUpdated: "August 2026",
    sections: [
      {
        heading: "1. Who we are and what these terms cover",
        paragraphs: [
          "Oralzon is an online intermediation service connecting suppliers of dental products (**vendors**) with professional operators in the sector (**buyers**). Oralzon does not sell its own products to buyers through the intermediation service: every sales contract is concluded directly between the vendor and the buyer.",
          "The platform operator is **Oralzon**, reachable at support@oralzon.com.",
          "By using the platform you accept these Terms. If you do not accept them, you may not use it. The Terms of Sale, the Privacy Policy and the Cookie Policy form an integral part of them."
        ],
      },
      {
        heading: "2. Who can use Oralzon",
        paragraphs: [
          "Oralzon is reserved for parties acting in the course of their professional or business activity and holding a valid VAT number. It is not aimed at consumers: consequently **the protections of consumer law do not apply**, as they are reserved for natural persons acting for purposes outside their trade or profession.",
          "Vendors must be established in one of the 27 Member States of the European Union. This requirement derives from the VAT deemed supplier rules (Article 14a of Directive 2006/112/EC) and cannot be waived.",
          "You are responsible for the accuracy of the data you provide, for safeguarding your credentials and for everything done through your account."
        ],
      },
      {
        heading: "3. Changes to these terms",
        paragraphs: [
          "We may amend these Terms. Changes are notified to vendors by email and published on the platform **at least 15 days before** taking effect, as required by Article 3 of Regulation (EU) 2019/1150. Where a change requires significant technical or commercial adjustments, the notice period is proportionately longer.",
          "During the notice period the vendor may terminate free of charge. Publishing new products or failing to terminate within the deadline constitutes acceptance.",
          "The notice period does not apply where the change is imposed by a legal obligation or is needed to address an imminent risk to the security of the platform or its users."
        ],
      },
      {
        heading: "4. How products are ranked",
        paragraphs: [
          "In accordance with Article 5 of Regulation (EU) 2019/1150, we set out below the main parameters determining the position of products in search results and platform sections, and their relative importance."
        ],
        bullets: [
        "**Match with the search** — the prevailing parameter, which no other can override. The search compares the term entered against the product name (including translations), brand, item code and description, with decreasing weight in that order: a match in the name counts for more than the same word appearing only in the description",
        "**Filters and sorting chosen by the buyer** — when the buyer sorts by price, that choice prevails over every other parameter, including paid placements",
        "**Availability** — with equal matching, an available product precedes an out-of-stock one. It is the second parameter by importance, because a result that cannot be purchased is of no use either to the buyer or to the seller. Out-of-stock products nonetheless remain visible and are not removed from results",
        "**Sales achieved** — with equal matching, a product already purchased by other professionals precedes one with no sales history. The effect is progressive but diminishing: the difference between no sales and the first sales counts far more than that between many sales and very many, so an established product does not hold the position permanently",
        "**Reviews received** — average rating, weighted by the number of reviews: a few excellent reviews count for less than many good ones. Reviews are accepted exclusively from buyers who have actually purchased that product on the platform",
        "**Recently published products** — products published recently receive an explicit ranking advantage, which decreases gradually over the first three months. This is a deliberate choice: without it a marketplace would permanently favour those already selling, and a seller joining today would have no way to start",
        "**Paid placement** — sellers may purchase visibility packages (featured products, homepage slots, category slots, contextual cards). Such content is **always labelled “Sponsored”**. In search results sponsorship is **added** to the product's score and does not multiply it: it can therefore prevail between equally matching products, but **cannot place a poorly matching product above a highly matching one**. Where a paid slot is available but no seller has purchased it, we show a non-sponsored product with the neutral label “Featured”, without attributing to it a sponsorship that does not exist",
        "**Buyer's purchase and browsing history** — used to suggest relevant products, with data collected solely on this platform. It does not affect prices or conditions and never prevails over the buyer's explicit choices or over paid slots",
        "**No seller preference** — a seller's seniority, overall sales volume, subscribed plan and any purchase of other services have no influence whatsoever on the ranking of their products. Oralzon does not sell its own products and therefore has no positions to favour"
        ],
      },
      {
        heading: "5. Vendor obligations",
        bullets: [
          "Be duly incorporated legal entities holding a valid VAT number in an EU Member State",
          "Publish complete, accurate and non-misleading product information, including any legally required particulars",
          "Ensure that products classified as medical devices comply with Regulation (EU) 2017/745 (MDR) and any other applicable legislation",
          "Keep stock availability up to date and fulfil received orders within the stated timeframes",
          "Handle shipping of their own products and enter tracking details",
          "Use buyers’ data solely to fulfil the order, in compliance with the GDPR",
          "**Not direct buyers away from the platform**: it is prohibited to include direct contact details (email, telephone, messaging services, third-party websites) in product listings, answers to questions, reviews, images or materials enclosed with shipments, for the purpose of concluding outside Oralzon sales originating on the platform",
          "Fulfil all tax obligations independently, including EC Sales Lists (Intrastat) where applicable: Oralzon does not file them on the vendor’s behalf"
        ],
      },
      {
        heading: "6. Restriction, suspension and termination of the service",
        paragraphs: [
          "In accordance with Article 4 of Regulation (EU) 2019/1150, where we restrict or suspend services to a vendor we provide **the specific grounds** for that decision, on a durable medium, no later than the moment the measure takes effect.",
          "Where we decide to terminate the provision of services altogether, we give **at least 30 days’ notice**, unless a legal obligation applies, there is a serious and repeated breach of these Terms, or there is a genuine risk to user safety or to the integrity of the service.",
          "The vendor may challenge the decision through the complaint procedure in section 7. Where the challenge is upheld, the measure is reversed without undue delay.",
          "Expiry of the trial period or of the vendor plan, where not renewed, is not a sanction: it is governed by the Terms of Sale and is preceded by dedicated notices.",
          "**Orders already received before a suspension remain valid** and must be fulfilled. The corresponding amounts are paid out under the ordinary terms."
        ],
      },
      {
        heading: "7. Complaints and dispute resolution",
        paragraphs: [
          "Any vendor may submit a complaint by writing to **support@oralzon.com**, stating the subject of the dispute. We handle complaints within a reasonable timeframe proportionate to their complexity, and communicate the outcome individually and in plain language.",
          "The platform operator is currently a small enterprise within the meaning of Article 11(5) of Regulation (EU) 2019/1150 and is therefore not required to establish a formalised internal complaint-handling system. We nevertheless maintain the procedure described above.",
          "Failing agreement, the parties may refer the matter out of court to a mediation body entered in the register kept by the Italian Ministry of Justice and competent in commercial matters. Recourse to mediation is without prejudice to the right to bring proceedings before the courts.",
          "The rights granted to organisations representing vendors under Article 14 of that Regulation remain unaffected."
        ],
      },
      {
        heading: "8. Access to data",
        paragraphs: [
          "Vendors have access, from their own dashboard, to the data generated by their activity: orders received, products sold, turnover, reviews, customer questions, transfers and tax summaries.",
          "We do not share buyers’ email addresses or telephone numbers with vendors. Vendors do receive the name, shipping address and invoicing details needed to deliver and issue an invoice. This choice protects buyers from unsolicited communications and keeps exchanges traceable in the event of a dispute.",
          "We do not transfer aggregated data generated on the platform to third parties for their own commercial purposes."
        ],
      },
      {
        heading: "9. Intellectual property and content",
        paragraphs: [
          "Vendors retain all rights in the content they publish and warrant that they are entitled to do so. They grant Oralzon a non-exclusive, royalty-free licence to publish it, translate it automatically into the platform languages and use it to promote the catalogue, for the duration of the relationship only.",
          "Trade marks, interfaces, editorial content and platform software belong to the operator and may not be reproduced without authorisation.",
          "We remove content that is unlawful, misleading or in breach of these Terms, informing the author with a statement of reasons."
        ],
      },
      {
        heading: "10. Liability",
        paragraphs: [
          "Oralzon is responsible for the operation of the technology platform and for the accuracy of the information it provides itself. It is not a party to the sales contract and is not liable for the quality, compliance or safety of products, for vendor conduct or for delivery times, which remain the vendor’s exclusive responsibility.",
          "Save in cases of wilful misconduct or gross negligence, and save for personal injury, Oralzon’s aggregate liability towards a vendor is limited to the amounts paid by that vendor to the platform in the twelve months preceding the event. Towards a buyer it is limited to the value of the order to which the claim relates.",
          "Nothing in these Terms excludes or limits liability which applicable law does not permit to be excluded or limited."
        ],
      },
      {
        heading: "11. Governing law and jurisdiction",
        paragraphs: [
          "These Terms are governed by Italian law.",
          "The Court of Cassino has exclusive jurisdiction over any dispute. As the relationships concerned are between professionals, the parties acknowledge that this is agreed in writing pursuant to Article 25 of Regulation (EU) 1215/2012.",
          "The Italian version of these Terms prevails in the event of any discrepancy with translations."
        ],
      },
    ],
  },
  condizioni: {
    title: "Terms of Sale",
    lastUpdated: "August 2026",
    sections: [
      {
        heading: "1. Scope",
        paragraphs: [
          "These Terms govern purchases made through Oralzon by professional operators in the dental sector. Products are sold by registered suppliers (vendors): the contract is concluded between vendor and buyer, while Oralzon acts as a technology intermediary and as collection agent.",
          "As the buyer always acts in the course of their business, **consumer law protections do not apply**, being reserved for consumers."
        ],
      },
      {
        heading: "2. Orders and confirmation",
        paragraphs: [
          "The order is concluded when payment is confirmed. The buyer immediately receives an email with the order number and summary, which constitutes acceptance of the vendor’s offer.",
          "Checkouts started but not completed do not give rise to any order and are automatically cancelled after 24 hours.",
          "Product availability is checked at the time of the order. If, due to concurrent purchases, an item becomes unavailable after confirmation, the vendor notifies the buyer and the unfulfillable portion is refunded."
        ],
      },
      {
        heading: "3. Prices, VAT and payment",
        bullets: [
          "Prices are in Euros. For domestic sales they include VAT at the rate applicable in the vendor’s country",
          "For sales between a vendor and a buyer established in two different EU Member States, both holding a VAT number verified on the VIES system, the reverse charge applies: the price does not include VAT and the buyer accounts for the tax in their own country, as stated on the invoice",
          "Where VIES verification does not return a positive result for either party, the VAT of the vendor’s country applies",
          "Payment is made by credit or debit card and processed by Stripe. Oralzon neither processes nor stores card data",
          "The full amount is due at the time of the order",
          "The invoice is issued by the vendor, who is the only party under that obligation: Oralzon supplies the necessary data but does not issue invoices on their behalf"
        ],
      },
      {
        heading: "4. Commission and vendor plan",
        paragraphs: [
          "On every completed sale Oralzon withholds a commission of **7% of the value of the goods** (taxable amount, excluding VAT), deducted from the amount paid out to the vendor. The commission covers payment processing costs and platform services.",
          "**The commission does not apply to shipping costs**, which are not platform revenue.",
          "Access to the platform also requires an annual vendor plan, on the terms shown on the dedicated page at the time of sign-up. At the end of the free trial period, failure to subscribe results in the suspension of sales, preceded by email notices before expiry and in the days that follow. Catalogue, orders and statistics remain stored and become available again once the plan is activated.",
          "Any change to the commission percentage is notified by email with at least 30 days’ notice and does not apply to orders already received."
        ],
      },
      {
        heading: "5. Shipping",
        paragraphs: [
          "Each vendor ships their own products independently. In orders involving several suppliers, products travel separately, with distinct shipping charges and tracking for each vendor.",
          "Shipping charges are set by the vendor by destination zone and shown to the buyer before payment, broken down by supplier. A vendor may set an order threshold above which shipping is free: in that case the transport cost is borne by the vendor.",
          "Delivery times shown on product pages are estimates and not binding. Oralzon ships exclusively within the European Union.",
          "The buyer receives the tracking number by email when the item is shipped and is invited to confirm receipt from the orders section. In the absence of confirmation, delivery is deemed to have taken place 7 days after dispatch for domestic shipments and 15 days for intra-EU shipments."
        ],
      },
      {
        heading: "6. Payment to the vendor",
        paragraphs: [
          "Amounts collected are held by Oralzon until delivery is confirmed, manually or automatically under section 5. Only then is the net amount paid out to the vendor’s connected account.",
          "This arrangement protects both parties: it allows a return or dispute to be handled before the funds are transferred, and guarantees the vendor an automatic payout without the need to chase it.",
          "An open return request suspends the payout relating to the item concerned until the case is closed.",
          "To receive payouts the vendor must complete the identity verification required by the payment service provider. Until then the amounts are set aside and are not lost."
        ],
      },
      {
        heading: "7. Returns and refunds",
        paragraphs: [
          "As these are sales between professionals, **there is no statutory right of withdrawal**. Oralzon nevertheless offers, as its own commercial policy, the possibility of requesting a return within **30 days** of delivery, on the terms below.",
          "The request is opened from the “My orders” section and may cover only part of the quantities purchased. The vendor reviews it and may accept or refuse it, giving reasons.",
          "Products must be returned undamaged, in their original unopened packaging and complete with every component. **Excluded from returns** are single-use devices whose sterile packaging has been opened or damaged, custom-made products, products subject to rapid deterioration, and products whose safety can no longer be verified once opened.",
          "Unless otherwise agreed, return shipping costs are borne by the buyer. They are borne by the vendor where the product is defective, does not match the order, or was damaged in transit.",
          "The refund is calculated on the price actually paid for the returned items and is issued to the same payment method within 14 days of acceptance of the return. The vendor may withhold a justified amount to reflect deterioration not caused by inspection of the product.",
          "This policy is without prejudice to the statutory warranty against defects under the Italian Civil Code, which remains unaffected."
        ],
      },
      {
        heading: "8. Product warranty and compliance",
        paragraphs: [
          "The vendor warrants, under their sole responsibility, that the products published comply with applicable legislation, including Regulation (EU) 2017/745 on medical devices, and that they hold the rights necessary to market them.",
          "Oralzon verifies the registration and tax data provided at sign-up, but does not examine or certify the compliance of individual products, which remains entirely the vendor’s responsibility.",
          "The statutory warranty against defects under Articles 1490 et seq. of the Italian Civil Code applies to the sale, as between vendor and buyer."
        ],
      },
      {
        heading: "9. Reviews and questions",
        paragraphs: [
          "Only buyers who have actually purchased the product may leave a review: verification is automatic and cannot be bypassed.",
          "Reviews and questions are public and show the author’s name. They may not contain direct contact details, defamatory or unlawful content, or matters unrelated to the product.",
          "We do not remove negative reviews at a vendor’s request; the vendor may however reply publicly. We remove content breaching these rules, informing the author."
        ],
      },
      {
        heading: "10. Governing law and jurisdiction",
        paragraphs: [
          "These Terms are governed by Italian law. The Court of Cassino has exclusive jurisdiction over any dispute, pursuant to Article 25 of Regulation (EU) 1215/2012, the relationships concerned being between professionals.",
          "The Italian version prevails in the event of any discrepancy with translations."
        ],
      },
      {
        heading: "11. Contact",
        paragraphs: [
          "For any information about these Terms: **support@oralzon.com**"
        ],
      },
    ],
  },
};
