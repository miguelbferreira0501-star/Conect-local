-- Assinaturas pagas pelas empresas (Pix ou cartão via meio de pagamento — Asaas).
-- Não guardamos CPF/CNPJ nem dados de cartão: ficam só no meio de pagamento.

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'asaas',
  provider_customer_id text NOT NULL,
  provider_subscription_id text NOT NULL UNIQUE,
  plan text NOT NULL CHECK (plan IN ('pro', 'team')),
  billing_type text NOT NULL CHECK (billing_type IN ('PIX', 'CREDIT_CARD')),
  value_cents int NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'canceled')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  canceled_at timestamptz
);
CREATE INDEX subscriptions_business_idx ON subscriptions (business_id, created_at DESC);

CREATE TABLE subscription_payments (
  provider_payment_id text PRIMARY KEY,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  value_cents int NOT NULL,
  status text NOT NULL,
  due_date date,
  paid_at timestamptz,
  invoice_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Eventos do meio de pagamento já processados (o aviso pode chegar repetido).
CREATE TABLE billing_events (
  id text PRIMARY KEY,
  event text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE businesses ADD COLUMN billing_customer_id text;

GRANT SELECT ON subscriptions, subscription_payments TO {{APP_ROLE}};
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_member_read ON subscriptions FOR SELECT USING (app.is_business_member(business_id));
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY sub_payments_member_read ON subscription_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_id AND app.is_business_member(s.business_id)));

-- Registrar uma assinatura criada no meio de pagamento (pelo dono/gerente da empresa).
CREATE OR REPLACE FUNCTION app.billing_register_subscription(
  p_business uuid, p_customer text, p_subscription text, p_plan text, p_billing_type text, p_value_cents int
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT app.is_business_member(p_business) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  UPDATE businesses SET billing_customer_id = p_customer WHERE id = p_business;
  INSERT INTO subscriptions (business_id, provider_customer_id, provider_subscription_id, plan, billing_type, value_cents, created_by)
  VALUES (p_business, p_customer, p_subscription, p_plan, p_billing_type, p_value_cents, app.current_user_id())
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION app.billing_mark_canceled(p_subscription text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE subscriptions SET status = 'canceled', canceled_at = coalesce(canceled_at, now())
  WHERE provider_subscription_id = p_subscription
    AND (app.current_user_id() IS NULL OR app.is_business_member(business_id));
END $$;

-- Aplicar um aviso do meio de pagamento (chamado só pelo servidor, após validar o token do aviso).
-- Pagamento confirmado: ativa o plano até o próximo vencimento + 3 dias de tolerância.
CREATE OR REPLACE FUNCTION app.billing_apply_payment(
  p_event_id text, p_event text, p_payment text, p_subscription text, p_status text, p_value_cents int, p_due date, p_invoice_url text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_sub subscriptions;
BEGIN
  INSERT INTO billing_events (id, event) VALUES (p_event_id, p_event) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 'duplicate'; END IF;
  SELECT * INTO v_sub FROM subscriptions WHERE provider_subscription_id = p_subscription;
  IF NOT FOUND THEN RETURN 'unknown_subscription'; END IF;
  INSERT INTO subscription_payments (provider_payment_id, subscription_id, value_cents, status, due_date, invoice_url, paid_at)
  VALUES (p_payment, v_sub.id, p_value_cents, p_status, p_due, p_invoice_url,
          CASE WHEN p_event IN ('PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED') THEN now() END)
  ON CONFLICT (provider_payment_id) DO UPDATE SET status = EXCLUDED.status, invoice_url = coalesce(EXCLUDED.invoice_url, subscription_payments.invoice_url),
    paid_at = coalesce(subscription_payments.paid_at, EXCLUDED.paid_at), updated_at = now();
  IF p_event IN ('PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED') THEN
    UPDATE subscriptions SET status = 'active' WHERE id = v_sub.id AND status = 'pending';
    UPDATE businesses SET
      plan = v_sub.plan,
      plan_until = greatest(coalesce(plan_until, now()), (coalesce(p_due, current_date) + interval '1 month' + interval '3 days')),
      updated_at = now()
    WHERE id = v_sub.business_id;
    RETURN 'activated';
  ELSIF p_event IN ('PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED') THEN
    UPDATE businesses SET plan_until = now() WHERE id = v_sub.business_id AND plan = v_sub.plan;
    RETURN 'revoked';
  END IF;
  RETURN 'recorded';
END $$;

CREATE OR REPLACE FUNCTION app.billing_subscription_event(p_event_id text, p_event text, p_subscription text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO billing_events (id, event) VALUES (p_event_id, p_event) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 'duplicate'; END IF;
  IF p_event IN ('SUBSCRIPTION_DELETED', 'SUBSCRIPTION_INACTIVATED') THEN
    UPDATE subscriptions SET status = 'canceled', canceled_at = coalesce(canceled_at, now()) WHERE provider_subscription_id = p_subscription;
    RETURN 'canceled';
  END IF;
  RETURN 'ignored';
END $$;

REVOKE ALL ON FUNCTION app.billing_register_subscription(uuid, text, text, text, text, int), app.billing_mark_canceled(text),
  app.billing_apply_payment(text, text, text, text, text, int, date, text), app.billing_subscription_event(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.billing_register_subscription(uuid, text, text, text, text, int), app.billing_mark_canceled(text),
  app.billing_apply_payment(text, text, text, text, text, int, date, text), app.billing_subscription_event(text, text, text) TO {{APP_ROLE}};
