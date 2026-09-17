import { Book, ShoppingBag, Palette, FileText, Database, Globe, Shield, Rocket, HelpCircle, Download, Package, CreditCard } from "lucide-react";

const sections = [
  {
    icon: Book,
    title: "Project Overview",
    content: `TDEV (Tenue de Ville) is a luxury fashion e-commerce platform with a standalone internal inventory management system, multi-gateway payment configuration, a powerful admin dashboard, a blog system, and 40+ theme presets with seasonal auto-detection. The site runs exclusively in dark mode for a premium aesthetic.`,
  },
  {
    icon: Package,
    title: "Inventory Management",
    content: `Products are managed entirely from the admin panel under the Inventory tab, which contains two sub-sections: Categories and Products. The system supports full product variants and bulk operations.`,
    bullets: [
      "Categories — Create, edit, delete product categories with slugs and descriptions",
      "Products — Full CRUD with name, slug, SKU, brand, material, weight, price, stock quantity",
      "Variant support — Sizes, colors, tags, and multiple images per product",
      "Stock alerts — Low stock warnings when quantity ≤ 5 units",
      "CSV Export — Download entire catalog as CSV for external use or backup",
      "CSV Import — Bulk import products from CSV files (name, slug required; pipe-separated arrays)",
    ],
  },
  {
    icon: CreditCard,
    title: "Payment Gateways",
    content: `The admin panel supports configuring multiple payment gateways. Admins can enable/disable and configure API keys for each provider. Only one gateway can be active at a time.`,
    bullets: [
      "Stripe — Full integration support with test/live mode toggle",
      "PayPal — Client ID and secret configuration",
      "Paystack — Popular for African markets with test/live mode",
      "Flutterwave — Alternative African payment gateway",
      "Gateway settings are stored in the site_settings database table",
    ],
  },
  {
    icon: Palette,
    title: "Theme & Customisation",
    content: `The theming engine offers 40+ presets across Core, Neon, and Holiday categories, including Black & Gold and White & Gold luxury themes. Seasonal themes auto-detect based on the current date. Over 50 Google Fonts are available for headings and body text. All changes persist to the database instantly. The site runs in dark mode only — the light/dark toggle has been removed.`,
    bullets: [
      "Core — Warm Sand, Midnight Noir, Black & Gold, White & Gold, Ocean Breeze, etc.",
      "Neon — Cyber Pink, Electric Blue, Matrix Green, etc.",
      "Holiday — Valentine's, Easter, Halloween, Christmas, etc.",
      "Neon overlay mixer — Blend neon effects onto any base theme",
    ],
  },
  {
    icon: FileText,
    title: "Blog / Journal",
    content: `The blog supports rich Markdown content, AI-assisted drafting, cover images, tags, and draft/published toggling. Posts are accessible at /blog/[slug] with SEO-friendly URLs auto-generated from titles.`,
  },
  {
    icon: Database,
    title: "Database & Authentication",
    content: `Authentication uses email/password with email verification required. Admin roles are stored in a separate user_roles table and checked server-side via a security-definer function to prevent privilege escalation.`,
    bullets: [
      "profiles — User display names, avatars, emails",
      "user_roles — Role assignments (admin, moderator, user)",
      "products — Full product catalog with variants (sku, brand, material, weight, tags)",
      "categories — Product categories with images and ordering",
      "orders — Customer orders with items, totals, and shipping",
      "announcements — Rotating banner messages",
      "blog_posts — Articles with content, tags, publish status",
      "site_settings — Key-value config store (theme, fonts, payment gateways, carousels)",
      "page_views — Analytics data",
    ],
  },
  {
    icon: Globe,
    title: "Site Pages",
    content: `The site consists of the following routes:`,
    bullets: [
      "/ — Homepage with hero carousel, collections, about section",
      "/shop — Full product catalogue from internal inventory",
      "/category/:slug — Category pages (Femme, Homme, Global) with admin-editable carousels",
      "/product/:slug — Product detail with variants and add-to-cart",
      "/wishlist — Saved items (requires login)",
      "/blog — Published articles and journal",
      "/admin — Full content management (admin role required)",
      "/auth — Sign in / sign up",
    ],
  },
  {
    icon: Shield,
    title: "Content Management Workflows",
    content: `All admin changes update the database directly and are live immediately — no publish step required. Frontend code changes deploy automatically from the GitHub repo (push to main/master).`,
    bullets: [
      "Inventory → Admin > Inventory tab (Categories + Products sub-tabs)",
      "CSV Import/Export → Admin > Inventory > Products (bulk operations)",
      "Payment Gateways → Admin > Payments tab",
      "Carousels → Admin > Carousels tab (hero & category images)",
      "Blog posts → Admin > Blog tab (supports AI generation)",
      "Announcements → Admin > Announcements tab (toggle, reorder)",
      "Theme/Fonts → Admin > Theme & Fonts tab (live preview)",
      "Homepage content → Admin > Site Content tab",
      "Invite admins → Admin > Invite Admin tab",
    ],
  },
  {
    icon: Rocket,
    title: "Deployment",
    content: `The site is hosted on Vercel and deployed from GitHub. Push to the main branch and the new build goes live automatically. Backend changes (database) apply instantly. Custom domains can be configured in Project Settings > Domains.`,
  },
  {
    icon: HelpCircle,
    title: "Troubleshooting",
    content: `Common issues and solutions:`,
    bullets: [
      "Products not showing? — Check if products exist in admin Inventory tab",
      "Theme not applying? — Clear browser cache or hard refresh (Ctrl+Shift+R)",
      "Can't access admin? — Ensure your account has admin role; another admin can invite you",
      "CSV import failing? — Ensure CSV has header row with 'name' and 'slug' columns",
      "Blog post not visible? — Toggle 'Published' on in admin panel",
      "Payment not working? — Ensure gateway is enabled and API keys are configured in Payments tab",
    ],
  },
];

const AdminDocumentation = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-light">Documentation & Handover</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Complete guide for managing the TDEV platform.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-md bg-accent/10">
                  <Icon size={18} className="text-accent" />
                </div>
                <h3 className="font-display text-lg font-light pt-1">{section.title}</h3>
              </div>
              <p className="font-body text-sm text-foreground/70 leading-relaxed mb-3">
                {section.content}
              </p>
              {section.bullets && (
                <ul className="space-y-1.5 ml-1">
                  {section.bullets.map((bullet, i) => (
                    <li key={i} className="font-body text-xs text-foreground/55 leading-relaxed flex gap-2">
                      <span className="text-accent/60 mt-0.5">▸</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDocumentation;
