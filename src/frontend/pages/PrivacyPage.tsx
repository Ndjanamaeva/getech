import { Shield } from 'lucide-react';
import { siteConfig } from '@/backend/lib/config';
import { Reveal } from '@/frontend/hooks/useReveal';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container-page py-12 lg:py-16">
        <Reveal className="max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold text-brand-text">Politique de confidentialité</h1>
          </div>
          <div className="mt-8 space-y-6 leading-relaxed text-brand-muted">
            <p>
              {siteConfig.company.legalName} s'engage à protéger les données personnelles des visiteurs
              qui soumettent une demande de devis via notre plateforme. Cette politique décrit comment
              vos données sont collectées et utilisées.
            </p>
            <section>
              <h2 className="text-lg font-semibold text-brand-text">Données collectées</h2>
              <p className="mt-2">
                Lors d'une demande de devis, nous collectons : votre nom, prénom, adresse, numéro de
                téléphone, e-mail (si fourni), ville, pays, ainsi que la quantité souhaitée et votre
                message. Ces informations sont nécessaires au traitement de votre demande commerciale.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-brand-text">Utilisation des données</h2>
              <p className="mt-2">
                Vos données sont exclusivement utilisées pour traiter votre demande de devis, vous
                contacter dans le cadre de la négociation commerciale et assurer le suivi de votre
                commande. Elles ne sont jamais vendues ni partagées avec des tiers à des fins commerciales.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-brand-text">Conservation</h2>
              <p className="mt-2">
                Les demandes de devis et les données associées sont conservées pour la durée nécessaire au
                suivi commercial et à la conformité des obligations légales.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-brand-text">Vos droits</h2>
              <p className="mt-2">
                Vous disposez d'un droit d'accès, de rectification et de suppression de vos données
                personnelles. Pour exercer ces droits, contactez-nous via les coordonnées disponibles sur
                la page Contact.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-brand-text">Sécurité</h2>
              <p className="mt-2">
                Les données sont stockées dans une base de données sécurisée. L'accès aux données clients
                est restreint aux administrateurs autorisés. Les données personnelles ne sont jamais
                affichées publiquement.
              </p>
            </section>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
