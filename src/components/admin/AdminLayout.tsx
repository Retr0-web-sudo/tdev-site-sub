import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Palette, Type, Grid3X3, Lightbulb, Package, UserPlus, LogOut, ExternalLink, Megaphone, FileText, BookOpen, Image, CreditCard, ClipboardList, Mail, Shirt, Gamepad2, Printer, Repeat } from "lucide-react";
import AdminAnalytics from "./AdminAnalytics";
import AdminThemeFonts from "./AdminThemeFonts";
import AdminSiteContent from "./AdminSiteContent";
import AdminPhilosophy from "./AdminPhilosophy";
import AdminInventory from "./AdminInventory";
import AdminInvite from "./AdminInvite";
import AdminAnnouncements from "./AdminAnnouncements";
import AdminBlog from "./AdminBlog";
import AdminDocumentation from "./AdminDocumentation";
import AdminCarousels from "./AdminCarousels";
import AdminPaymentGateways from "./AdminPaymentGateways";
import AdminOrders from "./AdminOrders";
import AdminMessages from "./AdminMessages";
import AdminDesignRequests from "./AdminDesignRequests";
import AdminGameSettings from "./AdminGameSettings";
import AdminPrintify from "./AdminPrintify";
import AdminSubscriptions from "./AdminSubscriptions";

const tabs = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "theme", label: "Theme & Fonts", icon: Palette },
  { id: "content", label: "Site Content", icon: Type },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "carousels", label: "Carousels", icon: Image },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "subscriptions", label: "Subscriptions", icon: Repeat },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "philosophy", label: "Philosophy", icon: Lightbulb },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "designs", label: "Custom Designs", icon: Shirt },
  { id: "games", label: "Game Settings", icon: Gamepad2 },
  { id: "printify", label: "Printify", icon: Printer },
  { id: "invite", label: "Invite Admin", icon: UserPlus },
  { id: "docs", label: "Documentation", icon: BookOpen },
];

const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const { user, signOut } = useAuth();

  const renderTab = () => {
    switch (activeTab) {
      case "analytics": return <AdminAnalytics />;
      case "theme": return <AdminThemeFonts />;
      case "content": return <AdminSiteContent />;
      case "announcements": return <AdminAnnouncements />;
      case "blog": return <AdminBlog />;
      case "carousels": return <AdminCarousels />;
      case "inventory": return <AdminInventory />;
      case "subscriptions": return <AdminSubscriptions />;
      case "orders": return <AdminOrders />;
      case "philosophy": return <AdminPhilosophy />;
      case "payments": return <AdminPaymentGateways />;
      case "messages": return <AdminMessages />;
      case "designs": return <AdminDesignRequests />;
      case "games": return <AdminGameSettings />;
      case "printify": return <AdminPrintify />;
      case "invite": return <AdminInvite />;
      case "docs": return <AdminDocumentation />;
      default: return <AdminAnalytics />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-[hsl(25,15%,5%)]">
        <div className="px-6 md:px-10 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-3 group" aria-label="TDEV - Tenue de Ville home">
              <img src="/logo.png" alt="TDEV | Tenue de Ville" className="h-9 w-9 rounded-lg object-cover ring-1 ring-white/10 group-hover:ring-accent/60 transition-all" />
              <span className="font-body text-sm tracking-wider">Admin Panel</span>
            </a>
          </div>
          <div className="flex items-center gap-6">
            <a href="/" target="_blank" className="hidden md:flex items-center gap-1.5 font-body text-xs tracking-wider text-muted-foreground hover:text-foreground transition-colors">
              View Site <ExternalLink size={12} />
            </a>
            <span className="hidden md:block font-body text-xs text-muted-foreground">{user?.email}</span>
            <button onClick={signOut} className="flex items-center gap-1.5 font-body text-xs tracking-wider text-muted-foreground hover:text-foreground transition-colors">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-light">Welcome back</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Manage your website content without any coding required.</p>
        </div>

        <div className="border-b border-border mb-8 overflow-x-auto">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-md font-body text-xs tracking-wider whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {renderTab()}
      </div>
    </div>
  );
};

export default AdminLayout;
