import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { contactSchema, type ContactFormValues } from '@/backend/lib/validations';
import { siteConfig } from '@/backend/lib/config';
import { Alert } from '@/frontend/components/ui/Alert';
import { Reveal } from '@/frontend/hooks/useReveal';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (_values: ContactFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setSubmitted(true);
      reset();
    } catch {
      setSubmitError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const contact = siteConfig.company.contact;

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="container-page py-10 lg:py-16">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">Contact</span>
          <h1 className="mt-3 text-3xl font-bold text-brand-text sm:text-4xl">Contactez-nous</h1>
          <p className="mt-2 text-brand-muted">
            Une question, une demande d'information ? Écrivez-nous via le formulaire ci-dessous.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <Reveal className="space-y-4 lg:col-span-1">
            <ContactCard icon={Mail} label="E-mail" value={contact.email} href={contact.email ? `mailto:${contact.email}` : undefined} />
            <ContactCard icon={Phone} label="Téléphone" value={contact.phone} href={contact.phone ? `tel:${contact.phone}` : undefined} />
            {contact.phone2 && (
              <ContactCard icon={Phone} label="Téléphone" value={contact.phone2} href={`tel:${contact.phone2}`} />
            )}
            <ContactCard icon={MapPin} label="Adresse" value={contact.addressLine} />
          </Reveal>

          <Reveal delay={120} className="lg:col-span-2">
            <div className="card p-6 sm:p-8">
              {submitted ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-50">
                    <CheckCircle2 className="h-7 w-7 text-success-600" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-brand-text">Message envoyé</h2>
                  <p className="mt-2 text-brand-muted">Merci. Nous vous répondrons dès que possible.</p>
                  <button onClick={() => setSubmitted(false)} className="btn-secondary mt-6">
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="mb-4">
                    <label className="label" htmlFor="name">Nom complet *</label>
                    <input id="name" className="input" {...register('name')} />
                    {errors.name && <p className="mt-1 text-xs text-danger-600">{errors.name.message}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="label" htmlFor="email">E-mail *</label>
                    <input id="email" type="email" className="input" {...register('email')} />
                    {errors.email && <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="label" htmlFor="message">Message *</label>
                    <textarea id="message" rows={5} className="input resize-none" {...register('message')} />
                    {errors.message && <p className="mt-1 text-xs text-danger-600">{errors.message.message}</p>}
                  </div>

                  {submitError && (
                    <div className="mb-4">
                      <Alert variant="error">{submitError}</Alert>
                    </div>
                  )}

                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Envoi…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Envoyer
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  const content = value ? (
    <p className="text-sm font-medium text-brand-text">{value}</p>
  ) : (
    <p className="text-sm italic text-brand-muted/60">À renseigner</p>
  );
  return (
    <div className="card p-5 card-hover">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-bg text-brand-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-brand-muted">{label}</p>
          {href ? <a href={href} className="hover:text-brand-primary">{content}</a> : content}
        </div>
      </div>
    </div>
  );
}
