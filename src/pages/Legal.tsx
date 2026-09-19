import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";

/* ── Legal pages: Terms & Conditions, Privacy Policy, Cookie Policy ── */

const sections = (s: { h: string; b: string }[]) =>
  s.map(({ h, b }) => (
    <section key={h} className="mb-6">
      <h2 className="font-display text-lg sm:text-xl font-light text-foreground mb-2">{h}</h2>
      <p className="font-body text-sm text-muted-foreground leading-[1.8]">{b}</p>
    </section>
  ));

const LegalLayout = ({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Seo title={`${title} — TDEV`} description={`${title} for TDEV | Tenue de Ville.`} path={undefined} />
    <Navbar />
    <main className="section-padding pt-28 md:pt-32 pb-16 sm:pb-20 max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm tracking-wider mb-8">
        <ArrowLeft size={16} /> Back to Home
      </Link>
      <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-2">Legal</p>
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground mb-3">{title}</h1>
      <p className="font-body text-xs text-muted-foreground/70 mb-10">Last updated: {updated}</p>
      {children}
    </main>
    <Footer />
  </div>
);

export const TermsPage = () => (
  <LegalLayout title="Terms & Conditions" updated="September 2026">
    {sections([
      { h: "1. Agreement", b: "These Terms & Conditions ('Terms') govern your use of www.tenuedevillestore.com, tdev-site.vercel.app and related storefronts operated by TDEV | Tenue de Ville ('TDEV', 'we', 'us'). By placing an order or using the site you agree to these Terms. If you do not agree, please do not use the store." },
      { h: "2. Products & Pricing", b: "All products are described as accurately as possible; slight variations in colour and fit may occur due to fabric and photography. Prices are listed in US Dollars (USD) and are inclusive of applicable taxes where required. We reserve the right to change prices at any time without notice; the price at checkout is the price you pay." },
      { h: "3. Orders & Payment", b: "An order is confirmed when you complete checkout and payment is authorised through our payment provider. We may decline or cancel an order where payment fails, stock is unavailable, or we suspect fraud — we will refund any amount already charged. Payment details are processed directly by our payment partners; TDEV does not store card details." },
      { h: "4. Shipping, Returns & Exchanges", b: "Shipping times and costs are shown at checkout. If a product arrives damaged or incorrect, contact us within 7 days of delivery and we will arrange a replacement, refund, or exchange. Return eligibility and any return-period terms are communicated at purchase; custom or personalised items are final sale unless faulty." },
      { h: "5. Subscription Plans (where applicable)", b: "Subscription plans (where offered) renew monthly until cancelled. You can cancel anytime through your dashboard; cancellation stops future charges and your plan remains active until the end of the current period. Where applicable, the curated-box selection and delivery schedule are described on the plan pages." },
      { h: "6. Intellectual Property", b: "All content on this site — logos, artwork, product designs, copy, and graphics — is the property of TDEV or its licensors. You may not reproduce, resell, or use our designs commercially without written permission." },
      { h: "7. Limitation of Liability", b: "To the maximum extent permitted by law, TDEV is not liable for indirect or consequential loss arising from use of the site or in connection with products purchased. Nothing in these Terms limits rights that cannot be limited by law." },
      { h: "8. Contact", b: "Questions about these Terms? Use the contact section on the site or reach us through the Contact page and we will respond as soon as possible." },
    ])}
  </LegalLayout>
);

export const PrivacyPage = () => (
  <LegalLayout title="Privacy Policy" updated="September 2026">
    {sections([
      { h: "1. Who we are", b: "TDEV | Tenue de Ville ('TDEV', 'we', 'us') operates this store. This Privacy Policy explains what personal data we collect, why we collect it, and the choices you have. We are committed to handling your data transparently and lawfully." },
      { h: "2. Data we collect", b: "We collect: (a) account and contact details (name, email, phone, delivery address) when you create an account or place an order; (b) checkout and cart contents to fulfil orders; (c) data you submit through contact, custom-design, and style-quiz forms; and (d) basic technical data (pages visited, approximate region, device type) through analytics." },
      { h: "3. How we use it", b: "Your data is used to: process and deliver orders, communicate about your order and account, respond to enquiries and design requests, run the style quiz and subscription service where offered, prevent fraud, and improve the store. We rely on the legal basis of performing the contract you enter when ordering, our legitimate interest in operating the business securely, and consent where required." },
      { h: "4. Sharing", b: "We share the minimum data needed with: payment processors (Paystack, Flutterwave) to authorise charges; logistics/shipping partners to deliver orders; and analytics providers for aggregate statistics. We never sell your personal data." },
      { h: "5. Retention", b: "We keep order and account records for as long as your account is active or as needed to fulfil our legal and tax obligations. Analytics data is retained in aggregated form." },
      { h: "6. Your rights", b: "Depending on where you live, you may have rights to access, correct, delete, or port your personal data, and to object to or restrict certain processing. To exercise these, contact us through the Contact page — we will respond within a reasonable time and without charge." },
      { h: "7. Security", b: "We use HTTPS encryption, secure password hashing, and access controls to protect your data. Payment details are handled exclusively by our PCI-compliant payment partners and never touch our servers." },
      { h: "8. Children", b: "This store is not directed at children under 13 and we do not knowingly collect their data. If you believe a child has provided data, contact us and we will delete it." },
      { h: "9. Contact", b: "Privacy questions or requests: use the contact form on the site or the email address in the footer and we will help." },
    ])}
  </LegalLayout>
);

export const CookiePage = () => (
  <LegalLayout title="Cookie Policy" updated="September 2026">
    {sections([
      { h: "1. What cookies are", b: "Cookies are small text files stored on your device when you visit a website. They help the site work, remember your preferences, and understand how visitors use the store." },
      { h: "2. Cookies we use", b: "(a) Essential: session and security cookies required for the cart, checkout, and sign-in to function — these cannot be switched off. (b) Preferences: remember your chosen currency and theme. (c) Analytics: anonymised visit statistics (pages viewed, device type, approximate region) that help us improve the store." },
      { h: "3. Managing cookies", b: "You can block or delete cookies in your browser settings at any time. Blocking essential cookies may break the cart, checkout, or login; blocking analytics cookies only affects our aggregate statistics and has no impact on store functionality." },
      { h: "4. Updates", b: "We may update this policy as the store evolves. The 'Last updated' date at the top of this page reflects the current version." },
      { h: "5. Contact", b: "Questions about cookies? Reach us through the Contact page." },
    ])}
  </LegalLayout>
);