import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
  Stethoscope,
  Wheat,
  Gem,
  Search,
  ClipboardList,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Headphones,
} from 'lucide-react';
import { fetchCategories } from '@/backend/services/catalog';
import { Loading } from '@/frontend/components/ui/Loading';
import { SmartImage } from '@/frontend/components/ui/SmartImage';
import { Reveal } from '@/frontend/hooks/useReveal';
import { siteConfig } from '@/backend/lib/config';
import { siteImages, sectorImage } from '@/frontend/lib/images';
import type { Category } from '@/backend/types';

const categoryIcons: Record<string, typeof Stethoscope> = {
  'analyses-medicales': Stethoscope,
  'analyses-agroalimentaires': Wheat,
  'analyses-mineralogiques': Gem,
};

const sectorContent: Record<string, { points: string[] }> = {
  'analyses-medicales': {
    points: [
      'Instruments de diagnostic in vitro et d’hématologie',
      'Centrifugeuses et automates de biochimie',
      'Microscopes et équipements de prélèvement',
    ],
  },
  'analyses-agroalimentaires': {
    points: [
      'Analyseurs de composition et de sécurité alimentaire',
      'Équipements de contrôle de qualité et microbiologie',
      'Instruments de dosage et de spectroscopie',
    ],
  },
  'analyses-mineralogiques': {
    points: [
      'Spectromètres et équipements de fluorescence X',
      'Broyeurs, concasseurs et préparation d’échantillons',
      'Microscopes pétrographiques et balances de précision',
    ],
  },
};

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cats = await fetchCategories();
        if (!active) return;
        setCategories(cats);
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
    <>
      <Hero />
      <CompanySection />
      <SectorsSection categories={categories} />
      <CategoriesSection categories={categories} />
      <ProcessSection />
      <CtaSection />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-deep">
      <div className="absolute inset-0">
        <SmartImage
          src={siteImages.hero}
          alt={siteImages.heroAlt}
          priority
          loading="eager"
          wrapperClassName="absolute inset-0"
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/85 via-brand-deep/55 to-brand-deep/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/80 via-transparent to-transparent" />
      </div>
      <div className="container-page relative z-10 py-24 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl animate-fadeInUp">
            {siteConfig.company.tagline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 animate-fadeInUp" style={{ animationDelay: '120ms' }}>
            Nous vous accompagnons dans l'approvisionnement en équipements techniques adaptés à vos exigences.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row animate-fadeInUp" style={{ animationDelay: '240ms' }}>
            <Link to="/equipements" className="btn-primary group">
              <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
              Explorer nos équipements
            </Link>
            <Link to="/demande-de-devis" className="btn-light">
              <FileText className="h-4 w-4" />
              Demander un devis
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden="true" />
    </section>
  );
}

function CompanySection() {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Qualité des équipements',
      text: 'Des instruments sélectionnés pour répondre aux exigences professionnelles.',
    },
    {
      icon: Headphones,
      title: 'Accompagnement commercial',
      text: 'Une équipe dédiée pour vous conseiller et négocier les meilleures conditions.',
    },
    {
      icon: Truck,
      title: 'Disponibilité suivie',
      text: 'La disponibilité des produits est indiquée en temps réel selon notre stock.',
    },
    {
      icon: CheckCircle2,
      title: 'Suivi des demandes',
      text: 'Chaque demande de devis est tracée et traitée par notre équipe commerciale.',
    },
  ];

  return (
    <section className="py-20 lg:py-28">
      <div className="container-page">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">À propos de GENESYS Cameroon</span>
          <h2 className="mt-3 text-3xl font-bold text-brand-text sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Un fournisseur d'équipements techniques pour les laboratoires
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-brand-muted">
            {siteConfig.company.description}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 80} className="card p-6 card-hover group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-accent group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-semibold text-brand-text">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{f.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectorsSection({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="py-20 bg-brand-bg lg:py-28">
      <div className="container-page">
        <Reveal className="text-center">
          <span className="eyebrow justify-center">Expertise</span>
          <h2 className="mt-3 text-3xl font-bold text-brand-text sm:text-4xl">
            Nos secteurs d'activité
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-brand-muted">
            Une expertise sectorielle pour des équipements adaptés à chaque laboratoire.
          </p>
        </Reveal>
        <div className="mt-14 space-y-8">
          {categories.map((cat, idx) => {
            const content = sectorContent[cat.slug];
            const Icon = categoryIcons[cat.slug] ?? Stethoscope;
            const reverse = idx % 2 === 1;
            const img = sectorImage(cat.slug, cat.image_url);
            return (
              <Reveal key={cat.id}>
                <div
                  className={`card grid overflow-hidden md:grid-cols-2 ${
                    reverse ? 'md:[&>*:first-child]:order-2' : ''
                  }`}
                >
                  <div className="relative aspect-[16/10] min-h-[280px] bg-brand-deep md:aspect-auto">
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
                    <h3 className="mt-5 text-xl font-bold text-brand-text">{cat.name}</h3>
                    {cat.description && (
                      <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                        {cat.description}
                      </p>
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
                    <div className="mt-7 flex flex-wrap items-center gap-4">
                      <Link
                        to={`/equipements?categorie=${cat.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary transition-all hover:gap-2.5"
                      >
                        Voir les équipements
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        to="/secteurs"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent transition-all hover:gap-2.5"
                      >
                        En savoir plus
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CategoriesSection({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="py-20 lg:py-28">
      <div className="container-page">
        <Reveal className="text-center">
          <span className="eyebrow justify-center">Catalogue</span>
          <h2 className="mt-3 text-3xl font-bold text-brand-text sm:text-4xl">
            Nos catégories d'équipements
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-brand-muted">
            Trois domaines d'expertise pour couvrir les besoins des laboratoires d'analyses
            médicales, agroalimentaires et minéralogiques.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {categories.map((cat, i) => {
            const Icon = categoryIcons[cat.slug] ?? Stethoscope;
            const img = sectorImage(cat.slug, cat.image_url);
            return (
              <Reveal key={cat.id} delay={i * 100}>
                <Link
                  to={`/equipements?categorie=${cat.slug}`}
                  className="card group block overflow-hidden card-hover"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-brand-deep">
                    <SmartImage
                      src={img}
                      alt={cat.name}
                      wrapperClassName="absolute inset-0"
                      className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/85 via-brand-deep/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Voir les équipements
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-brand-text transition-colors group-hover:text-brand-accent">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-brand-muted">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    { icon: Search, title: 'Choisissez votre équipement', text: 'Parcourez le catalogue et sélectionnez le produit adapté à vos besoins.' },
    { icon: ClipboardList, title: 'Envoyez votre demande', text: 'Remplissez le formulaire avec vos coordonnées et la quantité souhaitée.' },
    { icon: MessageSquare, title: 'Échangez avec notre équipe', text: 'Notre équipe commerciale vous contacte pour négocier les conditions.' },
    { icon: CheckCircle2, title: 'Validez votre commande', text: "Après accord sur les conditions de vente, votre commande est validée." },
  ];

  return (
    <section className="py-20 bg-brand-bg lg:py-28">
      <div className="container-page">
        <Reveal className="text-center">
          <span className="eyebrow justify-center">Processus</span>
          <h2 className="mt-3 text-3xl font-bold text-brand-text sm:text-4xl">
            Comment ça marche&nbsp;?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-brand-muted">
            Un processus simple et transparent, de la sélection à la commande.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 100} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent text-white shadow-sm transition-transform hover:scale-105">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mt-4 text-xs font-bold tracking-wider text-brand-accent">
                  ÉTAPE {i + 1}
                </div>
                <h3 className="mt-1 font-semibold text-brand-text">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">{step.text}</p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="absolute left-[60%] top-7 hidden h-px w-full bg-gradient-to-r from-brand-border to-transparent lg:block"
                  aria-hidden="true"
                />
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-brand-deep px-6 py-12 text-center sm:px-12 lg:py-16">
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-30" aria-hidden="true" />
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 lg:flex-row lg:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Prêt à équiper votre laboratoire&nbsp;?
            </h2>
            <p className="mt-2 text-white/70">
              Soumettez votre demande de devis et notre équipe vous répondra rapidement.
            </p>
          </div>
          <Link to="/demande-de-devis" className="btn-accent group flex-shrink-0">
            <FileText className="h-4 w-4 transition-transform group-hover:scale-110" />
            Demander un devis
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
