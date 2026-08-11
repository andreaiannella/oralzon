import type { LegalDocument } from '../legalContent';

export const EN_LEGAL: { termini: LegalDocument; condizioni: LegalDocument } = {
  termini: {
    title: "Terms of Service",
    lastUpdated: "May 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        paragraphs: [
          "By using Oralzon, you fully accept these Terms of Service. If you do not accept them, you may not use the platform."
        ],
      },
      {
        heading: "2. Service Description",
        paragraphs: [
          "Oralzon is a B2B marketplace for professional dental products. It acts as an intermediary between suppliers (vendors) and buyers (dental practices, dental laboratories, professionals). Oralzon is not a direct seller of the products present on the platform."
        ],
      },
      {
        heading: "3. Registration and Account",
        paragraphs: [
          "To use the service you must register with truthful data. You are responsible for the security of your account and all activities carried out through it. Oralzon reserves the right to suspend accounts in case of violations."
        ],
      },
      {
        heading: "4. Vendor Obligations",
        bullets: [
          "Vendors must be duly incorporated legal entities (businesses, VAT-registered)",
          "Dental products classified as medical devices must comply with MDR EU 2017/745 regulations",
          "Vendors are responsible for the accuracy of product information",
          "Vendors independently manage shipments and are responsible for delivery",
          "A platform commission applies to every completed sale, detailed in the Terms of Sale; any changes to the percentage will be communicated at least 30 days in advance",
          "For sales to buyers registered in other European Union countries, the vendor is solely responsible for their own tax obligations with their national Tax Agency, including the EC Sales List (Intrastat) when applicable. Oralzon does not file these obligations on the vendor's behalf"
        ],
      },
      {
        heading: "5. Payments",
        paragraphs: [
          "Payments are processed by Stripe. Oralzon does not store credit card data. In case of non-delivery or non-conforming product, the buyer must contact the vendor. Oralzon may intervene as a mediator."
        ],
      },
      {
        heading: "6. Limitation of Liability",
        paragraphs: [
          "Oralzon is not responsible for: the quality of products sold by suppliers, shipping times, damages arising from product use. Oralzon's maximum liability is limited to the amount of the subscription paid."
        ],
      },
      {
        heading: "7. Applicable Law",
        paragraphs: [
          "These terms are governed by Italian law. The Court of Cassino has exclusive jurisdiction over any dispute."
        ],
      },
    ],
  },
  condizioni: {
    title: "Terms of Sale",
    lastUpdated: "August 2026",
    sections: [
      {
        heading: "1. Scope of Application",
        paragraphs: [
          "These Terms of Sale govern all purchases made by dental industry professionals (buyers) through the Oralzon platform. Products are sold directly by registered suppliers (vendors) and not by Oralzon, which operates exclusively as a technology intermediary."
        ],
      },
      {
        heading: "2. Orders and Confirmation",
        paragraphs: [
          "The order is finalized upon payment confirmation by Stripe. The buyer receives a confirmation email with the order number within a few minutes. The order confirmation constitutes acceptance of the vendor's offer."
        ],
      },
      {
        heading: "3. Prices and Payments",
        bullets: [
          "All prices are expressed in Euros (€), VAT included, for domestic sales. For sales between a vendor and a buyer registered in two different EU countries, both with a verified VAT number, the reverse charge regime applies: the price does not include VAT and the buyer is required to settle the tax in their own country, as indicated on the invoice",
          "Payments are accepted via credit/debit card through Stripe",
          "Oralzon does not store payment data — this is handled exclusively by Stripe",
          "Payment is required in full at the time of the order"
        ],
      },
      {
        heading: "4. Vendor Commissions and Subscription",
        paragraphs: [
          "Oralzon charges registered vendors a commission of **7% on the value of every completed sale** (taxable amount, VAT excluded), withheld when settling the vendor's net proceeds. The commission covers payment processing costs and the services offered by the platform (order management, email communications, catalog hosting).",
          "Access to the platform also requires a monthly vendor subscription, as indicated on the Plans and Pricing page at the time of sign-up. Any promotional codes that extend the trial period do not modify the commission applied to sales completed during that period.",
          "Oralzon reserves the right to change the commission percentage with a minimum notice of 30 days, communicated by email to all active vendors."
        ],
      },
      {
        heading: "5. Shipping and Delivery",
        paragraphs: [
          "Each vendor independently manages the shipping of their products. Oralzon is not responsible for the delivery times indicated on product pages, which are provided for informational purposes only. The buyer receives an email notification with the tracking number when the item is shipped.",
          "In case of orders from multiple suppliers, products are shipped separately by each vendor."
        ],
      },
      {
        heading: "6. Right of Withdrawal",
        paragraphs: [
          "For non-personalized products not belonging to the category of single-use medical devices, the buyer has the right to withdraw within 30 days of receipt, in accordance with Italian Legislative Decree 206/2005 (Consumer Code). To exercise the right of withdrawal, contact the vendor via the email address indicated on their store page, or open a return request from the \"My Orders\" section.",
          "**Exceptions:** the right of withdrawal does not apply to opened single-use products, custom-made products, and products subject to rapid deterioration."
        ],
      },
      {
        heading: "7. Warranties and Compliance",
        paragraphs: [
          "Vendors guarantee, under their sole responsibility, that the products they publish comply with applicable regulations, including EU Regulation 2017/745 (MDR) for medical devices. Oralzon carries out formal checks on the registration and tax data provided during sign-up, but does not verify or guarantee the regulatory compliance of individual products, which remains entirely the vendor's responsibility."
        ],
      },
      {
        heading: "8. Oralzon's Liability",
        paragraphs: [
          "Oralzon is responsible solely for the correct functioning of the technology platform. It is not responsible for: the quality and compliance of products sold, vendor conduct, delivery delays, or damages arising from product use."
        ],
      },
      {
        heading: "9. Applicable Law and Jurisdiction",
        paragraphs: [
          "These terms are governed by Italian law. The Court of Cassino has exclusive jurisdiction over any dispute that cannot be resolved amicably."
        ],
      },
      {
        heading: "10. Contact",
        paragraphs: [
          "For any information about the terms of sale: **support@oralzon.com**"
        ],
      },
    ],
  },
};