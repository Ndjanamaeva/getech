import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  ShoppingCart,
  FileText,
  MessageCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { fetchQuoteById, updateQuoteStatus } from '@/backend/services/quotes';
import { validateSale, getQuoteSale } from '@/backend/services/admin';
import { PageHeader } from '@/frontend/components/ui/PageHeader';
import { Loading } from '@/frontend/components/ui/Loading';
import { StatusBadge } from '@/frontend/components/ui/StatusBadge';
import { Alert } from '@/frontend/components/ui/Alert';
import { Modal } from '@/frontend/components/ui/Modal';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  quoteStatusLabels,
  quoteStatusTone,
  paymentStatusLabels,
  paymentStatusTone,
} from '@/backend/lib/utils';
import type { QuoteRequestWithProduct, QuoteStatus } from '@/backend/types';

const statusFlow: QuoteStatus[] = [
  'NOUVELLE',
  'CONTACTÉE',
  'EN NÉGOCIATION',
  'DEVIS ENVOYÉ',
  'ACCEPTÉE',
  'REFUSÉE',
  'ANNULÉE',
];

type LinkedSale = {
  id: string;
  reference: string;
  status: string;
  total_amount: number;
  payment_status: string;
  delivery_status: string;
  order_status: string;
  created_at: string;
} | null;

export default function AdminQuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<QuoteRequestWithProduct | null>(null);
  const [linkedSale, setLinkedSale] = useState<LinkedSale>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<QuoteStatus>('NOUVELLE');
  const [note, setNote] = useState('');
  const [negotiatedAmount, setNegotiatedAmount] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [q, sale] = await Promise.all([fetchQuoteById(id), getQuoteSale(id)]);
      setQuote(q);
      setLinkedSale(sale);
      if (q) {
        setNewStatus(q.status);
        setNegotiatedAmount(q.negotiated_amount?.toString() ?? '');
        setNote(q.commercial_notes ?? '');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdate = async () => {
    if (!quote) return;
    setUpdating(true);
    setError(null);
    try {
      await updateQuoteStatus(
        quote.id,
        newStatus,
        note || undefined,
        negotiatedAmount ? parseFloat(negotiatedAmount) : null,
        note || null
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setUpdating(false);
    }
  };

  const handleValidateSale = async () => {
    if (!quote) return;
    setValidating(true);
    setSaleError(null);
    try {
      const amount = negotiatedAmount ? parseFloat(negotiatedAmount) : 0;
      const unitPrice = negotiatedAmount ? parseFloat(negotiatedAmount) / quote.quantity : 0;
      const sale = await validateSale({
        quoteRequestId: quote.id,
        customerName: `${quote.first_name} ${quote.last_name}`,
        customerEmail: quote.email ?? undefined,
        customerPhone: quote.phone,
        items: [
          {
            product_id: quote.product_id,
            quantity: quote.quantity,
            unit_price: unitPrice || amount,
          },
        ],
      });
      setSaleSuccess(sale.reference);
      setSaleModalOpen(false);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur';
      if (msg.includes('INSUFFICIENT_STOCK')) {
        setSaleError('Stock insuffisant pour valider cette vente.');
      } else if (msg.includes('QUOTE_ALREADY_SOLD')) {
        setSaleError('Cette demande a déjà une vente validée.');
      } else {
        setSaleError(msg);
      }
    } finally {
      setValidating(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !quote) {
    return (
      <div>
        <Link to="/admin/demandes" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary">
          <ArrowLeft className="h-4 w-4" />
          Retour aux demandes
        </Link>
        <p className="mt-4 text-brand-muted">Demande introuvable. {error}</p>
      </div>
    );
  }

  const whatsappUrl = quote.phone
    ? `https://wa.me/${quote.phone.replace(/[^0-9]/g, '')}`
    : '';
  const mailtoUrl = quote.email
    ? `mailto:${quote.email}?subject=GENESYS Cameroon — Demande ${quote.reference}`
    : '';

  return (
    <div>
      <Link
        to="/admin/demandes"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux demandes
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-text">{quote.reference}</h1>
            <StatusBadge tone={quoteStatusTone(quote.status)} label={quoteStatusLabels(quote.status)} />
          </div>
          <p className="mt-1 text-sm text-brand-muted">Créée le {formatDateTime(quote.created_at)}</p>
        </div>
        {quote.status === 'ACCEPTÉE' && !linkedSale && (
          <button onClick={() => setSaleModalOpen(true)} className="btn-accent">
            <ShoppingCart className="h-4 w-4" />
            Créer une vente
          </button>
        )}
      </div>

      {saleSuccess && (
        <div className="mt-4">
          <Alert variant="success" title="Vente validée">
            La vente <strong>{saleSuccess}</strong> a été créée et le stock a été déduit.{' '}
            <Link to="/admin/ventes" className="font-semibold underline">Voir les ventes</Link>.
          </Alert>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: client info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-text">Coordonnées du client</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow icon={Phone} label="Téléphone" value={quote.phone} />
              <InfoRow icon={Mail} label="E-mail" value={quote.email ?? '—'} breakWord />
              <InfoRow icon={MapPin} label="Adresse" value={quote.address} />
              <InfoRow icon={MapPin} label="Ville / Pays" value={`${quote.city ?? '—'}, ${quote.country}`} />
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-brand-muted">Nom</p>
              <p className="text-sm font-medium text-brand-text">{quote.first_name} {quote.last_name}</p>
            </div>
            {quote.message && (
              <div className="mt-4 rounded-lg bg-brand-bg p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-brand-muted">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Message du client
                </p>
                <p className="mt-2 text-sm text-brand-text whitespace-pre-line">{quote.message}</p>
              </div>
            )}
            {(whatsappUrl || mailtoUrl) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                {mailtoUrl && (
                  <a
                    href={mailtoUrl}
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-brand-primary hover:bg-brand-bg transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Envoyer un e-mail
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-text">Produit demandé</h2>
            <div className="mt-4 flex items-center gap-4 rounded-lg border border-brand-border p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-bg text-brand-primary">
                <Package className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-brand-text">{quote.products?.name ?? 'Produit supprimé'}</p>
                {quote.products?.reference && (
                  <p className="text-xs text-brand-muted">Réf. {quote.products.reference}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-brand-muted">Quantité</p>
                <p className="text-lg font-bold text-brand-text">{quote.quantity}</p>
              </div>
            </div>
            {quote.negotiated_amount && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
                <span className="text-sm text-green-800">Montant convenu</span>
                <span className="font-bold text-green-700">{formatCurrency(quote.negotiated_amount)}</span>
              </div>
            )}
          </div>

          {/* Linked sale panel */}
          {linkedSale && (
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-text">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Vente associée
              </h2>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-brand-border p-4">
                <div>
                  <p className="font-medium text-brand-text">{linkedSale.reference}</p>
                  <p className="text-xs text-brand-muted">{formatDateTime(linkedSale.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-brand-text">{formatCurrency(linkedSale.total_amount)}</span>
                  <StatusBadge
                    tone={linkedSale.status === 'VALIDÉE' ? 'success' : 'neutral'}
                    label={linkedSale.status === 'VALIDÉE' ? 'Validée' : 'Annulée'}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-brand-muted">Paiement</p>
                  <div className="mt-1">
                    <StatusBadge tone={paymentStatusTone(linkedSale.payment_status)} label={paymentStatusLabels(linkedSale.payment_status)} />
                  </div>
                </div>
              </div>
              <Link
                to={`/admin/ventes/${linkedSale.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
              >
                Voir / modifier la vente
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-text">Actions commerciales</h2>

            {error && (
              <div className="mt-3">
                <Alert variant="error">{error}</Alert>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label className="label">Statut</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as QuoteStatus)}
                  className="input"
                >
                  {statusFlow.map((s) => (
                    <option key={s} value={s}>
                      {quoteStatusLabels(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Montant convenu (FCFA)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={negotiatedAmount}
                  onChange={(e) => setNegotiatedAmount(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  rows={4}
                  className="input resize-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Modalités, conditions particulières, suivi commercial…"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={updating}
                className="btn-primary w-full"
              >
                {updating ? 'Mise à jour…' : 'Mettre à jour'}
              </button>
            </div>
          </div>

          {quote.status === 'ACCEPTÉE' && !linkedSale && (
            <div className="card border-amber-200 p-6">
              <h3 className="font-semibold text-brand-text">Vente</h3>
              <p className="mt-2 text-sm text-brand-muted">
                Cette demande est acceptée. Créez la vente pour déduire le stock et enregistrer la transaction.
              </p>
              <button onClick={() => setSaleModalOpen(true)} className="btn-accent mt-4 w-full">
                <ShoppingCart className="h-4 w-4" />
                Créer la vente
              </button>
            </div>
          )}

          {quote.status === 'ACCEPTÉE' && linkedSale && (
            <div className="card border-green-200 p-6">
              <h3 className="flex items-center gap-2 font-semibold text-brand-text">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Vente créée
              </h3>
              <p className="mt-2 text-sm text-brand-muted">
                Une vente est déjà associée à cette demande. Vous pouvez la consulter, modifier ses termes ou l'annuler depuis la page de la vente.
              </p>
              <Link
                to={`/admin/ventes/${linkedSale.id}`}
                className="btn-secondary mt-4 w-full"
              >
                Voir la vente {linkedSale.reference}
              </Link>
            </div>
          )}

          {(quote.status === 'REFUSÉE' || quote.status === 'ANNULÉE') && (
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-brand-text">
                <XCircle className="h-5 w-5 text-brand-accent" />
                {quote.status === 'REFUSÉE' ? 'Demande refusée' : 'Demande annulée'}
              </h3>
              <p className="mt-2 text-sm text-brand-muted">
                Cette demande n'est plus active. Aucune vente ne peut être créée.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sale confirmation modal */}
      <Modal
        open={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        title="Valider la vente"
        size="sm"
        footer={
          <>
            <button onClick={() => setSaleModalOpen(false)} className="btn-secondary">
              Annuler
            </button>
            <button onClick={handleValidateSale} disabled={validating} className="btn-accent">
              {validating ? 'Validation…' : 'Confirmer la vente'}
            </button>
          </>
        }
      >
        {saleError && (
          <div className="mb-4">
            <Alert variant="error">{saleError}</Alert>
          </div>
        )}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-muted">Client</span>
            <span className="font-medium text-brand-text">{quote.first_name} {quote.last_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Produit</span>
            <span className="font-medium text-brand-text">{quote.products?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Quantité</span>
            <span className="font-medium text-brand-text">{quote.quantity}</span>
          </div>
          {negotiatedAmount && (
            <div className="flex justify-between">
              <span className="text-brand-muted">Montant</span>
              <span className="font-bold text-brand-text">{formatCurrency(parseFloat(negotiatedAmount))}</span>
            </div>
          )}
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            La validation déduira {quote.quantity} unité(s) du stock de façon atomique. Cette opération est irréversible.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, breakWord }: { icon: typeof Phone; label: string; value: string; breakWord?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-brand-muted" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-brand-muted">{label}</p>
        <p className={`text-sm text-brand-text ${breakWord ? 'break-all' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
