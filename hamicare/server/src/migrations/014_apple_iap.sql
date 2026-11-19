-- Assinaturas do HamiCare+ compradas na App Store (StoreKit 2).
-- Cada assinatura (original_transaction_id) pertence à primeira conta que a apresentou; renovações,
-- cancelamentos e reembolsos chegam pelo aviso da Apple e atualizam o premium_until da mesma conta.
CREATE TABLE IF NOT EXISTS apple_subs (
  original_transaction_id text PRIMARY KEY CHECK (length(original_transaction_id) BETWEEN 1 AND 64),
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  product_id text NOT NULL CHECK (length(product_id) <= 100),
  expires_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  environment text NOT NULL CHECK (environment IN ('Production', 'Sandbox', 'Xcode', 'LocalTesting')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS apple_subs_user ON apple_subs (user_id);
ALTER TABLE apple_subs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS apple_subs_read ON apple_subs;
CREATE POLICY apple_subs_read ON apple_subs FOR SELECT USING (user_id = app.current_user_id());

-- Aplica uma transação já conferida (assinatura da Apple válida). p_user é a conta logada (compra no app)
-- ou NULL (aviso da Apple: usa o dono já gravado). Devolve o premium_until da conta, ou NULL se não há dono.
CREATE OR REPLACE FUNCTION app.apple_apply(p_orig text, p_user uuid, p_product text, p_expires timestamptz, p_revoked boolean, p_env text)
RETURNS date
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
DECLARE
  owner uuid;
  result date;
BEGIN
  SELECT user_id INTO owner FROM apple_subs WHERE original_transaction_id = p_orig FOR UPDATE;
  IF owner IS NULL THEN
    owner := p_user;
    IF owner IS NULL THEN RETURN NULL; END IF;
    INSERT INTO apple_subs (original_transaction_id, user_id, product_id, expires_at, revoked, environment)
    VALUES (p_orig, owner, p_product, p_expires, p_revoked, p_env);
  ELSIF p_user IS NOT NULL AND p_user <> owner THEN
    -- A mesma assinatura da Apple não libera duas contas.
    RAISE EXCEPTION 'assinatura de outra conta' USING ERRCODE = '42501';
  ELSE
    UPDATE apple_subs SET product_id = p_product,
      expires_at = CASE WHEN p_expires IS NULL OR expires_at > p_expires THEN coalesce(expires_at, p_expires) ELSE p_expires END,
      revoked = p_revoked, environment = p_env, updated_at = now()
    WHERE original_transaction_id = p_orig;
  END IF;
  IF p_revoked THEN
    -- Reembolso ou revogação: tira o Plus que veio desta assinatura (não mexe em teste grátis ou Guardião mais longos).
    UPDATE users SET premium_until = current_date - 1
      WHERE id = owner AND premium_until IS NOT NULL AND premium_until <= (p_expires AT TIME ZONE 'UTC')::date
      RETURNING premium_until INTO result;
  ELSIF p_expires IS NOT NULL AND p_expires > now() THEN
    UPDATE users SET premium_until = greatest(coalesce(premium_until, current_date), (p_expires AT TIME ZONE 'UTC')::date)
      WHERE id = owner RETURNING premium_until INTO result;
  END IF;
  IF result IS NULL THEN SELECT premium_until INTO result FROM users WHERE id = owner; END IF;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION app.apple_apply(text, uuid, text, timestamptz, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.apple_apply(text, uuid, text, timestamptz, boolean, text) TO {{APP_ROLE}};
