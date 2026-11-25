-- Assinaturas do Lumbi+ compradas na Google Play (app Android). Cada compra tem um purchase token;
-- ao trocar de plano ou voltar a assinar, o Google cria um token novo que aponta para o anterior
-- (linked), e o dono continua o mesmo. O servidor confere cada token na API do Google antes de aplicar.
CREATE TABLE IF NOT EXISTS google_subs (
  purchase_token text PRIMARY KEY CHECK (length(purchase_token) BETWEEN 10 AND 2000),
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  product_id text NOT NULL CHECK (length(product_id) <= 100),
  expires_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  test boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS google_subs_user ON google_subs (user_id);
ALTER TABLE google_subs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS google_subs_read ON google_subs;
CREATE POLICY google_subs_read ON google_subs FOR SELECT USING (user_id = app.current_user_id());

-- Aplica uma assinatura já conferida no Google. p_user é a conta logada (compra no app) ou NULL (aviso do
-- Google: usa o dono já gravado, ou o dono do token anterior). Devolve o premium_until da conta.
CREATE OR REPLACE FUNCTION app.google_apply(p_token text, p_linked text, p_user uuid, p_product text, p_expires timestamptz, p_revoked boolean, p_test boolean)
RETURNS date
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
DECLARE
  owner uuid;
  result date;
BEGIN
  SELECT user_id INTO owner FROM google_subs WHERE purchase_token = p_token FOR UPDATE;
  IF owner IS NULL AND p_linked IS NOT NULL THEN
    SELECT user_id INTO owner FROM google_subs WHERE purchase_token = p_linked;
  END IF;
  IF owner IS NOT NULL AND p_user IS NOT NULL AND p_user <> owner THEN
    -- A mesma assinatura da Google Play não libera duas contas.
    RAISE EXCEPTION 'assinatura de outra conta' USING ERRCODE = '42501';
  END IF;
  owner := coalesce(owner, p_user);
  IF owner IS NULL THEN RETURN NULL; END IF;
  INSERT INTO google_subs (purchase_token, user_id, product_id, expires_at, revoked, test)
  VALUES (p_token, owner, p_product, p_expires, p_revoked, p_test)
  ON CONFLICT (purchase_token) DO UPDATE SET product_id = excluded.product_id,
    expires_at = CASE WHEN excluded.expires_at IS NULL OR google_subs.expires_at > excluded.expires_at THEN coalesce(google_subs.expires_at, excluded.expires_at) ELSE excluded.expires_at END,
    revoked = excluded.revoked, test = excluded.test, updated_at = now();
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
REVOKE ALL ON FUNCTION app.google_apply(text, text, uuid, text, timestamptz, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.google_apply(text, text, uuid, text, timestamptz, boolean, boolean) TO {{APP_ROLE}};
