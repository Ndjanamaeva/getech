import { useEffect, useState, useCallback } from 'react';
import {
  Warehouse,
  Pencil,
  History,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  MinusCircle,
} from 'lucide-react';
import { fetchAllProductsAdmin } from '@/backend/services/catalog';
import { fetchInventoryMovements, adjustStock } from '@/backend/services/admin';
import { PageHeader } from '@/frontend/components/ui/PageHeader';
import { Loading } from '@/frontend/components/ui/Loading';
import { StatusBadge } from '@/frontend/components/ui/StatusBadge';
import { EmptyState } from '@/frontend/components/ui/EmptyState';
import { Modal } from '@/frontend/components/ui/Modal';
import { Alert } from '@/frontend/components/ui/Alert';
import { AdminTable, AdminTHead, AdminTBody } from '@/admin/components/AdminTable';
import { getStockStatus, formatDateTime } from '@/backend/lib/utils';
import type { ProductWithCategory, InventoryMovement } from '@/backend/types';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<ProductWithCategory | null>(null);
  const [selected, setSelected] = useState<ProductWithCategory | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, moves] = await Promise.all([fetchAllProductsAdmin(), fetchInventoryMovements()]);
      setProducts(prods);
      setMovements(moves);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdjustModal = (product: ProductWithCategory) => {
    setSelected(product);
    setQuantity(product.stock_quantity.toString());
    setReason('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      setFormError('Quantité invalide');
      return;
    }
    if (!reason.trim()) {
      setFormError('Une raison est obligatoire');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await adjustStock(selected.id, qty, reason);
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const productMovements = historyProduct
    ? movements.filter((m) => m.product_id === historyProduct.id)
    : [];

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Gestion des stocks"
        description="Suivez les quantités, seuils d'alerte et mouvements de stock. Utilisez « Corriger » pour ajuster le stock après inventaire."
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="h-10 w-10" />}
          title="Aucun produit"
          description="Ajoutez d'abord des produits depuis le catalogue."
        />
      ) : (
        <AdminTable maxHeight="65vh">
          <AdminTHead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Référence</th>
              <th>Stock</th>
              <th>Réservé</th>
              <th>Disponible</th>
              <th>Seuil min.</th>
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </AdminTHead>
          <AdminTBody>
            {products.map((p) => {
              const stock = getStockStatus(p.stock_quantity, p.low_stock_threshold);
              const available = p.stock_quantity - p.reserved_quantity;
              return (
                <tr key={p.id}>
                  <td className="font-medium text-brand-text">{p.name}</td>
                  <td className="text-brand-muted">{p.categories?.name ?? '—'}</td>
                  <td className="text-brand-muted">{p.reference ?? '—'}</td>
                  <td className="font-semibold text-brand-text">{p.stock_quantity}</td>
                  <td className="text-brand-muted">{p.reserved_quantity}</td>
                  <td className="text-brand-text">{available}</td>
                  <td className="text-brand-muted">{p.low_stock_threshold}</td>
                  <td>
                    <StatusBadge tone={stock.tone} label={stock.label} />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openAdjustModal(p)}
                        className="rounded-lg p-2 text-brand-muted hover:bg-amber-50 hover:text-amber-600"
                        title="Corriger le stock"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setHistoryProduct(p)}
                        className="rounded-lg p-2 text-brand-muted hover:bg-brand-bg hover:text-brand-accent"
                        title="Historique des mouvements"
                      >
                        <History className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </AdminTBody>
        </AdminTable>
      )}

      {/* Stock correction modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Corriger le stock"
        size="sm"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Annuler</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? 'Enregistrement…' : 'Confirmer'}
            </button>
          </>
        }
      >
        {formError && (
          <div className="mb-4">
            <Alert variant="error">{formError}</Alert>
          </div>
        )}
        <div className="space-y-4">
          <div className="rounded-lg bg-brand-bg p-3">
            <p className="font-medium text-brand-text">{selected?.name}</p>
            <p className="text-xs text-brand-muted">Stock actuel : {selected?.stock_quantity}</p>
          </div>
          <div>
            <label className="label">Nouveau stock total</label>
            <input
              type="number"
              min={0}
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Raison *</label>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex : Inventaire, casse, perte…"
            />
          </div>
          <p className="text-xs text-brand-muted">
            Cette opération corrige le stock réel après inventaire. Elle sera tracée dans l'historique des mouvements et le journal d'audit. Pour réceptionner de nouvelles marchandises, créez un mouvement d'entrée distinct.
          </p>
        </div>
      </Modal>

      {/* History modal */}
      <Modal
        open={historyProduct !== null}
        onClose={() => setHistoryProduct(null)}
        title={`Mouvements — ${historyProduct?.name ?? ''}`}
        size="lg"
      >
        {productMovements.length === 0 ? (
          <p className="text-sm text-brand-muted py-6 text-center">Aucun mouvement enregistré.</p>
        ) : (
          <div className="space-y-2">
            {productMovements.map((m) => (
              <MovementRow key={m.id} movement={m} />
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

const movementConfig = {
  IN: { icon: ArrowDownCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Entrée' },
  OUT: { icon: ArrowUpCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Sortie' },
  ADJUSTMENT: { icon: MinusCircle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Correction' },
  RETURN: { icon: RotateCcw, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Retour' },
};

function MovementRow({ movement }: { movement: InventoryMovement }) {
  const cfg = movementConfig[movement.movement_type];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center gap-3 rounded-lg ${cfg.bg} px-4 py-3`}>
      <Icon className={`h-5 w-5 flex-shrink-0 ${cfg.color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
          <span className="text-sm font-bold text-brand-text">
            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
          </span>
        </div>
        {movement.reason && <p className="text-xs text-brand-muted truncate">{movement.reason}</p>}
      </div>
      <span className="text-xs text-brand-muted flex-shrink-0">{formatDateTime(movement.created_at)}</span>
    </div>
  );
}
