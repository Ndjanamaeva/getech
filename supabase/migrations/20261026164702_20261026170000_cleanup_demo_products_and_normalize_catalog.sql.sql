/*
# Nettoyage du catalogue : suppression des 12 produits de démonstration

## Contexte
Le catalogue de référence contient 21 produits (références MED-*, AGR-*, MIN-*).
12 produits de démonstration (références DEMO-*) sont archivés et inactifs depuis
la migration 20261026143625. Aucune donnée commerciale (demandes de devis,
ventes, lignes de vente, mouvements de stock, historique) ne référence ces
produits (vérifié avant exécution : 0 lignes liées dans quote_requests,
sale_items, inventory_movements, sales via quote_requests).

## Changements
1. Supprime les 12 produits dont la référence commence par 'DEMO-'.
2. Marque les 21 produits de référence comme disponibles :
   - is_active = true, is_archived = false (déjà le cas pour la plupart,
     réappliqué pour cohérence).
   - low_stock_threshold fixé à 5 pour tous (évite l'indisponibilité tant que
     stock_quantity est 0 ; une fois du stock ajouté, le seuil reste pertinent).
3. Vérifie (post-exécution côté applicatif) que le compte de produits actifs
   vaut 21.

## Sécurité
Aucune modification de schéma, de politique RLS ni de grant.
Les politiques existantes s'appliquent automatiquement.
*/

-- 1. Supprimer les produits de démonstration (aucune relation commerciale)
DELETE FROM public.products WHERE reference LIKE 'DEMO-%';

-- 2. Normaliser les 21 produits de référence : actifs, non archivés, seuil cohérent
UPDATE public.products
SET is_active = true,
    is_archived = false,
    low_stock_threshold = 5,
    updated_at = now()
WHERE reference LIKE 'MED-%'
   OR reference LIKE 'AGR-%'
   OR reference LIKE 'MIN-%';