/*
  # Création de la table payment_webhooks pour les logs

  1. Nouvelle table
    - `payment_webhooks`
      - `id` (uuid, primary key)
      - `payment_id` (uuid, foreign key vers payments)
      - `deposit_id` (text, ID du dépôt PawaPay)
      - `status` (varchar, statut du webhook)
      - `payload` (jsonb, payload complet du webhook)
      - `processed_at` (timestamp, date de traitement)

  2. Sécurité
    - Enable RLS sur la table `payment_webhooks`
    - Politiques pour que seuls les services puissent accéder

  3. Index
    - Index sur payment_id et deposit_id
*/

-- Créer la table payment_webhooks pour les logs
CREATE TABLE IF NOT EXISTS public.payment_webhooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
    deposit_id text NOT NULL,
    status character varying(50) NOT NULL,
    payload jsonb NOT NULL,
    processed_at timestamp with time zone DEFAULT now()
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_payment_id ON public.payment_webhooks USING btree (payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_deposit_id ON public.payment_webhooks USING btree (deposit_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed_at ON public.payment_webhooks USING btree (processed_at);

-- Activer Row Level Security
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Politique pour que seuls les services puissent accéder
CREATE POLICY "Service role can manage all payment webhooks"
ON public.payment_webhooks FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Commentaires
COMMENT ON TABLE public.payment_webhooks IS 'Table pour stocker les logs des webhooks de paiement';
COMMENT ON COLUMN public.payment_webhooks.payment_id IS 'Référence vers le paiement concerné';
COMMENT ON COLUMN public.payment_webhooks.deposit_id IS 'ID du dépôt PawaPay';
COMMENT ON COLUMN public.payment_webhooks.payload IS 'Payload complet du webhook reçu';