import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ClipboardList, Eye } from 'lucide-react';
import { fetchQuotesAdmin } from '@/backend/services/quotes';
import { fetchAllProductsAdmin } from '@/backend/services/catalog';
import { PageHeader } from '@/frontend/components/ui/PageHeader';
import { Loading } from '@/frontend/components/ui/Loading';
import { StatusBadge } from '@/frontend/components/ui/StatusBadge';
import { EmptyState } from '@/frontend/components/ui/EmptyState';
import { AdminTable, AdminTHead, AdminTBody } from '@/admin/components/AdminTable';
import { formatDate, quoteStatusLabels, quoteStatusTone } from '@/backend/lib/utils';
import type { QuoteRequestWithProduct, QuoteStatus, ProductWithCategory } from '@/backend/types';

const statusOptions: { value: QuoteStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'NOUVELLE', label: 'Nouvelles' },
  { value: 'CONTACTÉE', label: 'Contactées' },
  { value: 'EN NÉGOCIATION', label: 'En négociation' },
  { value: 'DEVIS ENVOYÉ', label: 'Devis envoyés' },
  { value: 'ACCEPTÉE', label: 'Acceptées' },
  { value: 'REFUSÉE', label: 'Refusées' },
  { value: 'ANNULÉE', label: 'Annulées' },
];

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequestWithProduct[]>([]);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuoteStatus | 'all'>('all');
  const [productId, setProductId] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [q, p] = await Promise.all([
        fetchQuotesAdmin({ status, search, productId: productId !== 'all' ? productId : undefined }),
        fetchAllProductsAdmin(),
      ]);
      setQuotes(q);
      setProducts(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [status, search, productId]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Demandes de devis"
        description="Suivez et gérez les demandes clients, du premier contact à la vente."
      />

      <div className="card mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
            <input
              type="search"
              placeholder="Rechercher par nom, téléphone ou référence…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as QuoteStatus | 'all')} className="input lg:w-48">
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input lg:w-56">
            <option value="all">Tous les produits</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Aucune demande"
          description="Les demandes de devis soumises depuis le site apparaîtront ici."
        />
      ) : (
        <AdminTable>
          <AdminTHead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Produit</th>
              <th>Qté</th>
              <th>Date</th>
              <th>Statut</th>
              <th className="text-right">Action</th>
            </tr>
          </AdminTHead>
          <AdminTBody>
            {quotes.map((q) => (
              <tr key={q.id}>
                <td className="font-mono text-xs text-brand-text">{q.reference}</td>
                <td>
                  <p className="font-medium text-brand-text">{q.first_name} {q.last_name}</p>
                  <p className="text-xs text-brand-muted">{q.phone}</p>
                </td>
                <td className="text-brand-muted">{q.products?.name ?? '—'}</td>
                <td className="text-brand-text">{q.quantity}</td>
                <td className="text-brand-muted">{formatDate(q.created_at)}</td>
                <td>
                  <StatusBadge tone={quoteStatusTone(q.status)} label={quoteStatusLabels(q.status)} />
                </td>
                <td className="text-right">
                  <Link
                    to={`/admin/demandes/${q.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg p-2 text-brand-muted hover:bg-brand-bg hover:text-brand-accent"
                    title="Voir le détail"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </AdminTBody>
        </AdminTable>
      )}
    </div>
  );
}
