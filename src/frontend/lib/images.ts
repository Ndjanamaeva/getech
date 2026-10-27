/**
 * Centralized image registry for the public site.
 * Reliable Pexels URLs (license-free) for sector and hero imagery.
 * Product images still come from the database (products.image_url).
 */
export const siteImages = {
  hero: 'https://images.pexels.com/photos/8442027/pexels-photo-8442027.jpeg?auto=compress&cs=tinysrgb&w=2000',
  heroAlt: 'Équipements de laboratoire de précision',
  about: 'https://images.pexels.com/photos/9574466/pexels-photo-9574466.jpeg?auto=compress&cs=tinysrgb&w=1600',
  aboutAlt: 'Analyses en laboratoire',

  sectors: {
    'analyses-medicales': {
      src: 'https://images.pexels.com/photos/8442446/pexels-photo-8442446.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'Analyses médicales en laboratoire',
    },
    'analyses-agroalimentaires': {
      src: 'https://images.pexels.com/photos/10514991/pexels-photo-10514991.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'Analyses agroalimentaires en laboratoire',
    },
    'analyses-mineralogiques': {
      src: 'https://images.pexels.com/photos/9010826/pexels-photo-9010826.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'Analyses minéralogiques en laboratoire',
    },
  },

  // Fallback per sector when category has no image_url in DB
  categoryFallback: {
    'analyses-medicales':
      'https://images.pexels.com/photos/8442446/pexels-photo-8442446.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'analyses-agroalimentaires':
      'https://images.pexels.com/photos/10514991/pexels-photo-10514991.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'analyses-mineralogiques':
      'https://images.pexels.com/photos/9010826/pexels-photo-9010826.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
} as const;

export function sectorImage(slug: string, dbImage?: string | null): string | undefined {
  if (dbImage) return dbImage;
  return siteImages.categoryFallback[slug as keyof typeof siteImages.categoryFallback];
}
