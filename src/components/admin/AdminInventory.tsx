import { useState } from "react";
import { Grid3X3, Package } from "lucide-react";
import AdminCategories from "./AdminCategories";
import AdminProducts from "./AdminProducts";

const subTabs = [
  { id: "categories", label: "Categories", icon: Grid3X3 },
  { id: "products", label: "Products", icon: Package },
];

const AdminInventory = () => {
  const [activeSubTab, setActiveSubTab] = useState("categories");

  return (
    <div>
      <h2 className="font-display text-2xl font-light mb-1">Inventory Management</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">
        Manage your categories and products in one place.
      </p>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-md font-body text-xs tracking-wider whitespace-nowrap transition-colors ${
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

      {activeSubTab === "categories" ? <AdminCategories /> : <AdminProducts />}
    </div>
  );
};

export default AdminInventory;
