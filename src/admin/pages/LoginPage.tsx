import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, ArrowLeft } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/backend/lib/validations';
import { useAuth } from '@/backend/lib/auth';
import { Logo } from '@/frontend/components/ui/Logo';
import { Alert } from '@/frontend/components/ui/Alert';

export default function LoginPage() {
  const { signIn, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await signIn(values.identifier, values.password);
    setSubmitting(false);
    if (error) {
      setSubmitError(error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand-deep">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-block">
              <Logo variant="light" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white">Espace administrateur</h1>
            <p className="mt-2 text-sm text-white/60">
              Connectez-vous pour accéder au tableau de bord.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-xl">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="mb-4">
                <label className="label" htmlFor="identifier">Nom d'utilisateur</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    className="input pl-10"
                    placeholder="ADMIN"
                    {...register('identifier')}
                  />
                </div>
                {errors.identifier && <p className="mt-1 text-xs text-red-600">{errors.identifier.message}</p>}
              </div>

              <div className="mb-5">
                <label className="label" htmlFor="password">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="input pl-10"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              {submitError && (
                <div className="mb-4">
                  <Alert variant="error">
                    {submitError}. Vérifiez vos identifiants et réessayez.
                  </Alert>
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Connexion…
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
