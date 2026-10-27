import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  ClipboardList,
  Package,
  ShoppingCart,
  TrendingUp,
  PackageX,
  Clock,
  FileText,
  Truck,
} from 'lucide-react';
import {
  fetchDashboardStats,
  fetchRecentQuotes,
  fetchRecentSales,
  fetchSalesChartData,
  fetchQuotesChartData,
} from '@/backend/services/admin';
import { PageHeader } from '@/frontend/components/ui/PageHeader';
import { Loading } from '@/frontend/components/ui/Loading';
import { StatusBadge } from '@/frontend/components/ui/StatusBadge';
import { formatCurrency, formatDate, quoteStatusLabels, quoteStatusTone } from '@/backend/lib/utils';
import type { DashboardStats, Sale, QuoteRequestWithProduct } from '@/backend/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentQuotes, setRecentQuotes] = useState<QuoteRequestWithProduct[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [chartData, setChartData] = useState<{ month: string; ventes: number; demandes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [s, rq, rs, salesChart, quotesChart] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentQuotes(5),
          fetchRecentSales(5),
          fetchSalesChartData(6),
          fetchQuotesChartData(6),
        ]);
        if (!active) return;
        setStats(s);
        setRecentQuotes(rq as QuoteRequestWithProduct[]);
        setRecentSales(rs);

        const months = buildMonthLabels(6);
        const salesByMonth = aggregateByMonth(salesChart, 'total_amount', 'validated_at');
        const quotesByMonth = aggregateByMonth(quotesChart, null, 'created_at');
        setChartData(
          months.map((m) => ({
            month: m.label,
            ventes: salesByMonth[m.key] ?? 0,
            demandes: quotesByMonth[m.key] ?? 0,
          }))
        );
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loading />;
  if (error || !stats)
    return (
      <div>
        <PageHeader title="Tableau de bord" />
        <p className="text-brand-muted">Erreur de chargement des données. {error}</p>
      </div>
    );

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité commerciale, calculée en temps réel."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={ClipboardList}
          label="Total demandes"
          value={stats.total_quotes.toString()}
          accent="text-brand-primary"
        />
        <StatCard
          icon={Clock}
          label="Nouvelles à traiter"
          value={stats.new_quotes.toString()}
          accent="text-amber-600"
          highlight={stats.new_quotes > 0}
        />
        <StatCard
          icon={ShoppingCart}
          label="Ventes validées"
          value={stats.validated_sales.toString()}
          accent="text-green-600"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Package}
          label="Produits actifs"
          value={stats.active_products.toString()}
          accent="text-brand-primary"
        />
        <StatCard
          icon={PackageX}
          label="Produits indisponibles"
          value={stats.unavailable_products.toString()}
          accent="text-brand-accent"
          highlight={stats.unavailable_products > 0}
        />
        <StatCard
          icon={TrendingUp}
          label="Chiffre d'affaires"
          value={formatCurrency(stats.revenue)}
          accent="text-brand-accent"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={FileText}
          label="Devis envoyés"
          value={stats.quote_sent_quotes.toString()}
          accent="text-brand-primary"
        />
        <StatCard
          icon={Clock}
          label="Paiements en attente"
          value={stats.pending_payments.toString()}
          accent="text-amber-600"
          highlight={stats.pending_payments > 0}
        />
        <StatCard
          icon={Truck}
          label="Livraisons en attente"
          value={stats.pending_deliveries.toString()}
          accent="text-blue-600"
          highlight={stats.pending_deliveries > 0}
        />
      </div>

      <div className="mt-6 card p-6">
        <h2 className="text-lg font-semibold text-brand-text">Évolution des ventes et demandes</h2>
        <p className="text-sm text-brand-muted">6 derniers mois</p>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#164B8C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#164B8C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDemandes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D62839" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D62839" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DFE6EF" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#62748A' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#62748A' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #DFE6EF',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="demandes"
                name="Demandes"
                stroke="#D62839"
                fillOpacity={1}
                fill="url(#colorDemandes)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="ventes"
                name="Ventes (FCFA)"
                stroke="#164B8C"
                fillOpacity={1}
                fill="url(#colorVentes)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-text">Dernières demandes</h2>
            <Link to="/admin/demandes" className="text-sm font-medium text-brand-primary hover:underline">
              Tout voir
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentQuotes.length === 0 ? (
              <p className="text-sm text-brand-muted py-6 text-center">Aucune demande pour le moment.</p>
            ) : (
              recentQuotes.map((q) => (
                <Link
                  key={q.id}
                  to={`/admin/demandes/${q.id}`}
                  className="flex items-center justify-between rounded-lg border border-brand-border p-3 hover:bg-brand-bg/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">
                      {q.first_name} {q.last_name}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {q.reference} · {formatDate(q.created_at)}
                    </p>
                  </div>
                  <StatusBadge tone={quoteStatusTone(q.status)} label={quoteStatusLabels(q.status)} />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-text">Dernières ventes</h2>
            <Link to="/admin/ventes" className="text-sm font-medium text-brand-primary hover:underline">
              Tout voir
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-sm text-brand-muted py-6 text-center">Aucune vente pour le moment.</p>
            ) : (
              recentSales.map((s) => (
                <Link
                  key={s.id}
                  to={`/admin/ventes/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-brand-border p-3 hover:bg-brand-bg/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">{s.customer_name}</p>
                    <p className="text-xs text-brand-muted">
                      {s.reference} · {formatDate(s.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-text">
                      {formatCurrency(s.total_amount)}
                    </span>
                    <StatusBadge
                      tone={s.status === 'VALIDÉE' ? 'success' : 'danger'}
                      label={s.status === 'VALIDÉE' ? 'Confirmée' : 'Annulée'}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  highlight,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div className={`card p-5 ${highlight ? 'ring-1 ring-amber-200' : ''}`}>
      <div className="flex items-center justify-between">
        <Icon className={`h-5 w-5 ${accent}`} />
      </div>
      <p className="mt-3 text-2xl font-bold text-brand-text">{value}</p>
      <p className="mt-0.5 text-xs text-brand-muted">{label}</p>
    </div>
  );
}

function buildMonthLabels(count: number): { label: string; key: string }[] {
  const months: { label: string; key: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ label, key });
  }
  return months;
}

type ChartRow = { created_at: string; validated_at?: string | null; total_amount?: number };

function aggregateByMonth(
  rows: ChartRow[],
  amountField: string | null,
  dateField: string
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const dateStr = dateField === 'validated_at' ? row.validated_at ?? row.created_at : row.created_at;
    if (!dateStr) continue;
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (amountField) {
      result[key] = (result[key] ?? 0) + ((row as Record<string, unknown>)[amountField] as number ?? 0);
    } else {
      result[key] = (result[key] ?? 0) + 1;
    }
  }
  return result;
}
