import { useEffect, useState, useCallback, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Pencil,
  Archive,
  Package,
  Search,
  ToggleLeft,
  ToggleRight,
  Upload,
  X,
} from 'lucide-react';
import {
  fetchAllProductsAdmin,
  fetchAllCategoriesAdmin,
  createProduct,
  updateProduct,
  archiveProduct,
  createCategory,
  updateCategory,
  uploadProductImage,
  uploadCategoryImage,
} from '@/backend/services/catalog';
import { productSchema, categorySchema, type ProductFormValues, type CategoryFormValues } from '@/backend/lib/validations';
import { slugify, getStockStatus, formatCurrency, generateReference } from '@/backend/lib/utils';
import { PageHeader } from '@/frontend/components/ui/PageHeader';
import { Loading } from '@/frontend/components/ui/Loading';
import { StatusBadge } from '@/frontend/components/ui/StatusBadge';
import { EmptyState } from '@/frontend/components/ui/EmptyState';
import { Modal } from '@/frontend/components/ui/Modal';
import { Alert } from '@/frontend/components/ui/Alert';
import { AdminTable, AdminTHead, AdminTBody } from '@/admin/components/AdminTable';
import type { ProductWithCategory, Category } from '@/backend/types';

type Tab = 'products' | 'categories';

export default function AdminProductsPage() {
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<ProductWithCategory | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([fetchAllProductsAdmin(), fetchAllCategoriesAdmin()]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.name.toLowerCase().includes(s) || (p.reference ?? '').toLowerCase().includes(s);
  });

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { currency: 'XAF', show_public_price: false, is_active: true, stock_quantity: 0, low_stock_threshold: 0 },
  });
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { sort_order: 0, is_active: true },
  });

  const openProductModal = (product: ProductWithCategory | null) => {
    setEditingProduct(product);
    setFormError(null);
    if (product) {
      productForm.reset({
        category_id: product.category_id,
        name: product.name,
        reference: product.reference ?? '',
        slug: product.slug,
        short_description: product.short_description ?? '',
        long_description: product.long_description ?? '',
        image_url: product.image_url ?? '',
        unit_price: product.unit_price,
        currency: product.currency,
        show_public_price: product.show_public_price,
        is_active: product.is_active,
        stock_quantity: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold,
      });
    } else {
      productForm.reset({
        category_id: categories[0]?.id ?? '',
        name: '',
        reference: '',
        slug: '',
        short_description: '',
        long_description: '',
        image_url: '',
        unit_price: 0,
        currency: 'XAF',
        show_public_price: false,
        is_active: true,
        stock_quantity: 0,
        low_stock_threshold: 0,
      });
    }
    setModalOpen(true);
  };

  const openCategoryModal = (cat: Category | null) => {
    setEditingCategory(cat);
    setFormError(null);
    if (cat) {
      categoryForm.reset({
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? '',
        image_url: cat.image_url ?? '',
        sort_order: cat.sort_order,
        is_active: cat.is_active,
      });
    } else {
      categoryForm.reset({ name: '', slug: '', description: '', image_url: '', sort_order: 0, is_active: true });
    }
    setCatModalOpen(true);
  };

  const onProductSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const input = {
        ...values,
        reference: values.reference || null,
        short_description: values.short_description || null,
        long_description: values.long_description || null,
        image_url: values.image_url || null,
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, input);
      } else {
        await createProduct(input);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const onCategorySubmit = async (values: CategoryFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const input = {
        ...values,
        description: values.description || null,
        image_url: values.image_url || null,
      };
      if (editingCategory) {
        await updateCategory(editingCategory.id, input);
      } else {
        await createCategory(input);
      }
      setCatModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!confirmArchive) return;
    setSubmitting(true);
    try {
      await archiveProduct(confirmArchive.id);
      setConfirmArchive(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (product: ProductWithCategory) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Catalogue"
        description="Gérez vos produits, catégories, prix internes et stocks."
        actions={
          tab === 'products' ? (
            <button onClick={() => openProductModal(null)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Nouveau produit
            </button>
          ) : (
            <button onClick={() => openCategoryModal(null)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Nouvelle catégorie
            </button>
          )
        }
      />

      {formError && (
        <div className="mb-4">
          <Alert variant="error">{formError}</Alert>
        </div>
      )}

      <div className="mb-6 flex gap-1 border-b border-brand-border">
        <button
          onClick={() => setTab('products')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'products'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-muted hover:text-brand-text'
          }`}
        >
          Produits ({products.length})
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'categories'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-muted hover:text-brand-text'
          }`}
        >
          Catégories ({categories.length})
        </button>
      </div>

      {tab === 'products' ? (
        <>
          <div className="card mb-4 p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
              <input
                type="search"
                placeholder="Rechercher par nom ou référence…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Package className="h-10 w-10" />}
              title="Aucun produit"
              description="Commencez par créer votre premier produit."
              action={
                <button onClick={() => openProductModal(null)} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Nouveau produit
                </button>
              }
            />
          ) : (
            <AdminTable>
              <AdminTHead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Référence</th>
                  <th>Prix interne</th>
                  <th>Stock</th>
                  <th>Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </AdminTHead>
              <AdminTBody>
                {filtered.map((p) => {
                  const stock = getStockStatus(p.stock_quantity, p.low_stock_threshold);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-brand-bg">
                            {p.image_url ? (
                              <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-5 w-5 text-brand-muted" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-brand-text truncate">{p.name}</p>
                            {p.is_archived && (
                              <span className="text-xs text-brand-muted">Archivé</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-brand-muted">{p.categories?.name ?? '—'}</td>
                      <td className="text-brand-muted">{p.reference ?? '—'}</td>
                      <td className="text-brand-text">{formatCurrency(p.unit_price)}</td>
                      <td>
                        <span className="font-medium text-brand-text">{p.stock_quantity}</span>
                      </td>
                      <td>
                        <StatusBadge tone={stock.tone} label={stock.label} />
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleActive(p)}
                            className="rounded-lg p-2 text-brand-muted hover:bg-brand-bg hover:text-brand-primary"
                            title={p.is_active ? 'Désactiver' : 'Activer'}
                            disabled={p.is_archived}
                          >
                            {p.is_active ? (
                              <ToggleRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => openProductModal(p)}
                            className="rounded-lg p-2 text-brand-muted hover:bg-brand-bg hover:text-brand-primary"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmArchive(p)}
                            className="rounded-lg p-2 text-brand-muted hover:bg-red-50 hover:text-brand-accent"
                            title="Archiver"
                            disabled={p.is_archived}
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </AdminTBody>
            </AdminTable>
          )}
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-brand-text">{c.name}</h3>
                </div>
                <button
                  onClick={() => openCategoryModal(c)}
                  className="rounded-lg p-2 text-brand-muted hover:bg-brand-bg hover:text-brand-primary"
                  title="Modifier"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              {c.description && <p className="mt-3 text-sm text-brand-muted line-clamp-2">{c.description}</p>}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-medium text-brand-muted">
                  {products.filter((p) => p.category_id === c.id && !p.is_archived).length} produit(s)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              Annuler
            </button>
            <button
              onClick={productForm.handleSubmit(onProductSubmit)}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Enregistrement…' : editingProduct ? 'Enregistrer' : 'Créer'}
            </button>
          </>
        }
      >
        <ProductForm
          form={productForm}
          categories={categories}
          onNameChange={(name) => {
            if (!editingProduct) {
              productForm.setValue('slug', slugify(name));
            }
          }}
          onCategoryChange={(categorySlug) => {
            if (!editingProduct) {
              const seq = Math.floor(Math.random() * 900) + 100;
              productForm.setValue('reference', generateReference(categorySlug, seq));
            }
          }}
        />
      </Modal>

      {/* Category modal */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        footer={
          <>
            <button onClick={() => setCatModalOpen(false)} className="btn-secondary">
              Annuler
            </button>
            <button
              onClick={categoryForm.handleSubmit(onCategorySubmit)}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Enregistrement…' : editingCategory ? 'Enregistrer' : 'Créer'}
            </button>
          </>
        }
      >
        <CategoryForm
          form={categoryForm}
          onNameChange={(name) => {
            if (!editingCategory) {
              categoryForm.setValue('slug', slugify(name));
            }
          }}
        />
      </Modal>

      {/* Archive confirmation */}
      <Modal
        open={confirmArchive !== null}
        onClose={() => setConfirmArchive(null)}
        title="Archiver le produit"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmArchive(null)} className="btn-secondary">
              Annuler
            </button>
            <button onClick={handleArchive} disabled={submitting} className="btn-accent">
              {submitting ? 'Archivage…' : 'Archiver'}
            </button>
          </>
        }
      >
        <p className="text-sm text-brand-muted">
          Le produit <strong className="text-brand-text">{confirmArchive?.name}</strong> sera archivé.
          Il n'apparaîtra plus dans le catalogue public, mais l'historique commercial associé sera conservé.
        </p>
      </Modal>
    </div>
  );
}

function ProductForm({
  form,
  categories,
  onNameChange,
  onCategoryChange,
}: {
  form: ReturnType<typeof useForm<ProductFormValues>>;
  categories: Category[];
  onNameChange: (name: string) => void;
  onCategoryChange: (categorySlug: string) => void;
}) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageUrl = watch('image_url');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadProductImage(file);
      setValue('image_url', url, { shouldValidate: true });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur lors du téléversement');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Nom du produit *</label>
          <input
            className="input"
            {...register('name')}
            onChange={(e) => {
              register('name').onChange(e);
              onNameChange(e.target.value);
            }}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Catégorie *</label>
          <select
            className="input"
            {...register('category_id')}
            onChange={(e) => {
              register('category_id').onChange(e);
              const cat = categories.find((c) => c.id === e.target.value);
              if (cat) onCategoryChange(cat.slug);
            }}
          >
            <option value="">Sélectionner…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="mt-1 text-xs text-red-600">{errors.category_id.message}</p>}
        </div>
        <div>
          <label className="label">Référence</label>
          <input className="input bg-brand-bg/50" {...register('reference')} readOnly />
          <p className="mt-1 text-xs text-brand-muted">Générée automatiquement selon la catégorie.</p>
        </div>
      </div>
      <div>
        <label className="label">Slug (URL) *</label>
        <input className="input" {...register('slug')} />
        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
      </div>
      <div>
        <label className="label">Description courte</label>
        <input className="input" {...register('short_description')} />
      </div>
      <div>
        <label className="label">Description détaillée</label>
        <textarea rows={4} className="input resize-none" {...register('long_description')} />
      </div>
      <div>
        <label className="label">Image du produit</label>
        <div className="flex items-start gap-4">
          {imageUrl ? (
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-brand-border">
              <img src={imageUrl} alt="Aperçu" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setValue('image_url', '', { shouldValidate: true })}
                className="absolute right-0 top-0 rounded-bl-lg bg-black/60 p-1 text-white hover:bg-black/80"
                title="Retirer l'image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-brand-border bg-brand-bg">
              <Package className="h-8 w-8 text-brand-muted" />
            </div>
          )}
          <div className="flex-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-border px-4 py-2.5 text-sm font-medium text-brand-text hover:bg-brand-bg transition-colors">
              <Upload className="h-4 w-4 text-brand-primary" />
              {uploading ? 'Téléversement…' : 'Choisir un fichier'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
            {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
            <p className="mt-1 text-xs text-brand-muted">JPG, PNG ou WebP. L'image sera stockée et accessible publiquement.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Prix interne (FCFA) *</label>
          <input
            type="number"
            step="0.01"
            className="input"
            {...register('unit_price', { valueAsNumber: true })}
          />
          {errors.unit_price && <p className="mt-1 text-xs text-red-600">{errors.unit_price.message}</p>}
        </div>
        <div>
          <label className="label">Stock initial *</label>
          <input
            type="number"
            className="input"
            {...register('stock_quantity', { valueAsNumber: true })}
          />
          {errors.stock_quantity && <p className="mt-1 text-xs text-red-600">{errors.stock_quantity.message}</p>}
        </div>
        <div>
          <label className="label">Seuil d'alerte *</label>
          <input
            type="number"
            className="input"
            {...register('low_stock_threshold', { valueAsNumber: true })}
          />
          {errors.low_stock_threshold && (
            <p className="mt-1 text-xs text-red-600">{errors.low_stock_threshold.message}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input type="checkbox" className="h-4 w-4 rounded border-brand-border text-brand-primary" {...register('is_active')} />
          Produit actif (visible au public)
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input type="checkbox" className="h-4 w-4 rounded border-brand-border text-brand-primary" {...register('show_public_price')} />
          Afficher le prix publiquement
        </label>
      </div>
    </div>
  );
}

function CategoryForm({
  form,
  onNameChange,
}: {
  form: ReturnType<typeof useForm<CategoryFormValues>>;
  onNameChange: (name: string) => void;
}) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageUrl = watch('image_url');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadCategoryImage(file);
      setValue('image_url', url, { shouldValidate: true });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur lors du téléversement');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nom *</label>
        <input
          className="input"
          {...register('name')}
          onChange={(e) => {
            register('name').onChange(e);
            onNameChange(e.target.value);
          }}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label">Slug *</label>
        <input className="input" {...register('slug')} />
        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea rows={3} className="input resize-none" {...register('description')} />
      </div>
      <div>
        <label className="label">Image de la catégorie</label>
        <div className="flex items-start gap-4">
          {imageUrl ? (
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-brand-border">
              <img src={imageUrl} alt="Aperçu" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setValue('image_url', '', { shouldValidate: true })}
                className="absolute right-0 top-0 rounded-bl-lg bg-black/60 p-1 text-white hover:bg-black/80"
                title="Retirer l'image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-brand-border bg-brand-bg">
              <Package className="h-8 w-8 text-brand-muted" />
            </div>
          )}
          <div className="flex-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-border px-4 py-2.5 text-sm font-medium text-brand-text hover:bg-brand-bg transition-colors">
              <Upload className="h-4 w-4 text-brand-primary" />
              {uploading ? 'Téléversement…' : 'Choisir un fichier'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
            {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
            <p className="mt-1 text-xs text-brand-muted">JPG, PNG ou WebP. L'image sera stockée et accessible publiquement.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Ordre d'affichage</label>
          <input type="number" className="input" {...register('sort_order', { valueAsNumber: true })} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-brand-text pb-2.5">
            <input type="checkbox" className="h-4 w-4 rounded border-brand-border text-brand-primary" {...register('is_active')} />
            Catégorie active
          </label>
        </div>
      </div>
    </div>
  );
}
