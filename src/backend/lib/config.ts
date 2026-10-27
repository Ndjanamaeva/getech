export const siteConfig = {
  company: {
    name: 'GENESYS CAMEROON',
    tagline: 'GENESYS CAMEROON, votre partenaire en matériel de pointe.',
    description:
      'GENESYS CAMEROON est un fournisseur d\'équipements techniques pour les laboratoires d\'analyses médicales, agroalimentaires et minéralogiques. Nous accompagnons les professionnels dans l\'approvisionnement en instruments de précision adaptés à leurs exigences.',
    contact: {
      email: 'dynamiscallcenter@gmail.com',
      phone: '690780007',
      phone2: '698608453',
      addressLine: 'Yaoundé, Cameroun',
      city: 'Yaoundé',
      country: 'Cameroun',
    },
    legalName: 'GENESYS CAMEROON',
  },
  currency: 'XAF',
  currencyLabel: 'FCFA',
  defaultCountry: 'Cameroun',
  social: {
    linkedin: '',
    facebook: '',
  },
  privacyPolicyUrl: '/politique-de-confidentialite',
} as const;

export type SiteConfig = typeof siteConfig;
