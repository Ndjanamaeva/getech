import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  Plus,
  Trash2,
  Send,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { fetchAllProductsAdmin } from '@/backend/services/catalog';
import { fetchQuotesAdmin } from '@/backend/services/quotes';
import { Modal } from '@/frontend/components/ui/Modal';
import { PageHeader } from '@/frontend/components/ui/PageHeader';
import { Loading } from '@/frontend/components/ui/Loading';
import { Alert } from '@/frontend/components/ui/Alert';
import { formatCurrency, formatDate } from '@/backend/lib/utils';
import type { ProductWithCategory, QuoteRequestWithProduct } from '@/backend/types';

type QuoteLine = {
  product_id: string;
  name: string;
  reference: string;
  quantity: number;
  unit_price: number;
};

export default function AdminQuoteFormPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequestWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [quoteNumber, setQuoteNumber] = useState('');
  const [conditions, setConditions] = useState('Paiement à la livraison. Délai de livraison : 2 à 4 semaines. Prix valables 30 jours.');
  const [lines, setLines] = useState<QuoteLine[]>([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [prods, qs] = await Promise.all([fetchAllProductsAdmin(), fetchQuotesAdmin()]);
      setProducts(prods);
      setQuotes(qs);
      setQuoteNumber(`DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    if (!quoteId) return;
    const q = quotes.find((x) => x.id === quoteId);
    if (!q) return;
    setClientName(`${q.first_name} ${q.last_name}`);
    setClientEmail(q.email ?? '');
    setClientPhone(q.phone);
    setClientAddress(`${q.address}, ${q.city ?? ''} ${q.country}`);
    const product = products.find((p) => p.id === q.product_id);
    setLines([
      {
        product_id: q.product_id,
        name: product?.name ?? q.products?.name ?? 'Produit',
        reference: product?.reference ?? q.products?.reference ?? '',
        quantity: q.quantity,
        unit_price: product?.unit_price ?? 0,
      },
    ]);
  };

  const addLine = () => {
    setLines((prev) => [...prev, { product_id: '', name: '', reference: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof QuoteLine, value: string | number) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== idx) return line;
        if (field === 'product_id') {
          const product = products.find((p) => p.id === value);
          return {
            ...line,
            product_id: value as string,
            name: product?.name ?? '',
            reference: product?.reference ?? '',
            unit_price: product?.unit_price ?? 0,
          };
        }
        return { ...line, [field]: value };
      })
    );
  };

  const total = lines.reduce((sum, l) => sum + (l.quantity > 0 && l.unit_price > 0 ? l.quantity * l.unit_price : 0), 0);
  const validLines = lines.filter((l) => l.name);

  const canGenerate = !!clientName && validLines.length > 0;

  const handleGeneratePreview = () => {
    if (!canGenerate) return;
    setPreviewOpen(true);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = () => {
    try {
      setDownloading(true);
      setError(null);

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = 210;
      const pageH = 297;
      const margin = 20;
      let y = margin;

      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0x16, 0x4b, 0x8c);
      doc.text('GENESYS Cameroon', margin, y + 5);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0x62, 0x74, 0x8a);
      doc.text('Équipements de laboratoire et d\'analyse', margin, y + 11);
      doc.text('Yaoundé, Cameroun — contact@genesys-cameroon.com', margin, y + 15);

      // Quote meta (right side)
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0x16, 0x4b, 0x8c);
      doc.text('DEVIS', pageW - margin, y + 5, { align: 'right' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0x62, 0x74, 0x8a);
      doc.text(`N° ${quoteNumber}`, pageW - margin, y + 11, { align: 'right' });
      doc.text(`Date : ${formatDate(quoteDate)}`, pageW - margin, y + 15, { align: 'right' });

      // Line under header
      y += 22;
      doc.setDrawColor(0x16, 0x4b, 0x8c);
      doc.setLineWidth(0.8);
      doc.line(margin, y, pageW - margin, y);
      y += 12;

      // Client info
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0x62, 0x74, 0x8a);
      doc.text('CLIENT', margin, y);
      y += 6;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0x1a, 0x2a, 0x3a);
      doc.text(clientName || '—', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0x4a, 0x5a, 0x6a);
      if (clientAddress) {
        const addrLines = doc.splitTextToSize(clientAddress, 120);
        doc.text(addrLines, margin, y);
        y += addrLines.length * 5;
      }
      if (clientPhone) {
        doc.text(`Tél : ${clientPhone}`, margin, y);
        y += 5;
      }
      if (clientEmail) {
        doc.text(clientEmail, margin, y);
        y += 5;
      }
      y += 8;

      // Table header
      const colNum = margin;
      const colName = margin + 12;
      const colQty = pageW - margin - 70;
      const colUnit = pageW - margin - 45;
      const colTotal = pageW - margin;
      doc.setFillColor(0x16, 0x4b, 0x8c);
      doc.rect(margin, y, pageW - margin * 2, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('#', colNum + 2, y + 6);
      doc.text('DÉSIGNATION', colName + 2, y + 6);
      doc.text('QTÉ', colQty + 2, y + 6, { align: 'right' });
      doc.text('PRIX UNIT.', colUnit + 2, y + 6, { align: 'right' });
      doc.text('TOTAL', colTotal - 2, y + 6, { align: 'right' });
      y += 9;

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0x1a, 0x2a, 0x3a);
      doc.setFontSize(10);

      validLines.forEach((l, i) => {
        if (y > pageH - 40) {
          doc.addPage();
          y = margin;
        }
        const rowH = 8;
        if (i % 2 === 1) {
          doc.setFillColor(0xf8, 0xfa, 0xfc);
          doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
        }
        doc.text(String(i + 1), colNum + 2, y + 5.5);
        const nameLines = doc.splitTextToSize(l.name, 95);
        doc.text(nameLines[0], colName + 2, y + 5.5);
        if (l.reference) {
          doc.setFontSize(8);
          doc.setTextColor(0x62, 0x74, 0x8a);
          doc.text(l.reference, colName + 2, y + 9);
          doc.setFontSize(10);
          doc.setTextColor(0x1a, 0x2a, 0x3a);
        }
        doc.text(String(l.quantity), colQty, y + 5.5, { align: 'right' });
        doc.text(formatCurrency(l.unit_price), colUnit, y + 5.5, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(l.quantity * l.unit_price), colTotal - 2, y + 5.5, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += rowH;
      });

      // Total row
      y += 2;
      doc.setDrawColor(0x16, 0x4b, 0x8c);
      doc.setLineWidth(0.6);
      doc.line(margin, y, pageW - margin, y);
      y += 8;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0x1a, 0x2a, 0x3a);
      doc.text('Total', pageW - margin - 60, y);
      doc.setTextColor(0xd6, 0x28, 0x39);
      doc.text(formatCurrency(total), colTotal - 2, y, { align: 'right' });
      y += 16;

      // Conditions
      if (y > pageH - 50) {
        doc.addPage();
        y = margin;
      }
      doc.setFillColor(0xf8, 0xfa, 0xfc);
      doc.roundedRect(margin, y, pageW - margin * 2, 24, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0x16, 0x4b, 0x8c);
      doc.text('CONDITIONS', margin + 4, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0x62, 0x74, 0x8a);
      const condLines = doc.splitTextToSize(conditions, pageW - margin * 2 - 8);
      doc.text(condLines, margin + 4, y + 11);
      y += 24 + 10;

      // Footer
      if (y > pageH - 20) {
        doc.addPage();
        y = margin;
      }
      doc.setDrawColor(0xdf, 0xe6, 0xef);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(0x62, 0x74, 0x8a);
      doc.text(`GENESYS Cameroon — Devis ${quoteNumber} — Émis le ${formatDate(quoteDate)}`, pageW / 2, y, { align: 'center' });

      const fileName = `Devis-GENESYS-${quoteNumber}.pdf`;
      doc.save(fileName);
    } catch (e) {
      setError(e instanceof Error ? `Erreur lors de la génération du PDF : ${e.message}` : 'Erreur lors de la génération du PDF');
    } finally {
      setDownloading(false);
    }
  };

  const sendMessage = (channel: 'whatsapp' | 'email') => {
    const lines_text = validLines
      .map((l) => `• ${l.name} — Qté : ${l.quantity} — PU : ${formatCurrency(l.unit_price)} — Total : ${formatCurrency(l.quantity * l.unit_price)}`)
      .join('\n');

    const plainBody =
      `Bonjour ${clientName},\n\n` +
      `Veuillez trouver ci-dessous notre devis n° ${quoteNumber} du ${formatDate(quoteDate)}.\n\n` +
      `Produits :\n${lines_text}\n\n` +
      `Total : ${formatCurrency(total)}\n\n` +
      `Conditions : ${conditions}\n\n` +
      `Cordialement,\nGENESYS Cameroon`;

    if (channel === 'whatsapp' && clientPhone) {
      const phone = clientPhone.replace(/[^0-9]/g, '');
      const waText = encodeURIComponent(plainBody);
      window.open(`https://wa.me/${phone}?text=${waText}`, '_blank');
    } else if (channel === 'email' && clientEmail) {
      const subject = `GENESYS Cameroon — Devis ${quoteNumber}`;
      const mailtoUrl = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainBody)}`;
      setSendOpen(false);
      setTimeout(() => { window.location.href = mailtoUrl; }, 100);
      return;
    }
    setSendOpen(false);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <Link to="/admin/demandes" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary">
        <ArrowLeft className="h-4 w-4" />
        Retour aux demandes
      </Link>

      <PageHeader
        title="Générer un devis"
        description="Composez un devis, prévisualisez-le, téléchargez le PDF et envoyez-le au client."
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Pre-fill from existing quote */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-text">Pré-remplir depuis une demande</h2>
            <p className="mt-1 text-sm text-brand-muted">Sélectionnez une demande existante pour auto-remplir les coordonnées client et le produit.</p>
            <select
              className="input mt-3"
              value={selectedQuoteId}
              onChange={(e) => handleSelectQuote(e.target.value)}
            >
              <option value="">— Manuel (sans demande existante) —</option>
              {quotes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.reference} — {q.first_name} {q.last_name} ({q.products?.name ?? 'Produit'})
                </option>
              ))}
            </select>
          </div>

          {/* Client info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-text">Informations client</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Nom du client *</label>
                <input className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input className="input" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input className="input" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">Adresse</label>
                <input className="input" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-text">Produits</h2>
              <button onClick={addLine} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline">
                <Plus className="h-4 w-4" />
                Ajouter une ligne
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="flex flex-wrap gap-2 items-center">
                  <select
                    className="input flex-1 min-w-[180px]"
                    value={line.product_id}
                    onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                  >
                    <option value="">Sélectionner un produit…</option>
                    {products.filter((p) => !p.is_archived).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="input w-20"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value, 10) || 0)}
                    placeholder="Qté"
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="input w-28"
                    value={line.unit_price}
                    onChange={(e) => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    placeholder="Prix unit."
                  />
                  <span className="text-sm font-semibold text-brand-text min-w-[100px] text-right">
                    {formatCurrency(line.quantity * line.unit_price)}
                  </span>
                  {lines.length > 1 && (
                    <button
                      onClick={() => removeLine(idx)}
                      className="rounded-lg p-2 text-brand-muted hover:bg-red-50 hover:text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between rounded-lg bg-brand-bg px-4 py-3">
              <span className="text-sm font-medium text-brand-muted">Total</span>
              <span className="text-lg font-bold text-brand-accent">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Conditions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-text">Conditions</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">N° de devis</label>
                <input className="input" value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} />
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <label className="label">Conditions de vente</label>
              <textarea
                rows={3}
                className="input resize-none"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-text">Actions</h2>
            <div className="mt-4 space-y-3">
              <button
                onClick={handleGeneratePreview}
                disabled={!canGenerate}
                className="btn-primary w-full"
              >
                <FileText className="h-4 w-4" />
                Générer le devis
              </button>
              {!canGenerate && (
                <p className="text-xs text-brand-muted">Renseignez le nom du client et au moins un produit.</p>
              )}

              <div className="border-t border-brand-border pt-3">
                <button
                  onClick={() => setSendOpen(true)}
                  disabled={!canGenerate || (!clientPhone && !clientEmail)}
                  className="btn-secondary w-full"
                >
                  <Send className="h-4 w-4" />
                  Envoyer le devis
                </button>
                {canGenerate && !clientPhone && !clientEmail && (
                  <p className="mt-1 text-xs text-brand-muted">Renseignez le téléphone ou l'e-mail du client pour l'envoi.</p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-muted" />
              <p className="text-sm text-brand-muted">
                Le devis n'est pas stocké dans l'application. Il est généré à la volée dans votre navigateur. Le PDF reste sur votre ordinateur après téléchargement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Prévisualisation — Devis ${quoteNumber}`}
        size="xl"
        footer={
          <>
            <button onClick={() => setPreviewOpen(false)} className="btn-secondary">Fermer</button>
            <button onClick={handleDownloadPDF} disabled={downloading} className="btn-primary">
              <Download className="h-4 w-4" />
              {downloading ? 'Génération…' : 'Télécharger le PDF'}
            </button>
          </>
        }
      >
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-brand-border bg-white">
          <QuotePreviewHTML
            clientName={clientName}
            clientAddress={clientAddress}
            clientPhone={clientPhone}
            clientEmail={clientEmail}
            quoteNumber={quoteNumber}
            quoteDate={quoteDate}
            lines={validLines}
            total={total}
            conditions={conditions}
          />
        </div>
      </Modal>

      {/* Send modal */}
      <Modal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        title="Envoyer le devis"
        size="sm"
        footer={
          <button onClick={() => setSendOpen(false)} className="btn-secondary">Annuler</button>
        }
      >
        <p className="text-sm text-brand-muted">
          Choisissez le canal d'envoi. Un message pré-rempli avec les détails du devis s'ouvrira dans l'application correspondante. Aucun envoi automatique n'est effectué — vous pourrez vérifier et confirmer avant l'envoi.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {clientPhone && (
            <button
              onClick={() => sendMessage('whatsapp')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
            >
              <Send className="h-4 w-4" />
              Envoyer via WhatsApp
            </button>
          )}
          {clientEmail && (
            <button
              onClick={() => sendMessage('email')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 text-sm font-medium text-brand-primary hover:bg-brand-bg transition-colors"
            >
              <Send className="h-4 w-4" />
              Envoyer par e-mail
            </button>
          )}
          {!clientPhone && !clientEmail && (
            <p className="text-xs text-brand-muted">Renseignez le téléphone ou l'e-mail du client dans le formulaire.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

function QuotePreviewHTML({
  clientName,
  clientAddress,
  clientPhone,
  clientEmail,
  quoteNumber,
  quoteDate,
  lines,
  total,
  conditions,
}: {
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  quoteNumber: string;
  quoteDate: string;
  lines: QuoteLine[];
  total: number;
  conditions: string;
}) {
  return (
    <div className="p-8" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div className="flex justify-between items-start mb-10 pb-5 border-b-[3px]" style={{ borderColor: '#164B8C' }}>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#164B8C' }}>GENESYS Cameroon</h1>
          <p className="mt-1 text-xs" style={{ color: '#62748A', lineHeight: 1.6 }}>
            Équipements de laboratoire et d'analyse<br/>Yaoundé, Cameroun<br/>contact@genesys-cameroon.com
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold" style={{ color: '#164B8C' }}>DEVIS</h2>
          <p className="mt-1 text-xs" style={{ color: '#62748A' }}>N° {quoteNumber}<br/>Date : {formatDate(quoteDate)}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-[11px] uppercase mb-2 tracking-wider" style={{ color: '#62748A' }}>Client</h3>
        <p className="text-sm" style={{ lineHeight: 1.6 }}>
          <strong>{clientName || '—'}</strong><br/>
          {clientAddress || ''}<br/>
          {clientPhone && <>Tél : {clientPhone}<br/></>}
          {clientEmail}
        </p>
      </div>

      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr style={{ background: '#164B8C' }}>
            <th className="text-left text-white px-4 py-3 text-xs uppercase tracking-wide">#</th>
            <th className="text-left text-white px-4 py-3 text-xs uppercase tracking-wide">Désignation</th>
            <th className="text-right text-white px-4 py-3 text-xs uppercase tracking-wide">Qté</th>
            <th className="text-right text-white px-4 py-3 text-xs uppercase tracking-wide">Prix unitaire</th>
            <th className="text-right text-white px-4 py-3 text-xs uppercase tracking-wide">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b" style={{ borderColor: '#DFE6EF' }}>
              <td className="px-4 py-3 text-sm">{i + 1}</td>
              <td className="px-4 py-3 text-sm">
                {l.name}
                {l.reference && <><br/><span className="text-[11px]" style={{ color: '#62748A' }}>{l.reference}</span></>}
              </td>
              <td className="px-4 py-3 text-sm text-right">{l.quantity}</td>
              <td className="px-4 py-3 text-sm text-right">{formatCurrency(l.unit_price)}</td>
              <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(l.quantity * l.unit_price)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-[3px]" style={{ borderColor: '#164B8C' }}>
            <td colSpan={4} className="px-4 py-4 text-right text-lg font-bold">Total</td>
            <td className="px-4 py-4 text-right text-lg font-bold" style={{ color: '#D62839' }}>{formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-6 p-5 rounded-lg" style={{ background: '#F8FAFC' }}>
        <h3 className="text-[11px] uppercase mb-2 tracking-wider" style={{ color: '#164B8C' }}>Conditions</h3>
        <p className="text-xs" style={{ color: '#62748A', lineHeight: 1.8 }}>{conditions}</p>
      </div>

      <div className="mt-10 text-center text-[11px] pt-4 border-t" style={{ color: '#62748A', borderColor: '#DFE6EF' }}>
        GENESYS Cameroon — Devis {quoteNumber} — Émis le {formatDate(quoteDate)}
      </div>
    </div>
  );
}
