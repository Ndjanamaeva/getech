import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Hash, Banknote, Truck } from 'lucide-react';
import { fetchSaleById, cancelSale, updateSalePayment, updateSaleDelivery } from '@/backend/services/admin';
import { Loading } from '@/frontend/components/ui/Loading';
import { StatusBadge } from '@/frontend/components/ui/StatusBadge';
import { Alert } from '@/frontend/components/ui/Alert';
import { Modal } from '@/frontend/components/ui/Modal';
import {
  formatCurrency,
  formatDateTime,
  formatDate,
  paymentStatusLabels,
  paymentStatusTone,
  deliveryStatusLabels,
  deliveryStatusTone,
} from '@/backend/lib/utils';
import type { SaleWithItems, PaymentStatus, DeliveryStatus } from '@/backend/types';

const paymentOptions: PaymentStatus[] = ['EN ATTENTE', 'PAYÉ', 'PARTIEL', 'NON REQUIS'];
const deliveryOptions: DeliveryStatus[] = ['EN ATTENTE', 'EXPÉDIÉE', 'LIVRÉE', 'RETOUR'];

export default function AdminSaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [sale, setSale] = useState<SaleWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Payment modal
  const [payOpen, setPayOpen] = useState(false);
  const [payStatus, setPayStatus] = useState<PaymentStatus>('EN ATTENTE');
  const [payMethod, setPayMethod] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [paySaving, setPaySaving] = useState(false);

  // Delivery modal
  const [delOpen, setDelOpen] = useState(false);
  const [delStatus, setDelStatus] = useState<DeliveryStatus>('EN ATTENTE');
  const [delDate, setDelDate] = useState('');
  const [delTracking, setDelTracking] = useState('');
  const [delAddress, setDelAddress] = useState('');
  const [delNotes, setDelNotes] = useState('');
  const [delError, setDelError] = useState<string | null>(null);
  const [delSaving, setDelSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const s = await fetchSaleById(id);
      setSale(s);
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

  const handleCancel = async () => {
    if (!sale) return;
    if (!cancelReason.trim()) {
      setCancelError('Une raison est obligatoire');
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelSale(sale.id, cancelReason);
      setCancelOpen(false);
      await load();
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setCancelling(false);
    }
  };

  const openPayModal = () => {
    if (!sale) return;
    setPayStatus(sale.payment_status);
    setPayMethod(sale.payment_method ?? '');
    setPayAmount(sale.payment_amount ? sale.payment_amount.toString() : '');
    setPayDate(sale.payment_date ? sale.payment_date.slice(0, 16) : '');
    setPayNotes(sale.notes ?? '');
    setPayError(null);
    setPayOpen(true);
  };

  const handlePaySave = async () => {
    if (!sale) return;
    setPaySaving(true);
    setPayError(null);
    try {
      await updateSalePayment({
        saleId: sale.id,
        paymentStatus: payStatus,
        paymentMethod: payMethod || null,
        paymentAmount: payAmount ? parseFloat(payAmount) : null,
        paymentDate: payDate ? new Date(payDate).toISOString() : null,
        notes: payNotes || null,
      });
      setPayOpen(false);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur';
      setPayError(msg.includes('SALE_CANCELLED') ? 'Cette vente est annulée.' : msg);
    } finally {
      setPaySaving(false);
    }
  };

  const openDelModal = () => {
    if (!sale) return;
    setDelStatus(sale.delivery_status);
    setDelDate(sale.delivery_date ? sale.delivery_date.slice(0, 16) : '');
    setDelTracking(sale.tracking_reference ?? '');
    setDelAddress(sale.delivery_address ?? '');
    setDelNotes(sale.notes ?? '');
    setDelError(null);
    setDelOpen(true);
  };

  const handleDelSave = async () => {
    if (!sale) return;
    setDelSaving(true);
    setDelError(null);
    try {
      await updateSaleDelivery({
        saleId: sale.id,
        deliveryStatus: delStatus,
        deliveryDate: delDate ? new Date(delDate).toISOString() : null,
        trackingReference: delTracking || null,
        deliveryAddress: delAddress || null,
        notes: delNotes || null,
      });
      setDelOpen(false);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur';
      setDelError(msg.includes('SALE_CANCELLED') ? 'Cette vente est annulée.' : msg);
    } finally {
      setDelSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !sale) {
    return (
      <div>
        <Link to="/admin/ventes" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary">
          <ArrowLeft className="h-4 w-4" />
          Retour aux ventes
        </Link>
        <p className="mt-4 text-brand-muted">Vente introuvable. {error}</p>
      </div>
    );
  }

  const isCancelled = sale.status === 'ANNULÉE';
  const isPaid = sale.payment_status === 'PAYÉ';

  return (
    <div>
      <Link to="/admin/ventes" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary">
        <ArrowLeft className="h-4 w-4" />
        Retour aux ventes
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-text">{sale.reference}</h1>
            <StatusBadge
              tone={sale.status === 'VALIDÉE' ? 'success' : 'danger'}
              label={sale.status === 'VALIDÉE' ? 'Confirmée' : 'Annulée'}
            />
            {sale.status === 'VALIDÉE' && (
              <StatusBadge
                tone={isPaid ? 'success' : 'warning'}
                label={isPaid ? 'Payée' : 'Paiement en attente'}
              />
            )}
          </div>
          <p className="mt-1 text-sm text-brand-muted">Créée le {formatDateTime(sale.created_at)}</p>
        </div>
        {sale.status === 'VALIDÉE' && (
          <button
            onClick={() => { setCancelOpen(true); setCancelReason(''); setCancelError(null); }}
            className="btn-accent"
          >
            Annuler la vente
          </button>
        )}
      </div>

      {isCancelled && sale.notes && (
        <div className="mt-4">
          <Alert variant="error" title="Vente annulée">
            {sale.notes}
          </Alert>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="border-b border-brand-border bg-brand-bg px-6 py-3">
              <h2 className="font-semibold text-brand-text">Lignes de vente</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="admin-table w-full">
                <thead className="admin-thead">
                  <tr>
                    <th>Produit</th>
                    <th>Référence</th>
                    <th className="text-right">Qté</th>
                    <th className="text-right">Prix unit.</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="admin-tbody divide-y divide-brand-border/60">
                  {sale.sale_items.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium text-brand-text">{item.product_name_snapshot}</td>
                      <td className="text-brand-muted">{item.product_reference_snapshot ?? '—'}</td>
                      <td className="text-right text-brand-text">{item.quantity}</td>
                      <td className="text-right text-brand-text">{formatCurrency(item.unit_price)}</td>
                      <td className="text-right font-semibold text-brand-text">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-brand-border bg-brand-bg">
                    <td colSpan={4} className="px-6 py-4 text-right font-semibold text-brand-text">
                      Total
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-brand-accent">
                      {formatCurrency(sale.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment tracking */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-text">
                <Banknote className="h-5 w-5" />
                Paiement
              </h2>
              {!isCancelled && (
                <button onClick={openPayModal} className="text-sm font-medium text-brand-primary hover:underline">
                  Modifier
                </button>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-brand-muted">Statut</p>
                <div className="mt-1">
                  <StatusBadge tone={paymentStatusTone(sale.payment_status)} label={paymentStatusLabels(sale.payment_status)} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-brand-muted">Méthode</p>
                <p className="mt-1 text-sm text-brand-text">{sale.payment_method ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-brand-muted">Montant payé</p>
                <p className="mt-1 text-sm font-semibold text-brand-text">{formatCurrency(sale.payment_amount)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-brand-muted">Date de paiement</p>
                <p className="mt-1 text-sm text-brand-text">{sale.payment_date ? formatDate(sale.payment_date) : '—'}</p>
              </div>
            </div>
            {isCancelled && sale.payment_status === 'PAYÉ' && (
              <div className="mt-4 rounded-lg bg-red-50 p-3">
                <p className="text-sm text-red-800">
                  Un remboursement peut être nécessaire. Le paiement était de {formatCurrency(sale.payment_amount)}.
                </p>
              </div>
            )}
          </div>

          {/* Delivery tracking */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-text">
                <Truck className="h-5 w-5" />
                Livraison
              </h2>
              {!isCancelled && (
                <button onClick={openDelModal} className="text-sm font-medium text-brand-primary hover:underline">
                  Modifier
                </button>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-brand-muted">Statut</p>
                <div className="mt-1">
                  <StatusBadge tone={deliveryStatusTone(sale.delivery_status)} label={deliveryStatusLabels(sale.delivery_status)} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-brand-muted">Suivi</p>
                <p className="mt-1 text-sm text-brand-text">{sale.tracking_reference ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-brand-muted">Date de livraison</p>
                <p className="mt-1 text-sm text-brand-text">{sale.delivery_date ? formatDate(sale.delivery_date) : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-brand-muted">Adresse</p>
                <p className="mt-1 text-sm text-brand-text">{sale.delivery_address ?? '—'}</p>
              </div>
            </div>
          </div>

          {sale.notes && !isCancelled && (
            <div className="card p-6">
              <h2 className="font-semibold text-brand-text">Notes</h2>
              <p className="mt-2 text-sm text-brand-muted whitespace-pre-line">{sale.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-brand-text">Informations</h2>
            <div className="mt-4 space-y-3">
              <InfoRow icon={User} label="Client" value={sale.customer_name} />
              {sale.customer_email && <InfoRow icon={User} label="E-mail" value={sale.customer_email} breakWord />}
              {sale.customer_phone && <InfoRow icon={User} label="Téléphone" value={sale.customer_phone} />}
              <InfoRow icon={Calendar} label="Validée le" value={sale.validated_at ? formatDateTime(sale.validated_at) : '—'} />
              <InfoRow icon={Hash} label="Devise" value={sale.currency} />
              {sale.quote_request_id && (
                <Link
                  to={`/admin/demandes/${sale.quote_request_id}`}
                  className="block pt-2 text-sm font-medium text-brand-primary hover:underline"
                >
                  Voir la demande de devis associée
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Annuler la vente"
        size="sm"
        footer={
          <>
            <button onClick={() => setCancelOpen(false)} className="btn-secondary">Annuler</button>
            <button onClick={handleCancel} disabled={cancelling} className="btn-accent">
              {cancelling ? 'Annulation…' : 'Confirmer'}
            </button>
          </>
        }
      >
        {cancelError && (
          <div className="mb-4">
            <Alert variant="error">{cancelError}</Alert>
          </div>
        )}
        <p className="text-sm text-brand-muted">
          La vente <strong className="text-brand-text">{sale.reference}</strong> sera annulée.
          Le stock sera retourné via un mouvement de retour. Cette opération est irréversible.
          {isPaid && (
            <span className="mt-2 block rounded-lg bg-red-50 p-2 text-xs text-red-800">
              Attention : un paiement de {formatCurrency(sale.payment_amount)} a été enregistré. Un remboursement peut être nécessaire.
            </span>
          )}
        </p>
        <div className="mt-4">
          <label className="label">Raison *</label>
          <textarea
            rows={3}
            className="input resize-none"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* Payment modal */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Mettre à jour le paiement"
        footer={
          <>
            <button onClick={() => setPayOpen(false)} className="btn-secondary">Annuler</button>
            <button onClick={handlePaySave} disabled={paySaving} className="btn-primary">
              {paySaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        }
      >
        {payError && <div className="mb-4"><Alert variant="error">{payError}</Alert></div>}
        <div className="space-y-4">
          <div>
            <label className="label">Statut du paiement *</label>
            <select className="input" value={payStatus} onChange={(e) => setPayStatus(e.target.value as PaymentStatus)}>
              {paymentOptions.map((s) => (
                <option key={s} value={s}>{paymentStatusLabels(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Méthode</label>
            <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              <option value="">—</option>
              <option value="Espèces">Espèces</option>
              <option value="Virement bancaire">Virement bancaire</option>
              <option value="Chèque">Chèque</option>
              <option value="Mobile Money">Mobile Money</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Montant payé (FCFA)</label>
              <input type="number" step="0.01" className="input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">Date de paiement</label>
              <input type="datetime-local" className="input" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input resize-none" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Delivery modal */}
      <Modal
        open={delOpen}
        onClose={() => setDelOpen(false)}
        title="Mettre à jour la livraison"
        footer={
          <>
            <button onClick={() => setDelOpen(false)} className="btn-secondary">Annuler</button>
            <button onClick={handleDelSave} disabled={delSaving} className="btn-primary">
              {delSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        }
      >
        {delError && <div className="mb-4"><Alert variant="error">{delError}</Alert></div>}
        <div className="space-y-4">
          <div>
            <label className="label">Statut de livraison *</label>
            <select className="input" value={delStatus} onChange={(e) => setDelStatus(e.target.value as DeliveryStatus)}>
              {deliveryOptions.map((s) => (
                <option key={s} value={s}>{deliveryStatusLabels(s)}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Date de livraison</label>
              <input type="datetime-local" className="input" value={delDate} onChange={(e) => setDelDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Référence de suivi</label>
              <input className="input" value={delTracking} onChange={(e) => setDelTracking(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Adresse de livraison</label>
            <input className="input" value={delAddress} onChange={(e) => setDelAddress(e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input resize-none" value={delNotes} onChange={(e) => setDelNotes(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, breakWord }: { icon: typeof User; label: string; value: string; breakWord?: boolean }) {
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
