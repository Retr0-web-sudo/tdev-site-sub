import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

/* ── Multi-currency support ──
 * Product prices in the DB are USD (the store is priced in dollars).
 * Display converts USD -> selected currency via live USD rates (open.er-api.com)
 * with a static fallback snapshot so the store never breaks offline.
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", decimals: 2 },
  { code: "EUR", symbol: "€", name: "Euro", decimals: 2 },
  { code: "GBP", symbol: "£", name: "British Pound", decimals: 2 },
  { code: "GHS", symbol: "GH₵", name: "Ghana Cedi", decimals: 2 },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", decimals: 0 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", decimals: 2 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", decimals: 2 },
  { code: "ZAR", symbol: "R", name: "South African Rand", decimals: 2 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", decimals: 0 },
];

/* Static fallback: units per 1 USD (refreshed from the API when online) */
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.87, GBP: 0.74, GHS: 11.45, NGN: 1328, CAD: 1.40, AUD: 1.41, ZAR: 16.32, JPY: 155.6,
};

const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const STORAGE_KEY = "tdev-currency";
const RATES_CACHE_KEY = "tdev-currency-rates";
const RATES_TTL = 6 * 60 * 60 * 1000; // 6h

interface CurrencyContextValue {
  currencies: Currency[];
  currency: Currency;
  setCurrencyCode: (code: string) => void;
  format: (usdAmount: number) => string;
  convert: (usdAmount: number) => number;
  rates: Record<string, number>;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function loadRates(): Record<string, number> {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached && cached.rates && Date.now() - cached.at < RATES_TTL) {
        return { ...FALLBACK_RATES, ...cached.rates };
      }
    }
  } catch { /* ignore corrupted cache */ }
  return FALLBACK_RATES;
}

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [rates, setRates] = useState<Record<string, number>>(loadRates);
  const [currency, setCurrency] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const match = saved ? CURRENCIES.find((c) => c.code === saved) : undefined;
      return match ?? CURRENCIES[0];
    } catch {
      return CURRENCIES[0]; // USD default
    }
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(RATES_URL);
        if (!res.ok) throw new Error("rates fetch failed");
        const data = await res.json();
        if (data?.result === "success" && data.rates) {
          const merged = { ...FALLBACK_RATES, ...data.rates };
          if (!cancelled) setRates(merged);
          try { localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ at: Date.now(), rates: data.rates })); }
          catch { /* storage unavailable */ }
        }
      } catch {
        /* keep fallback rates */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setCurrencyCode = useCallback((code: string) => {
    const next = CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
    setCurrency(next);
    try { localStorage.setItem(STORAGE_KEY, next.code); } catch { /* ignore */ }
  }, []);

  const convert = useCallback((usdAmount: number) => {
    const rate = rates[currency.code] ?? 1;
    return usdAmount * rate;
  }, [rates, currency.code]);

  const format = useCallback((usdAmount: number) => {
    const value = convert(usdAmount);
    return `${currency.symbol}${value.toLocaleString(undefined, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    })}`;
  }, [convert, currency]);

  return (
    <CurrencyContext.Provider value={{ currencies: CURRENCIES, currency, setCurrencyCode, format, convert, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}