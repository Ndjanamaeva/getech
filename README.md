# GENESYS Cameroon — Plateforme Web Professionnelle

Application web B2B pour GENESYS Cameroon, fournisseur d'équipements industriels et techniques.
La plateforme permet aux visiteurs de consulter un catalogue d'équipements (laboratoire pharmaceutique,
agro-industrie, pétrochimie) et de soumettre des demandes de devis. Un espace administrateur sécurisé
permet de gérer le catalogue, les demandes clients, les stocks, les ventes et de piloter l'activité.

## Stack technique

- **Frontend** : React 18, Vite 7, TypeScript 5 (strict)
- **Interface** : Tailwind CSS 3, lucide-react (icônes)
- **Routage** : React Router 6
- **Formulaires** : React Hook Form + Zod (validation client)
- **Graphiques** : Recharts
- **Backend** : Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **Base de données** : PostgreSQL avec migrations versionnées

## Architecture

Le projet suit une séparation des responsabilités en couches :

```
src/
├── app/                     # (réservé — initialisation future)
├── components/              # Composants UI partagés
│   ├── ui/                  # Primitives (Button, Modal, Alert, Badge, Loading…)
│   ├── layout/              # Layouts (PublicLayout, AdminLayout)
│   └── catalog/             # Composants métier (ProductCard)
├── features/                # (les pages ci-dessous regroupent les fonctionnalités)
├── pages/
│   ├── public/              # Site public (Home, Catalog, Product, Quote, About, Contact…)
│   └── admin/               # Espace admin (Login, Dashboard, Products, Quotes, Inventory, Sales)
├── services/                # Couche d'accès aux données (clients Supabase par domaine)
│   ├── catalog.ts           # Catalog Service : produits, catégories
│   ├── quotes.ts            # Customer & Lead Service : devis, suivi
│   └── admin.ts             # Sales, Inventory, Notification Services
├── lib/
│   ├── config.ts            # Configuration centralisée (entreprise, devise, coordonnées)
│   ├── supabase.ts          # Client Supabase singleton
│   ├── auth.tsx             # AuthProvider + useAuth (contexte d'authentification)
│   ├── validations.ts       # Schémas Zod (validation client)
│   └── utils.ts             # Utilitaires (formatage, statuts, slugify)
├── types/                   # Types TypeScript du domaine
└── App.tsx                  # Routage principal
```

### Domaines métier (orientés services)

1. **Catalog Service** (`services/catalog.ts`) — produits, catégories, visibilité.
2. **Customer & Lead Service** (`services/quotes.ts`) — demandes de devis, suivi des prospects.
3. **Inventory Service** (`services/admin.ts`) — stocks, mouvements, seuils.
4. **Sales Service** (`services/admin.ts`) — ventes, lignes, validation atomique.
5. **Identity & Administration Service** (`lib/auth.tsx` + RLS) — auth, rôles, autorisations.
6. **Notification Service** — notifications admin (déclenchées par les RPC).

La logique métier critique (validation de vente, ajustement de stock, soumission de devis) est
exécutée côté serveur via des fonctions PostgreSQL `SECURITY DEFINER` qui vérifient les permissions
avant d'agir. Aucune logique métier complète n'est exposée dans le navigateur.

## Installation et développement

```bash
# Installer les dépendances
npm install --legacy-peer-deps

# Démarrer le serveur de développement
npm run dev

# Vérifier les types
npm run typecheck

# Build de production
npm run build
```

## Configuration

### Variables d'environnement

Le fichier `.env` est pré-rempli avec les identifiants Supabase dans Bolt.
Pour un déploiement hors Bolt, copiez `.env.example` en `.env` et renseignez :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Configuration de l'entreprise

Tous les paramètres modifiables (nom, coordonnées, devise, textes) sont centralisés dans
`src/lib/config.ts`. Modifiez ce fichier pour adapter la plateforme sans toucher au code métier :

- `company.name`, `company.contact` (email, téléphone, adresse)
- `currency` (défaut : XAF / FCFA)
- `defaultCountry` (défaut : Cameroun)
- `social` (LinkedIn, Facebook)

Les coordonnées non renseignées s'affichent comme champs à compléter plutôt que d'inventer
des informations.

## Base de données (Supabase)

### Migrations appliquées

1. **`genesys_core_schema`** — Tables, index, RLS, policies, triggers.
2. **`genesys_business_rpcs`** — Fonctions métier (submit_quote, validate_sale, cancel_sale, adjust_stock, add_stock, update_quote_status, get_dashboard_stats).
3. **`genesys_demo_seed`** — Données de démonstration (3 catégories, 12 produits).
4. **`fix_touch_updated_at_search_path`** — Correctif linter.

### Schéma

| Table | Rôle |
|---|---|
| `profiles` | Profil admin lié à auth.users, rôle |
| `categories` | Catégories du catalogue |
| `products` | Produits, prix internes, stock, archivage |
| `quote_requests` | Demandes de devis, statut commercial |
| `quote_request_history` | Historique des changements de statut |
| `sales` | En-têtes de vente |
| `sale_items` | Lignes de vente |
| `inventory_movements` | Mouvements de stock (IN, OUT, ADJUSTMENT, RETURN) |
| `notifications` | Notifications admin |
| `audit_logs` | Journal d'audit |

### Sécurité (RLS)

- **Public (anon)** : peut consulter les catégories actives et les produits actifs non archivés ;
  peut soumettre une demande de devis (INSERT) ; ne peut PAS consulter les demandes, ventes, stocks,
  notifications ou journaux.
- **Administrateurs (authenticated + rôle admin)** : accès complet aux données commerciales.
- Les fonctions `SECURITY DEFINER` vérifient `is_admin()` avant chaque opération sensible.
- La clé `service_role` n'est jamais utilisée côté frontend.

### Règle métier : validation de vente atomique

La fonction `validate_sale()` exécute dans une transaction PostgreSQL :
1. Vérification des permissions admin.
2. Vérification du stock disponible pour chaque ligne.
3. Création de la vente et des lignes.
4. Déduction atomique du stock.
5. Enregistrement des mouvements de stock.
6. Marquage de la demande source comme ACCEPTÉE.
7. Notification et journal d'audit.

Si une étape échoue, toute la transaction est annulée : pas de vente partielle, pas de stock incohérent.
La protection anti double-soumission rejette une demande déjà associée à une vente validée.

## Création du premier administrateur

Aucun mot de passe admin n'est en dur. Pour créer le premier administrateur :

### Option 1 — Via Supabase Dashboard

1. Ouvrez le Dashboard Supabase → **Authentication** → **Users**.
2. Cliquez **Add user** → renseignez e-mail et mot de passe.
3. Le trigger `on_auth_user_created` crée automatiquement un profil avec `role = 'admin'`.
4. Connectez-vous sur `/admin/login`.

### Option 2 — Via SQL (console Supabase)

```sql
-- Crée un utilisateur via l'API d'authentification Supabase, puis confirme son profil admin.
-- Le trigger crée le profil automatiquement à l'inscription.
-- Pour forcer le rôle superadmin :
update public.profiles set role = 'superadmin' where id = (
  select id from auth.users where email = 'votre@email.com'
);
```

> **Important** : aucune inscription publique n'est disponible. L'admin doit être créé via
> le Dashboard Supabase ou par SQL. Email confirmation est désactivé par défaut.

## Tests

Le projet utilise TypeScript strict comme garde-fou principal. Les opérations métier critiques
(validation de vente, déduction de stock, soumission de devis) sont implémentées dans des fonctions
PostgreSQL testables. Pour vérifier le build :

```bash
npm run typecheck   # vérification des types
npm run build       # build de production
```

## Données de démonstration

Les produits de démonstration sont préfixés `DEMO-` dans leurs références et sont insérés par la
migration `genesys_demo_seed`. Ils sont séparés des données de production et peuvent être supprimés
ou remplacés sans affecter le schéma. Pour supprimer les données démo :

```sql
delete from public.products where reference like 'DEMO-%';
```

## Déploiement

### Sur Bolt

Le projet est déployé automatiquement. Le build de production est dans `dist/`.

### Déploiement indépendant des services métier

Le backend est actuellement modulaire au sein d'un projet Supabase unique. Pour extraire un
service (ex : Sales Service) en microservice indépendant :

1. **Isoler le schéma** : créer un schéma PostgreSQL dédié ou une base séparée.
2. **Créer une Edge Function** : `supabase/functions/sales/index.ts` qui expose l'API REST.
3. **Migrer les RPC** : déplacer `validate_sale`, `cancel_sale` vers la nouvelle base.
4. **Adapter le service frontend** : `src/services/admin.ts` appelle l'Edge Function au lieu du RPC direct.
5. **Documenter l'API** : OpenAPI / schéma de requêtes.

Les Edge Functions se déploient via `mcp__supabase__deploy_edge_functions`. Voir le skill
`bolt-database` pour les règles CORS et le runtime Deno.

## Accessibilité et SEO

- HTML sémantique, labels explicites sur les formulaires.
- Navigation clavier, indications de focus visibles (`ring-2`).
- `prefers-reduced-motion` respecté (animations désactivées).
- `robots.txt` et `sitemap.xml` inclus.
- Métadonnées Open Graph dans `index.html`.
- URLs lisibles (slugs en français).
- Responsive : mobile, tablette, ordinateur (breakpoints Tailwind).

## Fonctionnalités livrées

### Site public
- Page d'accueil complète (hero, entreprise, catégories, catalogue, secteurs, processus, CTA).
- Catalogue avec recherche et filtres (catégorie, disponibilité).
- Page produit détaillée avec équipements similaires.
- Formulaire de demande de devis avec présélection produit, validation, persistance réelle.
- Pages À propos, Contact, Politique de confidentialité, 404.

### Espace administrateur
- Authentification sécurisée (Supabase Auth, sessions, protection des routes).
- Dashboard avec indicateurs temps réel et graphiques (ventes, demandes).
- Gestion du catalogue (CRUD produits, catégories, archivage, activation).
- Gestion des demandes de devis (workflow NOUVELLE → CONTACTÉE → EN NÉGOCIATION → ACCEPTÉE / REFUSÉE).
- Gestion des stocks (mouvements, seuils, historique, corrections tracées).
- Gestion des ventes (création, validation atomique, annulation avec retour de stock).
- Notifications des nouvelles demandes et ventes.
