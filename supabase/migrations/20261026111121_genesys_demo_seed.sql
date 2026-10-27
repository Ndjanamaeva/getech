/*
# GENESYS Cameroon — Demo seed data

3 categories + 12 demo products (references prefixed DEMO-). Idempotent.
Images use Unsplash source URLs for industrial/lab/agro/petro visuals.
Prices are internal (show_public_price = false).
*/

insert into public.categories (name, slug, description, image_url, sort_order, is_active)
values
  ('Équipements de laboratoire pharmaceutique', 'laboratoire-pharmaceutique',
   'Instruments d''analyse, matériel de mesure et équipements de laboratoire pour l''industrie pharmaceutique.',
   'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80',
   1, true),
  ('Équipements agro-industriels', 'agro-industriel',
   'Machines, instruments de contrôle et solutions de transformation adaptées aux besoins agro-industriels.',
   'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
   2, true),
  ('Équipements pétrochimiques', 'petrochimique',
   'Instruments de mesure, équipements de contrôle et matériel technique pour les applications pétrochimiques.',
   'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1200&q=80',
   3, true)
on conflict (slug) do nothing;

-- Use a CTE with explicit column names to avoid ambiguity between category slug and product slug.
with src as (
  select * from (values
    ('laboratoire-pharmaceutique', 'Spectrophotomètre UV-Vis double faisceau', 'DEMO-LAB-001',
     'spectrophotometre-uv-vis-double-faisceau',
     'Spectrophotomètre de précision pour l''analyse quantitative en pharmacie.',
     'Spectrophotomètre UV-Visible à double faisceau, plage 190-1100 nm, largeur de fente réglable, logiciel d''acquisition intégré. Conçu pour le contrôle qualité pharmaceutique et la recherche analytique.',
     'https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?auto=format&fit=crop&w=1000&q=80',
     4500000::numeric, 4, 2),
    ('laboratoire-pharmaceutique', 'Chromatographe HPLC modulaire', 'DEMO-LAB-002',
     'chromatographe-hplc-modulaire',
     'Système HPLC modulaire pour la séparation et l''analyse de composés.',
     'Chromatographe en phase liquide haute performance (HPLC) modulaire avec pompe binaire, détecteur UV/DAD, passeur d''échantillons thermostaté. Idéal pour les analyses de pureté et de dosage en environnement pharmaceutique.',
     'https://images.unsplash.com/photo-1554475901-453fc5a30c80?auto=format&fit=crop&w=1000&q=80',
     12000000::numeric, 2, 1),
    ('laboratoire-pharmaceutique', 'Balance analytique de précision 220 g', 'DEMO-LAB-003',
     'balance-analytique-precision-220g',
     'Balance analytique 0,1 mg pour pesées de haute précision.',
     'Balance analytique de précision, capacité 220 g, lisibilité 0,1 mg, calibration interne automatique, interface USB. Conçue pour les laboratoires de contrôle qualité pharmaceutique.',
     'https://images.unsplash.com/photo-1587222392959-d8c495af9e51?auto=format&fit=crop&w=1000&q=80',
     850000::numeric, 10, 3),
    ('laboratoire-pharmaceutique', 'Étuve de stérilisation ventilée', 'DEMO-LAB-004',
     'etuve-sterilisation-ventilee',
     'Étuve ventilée pour stérilisation et séchage jusqu''à 250 °C.',
     'Étuve de stérilisation à convection forcée, plage 10-250 °C, volume 240 L, régulation PID, porte double vitrage. Adaptée aux protocoles de stérilisation pharmaceutique.',
     'https://images.unsplash.com/photo-1532187843-6ce694087a1a?auto=format&fit=crop&w=1000&q=80',
     2100000::numeric, 3, 2),
    ('agro-industriel', 'Broyeur industriel à marteaux 15 kW', 'DEMO-AGR-001',
     'broyeur-industriel-marteaux-15kw',
     'Broyeur à marteaux pour broyage de céréales et matières agricoles.',
     'Broyeur industriel à marteaux, moteur 15 kW, capacité 800 kg/h, grille calibrable, structure en acier inoxydable. Conçu pour la transformation de céréales et l''agro-industrie.',
     'https://images.unsplash.com/photo-1566126120563-2e9c8b8b3a7e?auto=format&fit=crop&w=1000&q=80',
     6800000::numeric, 5, 2),
    ('agro-industriel', 'Sécheur rotatif à air chaud', 'DEMO-AGR-002',
     'secheur-rotatif-air-chaud',
     'Sécheur rotatif pour produits agricoles et granulés.',
     'Sécheur rotatif à air chaud, tambour 1200 mm, contrôle de température 40-200 °C, débit d''air réglable. Utilisé pour le séchage de grains, fruits et matières agro-industrielles.',
     'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=1000&q=80',
     5400000::numeric, 2, 1),
    ('agro-industriel', 'Humidimètre numérique pour grains', 'DEMO-AGR-003',
     'humidimetre-numerique-grains',
     'Humidimètre portable pour mesurer l''humidité des grains.',
     'Humidimètre numérique portable pour céréales et graines, plage 0-40 %, mémoire 100 mesures, calibration multi-espèces. Outil de contrôle qualité en silo et sur site.',
     'https://images.unsplash.com/photo-1574323347407-f5e1ad6d0201?auto=format&fit=crop&w=1000&q=80',
     320000::numeric, 15, 5),
    ('agro-industriel', 'Presses à huile continue 500 kg/j', 'DEMO-AGR-004',
     'presse-a-huile-continue-500kg',
     'Presse à vis continue pour extraction d''huile végétale.',
     'Presse à huile continue à vis, capacité 500 kg/jour, rendement élevé, sortie tourteau ajustable. Conçue pour l''extraction d''huile de palme, arachide et tournesol.',
     'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1000&q=80',
     9200000::numeric, 2, 1),
    ('petrochimique', 'Analyseur de soufre par fluorescence X', 'DEMO-PET-001',
     'analyseur-soufre-fluorescence-x',
     'Analyseur XRF pour dosage du soufre dans les hydrocarbures.',
     'Analyseur de soufre par fluorescence X (XRF), conformité ASTM D4294, plage 0-10 %, écran tactile, impression intégrée. Pour le contrôle qualité des carburants et hydrocarbures.',
     'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1000&q=80',
     14000000::numeric, 3, 1),
    ('petrochimique', 'Viscosimètre rotatif programmable', 'DEMO-PET-002',
     'viscosimetre-rotatif-programmable',
     'Viscosimètre rotatif pour mesure de viscosité dynamique.',
     'Viscosimètre rotatif programmable, plage 1-2e7 mPa·s, multiple spindle, sortie USB, conformité ASTM. Pour la caractérisation des huiles et produits pétrochimiques.',
     'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1000&q=80',
     3200000::numeric, 6, 2),
    ('petrochimique', 'Chambre de calibration pression 200 bar', 'DEMO-PET-003',
     'chambre-calibration-pression-200bar',
     'Chambre de calibration pour capteurs de pression haute.',
     'Chambre de calibration de pression, plage 0-200 bar, stabilité 0,025 %, interface hydraulique, certification traçable. Pour l''étalonnage d''instruments pétrochimiques.',
     'https://images.unsplash.com/photo-1565514020179-018b4b8b6c04?auto=format&fit=crop&w=1000&q=80',
     7500000::numeric, 2, 1),
    ('petrochimique', 'Détecteur portable de gaz H2S', 'DEMO-PET-004',
     'detecteur-portable-gaz-h2s',
     'Détecteur portable de sulfure d''hydrogène pour zones industrielles.',
     'Détecteur portable H2S, plage 0-100 ppm, alarmes visuelles et sonores, batterie 12 h, certification ATEX. Pour la sécurité des installations pétrochimiques.',
     'https://images.unsplash.com/photo-1581093588401-fbb62a91f121?auto=format&fit=crop&w=1000&q=80',
     480000::numeric, 12, 4)
  ) as t(cat_slug, name, reference, prod_slug, short_description, long_description, image_url, unit_price, stock_quantity, low_stock_threshold)
)
insert into public.products (
  category_id, name, reference, slug, short_description, long_description,
  image_url, unit_price, currency, show_public_price, is_active, is_archived,
  stock_quantity, reserved_quantity, low_stock_threshold
)
select c.id, s.name, s.reference, s.prod_slug, s.short_description, s.long_description,
       s.image_url, s.unit_price, 'XAF', false, true, false,
       s.stock_quantity, 0, s.low_stock_threshold
from src s
join public.categories c on c.slug = s.cat_slug
where not exists (select 1 from public.products p where p.reference = s.reference);