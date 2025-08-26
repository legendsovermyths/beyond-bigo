import { useEffect } from 'react';

export interface SEOData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

/**
 * Apply SEO data to the document
 */
export function applySEOData(seoData: SEOData) {
  if (seoData.title) {
    document.title = seoData.title;
  }
  
  if (seoData.description) {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', seoData.description);
    }
  }
  
  if (seoData.image) {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      ogImage.setAttribute('content', seoData.image);
    }
    
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) {
      twitterImage.setAttribute('content', seoData.image);
    }
  }
}

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
