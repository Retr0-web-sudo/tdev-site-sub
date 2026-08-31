import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

interface RegionStore {
  countryCode: string;
  currencyCode: string;
  isDetected: boolean;
  detect: () => Promise<void>;
}

export const useRegionStore = create<RegionStore>()(
  persist(
    (set, get) => ({
      countryCode: 'US',
      currencyCode: 'USD',
      isDetected: false,

      detect: async () => {
        if (get().isDetected) return;
        try {
          const { data, error } = await supabase.functions.invoke('detect-region');
          if (!error && data?.countryCode) {
            set({
              countryCode: data.countryCode,
              currencyCode: data.currencyCode,
              isDetected: true,
            });
          }
        } catch {
          // Keep defaults
        }
      },
    }),
    {
      name: 'visitor-region',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ countryCode: s.countryCode, currencyCode: s.currencyCode, isDetected: s.isDetected }),
    }
  )
);
