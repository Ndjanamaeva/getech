import { Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import type { ProductWithCategory } from '@/backend/types';
import { getStockStatus } from '@/backend/lib/utils';
import { StatusBadge } from '@/frontend/components/ui/StatusBadge';
import { SmartImage } from '@/frontend/components/ui/SmartImage';

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const stock = getStockStatus(product.stock_quantity, product.low_stock_threshold);
  const categoryName = product.categories?.name ?? '';

  return (
    <Link
      to={`/equipements/${product.slug}`}
      className="card group flex flex-col overflow-hidden card-hover"
      aria-label={`Voir ${product.name}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-bg">
        <SmartImage
          src={product.image_url}
          alt={product.name}
          fallbackLabel={product.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
          wrapperClassName="absolute inset-0"
        />
        {categoryName && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-brand-deep backdrop-blur-sm">
            {categoryName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold leading-snug text-brand-text transition-colors group-hover:text-brand-primary">
          {product.name}
        </h3>
        {product.reference && (
          <p className="mt-1 text-xs text-brand-muted">Réf. {product.reference}</p>
        )}
        {product.short_description && (
          <p className="mt-2 line-clamp-2 text-sm text-brand-muted">{product.short_description}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <StatusBadge tone={stock.tone} label={stock.label} />
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary transition-all group-hover:gap-2.5">
            <FileText className="h-4 w-4" />
            Devis
            <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        </div>
      </div>
    </Link>
  );
}
