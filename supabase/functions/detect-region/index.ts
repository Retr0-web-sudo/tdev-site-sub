const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map country codes to Shopify-supported currency codes
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  GH: 'GHS', NG: 'NGN', KE: 'KES', ZA: 'ZAR',
  US: 'USD', CA: 'CAD', GB: 'GBP', FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR',
  JP: 'JPY', CN: 'CNY', IN: 'INR', AU: 'AUD', NZ: 'NZD',
  BR: 'BRL', MX: 'MXN', AE: 'AED', SA: 'SAR', SG: 'SGD',
  CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN',
  ZW: 'USD', EG: 'EGP', MA: 'MAD', TZ: 'TZS', UG: 'UGX',
  CI: 'XOF', SN: 'XOF', CM: 'XAF', ET: 'ETB', RW: 'RWF',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try CF-IPCountry header (Cloudflare) or x-country (some edge providers)
    const country = req.headers.get('cf-ipcountry')
      || req.headers.get('x-country')
      || 'US'; // Default to United States

    const countryCode = country.toUpperCase();
    const currencyCode = COUNTRY_CURRENCY_MAP[countryCode] || 'USD';

    return new Response(
      JSON.stringify({ countryCode, currencyCode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ countryCode: 'US', currencyCode: 'USD' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
