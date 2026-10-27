/*
# Remplacement des secteurs et du catalogue de démonstration

## Contexte
Les trois anciens secteurs (Laboratoire pharmaceutique, Agro-industriel, Pétrochimique)
et leurs produits de démonstration sont remplacés par les trois nouveaux secteurs
d'analyses et 21 nouvelles références d'équipements de laboratoire.

Aucune demande de devis, vente, mouvement de stock ni historique n''existe en base
(vérifié : quote_requests, sales, sale_items, inventory_movements,
quote_request_history sont toutes vides). Les produits de démonstration peuvent
donc être archivés sans perte de données commerciales.

## Changements

### 1. Catégories (mise à jour en place, IDs conservés)
Les trois catégories existantes sont renommées et leur slug/description/image
sont mis à jour pour correspondre aux nouveaux secteurs :

- ID 9ab34d90...  -> "Laboratoire d''analyses médicales" (slug: analyses-medicales)
- ID f38bfc9f...  -> "Laboratoire d''analyses agroalimentaires" (slug: analyses-agroalimentaires)
- ID 97bb485f...  -> "Laboratoire d''analyses minéralogiques" (slug: analyses-mineralogiques)

Les IDs sont conservés pour préserver toute relation future et l''historique.
Les anciens slugs ne sont plus référencés par des données commerciales.

### 2. Produits de démonstration
Les 12 produits de démonstration existants sont marqués is_archived = true et
is_active = false afin de ne plus apparaître dans le catalogue public ni dans
les listes actives, sans suppression destructrice.

### 3. Nouveaux produits (21)
21 nouveaux produits sont insérés, répartis sur les trois nouvelles catégories,
chacun avec un nom exact, une référence, un slug, une description courte et une
image pertinente (URL Pexels licence libre). Les prix internes restent à 0 et
show_public_price = false (tarification par devis). Stock et seuils à 0.

## Sécurité
Aucune modification de schéma, de politique RLS ni de grant. Les politiques
existantes s''appliquent automatiquement aux nouvelles lignes.
*/

-- ---------------------------------------------------------------------------
-- 1. Mettre à jour les catégories (IDs conservés)
-- ---------------------------------------------------------------------------
UPDATE categories
SET name = 'Laboratoire d''analyses médicales',
    slug = 'analyses-medicales',
    description = 'Équipements pour le diagnostic et l''analyse en laboratoire médical : hématologie, biologie moléculaire, microbiologie.',
    image_url = 'https://images.pexels.com/photos/8442446/pexels-photo-8442446.jpeg?auto=compress&cs=tinysrgb&w=1400',
    updated_at = now()
WHERE id = '9ab34d90-b90b-4b52-a1fc-38259b0c65b4';

UPDATE categories
SET name = 'Laboratoire d''analyses agroalimentaires',
    slug = 'analyses-agroalimentaires',
    description = 'Équipements pour le contrôle qualité des aliments et boissons : physico-chimie, microbiologie, séchage et stérilisation.',
    image_url = 'https://images.pexels.com/photos/10514991/pexels-photo-10514991.jpeg?auto=compress&cs=tinysrgb&w=1400',
    updated_at = now()
WHERE id = 'f38bfc9f-29e0-4583-874f-069c319ecde2';

UPDATE categories
SET name = 'Laboratoire d''analyses minéralogiques',
    slug = 'analyses-mineralogiques',
    description = 'Équipements pour la caractérisation des minéraux et matériaux : diffraction, microscopie, spectroscopie, analyse thermique.',
    image_url = 'https://images.pexels.com/photos/9010826/pexels-photo-9010826.jpeg?auto=compress&cs=tinysrgb&w=1400',
    updated_at = now()
WHERE id = '97bb485f-abf8-4ee8-bcf7-7578d3be592a';

-- ---------------------------------------------------------------------------
-- 2. Archiver les produits de démonstration existants
-- ---------------------------------------------------------------------------
UPDATE products
SET is_archived = true,
    is_active = false,
    updated_at = now()
WHERE reference LIKE 'DEMO-%';

-- ---------------------------------------------------------------------------
-- 3. Insérer les 21 nouveaux produits
-- ---------------------------------------------------------------------------
-- A. Laboratoire d''analyses médicales (catégorie 9ab34d90...)
INSERT INTO products (category_id, name, reference, slug, short_description, image_url, unit_price, currency, show_public_price, is_active, is_archived, stock_quantity, reserved_quantity, low_stock_threshold)
VALUES
('9ab34d90-b90b-4b52-a1fc-38259b0c65b4', 'Microscope', 'MED-MIC-001', 'microscope-medical',
 'Microscope optique de précision pour l''observation et le diagnostic en laboratoire médical.',
 'https://images.pexels.com/photos/8533045/pexels-photo-8533045.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('9ab34d90-b90b-4b52-a1fc-38259b0c65b4', 'Centrifugeuse de laboratoire', 'MED-CEN-002', 'centrifugeuse-laboratoire',
 'Centrifugeuse pour la séparation des échantillons sanguins et biologiques.',
 'https://images.pexels.com/photos/6629397/pexels-photo-6629397.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('9ab34d90-b90b-4b52-a1fc-38259b0c65b4', 'Analyseur hématologique', 'MED-HEM-003', 'analyseur-hematologique',
 'Analyseur automatisé pour le comptage et la caractérisation des cellules sanguines.',
 'https://images.pexels.com/photos/8442373/pexels-photo-8442373.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('9ab34d90-b90b-4b52-a1fc-38259b0c65b4', 'Automate de numération formule sanguine (NFS)', 'MED-NFS-004', 'automate-numeration-formule-sanguine',
 'Automate de numération formule sanguine pour le diagnostic hématologique de routine.',
 'https://images.pexels.com/photos/8442446/pexels-photo-8442446.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('9ab34d90-b90b-4b52-a1fc-38259b0c65b4', 'Thermocycleur', 'MED-PCR-005', 'thermocycleur',
 'Thermocycleur pour l''amplification de l''ADN par PCR en biologie moléculaire.',
 'https://images.pexels.com/photos/6183247/pexels-photo-6183247.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('9ab34d90-b90b-4b52-a1fc-38259b0c65b4', 'Incubateur de laboratoire', 'MED-INC-006', 'incubateur-laboratoire',
 'Incubateur à température contrôlée pour la culture de micro-organismes.',
 'https://images.pexels.com/photos/8940515/pexels-photo-8940515.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0)
ON CONFLICT (slug) DO NOTHING;

-- B. Laboratoire d''analyses agroalimentaires (catégorie f38bfc9f...)
INSERT INTO products (category_id, name, reference, slug, short_description, image_url, unit_price, currency, show_public_price, is_active, is_archived, stock_quantity, reserved_quantity, low_stock_threshold)
VALUES
('f38bfc9f-29e0-4583-874f-069c319ecde2', 'Réfractomètre', 'AGR-REF-001', 'refractometre',
 'Réfractomètre pour la mesure de l''indice de réfraction et du taux de sucre.',
 'https://images.pexels.com/photos/15300330/pexels-photo-15300330.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('f38bfc9f-29e0-4583-874f-069c319ecde2', 'Spectrophotomètre', 'AGR-SPE-002', 'spectrophotometre-agro',
 'Spectrophotomètre pour la mesure de l''absorbance et la quantification des composés.',
 'https://images.pexels.com/photos/10514991/pexels-photo-10514991.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('f38bfc9f-29e0-4583-874f-069c319ecde2', 'Chromatographe (HPLC ou CPG)', 'AGR-CHR-003', 'chromatographe-hplc-cpg',
 'Chromatographe HPLC/CPG pour la séparation et l''identification des constituants.',
 'https://images.pexels.com/photos/6132245/pexels-photo-6132245.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('f38bfc9f-29e0-4583-874f-069c319ecde2', 'pH-mètre', 'AGR-PHM-004', 'ph-metre',
 'pH-mètre de précision pour la mesure de l''acidité des solutions et produits.',
 'https://images.pexels.com/photos/3735773/pexels-photo-3735773.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('f38bfc9f-29e0-4583-874f-069c319ecde2', 'Balance analytique et de précision', 'AGR-BAL-005', 'balance-analytique-precision',
 'Balance analytique de précision pour la pesée exacte des échantillons.',
 'https://images.pexels.com/photos/3912364/pexels-photo-3912364.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('f38bfc9f-29e0-4583-874f-069c319ecde2', 'Étuve (four de séchage)', 'AGR-ETU-006', 'etuve-four-sechage',
 'Étuve de séchage à température contrôlée pour le traitement des échantillons.',
 'https://images.pexels.com/photos/8940358/pexels-photo-8940358.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('f38bfc9f-29e0-4583-874f-069c319ecde2', 'Déshydrateur', 'AGR-DES-007', 'desydrateur',
 'Déshydrateur pour la conservation et le séchage contrôlé des produits.',
 'https://images.pexels.com/photos/39060101/pexels-photo-39060101.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('f38bfc9f-29e0-4583-874f-069c319ecde2', 'Autoclave', 'AGR-AUT-008', 'autoclave',
 'Autoclave de stérilisation par vapeur sous pression pour milieux et matériel.',
 'https://images.pexels.com/photos/8413159/pexels-photo-8413159.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('f38bfc9f-29e0-4583-874f-069c319ecde2', 'Séquenceur d''ADN', 'AGR-SEQ-009', 'sequenceur-adn',
 'Séquenceur d''ADN pour l''analyse génétique et la détection de pathogènes.',
 'https://images.pexels.com/photos/8442543/pexels-photo-8442543.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0)
ON CONFLICT (slug) DO NOTHING;

-- C. Laboratoire d''analyses minéralogiques (catégorie 97bb485f...)
INSERT INTO products (category_id, name, reference, slug, short_description, image_url, unit_price, currency, show_public_price, is_active, is_archived, stock_quantity, reserved_quantity, low_stock_threshold)
VALUES
('97bb485f-abf8-4ee8-bcf7-7578d3be592a', 'Diffractomètre de rayons X (DRX)', 'MIN-DRX-001', 'diffractometre-rayons-x-drx',
 'Diffractomètre de rayons X pour l''identification des phases cristallines des minéraux.',
 'https://images.pexels.com/photos/6501859/pexels-photo-6501859.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('97bb485f-abf8-4ee8-bcf7-7578d3be592a', 'Microscope polarisant', 'MIN-MIC-002', 'microscope-polarisant',
 'Microscope polarisant pour l''étude pétrographique des roches et minéraux.',
 'https://images.pexels.com/photos/9010823/pexels-photo-9010823.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('97bb485f-abf8-4ee8-bcf7-7578d3be592a', 'Microscope électronique à balayage (MEB)', 'MIN-MEB-003', 'microscope-electronique-balayage-meb',
 'Microscope électronique à balayage pour l''imagerie et l''analyse de surface à haute résolution.',
 'https://images.pexels.com/photos/18952655/pexels-photo-18952655.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('97bb485f-abf8-4ee8-bcf7-7578d3be592a', 'Spectromètre de fluorescence X (FX)', 'MIN-FX-004', 'spectrometre-fluorescence-x',
 'Spectromètre de fluorescence X pour l''analyse élémentaire des matériaux.',
 'https://images.pexels.com/photos/33790175/pexels-photo-33790175.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('97bb485f-abf8-4ee8-bcf7-7578d3be592a', 'Microsonde électronique (EPMA)', 'MIN-EPMA-005', 'microsonde-electronique-epma',
 'Microsonde électronique pour l''analyse quantitative ponctuelle des minéraux.',
 'https://images.pexels.com/photos/8471928/pexels-photo-8471928.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0),
('97bb485f-abf8-4ee8-bcf7-7578d3be592a', 'Analyseur thermogravimétrique', 'MIN-ATG-006', 'analyseur-thermogravimetrique',
 'Analyseur thermogravimétrique pour l''étude des variations de masse selon la température.',
 'https://images.pexels.com/photos/8442027/pexels-photo-8442027.jpeg?auto=compress&cs=tinysrgb&w=1200',
 0, 'XAF', false, true, false, 0, 0, 0)
ON CONFLICT (slug) DO NOTHING;
