-- Esqueci minha senha: pedidos de troca com link de uso único que vence.
-- A API não lê nem escreve esta tabela direto: só pelas funções abaixo.

CREATE TABLE password_resets (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE INDEX password_resets_user ON password_resets (user_id);
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Cria o pedido. Devolve nome e e-mail só se a conta existe, não está suspensa
-- e não passou do limite de 3 pedidos por hora. A API responde igual nos dois casos.
CREATE OR REPLACE FUNCTION app.start_password_reset(p_email text, p_hash text, p_minutes int)
RETURNS TABLE (name text, email text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
DECLARE
  u users;
BEGIN
  SELECT * INTO u FROM users WHERE users.email = lower(p_email) AND banned_at IS NULL;
  IF NOT FOUND THEN RETURN; END IF;
  IF (SELECT count(*) FROM password_resets r WHERE r.user_id = u.id AND r.created_at > now() - interval '1 hour') >= 3 THEN
    RETURN;
  END IF;
  DELETE FROM password_resets r WHERE r.user_id = u.id AND (r.used_at IS NOT NULL OR r.expires_at < now());
  INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (p_hash, u.id, now() + make_interval(mins => p_minutes));
  RETURN QUERY SELECT u.name, u.email;
END $$;

-- O link ainda vale? (A tela avisa antes de a pessoa digitar a senha nova.)
CREATE OR REPLACE FUNCTION app.check_password_reset(p_hash text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT EXISTS (
    SELECT 1 FROM password_resets r JOIN users u ON u.id = r.user_id
    WHERE r.token_hash = p_hash AND r.used_at IS NULL AND r.expires_at > now() AND u.banned_at IS NULL
  )
$$;

-- Troca a senha: o link vale uma vez só e dentro do prazo. Derruba todas as
-- sessões abertas (inclusive a de quem pegou a senha antiga) e os outros pedidos.
CREATE OR REPLACE FUNCTION app.finish_password_reset(p_hash text, p_password_hash text) RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
DECLARE
  uid uuid;
BEGIN
  UPDATE password_resets r SET used_at = now()
  FROM users u
  WHERE r.token_hash = p_hash AND r.used_at IS NULL AND r.expires_at > now() AND u.id = r.user_id AND u.banned_at IS NULL
  RETURNING r.user_id INTO uid;
  IF uid IS NULL THEN RETURN NULL; END IF;
  UPDATE users SET password_hash = p_password_hash WHERE id = uid;
  DELETE FROM sessions WHERE user_id = uid;
  DELETE FROM password_resets WHERE user_id = uid AND token_hash <> p_hash;
  RETURN uid;
END $$;

REVOKE ALL ON FUNCTION app.start_password_reset(text, text, int), app.check_password_reset(text), app.finish_password_reset(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.start_password_reset(text, text, int), app.check_password_reset(text), app.finish_password_reset(text, text) TO {{APP_ROLE}};

-- ---------- Registro do aceite (a LGPD pede que o app consiga provar o consentimento) ----------

ALTER TABLE users
  ADD COLUMN terms_version text,
  ADD COLUMN terms_accepted_at timestamptz,
  ADD COLUMN health_consent_at timestamptz;

-- Grava a versão dos termos aceita e o consentimento para dados de saúde da própria pessoa.
CREATE OR REPLACE FUNCTION app.record_consent(p_version text, p_health boolean) RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
  UPDATE users SET
    terms_version = left(p_version, 20),
    terms_accepted_at = now(),
    health_consent_at = CASE WHEN p_health THEN now() ELSE NULL END
  WHERE id = app.current_user_id()
$$;

REVOKE ALL ON FUNCTION app.record_consent(text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.record_consent(text, boolean) TO {{APP_ROLE}};
