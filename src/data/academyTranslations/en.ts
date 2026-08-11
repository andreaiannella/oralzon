import type { AcademyGuideSection } from '../academyGuides';

export interface AcademyGuideTranslation {
  title: string;
  description: string;
  sections: AcademyGuideSection[];
}

export const EN_ACADEMY_TRANSLATIONS: Record<string, AcademyGuideTranslation> = {
  "come-iniziare-su-oralzon": {
    title: "Getting started on Oralzon",
    description: "The essential path for the first days: what to complete before really opening up to the public, and in what order.",
    sections: [
      {
        heading: "The store profile comes first",
        paragraphs: [
          "Before uploading products, it's worth completing the store profile in Settings: name, description, logo and shipping information. An incomplete store profile is often the main reason a potential customer hesitates to buy from a new vendor — they find the right product, but not enough information about the store to trust it."
        ],
      },
      {
        heading: "Connect Stripe before publishing products",
        paragraphs: [
          "The connected Stripe account is what actually receives sales payments — without it, a product can be published and even purchased, but the funds stay pending on Oralzon until the connection is completed. The Payments page always shows the up-to-date connection status, and a banner at the top of the panel reminds you until it's active."
        ],
      },
      {
        heading: "Your first products: quality over quantity",
        paragraphs: [
          "10-15 products with complete listings (multiple photos, detailed description, correct category) beat 50 minimal listings. Incomplete listings rank worse in internal search and convert less — a customer looking for a specific tool who finds a vague description almost always moves on to the next result.",
          "Importing from Excel (Import Excel section) is useful when starting from a catalog that already exists in a spreadsheet, but it's still worth reviewing the first imported listings by hand before publishing them: photo quality in particular can't be automated."
        ],
      },
      {
        heading: "What happens in the first 6 months",
        paragraphs: [
          "The free trial lasts 180 days from registration — during this period you don't pay the vendor plan fee, but the commission on sales is still active from the first order. It's worth using these months to test what works (categories, prices, sponsorships) before the fee kicks in."
        ],
      },
    ],
  },
  "migliorare-le-vendite": {
    title: "Improving sales: what actually moves the numbers",
    description: "The levers that have a real impact on sales, in order of practical priority — not everything is worth the same effort.",
    sections: [
      {
        heading: "Photos matter more than the description",
        paragraphs: [
          "In a B2B marketplace the temptation is to write very long technical descriptions and neglect the photos, assuming buyers already know what they're looking for. In practice the opposite happens: photos are the first filter a buyer uses to discard or consider a product, the description only comes into play afterward. Sharp photos on a neutral background, showing the product from multiple angles, make a measurable difference in conversion rate."
        ],
      },
      {
        heading: "Price isn't the only competitive lever",
        paragraphs: [
          "On a marketplace with several vendors in the same product category, the temptation is to compete purely on the lowest price — but honestly stated shipping times, a complete product listing, and positive reviews accumulated over time weigh as much or more than price for a professional buyer who's evaluating the supplier's reliability, not just the cost of the order."
        ],
      },
      {
        heading: "Reply to reviews, even the negative ones",
        paragraphs: [
          "A negative review with no public reply from the vendor weighs more than the review itself: it signals the problem was never addressed. A public reply, even a short one, that acknowledges the issue and explains what was done, recovers most of the lost trust — often more than the same review would have if it had been positive from the start."
        ],
      },
      {
        heading: "Sponsorships work best on products that already sell",
        paragraphs: [
          "Sponsoring a product that hasn't sold anything yet, to test whether it works, is almost always less efficient than sponsoring a product that's already selling well organically — sponsorship amplifies visibility, it doesn't make up for a weak listing or an off-market price. It's worth checking the statistics before choosing what to sponsor, not after."
        ],
      },
    ],
  },
  "fatturazione-e-dati-fiscali": {
    title: "Invoicing: what Oralzon does and what's left to the vendor",
    description: "How the line-by-line VAT calculation really works, what you'll find in the sales report, and what you still need to do yourself.",
    sections: [
      {
        heading: "Oralzon doesn't issue invoices on your behalf",
        paragraphs: [
          "An important point to be clear on from the start: Oralzon isn't responsible for issuing real fiscal invoices. Every vendor remains an independent tax subject, and must issue their own electronic invoices (or have their accountant do it) for every order. What Oralzon provides, in the Sales Report → Invoicing data section, is the calculation already worked out — taxable amount, rate, VAT, any exemption reason — so you don't have to redo it by hand."
        ],
      },
      {
        heading: "How VAT is calculated on every order",
        paragraphs: [
          "The calculation follows the standard EU rule for B2B supply of goods: a domestic sale (vendor and customer in the same country) applies the vendor's full domestic VAT rate; an intra-EU sale with both parties verified on VIES applies reverse charge (zero VAT, the customer self-assesses the tax); an intra-EU sale without VIES verification still applies the full VAT rate, out of caution; an extra-EU sale is exempt as an export.",
          "This calculation happens automatically for every order line, at the moment of purchase — nothing needs to be configured for it to work."
        ],
      },
      {
        heading: "Exporting data for your accountant",
        paragraphs: [
          "The Export CSV button in the Invoicing data section generates a file with one line for every product in every order — the level of detail actually needed to prepare an invoice, not a monthly aggregate. It's the most convenient file to hand to your accountant or use as the basis for issuing electronic invoices."
        ],
      },
    ],
  },
  "marketing-su-oralzon": {
    title: "Marketing on Oralzon",
    description: "The tools available to help people discover you on the platform, beyond simply being listed in the catalog.",
    sections: [
      {
        heading: "Your personal referral code",
        paragraphs: [
          "Every vendor has their own referral code, visible in the panel, to share with other practices or resellers interested in becoming vendors on Oralzon. Whoever registers with your code gets an extended trial period, and you get extra free trial days as a thank-you — a simple way to help the platform grow in your own industry while benefiting from it personally."
        ],
      },
      {
        heading: "Reviews are marketing, not just feedback",
        paragraphs: [
          "The reviews customers leave on your products are visible to anyone who visits your store page or product listings — they're effectively marketing material generated by your own customers, often more convincing than any description you could write. It's worth asking a customer, after a shipment has gone well, to leave a review, rather than waiting for it to happen on its own."
        ],
      },
      {
        heading: "Your store page is your business card",
        paragraphs: [
          "Many visitors arrive at a product through search, but then click the vendor's name to see the rest of the catalog — the store page is often where it's decided whether a customer becomes a repeat buyer or stays a one-off purchase. A well-written store description and a catalog organized by category help keep that visitor around."
        ],
      },
    ],
  },
  "sconti-e-codici-sconto": {
    title: "Discounts and discount codes",
    description: "How to create an effective discount code, and an important point to know if you sell in a cart shared with other vendors.",
    sections: [
      {
        heading: "How to create a discount code",
        paragraphs: [
          "From the Discounts section you can create a custom code, either percentage-based or a fixed amount, with an optional usage limit and expiry date, and — if you want — restrict it to specific products instead of the whole catalog. You share the code with customers yourself (email, social media, business card) — Oralzon doesn't advertise it automatically anywhere."
        ],
      },
      {
        heading: "Important: your code only applies to your own products",
        paragraphs: [
          "Oralzon is a multi-vendor marketplace: a customer can have your products together with other vendors' products in the same order. A fundamental point to keep in mind: a discount code you create applies exclusively to your store's lines in that cart, never to another vendor's products. No vendor can, even by mistake, unintentionally cut into another vendor's margin through their own discount code."
        ],
      },
      {
        heading: "A reasonable minimum threshold",
        paragraphs: [
          "Setting a minimum order amount to use the code (e.g. \"valid above €50\") is often more effective than a small discount with no threshold: it encourages the customer to add something extra to the cart to reach the threshold, instead of sticking to the minimum purchase they already had in mind."
        ],
      },
    ],
  },
  "come-usare-le-sponsorizzazioni": {
    title: "How to use sponsorships",
    description: "The options available in Promotions, and how to pick the right one based on what you want to achieve.",
    sections: [
      {
        heading: "Three types of visibility, three different goals",
        paragraphs: [
          "Featured Products puts up to 5 of your products on the homepage and in search results — the right choice when you want to give a push to specific products, maybe new arrivals or items with a better margin. Homepage Sponsorship gives you a fixed or rotating position in the homepage's sponsored section — better suited to building recognition for your store as a whole, not a single product. Category Sponsorship gives you privileged visibility in one or more chosen categories — useful if you want to get noticed by people who are already searching for exactly the kind of product you sell."
        ],
      },
      {
        heading: "Check the statistics before choosing what to sponsor",
        paragraphs: [
          "The Statistics section shows which products are already generating views and organic sales — these are generally the best candidates to sponsor, because sponsorship amplifies interest that already exists instead of having to create it from scratch. Sponsoring a product that isn't selling at all rarely turns the trend around on its own."
        ],
      },
      {
        heading: "The discount code in the sponsorship checkout",
        paragraphs: [
          "If you have a valid discount code for visibility packages, you enter it in the confirmation step that opens when you click \"Buy\" on a specific package — not before. The final price with the discount applied is what you see right before proceeding to payment, never a surprise afterward."
        ],
      },
    ],
  },
};