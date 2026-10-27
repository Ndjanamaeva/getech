import { siteConfig } from './config';

export function formatCurrency(amount: number, currency: string = siteConfig.currency): string {
  const value = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  if (currency === 'XAF') return `${value} FCFA`;
  return `${value} ${currency}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getStockStatus(stock: number, threshold: number): {
  label: string;
  tone: 'success' | 'warning' | 'danger';
} {
  if (stock <= 0) return { label: 'Indisponible', tone: 'danger' };
  if (stock <= threshold) return { label: 'Stock faible', tone: 'warning' };
  return { label: 'Disponible', tone: 'success' };
}

export function quoteStatusLabels(status: string): string {
  const map: Record<string, string> = {
    NOUVELLE: 'Nouvelle',
    'CONTACTÉE': 'Contactée',
    'EN NÉGOCIATION': 'En négociation',
    'DEVIS ENVOYÉ': 'Devis envoyé',
    ACCEPTÉE: 'Acceptée',
    REFUSÉE: 'Refusée',
    ANNULÉE: 'Annulée',
  };
  return map[status] ?? status;
}

export function quoteStatusTone(status: string): 'info' | 'warning' | 'success' | 'danger' | 'neutral' {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
    NOUVELLE: 'info',
    'CONTACTÉE': 'warning',
    'EN NÉGOCIATION': 'warning',
    'DEVIS ENVOYÉ': 'info',
    ACCEPTÉE: 'success',
    REFUSÉE: 'danger',
    ANNULÉE: 'neutral',
  };
  return map[status] ?? 'neutral';
}

export function paymentStatusLabels(status: string): string {
  const map: Record<string, string> = {
    'EN ATTENTE': 'En attente',
    'PAYÉ': 'Payé',
    'PARTIEL': 'Partiel',
    'NON REQUIS': 'Non requis',
  };
  return map[status] ?? status;
}

export function paymentStatusTone(status: string): 'info' | 'warning' | 'success' | 'danger' | 'neutral' {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
    'EN ATTENTE': 'warning',
    'PAYÉ': 'success',
    'PARTIEL': 'warning',
    'NON REQUIS': 'neutral',
  };
  return map[status] ?? 'neutral';
}

export function deliveryStatusLabels(status: string): string {
  const map: Record<string, string> = {
    'EN ATTENTE': 'En attente',
    'EXPÉDIÉE': 'Expédiée',
    'LIVRÉE': 'Livrée',
    'RETOUR': 'Retour',
  };
  return map[status] ?? status;
}

export function deliveryStatusTone(status: string): 'info' | 'warning' | 'success' | 'danger' | 'neutral' {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
    'EN ATTENTE': 'warning',
    'EXPÉDIÉE': 'info',
    'LIVRÉE': 'success',
    'RETOUR': 'danger',
  };
  return map[status] ?? 'neutral';
}

export function orderStatusLabels(status: string): string {
  const map: Record<string, string> = {
    'EN COURS': 'En cours',
    'FINALISÉE': 'Finalisée',
    'ANNULÉE': 'Annulée',
  };
  return map[status] ?? status;
}

export function orderStatusTone(status: string): 'info' | 'warning' | 'success' | 'danger' | 'neutral' {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
    'EN COURS': 'warning',
    'FINALISÉE': 'success',
    'ANNULÉE': 'danger',
  };
  return map[status] ?? 'neutral';
}

const categoryPrefixMap: Record<string, string> = {
  'analyses-agroalimentaires': 'AGR',
  'analyses-medicales': 'MED',
  'analyses-mineralogiques': 'MIN',
};

export function getCategoryPrefix(categorySlug: string): string {
  return categoryPrefixMap[categorySlug] ?? 'GEN';
}

export function generateReference(categorySlug: string, sequence: number): string {
  const prefix = getCategoryPrefix(categorySlug);
  const seq = String(sequence).padStart(3, '0');
  const typeCode = randomTypeCode();
  return `${prefix}-${typeCode}-${seq}`;
}

function randomTypeCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
