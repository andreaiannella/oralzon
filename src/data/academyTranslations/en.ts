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
          "Before uploading products, it's worth completing the profile in Settings: store name, phone number, website (if you have one), and the fiscal details (VAT number, PEC or SDI code) needed for invoicing. There's no logo or description to upload — on Oralzon a vendor's identity is the store name plus the verified-seller badge if applicable, not an image."
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
          "From the Reviews section you can reply publicly to every review — your reply stays visible below the customer's. A negative review with no reply weighs more than the review itself: it signals the problem was never addressed. A public reply, even a short one, that acknowledges the issue and explains what was done, recovers most of the lost trust."
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
    description: "How customers find you, why they don't at first, and what you can do about it.",
    sections: [
      {
        heading: "The problem when you start: existing isn't enough to be found",
        paragraphs: [
          "An uploaded catalogue is not a visible catalogue. On any marketplace, the products shown highest are those that have already sold, already collected reviews, already built a history. It makes sense for buyers — it shows what worked for others — but it creates a circular problem for whoever arrives now: you don't sell because nobody sees you, and nobody sees you because you haven't sold yet.",
          "That's why a serious supplier, with excellent products and fair prices, can go months without an order while less competitive rivals sell every day. It isn't a matter of quality: it's a matter of position. Someone searching for \\\"Gracey curettes\\\" looks at the first results and rarely reaches the third screen.",
          "Sponsorships exist for exactly this: buying the position you haven't earned yet, for the time it takes to earn it properly. They are a starting accelerator, not a permanent tax."
        ],
      },
      {
        heading: "What actually changes when a product is sponsored",
        paragraphs: [
          "A sponsored product isn't shown \\\"slightly higher\\\": it enters spaces where ordinary products don't appear at all. The Hero Sponsored card, for example, is a single card with your product alone, no competitors beside it, appearing on the homepage, in the catalogue and on product pages — where a customer is already looking at items like yours.",
          "The difference from good organic ranking is that sponsorship acts immediately and predictably: you know where you will appear and for how long. Organic ranking comes later, as a consequence of the sales that sponsorship allowed you to make.",
          "And this is the point many vendors miss: the sales generated while you are sponsored don't disappear when the sponsorship ends. They remain as order history and as reviews, and those are precisely the ingredients that push you up the results afterwards. One month of paid visibility can leave you in a position that would have taken far longer to reach alone."
        ],
      },
      {
        heading: "When it's genuinely worth it, and when it isn't",
        paragraphs: [
          "Sponsoring makes sense when the product is already ready to convert: complete listing, sharp photos, price in line with the market, real stock availability. Driving traffic to an empty listing or a sold-out item is the fastest way to waste the budget — the customer arrives, doesn't find what they were looking for, and doesn't come back.",
          "It makes most sense at three moments: when you open your store and nobody knows you yet; when you launch a new product with no history; when you want to defend a category where a competitor is gaining ground.",
          "It makes less sense on products that already sell well by themselves — there you're paying for visibility you would have had anyway — and on items with margins that are too thin, where the cost of the sponsorship eats the profit. Before buying, do a simple calculation: how many extra units must you sell to pay back the package? If the number seems reasonable, go ahead; if it seems high, pick a product with a better margin.",
          "Sponsorships do not guarantee sales: they buy visibility, which is a necessary but not sufficient condition. What happens after the click depends on your product listing, your price and your reliability."
        ],
      },
      {
        heading: "Measure the results, don't trust the impression",
        paragraphs: [
          "Before activating a sponsorship, note your starting point: how many orders and how much revenue that product generated over the last month. You'll find them in the Statistics section of your dashboard. When the package expires, compare the same figures — that's the only way to know whether it really worked, instead of going by gut feeling.",
          "If a package paid off, renew it. If it didn't, try changing the product or the type of visibility before concluding that sponsorships don't work: often the problem isn't the tool but the match between the tool and the product you chose."
        ],
      },
      {
        heading: "Your store name and the verified badge are your identity",
        paragraphs: [
          "On Oralzon there is no logo or store description to customise: what a customer sees, on your store page and next to your products, is your business name and the verified vendor badge, if you have it. This is a deliberate platform choice — a logo and free-form description are the places where people most often try to insert direct contact details to pull the customer off the marketplace, and removing them protects every vendor equally, so that those who follow the rules don't have to compete with those who don't.",
          "That's why it's worth choosing a clear, recognisable store name right from registration: it's the only identity element representing you everywhere on the platform, including sponsored sections where competition is most direct.",
          "The verified vendor badge cannot be bought: you earn it by completing identity verification on Stripe, the same one required to receive payments. It's the strongest reliability signal available to you, and in sponsored sections it makes a difference: with equal product and price, buyers almost always choose the verified vendor."
        ],
      },
      {
        heading: "Reviews are marketing, not just feedback",
        paragraphs: [
          "The reviews customers leave on your products are visible to anyone visiting your store page or product listings — they are, to all intents and purposes, material created by your own customers, often more convincing than any description you could write. After a delivery that went well, it's worth politely asking the customer to leave a review rather than waiting for it to happen by itself.",
          "Reviews count double if you are sponsoring: visibility brings the customer to the listing, but it's social proof that makes them hit \\\"add to cart\\\". Sponsoring a product without reviews works; sponsoring one with positive reviews works much better — for the same spend."
        ],
      },
      {
        heading: "Your store page gathers your whole catalogue",
        paragraphs: [
          "Many visitors reach a product through search, then click the vendor name to see the rest of the catalogue — the store page is often where it's decided whether a customer becomes a regular or stays a one-off purchase. A catalogue organised by category, with complete product listings, helps keep that visitor.",
          "It's also why it pays to sponsor the right product and not necessarily the cheapest one: sponsorship brings traffic to one listing, but from there the customer explores everything else. A product representative of what you sell brings more useful visits than a loss-leader disconnected from your catalogue."
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
        heading: "Four types of visibility, four different goals",
        paragraphs: [
          "Featured Products puts up to 5 of your products on the homepage and in search results — the right choice when you want to give a push to specific products, maybe new arrivals or items with a better margin. Homepage Sponsorship gives you a rotating or fixed position in the homepage's sponsored section — better suited to building recognition for your store as a whole, not a single product. Category Sponsorship gives you privileged visibility in one or more chosen categories — useful if you want to get noticed by people who are already searching for exactly the kind of product you sell. Hero Sponsored puts you alone, with no other products around, in a featured card contextual to the category the customer is browsing at that moment — it appears in several spots across home, catalog and product page."
        ],
      },
      {
        heading: "Hero Sponsored: never more than one of yours at a time",
        paragraphs: [
          "You can buy this package for as many products as you like — there's no limit to how many you can have sponsored. The limit is about what the single customer sees in a single moment: on the same page, never more than one of your products appears at the same time, even if you've sponsored several — the system rotates which of your products to show, both over time and across the different spots on the home page where this format appears. This keeps the space shared fairly among all sponsors, instead of being monopolized by whoever buys the most."
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