import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, FileText, ArrowUpRight, Mail, Phone, MapPin } from 'lucide-react';
import { Logo } from '@/frontend/components/ui/Logo';
import { siteConfig } from '@/backend/lib/config';

// Order: Accueil → À propos → Secteurs d'activité → Nos équipements → Contact
const navItems = [
  { label: 'Accueil', to: '/' },
  { label: 'À propos', to: '/a-propos' },
  { label: "Secteurs d'activité", to: '/secteurs' },
  { label: 'Nos équipements', to: '/equipements' },
  { label: 'Contact', to: '/contact' },
];

export default function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ease-smooth ${
          scrolled
            ? 'bg-white/90 shadow-sm backdrop-blur-md border-b border-brand-border'
            : 'bg-white border-b border-transparent'
        }`}
      >
        <div className="container-page">
          <div
            className={`flex items-center justify-between transition-all duration-300 ease-smooth ${
              scrolled ? 'h-16' : 'h-20'
            }`}
          >
            <Link to="/" aria-label={`${siteConfig.company.name} — Accueil`} className="shrink-0">
              <Logo />
            </Link>

            <nav
              className="hidden items-center gap-0.5 lg:flex"
              aria-label="Navigation principale"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-brand-primary'
                        : 'text-brand-text hover:text-brand-accent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      <span
                        className={`absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-brand-accent transition-all duration-200 ${
                          isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="hidden lg:block">
              <Link to="/demande-de-devis" className="btn-accent group">
                <FileText className="h-4 w-4 transition-transform group-hover:scale-110" />
                Demander un devis
              </Link>
            </div>

            <button
              className="rounded-lg p-2 text-brand-text hover:bg-brand-bg lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-brand-border bg-white lg:hidden animate-fadeIn">
            <nav
              className="container-page flex flex-col gap-1 py-4"
              aria-label="Navigation mobile"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-brand-primary bg-brand-bg'
                        : 'text-brand-text hover:bg-brand-bg/60 hover:text-brand-accent'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <Link to="/demande-de-devis" className="btn-accent mt-3 w-full">
                <FileText className="h-4 w-4" />
                Demander un devis
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const contact = siteConfig.company.contact;

  return (
    <footer className="relative overflow-hidden bg-brand-deep text-white">
      <div
        className="absolute inset-0 bg-grid-faint bg-grid opacity-40"
        aria-hidden="true"
      />
      <div className="container-page relative z-10 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
              Équipements techniques de précision pour les laboratoires d'analyses
              médicales, agroalimentaires et minéralogiques.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/" className="text-white/75 hover:text-white link-underline">Accueil</Link></li>
              <li><Link to="/a-propos" className="text-white/75 hover:text-white link-underline">À propos</Link></li>
              <li><Link to="/secteurs" className="text-white/75 hover:text-white link-underline">Secteurs d'activité</Link></li>
              <li><Link to="/equipements" className="text-white/75 hover:text-white link-underline">Nos équipements</Link></li>
              <li><Link to="/contact" className="text-white/75 hover:text-white link-underline">Contact</Link></li>
              <li><Link to="/demande-de-devis" className="text-white/75 hover:text-white link-underline">Demander un devis</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Secteurs
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/equipements?categorie=analyses-medicales" className="text-white/75 hover:text-white link-underline">Laboratoire d'analyses médicales</Link></li>
              <li><Link to="/equipements?categorie=analyses-agroalimentaires" className="text-white/75 hover:text-white link-underline">Laboratoire d'analyses agroalimentaires</Link></li>
              <li><Link to="/equipements?categorie=analyses-mineralogiques" className="text-white/75 hover:text-white link-underline">Laboratoire d'analyses minéralogiques</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Coordonnées
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-white/75">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                <a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a>
              </li>
              <li className="flex items-start gap-2.5 text-white/75">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                <span className="flex flex-col">
                  <a href={`tel:${contact.phone}`} className="hover:text-white">{contact.phone}</a>
                  <a href={`tel:${contact.phone2}`} className="hover:text-white">{contact.phone2}</a>
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-white/75">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                <span>{contact.addressLine}</span>
              </li>
            </ul>
            <Link
              to="/demande-de-devis"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-white"
            >
              Demander un devis
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row">
          <p>© {year} {siteConfig.company.legalName}. Tous droits réservés.</p>
          <Link to="/politique-de-confidentialite" className="hover:text-white/80 link-underline">
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </footer>
  );
}
