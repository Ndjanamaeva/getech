import { ShieldCheck, Headphones, Truck, CheckCircle2, Target, Eye, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/backend/lib/config';
import { Link } from 'react-router-dom';
import { Reveal } from '@/frontend/hooks/useReveal';
import { SmartImage } from '@/frontend/components/ui/SmartImage';
import { siteImages } from '@/frontend/lib/images';

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-brand-deep py-20 lg:py-28">
        <div className="absolute inset-0">
          <SmartImage
            src={siteImages.about}
            alt={siteImages.aboutAlt}
            priority
            wrapperClassName="absolute inset-0"
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-deep via-brand-deep/90 to-brand-deep/40" />
        </div>
        <div className="container-page relative z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              À propos
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              À propos de GENESYS Cameroon
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/75">
              {siteConfig.company.description}
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-2">
            <Reveal className="card p-8 card-hover">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-brand-text">Notre mission</h2>
              <p className="mt-3 leading-relaxed text-brand-muted">
                Fournir aux laboratoires africains des équipements techniques de précision, adaptés aux
                exigences des analyses médicales, agroalimentaires et minéralogiques. Nous facilitons
                l'accès à des instruments professionnels par un accompagnement commercial rigoureux
                et un suivi de chaque demande.
              </p>
            </Reveal>
            <Reveal delay={120} className="card p-8 card-hover">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                <Eye className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-brand-text">Notre approche</h2>
              <p className="mt-3 leading-relaxed text-brand-muted">
                Nous privilégions la qualité, la transparence et la disponibilité. Chaque demande de devis
                est traitée individuellement par notre équipe commerciale, avec une négociation adaptée aux
                besoins et aux volumes commandés. La disponibilité de nos équipements est indiquée en temps
                réel selon notre stock.
              </p>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Qualité', text: 'Des équipements sélectionnés pour leur fiabilité technique.' },
              { icon: Headphones, title: 'Accompagnement', text: 'Un interlocuteur dédié pour chaque demande.' },
              { icon: Truck, title: 'Disponibilité', text: 'Stock suivi en temps réel, statut visible au catalogue.' },
              { icon: CheckCircle2, title: 'Suivi', text: 'Chaque demande est tracée du devis à la commande.' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 80} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-bg text-brand-primary transition-transform hover:scale-105">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-brand-text">{f.title}</h3>
                <p className="mt-1.5 text-sm text-brand-muted">{f.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-brand-deep px-6 py-12 text-center sm:px-12">
          <div className="absolute inset-0 bg-grid-faint bg-grid opacity-30" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Une question sur nos équipements ?
            </h2>
            <p className="mt-2 text-white/70">Notre équipe est à votre écoute.</p>
            <Link to="/contact" className="btn-white mt-6 group">
              Nous contacter
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
