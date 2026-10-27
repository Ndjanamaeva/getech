/*
# Disponibilité des 21 produits de référence

## Contexte
Les 21 produits de référence ont stock_quantity = 0, ce qui les affiche comme
"Indisponible" dans le catalogue et le tableau de bord. L'utilisateur indique
que les 21 produits sont disponibles à la commande.

## Changements
Met à jour stock_quantity = 10 et low_stock_threshold = 5 pour les 21 produits
de référence (MED-*, AGR-*, MIN-*). Avec stock (10) > seuil (5), le statut
calculé devient "Disponible" via getStockStatus().

Aucune transaction fictive n'est créée ; aucun mouvement d'inventaire n'est
inséré. Seul le champ stock_quantity existant est mis à jour pour refléter
la disponibilité réelle annoncée par l'entreprise.
*/

UPDATE public.products
SET stock_quantity = 10,
    low_stock_threshold = 5,
    updated_at = now()
WHERE reference LIKE 'MED-%'
   OR reference LIKE 'AGR-%'
   OR reference LIKE 'MIN-%';