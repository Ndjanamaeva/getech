import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Eye, Plus } from 'lucide-react';
import { fetchSales, cancelSale } from '@/backend/services/admin';
import { fetchAllProductsAdmin } from '@/backend/services/catalog';
import { PageHeader } from '@/frontend/components/ui/PageHeader';
import { Loading } from '@/frontend/components/ui/Loading';
import { StatusBadge } from '@/frontend/components/ui/StatusBadge';
import { EmptyState } from '@/frontend/components/ui/EmptyState';
import { Modal } from '@/frontend/components/ui/Modal';
import { Alert } from '@/frontend/components/ui/Alert';
import { AdminTable, AdminTHead, AdminTBody } from '@/admin/components/AdminTable';
import { formatDate, formatCurrency, paymentStatusLabels, paymentStatusTone, deliveryStatusLabels, deliveryStatusTone } from '@/backend/lib/utils';
import { validateSale } from '@/backend/services/admin';
import type { Sale, ProductWithCategory } from '@/backend/types';
import type { SaleItemInput } from '@/backend/lib/validations';

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'VALIDÉE' | 'ANNULÉE'>('all');
  const [cancelTarget, setCancelTarget] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // New sale modal
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [saleItems, setSaleItems] = useState<SaleItemInput[]>([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([fetchSales(), fetchAllProductsAdmin()]);
      setSales(s);
      setProducts(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = sales.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.reference.toLowerCase().includes(q) ||
      s.customer_name.toLowerCase().includes(q) ||
      (s.customer_email ?? '').toLowerCase().includes(q)
    );
  });

  const totalRevenue = sales
    .filter((s) => s.status === 'VALIDÉE')
    .reduce((sum, s) => sum + s.total_amount, 0);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelReason.trim()) {
      setCancelError('Une raison est obligatoire');
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelSale(cancelTarget.id, cancelReason);
      setCancelTarget(null);
      setCancelReason('');
      await load();
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setCancelling(false);
    }
  };

  const updateItem = (idx: number, field: keyof SaleItemInput, value: string | number) => {
    setSaleItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        return updated;
      })
    );
  };

  const addItem = () => {
    setSaleItems((prev) => [...prev, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (idx: number) => {
    setSaleItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleProductSelect = (idx: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setSaleItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, product_id: productId, unit_price: product?.unit_price ?? 0 }
          : item
      )
    );
  };

  const handleValidateSale = async () => {
    setSaleError(null);
    if (!customerName.trim()) {
      setSaleError('Nom du client requis');
      return;
    }
    const validItems = saleItems.filter((i) => i.product_id && i.quantity > 0);
    if (validItems.length === 0) {
      setSaleError('Au moins un produit est requis');
      return;
    }
    setValidating(true);
    try {
      const sale = await validateSale({
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        items: validItems,
      });
      setSaleSuccess(sale.reference);
      setNewSaleOpen(false);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setSaleItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur';
      if (msg.includes('INSUFFICIENT_STOCK')) {
        setSaleError('Stock insuffisant pour un des produits sélectionnés.');
      } else {
        setSaleError(msg);
      }
    } finally {
      setValidating(false);
    }
  };

  const computedTotal = saleItems.reduce(
    (sum, i) => sum + (i.quantity > 0 && i.unit_price > 0 ? i.quantity * i.unit_price : 0),
    0
  );

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Ventes"
        description="Gérez les ventes validées et annulées. Le CA est calculé sur les ventes validées."
        actions={
          <button onClick={() => { setNewSaleOpen(true); setSaleSuccess(null); }} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nouvelle vente
          </button>
        }
      />

      {saleSuccess && (
        <div className="mb-4">
          <Alert variant="success" title="Vente validée">
            La vente <strong>{saleSuccess}</strong> a été créée et le stock déduit.
          </Alert>
        </div>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-brand-muted">Total ventes</p>
          <p className="mt-1 text-xl font-bold text-brand-text">{sales.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-brand-muted">Validées</p>
          <p className="mt-1 text-xl font-bold text-green-600">
            {sales.filter((s) => s.status === 'VALIDÉE').length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-brand-muted">Annulées</p>
          <p className="mt-1 text-xl font-bold text-red-600">
            {sales.filter((s) => s.status === 'ANNULÉE').length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-brand-muted">Chiffre d'affaires</p>
          <p className="mt-1 text-xl font-bold text-brand-primary">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="card mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
            <input
              type="search"
              placeholder="Rechercher par référence ou client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'VALIDÉE' | 'ANNULÉE')}
            className="input lg:w-40"
          >
            <option value="all">Toutes</option>
            <option value="VALIDÉE">Validées</option>
            <option value="ANNULÉE">Annulées</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-10 w-10" />}
          title="Aucune vente"
          description="Les ventes validées apparaîtront ici."
        />
      ) : (
        <AdminTable maxHeight="65vh">
          <AdminTHead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Paiement</th>
              <th>Livraison</th>
              <th>Date</th>
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </AdminTHead>
          <AdminTBody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-xs text-brand-text">{s.reference}</td>
                <td>
                  <p className="font-medium text-brand-text">{s.customer_name}</p>
                  {s.customer_email && <p className="text-xs text-brand-muted break-all">{s.customer_email}</p>}
                </td>
                <td className="font-semibold text-brand-text">{formatCurrency(s.total_amount)}</td>
                <td>
                  <StatusBadge tone={paymentStatusTone(s.payment_status)} label={paymentStatusLabels(s.payment_status)} />
                </td>
                <td>
                  <StatusBadge tone={deliveryStatusTone(s.delivery_status)} label={deliveryStatusLabels(s.delivery_status)} />
                </td>
                <td className="text-brand-muted">{formatDate(s.created_at)}</td>
                <td>
                  <StatusBadge
                    tone={s.status === 'VALIDÉE' ? 'success' : 'danger'}
                    label={s.status === 'VALIDÉE' ? 'Confirmée' : 'Annulée'}
                  />
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/admin/ventes/${s.id}`}
                      className="rounded-lg p-2 text-brand-muted hover:bg-brand-bg hover:text-brand-accent"
                      title="Voir le détail"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {s.status === 'VALIDÉE' && (
                      <button
                        onClick={() => {
                          setCancelTarget(s);
                          setCancelReason('');
                          setCancelError(null);
                        }}
                        className="rounded-lg p-2 text-brand-muted hover:bg-red-50 hover:text-brand-accent"
                        title="Annuler la vente"
                      >
                        <Plus className="h-4 w-4 rotate-45" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </AdminTBody>
        </AdminTable>
      )}

      {/* Cancel modal */}
      <Modal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Annuler la vente"
        size="sm"
        footer={
          <>
            <button onClick={() => setCancelTarget(null)} className="btn-secondary">Annuler</button>
            <button onClick={handleCancel} disabled={cancelling} className="btn-accent">
              {cancelling ? 'Annulation…' : 'Confirmer l\'annulation'}
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
          La vente <strong className="text-brand-text">{cancelTarget?.reference}</strong> sera annulée.
          Le stock sera retourné via un mouvement de retour tracé. Cette opération est irréversible.
        </p>
        <div className="mt-4">
          <label className="label">Raison de l'annulation *</label>
          <textarea
            rows={3}
            className="input resize-none"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ex : Erreur de commande, retour client…"
          />
        </div>
      </Modal>

      {/* New sale modal */}
      <Modal
        open={newSaleOpen}
        onClose={() => setNewSaleOpen(false)}
        title="Nouvelle vente"
        size="lg"
        footer={
          <>
            <button onClick={() => setNewSaleOpen(false)} className="btn-secondary">Annuler</button>
            <button onClick={handleValidateSale} disabled={validating} className="btn-accent">
              {validating ? 'Validation…' : 'Valider la vente'}
            </button>
          </>
        }
      >
        {saleError && (
          <div className="mb-4">
            <Alert variant="error">{saleError}</Alert>
          </div>
        )}
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="label">Nom du client *</label>
              <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="label">Produits</label>
              <button onClick={addItem} className="text-sm font-medium text-brand-primary hover:underline">
                + Ajouter une ligne
              </button>
            </div>
            <div className="space-y-2">
              {saleItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <select
                    className="input flex-1"
                    value={item.product_id}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                  >
                    <option value="">Sélectionner…</option>
                    {products.filter((p) => !p.is_archived).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (stock: {p.stock_quantity})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="input w-20"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 0)}
                    placeholder="Qté"
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="input w-28"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    placeholder="Prix unit."
                  />
                  {saleItems.length > 1 && (
                    <button
                      onClick={() => removeItem(idx)}
                      className="rounded-lg p-2.5 text-brand-muted hover:bg-red-50 hover:text-red-600"
                      title="Supprimer"
                    >
                      <Plus className="h-4 w-4 rotate-45" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between rounded-lg bg-brand-bg px-4 py-3">
              <span className="text-sm font-medium text-brand-muted">Total calculé</span>
              <span className="font-bold text-brand-text">{formatCurrency(computedTotal)}</span>
            </div>
          </div>

          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            La validation vérifiera la disponibilité du stock de façon atomique. Si le stock est insuffisant,
            la vente sera entièrement annulée (aucune vente partielle, aucun stock incohérent).
          </p>
        </div>
      </Modal>
    </div>
  );
}
