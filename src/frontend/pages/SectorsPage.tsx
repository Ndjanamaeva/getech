import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Wheat,
  Gem,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { fetchCategories, fetchProducts } from '@/backend/services/catalog';
import { Loading } from '@/frontend/components/ui/Loading';
import { SmartImage } from '@/frontend/components/ui/SmartImage';
import { Reveal } from '@/frontend/hooks/useReveal';
import { sectorImage } from '@/frontend/lib/images';
import type { Category, ProductWithCategory } from '@/backend/types';

const categoryIcons: Record<string, typeof Stethoscope> = {
  'analyses-medicales': Stethoscope,
  'analyses-agroalimentaires': Wheat,
  'analyses-mineralogiques': Gem,
};

const sectorContent: Record<string, { points: string[] }> = {
  'analyses-medicales': {
    points: [
      'Hématologie et biologie clinique',
      'Biologie moléculaire (PCR, séquençage)',
      'Microbiologie et cultures',
    ],
  },
  'analyses-agroalimentaires': {
    points: [
      'Contrôle physico-chimique des aliments',
      'Microbiologie alimentaire et stérilisation',
      'Séchage, déshydratation et conservation',
    ],
  },
  'analyses-mineralogiques': {
    points: [
      'Caractérisation des minéraux (DRX, FX)',
      'Microscopie pétrographique et électronique',
      'Analyse thermique et microsonde',
    ],
  },
};

export default function SectorsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cats, prods] = await Promise.all([fetchCategories(), fetchProducts({})]);
        if (!active) return;
        setCategories(cats);
        setProducts(prods);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Erreur de chargement');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loading fullScreen />;
  if (error)
    return (
      <div className="container-page py-20 text-center text-brand-muted">
        Une erreur est survenue lors du chargement. Veuillez réessayer.
      </div>
    );

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <section className="relative overflow-hidden bg-brand-deep py-16 lg:py-20">
        <div className="absolute inset-0">
          <SmartImage
            src={sectorImage(categories[0]?.slug, categories[0]?.image_url)}
            alt="Secteurs d'activité"
            priority
            wrapperClassName="absolute inset-0"
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-deep via-brand-deep/90 to-brand-deep/40" />
        </div>
        <div className="container-page relative z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-accent/20 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-brand-accent/40">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              Expertise
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Nos secteurs d'activité
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/75">
              Trois domaines d'expertise pour équiper les laboratoires d'analyses
              médicales, agroalimentaires et minéralogiques.
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-16 lg:py-24">
        <div className="space-y-10">
          {categories.map((cat, idx) => {
            const content = sectorContent[cat.slug];
            const Icon = categoryIcons[cat.slug] ?? Stethoscope;
            const reverse = idx % 2 === 1;
            const img = sectorImage(cat.slug, cat.image_url);
            const count = products.filter((p) => p.category_id === cat.id).length;
            return (
              <Reveal key={cat.id}>
                <div
                  className={`card grid overflow-hidden md:grid-cols-2 ${
                    reverse ? 'md:[&>*:first-child]:order-2' : ''
                  }`}
                >
                  <div className="relative aspect-[16/10] min-h-[300px] bg-brand-deep md:aspect-auto">
                    <SmartImage
                      src={img}
                      alt={cat.name}
                      wrapperClassName="absolute inset-0"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-8 lg:p-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold text-brand-text">{cat.name}</h2>
                    {cat.description && (
                      <p className="mt-3 leading-relaxed text-brand-muted">{cat.description}</p>
                    )}
                    {content && (
                      <ul className="mt-5 space-y-2.5">
                        {content.points.map((p) => (
                          <li key={p} className="flex items-start gap-2.5 text-sm text-brand-text">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-accent" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Link
                        to={`/equipements?categorie=${cat.slug}`}
                        className="btn-primary group"
                      >
                        Voir les équipements ({count})
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                      <Link to="/demande-de-devis" className="btn-secondary">
                        Demander un devis
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-brand-text">
            Besoin d'un équipement spécifique&nbsp;?
          </h2>
          <p className="mt-2 text-brand-muted">
            Notre équipe vous conseille et négocie les meilleures conditions.
          </p>
          <Link to="/demande-de-devis" className="btn-accent mt-6 group">
            Demander un devis
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
