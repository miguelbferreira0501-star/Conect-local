-- Plano pago só é ativado quando o valor recebido cobre o preço da assinatura.
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
    -- Só libera o plano se o valor pago cobre o preço do plano assinado (protege contra cobrança alterada).
    IF p_value_cents IS NULL OR p_value_cents < v_sub.value_cents THEN
      RETURN 'underpaid';
    END IF;
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
