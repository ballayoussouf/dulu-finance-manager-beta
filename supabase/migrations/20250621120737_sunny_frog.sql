/*
  # Création de la table payments pour le suivi des paiements

  1. Nouvelle table
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers users)
      - `amount` (numeric, montant du paiement)
      - `currency` (varchar, devise - XAF par défaut)
      - `status` (varchar, statut du paiement)
      - `payment_date` (timestamp, date du paiement)
      - `payment_method` (varchar, méthode de paiement)
      - `transaction_id` (text, ID unique de la passerelle)
      - `plan_id` (varchar, plan acheté)
      - `subscription_start_date` (timestamp, début abonnement)
      - `subscription_end_date` (timestamp, fin abonnement)
      - `created_at` (timestamp, création)
      - `updated_at` (timestamp, dernière mise à jour)
      - `metadata` (jsonb, données supplémentaires)

  2. Sécurité
    - Enable RLS sur la table `payments`
    - Politiques pour que les utilisateurs ne voient que leurs propres paiements

  3. Index
    - Index sur user_id pour les performances
    - Index sur transaction_id pour les recherches rapides
    - Index sur status pour filtrer par statut

  4. Trigger
    - Trigger pour mettre à jour automatiquement updated_at
*/

-- Créer la table payments
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) NOT NULL DEFAULT 'XAF',
    status character varying(50) NOT NULL DEFAULT 'pending',
    payment_date timestamp with time zone NOT NULL DEFAULT now(),
    payment_method character varying(50),
    transaction_id text UNIQUE,
    plan_id character varying(50),
    subscription_start_date timestamp with time zone,
    subscription_end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb
);

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments USING btree (transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments USING btree (payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_plan_id ON public.payments USING btree (plan_id);

-- Activer Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs propres paiements
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Politique pour que les utilisateurs puissent insérer leurs propres paiements
CREATE POLICY "Users can insert their own payments"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Politique pour que les utilisateurs puissent mettre à jour leurs propres paiements
CREATE POLICY "Users can update their own payments"
ON public.payments FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Politique pour permettre aux services (via service role) de gérer tous les paiements
CREATE POLICY "Service role can manage all payments"
ON public.payments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Créer un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Ajouter des contraintes pour valider les données
ALTER TABLE public.payments 
ADD CONSTRAINT check_amount_positive 
CHECK (amount > 0);

ALTER TABLE public.payments 
ADD CONSTRAINT check_status_valid 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'));

ALTER TABLE public.payments 
ADD CONSTRAINT check_currency_valid 
CHECK (currency IN ('XAF', 'EUR', 'USD'));

-- Commentaires pour documenter la table
COMMENT ON TABLE public.payments IS 'Table pour stocker les informations de paiement des utilisateurs';
COMMENT ON COLUMN public.payments.user_id IS 'Référence vers l''utilisateur qui a effectué le paiement';
COMMENT ON COLUMN public.payments.amount IS 'Montant du paiement en centimes ou unité de base';
COMMENT ON COLUMN public.payments.currency IS 'Devise du paiement (XAF, EUR, USD)';
COMMENT ON COLUMN public.payments.status IS 'Statut du paiement (pending, processing, completed, failed, cancelled, refunded)';
COMMENT ON COLUMN public.payments.payment_method IS 'Méthode de paiement utilisée (Mobile Money, Card, etc.)';
COMMENT ON COLUMN public.payments.transaction_id IS 'Identifiant unique fourni par la passerelle de paiement';
COMMENT ON COLUMN public.payments.plan_id IS 'Identifiant du plan d''abonnement acheté';
COMMENT ON COLUMN public.payments.metadata IS 'Données supplémentaires en JSON (webhooks, détails de transaction, etc.)';