# Architecture — GENESYS Cameroon

Documentation fidèle à l'implémentation réelle du projet.

## 1. Vue d'ensemble

GENESYS Cameroon est un site vitrine B2B et un back-office d'administration pour un
fournisseur d'équipements industriels de précision (laboratoires pharmaceutiques,
agro-industrie, pétrochimie). Le site public présente un catalogue d'équipements et
permet aux visiteurs de soumettre des demandes de devis. L'interface d'administration
permet à l'équipe commerciale de gérer le catalogue, traiter les demandes, valider
des ventes et suivre les stocks.

### Stack technique

| Couche         | Technologie                                      |
| -------------- | ------------------------------------------------ |
| Build / Dev    | Vite 7 (React plugin)                            |
| UI             | React 18 + TypeScript, Tailwind CSS 3, lucide-react |
| Routage        | React Router 7                                   |
| Formulaires    | React Hook Form + Zod (resolvers)                |
| Graphiques     | Recharts (dashboard admin)                       |
| Backend (BaaS) | Supabase (Postgres, Auth, RLS, fonctions SQL)    |
| Polices        | Manrope (titres) + Inter (textes) via Google Fonts |

Aucune bibliothèque d'animation lourde n'est utilisée : les transitions et
apparitions au défilement reposent sur CSS + `IntersectionObserver` (hook
`useReveal`), avec respect de `prefers-reduced-motion`.

## 2. Organisation du code — trois dossiers principaux

Le code applicatif (`src/`) est organisé en trois dossiers à responsabilité claire :

```
src/
├── App.tsx                  # Racine : routage + providers
├── main.tsx                 # Point d'entrée React
├── frontend/                # Site public (pages, composants, styles, hooks)
│   ├── components/
│   │   ├── catalog/         # ProductCard
│   │   ├── layout/          # PublicLayout (header + footer)
│   │   └── ui/              # Alert, EmptyState, Loading, Logo, Modal,
│   │                        #   PageHeader, SmartImage, StatusBadge
│   ├── hooks/
│   │   └── useReveal.tsx    # Scroll-reveal via IntersectionObserver
│   ├── lib/
│   │   └── images.ts        # Registre centralisé des images du site
│   ├── pages/               # HomePage, CatalogPage, ProductPage, QuotePage,
│   │                        #   AboutPage, ContactPage, PrivacyPage, NotFoundPage
│   └── styles/
│       └── index.css        # Tailwind + design system global
├── backend/                 # Logique métier, accès données, types, validations
│   ├── lib/
│   │   ├── auth.tsx         # AuthProvider + useAuth (session, profil, isAdmin)
│   │   ├── config.ts        # siteConfig (entreprise, contact, devise)
│   │   ├── supabase.ts      # Client Supabase (env)
│   │   ├── utils.ts         # formatage (devise, dates, statuts), slugify
│   │   └── validations.ts   # Schémas Zod (quote, product, sale, login, contact)
│   ├── services/
│   │   ├── catalog.ts       # CRUD produits/catégories (public + admin)
│   │   ├── quotes.ts        # Soumission et suivi des demandes de devis
│   │   └── admin.ts         # Dashboard, ventes, stock, notifications, graphs
│   └── types/
│       └── index.ts         # Types TypeScript (Product, QuoteRequest, Sale, etc.)
└── admin/                   # Interface d'administration
    ├── components/
    │   └── AdminLayout.tsx  # Sidebar + header + notifications
    └── pages/
        ├── LoginPage.tsx
        ├── DashboardPage.tsx
        ├── AdminProductsPage.tsx
        ├── AdminQuotesPage.tsx
        ├── AdminQuoteDetailPage.tsx
        ├── AdminInventoryPage.tsx
        ├── AdminSalesPage.tsx
        └── AdminSaleDetailPage.tsx
```

### Responsabilités

- **`src/frontend/`** — tout ce qui est visible par les visiteurs : pages publiques,
  composants visuels, catalogue, navigation, formulaire public de devis, styles et
  animations. Les composants UI partagés (`Loading`, `Modal`, `Alert`, etc.)
  vivent ici car ils sont consommés par les pages publiques ; l'admin les importe
  via `@/frontend/components/ui/...`.
- **`src/backend/`** — services métier et accès aux données Supabase, types
  partagés, validations Zod, configuration et authentification. Aucune logique de
  présentation. Les fonctions ici appellent directement le client Supabase
  côté navigateur (les règles RLS et les fonctions SQL sécurisent les accès).
- **`src/admin/`** — connexion et interface d'administration : dashboard, gestion
  des produits/catégories, demandes de devis, ventes, stocks. Importe les services
  de `backend/` et les composants UI de `frontend/`.

### Fichiers racine conservés

`index.html`, `vite.config.ts`, `tsconfig*.json`, `tailwind.config.js`,
`postcss.config.js`, `eslint.config.js`, `package.json`, `.env*` — configurations
framework requises.

## 3. Routage et navigation

Défini dans `src/App.tsx` avec `BrowserRouter` + lazy loading par page.

### Routes publiques (layout `PublicLayout`)

| Chemin                          | Page              |
| ------------------------------- | ----------------- |
| `/`                             | HomePage          |
| `/equipements`                  | CatalogPage       |
| `/equipements/:slug`            | ProductPage       |
| `/demande-de-devis`             | QuotePage         |
| `/a-propos`                     | AboutPage         |
| `/contact`                      | ContactPage       |
| `/politique-de-confidentialite` | PrivacyPage       |

### Routes admin (layout `AdminLayout`, protégées par `AdminRoute`)

| Chemin                | Page                  |
| --------------------- | --------------------- |
| `/admin/login`        | LoginPage             |
| `/admin`              | DashboardPage         |
| `/admin/produits`     | AdminProductsPage     |
| `/admin/demandes`     | AdminQuotesPage       |
| `/admin/demandes/:id` | AdminQuoteDetailPage  |
| `/admin/stock`        | AdminInventoryPage    |
| `/admin/ventes`       | AdminSalesPage        |
| `/admin/ventes/:id`   | AdminSaleDetailPage   |

`*` → NotFoundPage.

### Ordre de la navigation publique

Header (de gauche à droite après le logo) :
**Accueil → À propos → Nos équipements → Secteurs d'activité → Contact**,
puis le bouton **Demander un devis** (CTA accentué).

« Secteurs d'activité » pointe vers `/#secteurs` (ancrage sur la section
correspondante de la page d'accueil). Le `PublicLayout` gère le défilement vers
l'ancre lors de la navigation.

## 4. Flux de données

Le navigateur parle directement à Supabase via le client JS (`@supabase/supabase-js`).
Aucun serveur applicatif intermédiaire : la sécurité est enforced côté base de
données (RLS + `SECURITY DEFINER` fonctions).

```
Composant React (frontend/admin)
   │  appelle
   ▼
backend/services/*.ts   (catalog / quotes / admin)
   │  utilise
   ▼
backend/lib/supabase.ts (client Supabase)
   │  HTTPS + JWT
   ▼
Supabase Postgres       (tables + RLS + fonctions RPC)
```

### Lectures

- Catalogue public : `fetchCategories`, `fetchProducts`, `fetchProductBySlug` →
  `SELECT` sur `categories` / `products` (politiques `*_public_read`).
- Admin : `fetchAllProductsAdmin`, `fetchQuotesAdmin`, `fetchSales`,
  `fetchSaleById`, `fetchInventoryMovements`, `fetchNotifications` → `SELECT`
  protégés par `is_admin()`.

### Écritures publiques

- `submitQuote` → RPC `submit_quote` (valide consentement, génère la référence,
  insère dans `quote_requests`, crée une notification et une entrée d'historique).
- Le formulaire de contact est côté UI uniquement (pas de persistance demandée
  dans le périmètre actuel).

### Écritures admin (via RPC sécurisées)

- `updateQuoteStatus` → RPC `update_quote_status` (changement de statut,
  historique, montant négocié, notes).
- `validateSale` → RPC `validate_sale` (crée la vente + lignes, déduit le stock,
  vérifie la disponibilité, empêche un double-devis).
- `cancelSale` → RPC `cancel_sale` (annule la vente, retour de stock).
- `adjustStock` / `addStock` → RPC `adjust_stock` / `add_stock` (mouvements
  d'inventaire tracés).
- CRUD produits/catégories : `create/update/archiveProduct`, `create/updateCategory`.

## 5. Modèle de données

Tables principales (schéma `public`) :

```
profiles                 Utilisateurs (liés à auth.users), rôle admin/superadmin
categories               Catégories d'équipements (slug unique)
products                 Équipements (prix interne, stock, seuil, image, slug)
quote_requests           Demandes de devis (référence, statut, client, produit)
quote_request_history    Historique des changements de statut
sales                    Ventes validées (référence, montant total, client)
sale_items               Lignes de vente (snapshot produit, quantité, prix)
inventory_movements      Mouvements de stock (IN/OUT/ADJUSTMENT/RETURN)
notifications            Notifications admin (devis, vente, stock)
```

### Relations clés

- `products.category_id` → `categories.id`
- `quote_requests.product_id` → `products.id`
- `quote_request_history.quote_request_id` → `quote_requests.id`
- `sales.quote_request_id` → `quote_requests.id` (nullable)
- `sale_items.sale_id` → `sales.id`, `sale_items.product_id` → `products.id`
- `inventory_movements.product_id` → `products.id`
- `profiles.id` → `auth.users.id`

### Workflow des demandes de devis

Statuts : `NOUVELLE → CONTACTÉE → EN NÉGOCIATION → ACCEPTÉE` (ou `REFUSÉE` /
`ANNULÉE`). Chaque transition est tracée dans `quote_request_history`. Depuis une
demande `ACCEPTÉE`, l'admin peut créer une vente (`validateSale`), ce qui déduit
le stock et génère une référence de vente.

### Workflow des ventes

`VALIDÉE` ou `ANNULÉE`. L'annulation via `cancelSale` réincrémente le stock via un
mouvement `RETURN`.

### Stock

`stock_quantity`, `reserved_quantity`, `low_stock_threshold`. La disponibilité
affichée au public est calculée depuis `stock_quantity`. Les ajustements passent
par les RPC et sont journalisés dans `inventory_movements`.

## 6. Authentification, autorisations, sécurité

- **Auth** : Supabase Auth email/mot de passe. `AuthProvider` (`backend/lib/auth.tsx`)
  expose `session`, `user`, `profile`, `isAdmin`, `signIn`, `signOut`. La
  résolution du profil se fait via `onAuthStateChange` (avec garde anti-deadlock).
- **Rôles** : `profiles.role` ∈ {`admin`, `superadmin`}. `isAdmin` = rôle admin
  ou superadmin.
- **Protection des routes admin** : `AdminRoute` redirige vers `/admin/login` si
  l'utilisateur n'est pas admin.
- **RLS** : activée sur toutes les tables. Les politiques :
  - Lecture publique (`anon`, `authenticated`) sur `categories` et `products`
    actifs non archivés.
  - Insertion publique sur `quote_requests` (`consent = true`) et
    `quote_request_history`.
  - Tout le reste (admin) est protégé par `is_admin()` (fonction `SECURITY DEFINER`
    avec `search_path = public`).
- **Fonctions SQL** `SECURITY DEFINER` : `submit_quote`, `update_quote_status`,
  `validate_sale`, `cancel_sale`, `adjust_stock`, `add_stock`,
  `get_dashboard_stats`. `EXECUTE` révoquée de `PUBLIC`/`anon` pour les fonctions
  réservées, accordée à `authenticated` selon le cas.

## 7. Images, styles, composants partagés

- **Images du site** : `src/frontend/lib/images.ts` — registre centralisé des
  images de secteurs et du hero (URLs Pexels fiables, licence libre). Les images
  produits proviennent de `products.image_url` (base de données).
- **Composant `SmartImage`** : composant universel d'image avec repli élégant
  (placeholder brandé) si l'URL est absente ou en erreur, fondu à l'apparition,
  chargement différé. Utilisé partout où une image peut échouer.
- **Styles** : `src/frontend/styles/index.css` — Tailwind base/components/utilities,
  design system (`btn`, `card`, `input`, `eyebrow`, `link-underline`…), classes de
  scroll-reveal (`.reveal`, `.reveal-scale`), respect de `prefers-reduced-motion`.
- **Config Tailwind** : `tailwind.config.js` — palette `brand` (bleu `#164B8C`,
  bleu profond `#102A43`, rouge `#D62839`), ramps `success/warning/danger/info`,
  polices `Manrope` (display) + `Inter` (sans), animations et ombres.
- **Composants UI partagés** : `src/frontend/components/ui/` — `Alert`,
  `EmptyState`, `Loading`, `Logo`, `Modal`, `PageHeader`, `SmartImage`,
  `StatusBadge`. Importés par les pages publiques ET admin.
- **Hook d'animation** : `src/frontend/hooks/useReveal.tsx` — `useReveal` et le
  composant `Reveal` pour les apparitions au défilement.

## 8. Configuration et variables d'environnement

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — requis, lus dans
  `backend/lib/supabase.ts`.
- `siteConfig` (`backend/lib/config.ts`) — nom, description, coordonnées de
  contact, devise (`XAF` / FCFA), URL de la politique de confidentialité.
  Les champs de contact vides affichent un placeholder « à renseigner ».

## 9. Commandes

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Vérifier les types
npm run typecheck

# Linter
npm run lint

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

Les migrations SQL Supabase sont dans `supabase/migrations/` (appliquées via les
outils MCP Supabase, pas via la CLI qui n'est pas supportée ici).

## 10. Points d'extension connus

- Les coordonnées de contact dans `siteConfig.company.contact` sont vides par
  défaut et doivent être renseignées par l'entreprise.
- Le formulaire de contact public n'a pas de persistance backend dans le
  périmètre actuel (affichage de confirmation côté UI).
- Les images produits sont fournies via la base de données ; en l'absence
  d'URL, `SmartImage` affiche un placeholder brandé.
