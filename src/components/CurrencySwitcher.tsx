import { Globe } from "lucide-react";
import { useCurrency } from "@/lib/currency";

const CurrencySwitcher = ({ className = "" }: { className?: string }) => {
  const { currency, setCurrencyCode, currencies } = useCurrency();

  return (
    <div className={`relative flex items-center gap-1 ${className}`} title="Display currency">
      <Globe size={14} className="text-foreground/70" aria-hidden />
      <select
        value={currency.code}
        onChange={(e) => setCurrencyCode(e.target.value)}
        aria-label="Display currency"
        className="bg-transparent border border-border/50 rounded-full pl-2 pr-1 py-1 text-[10px] font-body tracking-[0.12em] text-foreground outline-none cursor-pointer hover:border-accent/50 transition-colors"
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code} className="bg-card text-foreground">
            {c.code}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySwitcher;