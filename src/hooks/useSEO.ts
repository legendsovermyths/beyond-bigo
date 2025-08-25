import { useEffect } from 'react';
import { SEOData, applySEOData } from '@/lib/seo';

/**
 * Hook to apply SEO data to the document
 */
export function useSEO(seoData: SEOData) {
  useEffect(() => {
    applySEOData(seoData);
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Beyond Big-O | Algorithms Beyond Interview Prep';
    };
  }, [seoData]);
}

export default useSEO;
