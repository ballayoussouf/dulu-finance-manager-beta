import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PricingData {
  proPrice: number;
  isLoading: boolean;
  error: string | null;
}

export function usePricing(): PricingData {
  const [proPrice, setProPrice] = useState<number>(2500); // Valeur par défaut
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('settings')
        .select('pricing')
        .single();

      if (fetchError) {
        console.error('Error fetching pricing:', fetchError);
        throw fetchError;
      }

      if (data && data.pricing) {
        setProPrice(data.pricing);
      }
    } catch (err) {
      console.error('Error in fetchPricing:', err);
      setError('Impossible de récupérer les tarifs');
      // Garder la valeur par défaut en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  return {
    proPrice,
    isLoading,
    error,
  };
}