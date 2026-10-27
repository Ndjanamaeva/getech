import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchProductBySlug, fetchProducts } from '@/backend/services/catalog';
import { Loading } from '@/frontend/components/ui/Loading';
import { StatusBadge } from '@/frontend/components/ui/StatusBadge';
import { SmartImage } from '@/frontend/components/ui/SmartImage';
import { ProductCard } from '@/frontend/components/catalog/ProductCard';
import { Reveal } from '@/frontend/hooks/useReveal';
import { getStockStatus } from '@/backend/lib/utils';
import { siteConfig } from '@/backend/lib/config';
import type { Product, ProductWithCategory } from '@/backend/types';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await fetchProductBySlug(slug);
        if (!active) return;
        if (!p) {
          setProduct(null);
          setError('Produit introuvable');
        } else {
          setProduct(p);
          const all = await fetchProducts({ categoryId: p.category_id });
          if (active) setRelated(all.filter((x) => x.id !== p.id).slice(0, 4));
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (loading) return <Loading fullScreen />;

  if (error || !product) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-brand-muted" />
          <h1 className="mt-4 text-2xl font-bold text-brand-text">Produit introuvable</h1>
          <p className="mt-2 text-brand-muted">
            Ce produit n'existe plus ou n'est plus disponible au catalogue.
          </p>
          <Link to="/equipements" className="btn-primary mt-6">
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const stock = getStockStatus(product.stock_quantity, product.low_stock_threshold);
  const showPrice = product.show_public_price && product.unit_price > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="container-page py-8 lg:py-12">
        <Link
          to="/equipements"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted transition-colors hover:text-brand-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <Reveal variant="reveal-scale">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-bg">
              <SmartImage
                src={product.image_url}
                alt={product.name}
                priority
                wrapperClassName="absolute inset-0"
                className="h-full w-full object-cover"
                fallbackLabel={product.name}
              />
            </div>
          </Reveal>

          <Reveal delay={120} className="flex flex-col">
            {product.reference && (
              <p className="text-sm font-medium text-brand-muted">Réf. {product.reference}</p>
            )}
            <h1 className="mt-1 text-3xl font-bold text-brand-text lg:text-4xl">{product.name}</h1>

            <div className="mt-4">
              <StatusBadge tone={stock.tone} label={stock.label} />
            </div>

            {product.short_description && (
              <p className="mt-5 text-lg leading-relaxed text-brand-text">
                {product.short_description}
              </p>
            )}

            {showPrice && (
              <p className="mt-5 text-2xl font-bold text-brand-primary">
                {new Intl.NumberFormat('fr-FR').format(product.unit_price)}{' '}
                {siteConfig.currencyLabel}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate(`/demande-de-devis?productId=${product.id}`)}
                className="btn-accent group"
              >
                <FileText className="h-4 w-4 transition-transform group-hover:scale-110" />
                Demander un devis
              </button>
              <Link to="/equipements" className="btn-secondary">
                Voir d'autres équipements
              </Link>
            </div>
          </Reveal>
        </div>

        {product.long_description && (
          <Reveal className="mt-12 max-w-3xl">
            <h2 className="text-xl font-bold text-brand-text">Description technique</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-brand-muted">
              {product.long_description}
            </p>
          </Reveal>
        )}

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-xl font-bold text-brand-text">Équipements similaires</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 60} variant="reveal-scale">
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
