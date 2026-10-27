import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, PackageX } from 'lucide-react';
import { fetchCategories, fetchProducts } from '@/backend/services/catalog';
import { ProductCard } from '@/frontend/components/catalog/ProductCard';
import { Loading } from '@/frontend/components/ui/Loading';
import { EmptyState } from '@/frontend/components/ui/EmptyState';
import { Reveal } from '@/frontend/hooks/useReveal';
import type { Category, ProductWithCategory } from '@/backend/types';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>(searchParams.get('categorie') ?? 'all');
  const [availability, setAvailability] = useState<'all' | 'available' | 'unavailable'>('all');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cats = await fetchCategories();
        if (!active) return;
        setCategories(cats);
        // Resolve a slug-based ?categorie= param to the matching category ID
        const param = searchParams.get('categorie');
        if (param) {
          const match = cats.find((c) => c.slug === param || c.id === param);
          if (match) setCategoryId(match.id);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts({
        categoryId: categoryId !== 'all' ? categoryId : undefined,
        search: search || undefined,
        availability,
      });
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [categoryId, search, availability]);

  useEffect(() => {
    const t = setTimeout(loadProducts, 250);
    return () => clearTimeout(t);
  }, [loadProducts]);

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    const next = new URLSearchParams(searchParams);
    if (value !== 'all') next.set('categorie', value);
    else next.delete('categorie');
    setSearchParams(next, { replace: true });
  };

  // Resolve a friendly category label from the slug for the page heading
  const activeCategory = categories.find(
    (c) => c.id === categoryId || c.slug === searchParams.get('categorie')
  );

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="container-page py-10 lg:py-14">
        <Reveal className="mb-8">
          <span className="eyebrow">Catalogue</span>
          <h1 className="mt-3 text-3xl font-bold text-brand-text sm:text-4xl">
            {activeCategory ? activeCategory.name : 'Nos équipements'}
          </h1>
          <p className="mt-2 text-brand-muted">
            Parcourez notre catalogue et demandez un devis pour les équipements qui vous intéressent.
          </p>
        </Reveal>

        <div className="card mb-8 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
              <input
                type="search"
                placeholder="Rechercher par nom ou référence…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                aria-label="Rechercher un équipement"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 flex-shrink-0 text-brand-muted" />
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="input min-w-[180px]"
                  aria-label="Filtrer par catégorie"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as 'all' | 'available' | 'unavailable')}
                className="input"
                aria-label="Filtrer par disponibilité"
              >
                <option value="all">Toutes disponibilités</option>
                <option value="available">Disponibles</option>
                <option value="unavailable">Indisponibles</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <EmptyState
            icon={<PackageX className="h-10 w-10" />}
            title="Erreur de chargement"
            description={error}
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<PackageX className="h-10 w-10" />}
            title="Aucun équipement trouvé"
            description="Essayez de modifier vos critères de recherche ou de filtrage."
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-brand-muted">
              {products.length} équipement{products.length > 1 ? 's' : ''} trouvé
              {products.length > 1 ? 's' : ''}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 60} variant="reveal-scale">
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
