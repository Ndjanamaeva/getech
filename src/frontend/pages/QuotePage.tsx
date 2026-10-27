import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { quoteFormSchema, type QuoteFormValues } from '@/backend/lib/validations';
import { fetchProducts, fetchProductById } from '@/backend/services/catalog';
import { submitQuote } from '@/backend/services/quotes';
import { siteConfig } from '@/backend/lib/config';
import { Loading } from '@/frontend/components/ui/Loading';
import { Alert } from '@/frontend/components/ui/Alert';
import { SmartImage } from '@/frontend/components/ui/SmartImage';
import { Reveal } from '@/frontend/hooks/useReveal';
import type { Product, ProductWithCategory } from '@/backend/types';

export default function QuotePage() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('productId');
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      product_id: preselectedId ?? '',
      quantity: 1,
      country: siteConfig.defaultCountry,
      consent: false as unknown as true,
    },
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchProducts({});
        if (!active) return;
        setProducts(data);
      } finally {
        if (active) setLoadingProducts(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!preselectedId || products.length === 0) return;
    let active = true;
    (async () => {
      const product = products.find((p) => p.id === preselectedId);
      if (product) {
        if (active) {
          setSelectedProduct(product);
          setValue('product_id', product.id);
          setProductError(null);
        }
      } else {
        const p = await fetchProductById(preselectedId);
        if (!active) return;
        if (p && p.is_active && !p.is_archived) {
          setSelectedProduct(p);
          setValue('product_id', p.id);
          setProductError(null);
        } else {
          setSelectedProduct(null);
          setProductError('Le produit sélectionné n\'existe plus ou n\'est plus disponible.');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [preselectedId, products, setValue]);

  const onSubmit = async (values: QuoteFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitQuote(values);
      setSuccessRef(result.reference);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Une erreur est survenue';
      if (msg.includes('PRODUCT_NOT_FOUND')) {
        setSubmitError('Le produit sélectionné n\'est plus disponible.');
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProducts) return <Loading fullScreen />;

  if (successRef) {
    return (
      <div className="container-page py-16 lg:py-24">
        <Reveal className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
            <CheckCircle2 className="h-8 w-8 text-success-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-brand-text">Demande envoyée avec succès</h1>
          <p className="mt-3 text-brand-muted">
            Votre demande de devis a bien été enregistrée. Notre équipe commerciale prendra contact
            avec vous prochainement.
          </p>
          <div className="mt-6 rounded-xl border border-brand-border bg-brand-bg p-5">
            <p className="text-sm text-brand-muted">Votre numéro de référence</p>
            <p className="mt-1 text-xl font-bold text-brand-primary">{successRef}</p>
          </div>
          <p className="mt-4 text-sm text-brand-muted">
            Conservez cette référence pour tout suivi de votre demande.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/equipements" className="btn-primary">
              <ArrowLeft className="h-4 w-4" />
              Retour au catalogue
            </Link>
            <Link to="/" className="btn-secondary">
              Accueil
            </Link>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="container-page py-10 lg:py-14">
        <Link
          to="/equipements"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted transition-colors hover:text-brand-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>

        <Reveal className="mt-6 max-w-3xl">
          <span className="eyebrow">Devis</span>
          <h1 className="mt-3 text-3xl font-bold text-brand-text sm:text-4xl">Demande de devis</h1>
          <p className="mt-2 text-brand-muted">
            Remplissez le formulaire ci-dessous. Les champs marqués d'un astérisque (*) sont obligatoires.
          </p>
        </Reveal>

        {productError && (
          <div className="mt-6 max-w-3xl">
            <Alert variant="warning" title="Produit indisponible">
              {productError}{' '}
              <Link to="/equipements" className="font-semibold underline">
                Retourner au catalogue
              </Link>
              .
            </Alert>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="card p-6 sm:p-8" noValidate>
              <h2 className="text-lg font-semibold text-brand-text">Produit sélectionné</h2>

              {selectedProduct ? (
                <div className="mt-4 flex items-center gap-4 rounded-lg border border-brand-border bg-brand-bg/50 p-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                    <SmartImage
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      wrapperClassName="h-full w-full"
                      className="h-full w-full object-cover"
                      fallbackLabel={selectedProduct.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-brand-text">{selectedProduct.name}</p>
                    {selectedProduct.reference && (
                      <p className="text-xs text-brand-muted">Réf. {selectedProduct.reference}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm italic text-brand-muted">
                  Aucun produit présélectionné. Choisissez un produit ci-dessous.
                </p>
              )}

              <div className="mt-4">
                <label className="label" htmlFor="product_id">
                  Modifier le produit *
                </label>
                <Controller
                  control={control}
                  name="product_id"
                  render={({ field }) => (
                    <select
                      id="product_id"
                      className="input"
                      value={field.value}
                      onChange={(e) => {
                        const id = e.target.value;
                        field.onChange(id);
                        const p = products.find((x) => x.id === id);
                        setSelectedProduct(p ?? null);
                      }}
                    >
                      <option value="" disabled>
                        Sélectionnez un équipement
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.reference ? ` — ${p.reference}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.product_id && (
                  <p className="mt-1 text-xs text-danger-600">{errors.product_id.message}</p>
                )}
              </div>

              <div className="mt-6">
                <label className="label" htmlFor="quantity">
                  Quantité souhaitée *
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  className="input max-w-[140px]"
                  {...register('quantity', { valueAsNumber: true })}
                />
                {errors.quantity && (
                  <p className="mt-1 text-xs text-danger-600">{errors.quantity.message}</p>
                )}
              </div>

              <hr className="my-6 border-brand-border" />

              <h2 className="text-lg font-semibold text-brand-text">Vos coordonnées</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="first_name">Prénom *</label>
                  <input id="first_name" className="input" {...register('first_name')} />
                  {errors.first_name && (
                    <p className="mt-1 text-xs text-danger-600">{errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="label" htmlFor="last_name">Nom *</label>
                  <input id="last_name" className="input" {...register('last_name')} />
                  {errors.last_name && (
                    <p className="mt-1 text-xs text-danger-600">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="label" htmlFor="address">Adresse complète *</label>
                <input id="address" className="input" {...register('address')} />
                {errors.address && (
                  <p className="mt-1 text-xs text-danger-600">{errors.address.message}</p>
                )}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="city">Ville</label>
                  <input id="city" className="input" {...register('city')} />
                </div>
                <div>
                  <label className="label" htmlFor="country">Pays *</label>
                  <input id="country" className="input" {...register('country')} />
                  {errors.country && (
                    <p className="mt-1 text-xs text-danger-600">{errors.country.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="phone">Numéro de téléphone *</label>
                  <input id="phone" type="tel" className="input" placeholder="+237 6XX XX XX XX" {...register('phone')} />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-danger-600">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label className="label" htmlFor="email">Adresse e-mail</label>
                  <input id="email" type="email" className="input" {...register('email')} />
                  {errors.email && (
                    <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="label" htmlFor="message">Message ou précisions complémentaires</label>
                <textarea
                  id="message"
                  rows={4}
                  className="input resize-none"
                  {...register('message')}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-danger-600">{errors.message.message}</p>
                )}
              </div>

              <div className="mt-5">
                <label className="flex items-start gap-3">
                  <Controller
                    control={control}
                    name="consent"
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                        checked={field.value === true}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    )}
                  />
                  <span className="text-sm text-brand-muted">
                    J'accepte le traitement de mes données personnelles dans le cadre de ma demande de devis.{' '}
                    <Link to={siteConfig.privacyPolicyUrl} className="font-medium text-brand-primary underline">
                      Politique de confidentialité
                    </Link>
                    .
                  </span>
                </label>
                {errors.consent && (
                  <p className="mt-1 text-xs text-danger-600">{errors.consent.message}</p>
                )}
              </div>

              {submitError && (
                <div className="mt-5">
                  <Alert variant="error" title="Échec de l'envoi">
                    {submitError}. Vérifiez vos informations et réessayez. Vos saisies sont conservées.
                  </Alert>
                </div>
              )}

              <div className="mt-6">
                <button type="submit" disabled={submitting} className="btn-accent w-full sm:w-auto">
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Demander un devis
                    </>
                  )}
                </button>
              </div>
            </form>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-1">
            <aside className="card sticky top-24 p-6">
              <h3 className="font-semibold text-brand-text">Comment ça marche ?</h3>
              <ol className="mt-4 space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">1</span>
                  <span className="text-brand-muted">Vous soumettez votre demande avec vos coordonnées.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">2</span>
                  <span className="text-brand-muted">Notre équipe reçoit votre demande et vous contacte.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">3</span>
                  <span className="text-brand-muted">Nous négocions les conditions de vente ensemble.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">4</span>
                  <span className="text-brand-muted">Votre commande est validée après accord.</span>
                </li>
              </ol>

              <div className="mt-6 rounded-lg bg-brand-bg p-4">
                <p className="flex items-start gap-2 text-xs text-brand-muted">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Les prix ne sont pas affichés publiquement. Ils font l'objet d'une négociation commerciale
                  adaptée à votre besoin.
                </p>
              </div>
            </aside>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
