import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="text-center animate-fadeIn">
        <p className="font-display text-7xl font-extrabold tracking-tightest text-brand-primary sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-brand-text">Page introuvable</h1>
        <p className="mt-2 text-brand-muted">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/" className="btn-primary">
            <Home className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <Link to="/equipements" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Voir le catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}
