-- Métricas de produto para o Admin: dias de uso por pessoa (retenção), origem do cadastro e conversão.
ALTER TABLE users ADD COLUMN IF NOT EXISTS ref text CHECK (ref IS NULL OR length(ref) <= 40);

CREATE TABLE IF NOT EXISTS user_days (
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  day date NOT NULL DEFAULT current_date,
  PRIMARY KEY (user_id, day)
);
ALTER TABLE user_days ENABLE ROW LEVEL SECURITY;

-- Marca o dia de hoje como dia de uso de quem está logado (uma linha por dia).
CREATE OR REPLACE FUNCTION app.touch_day() RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
  INSERT INTO user_days (user_id) SELECT app.current_user_id() WHERE app.current_user_id() IS NOT NULL ON CONFLICT DO NOTHING
$$;

-- Origem do cadastro (só grava uma vez, logo depois de criar a conta).
CREATE OR REPLACE FUNCTION app.set_ref(p_ref text) RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
  UPDATE users SET ref = left(lower(regexp_replace(p_ref, '[^a-zA-Z0-9_-]', '', 'g')), 40)
  WHERE id = app.current_user_id() AND ref IS NULL AND coalesce(p_ref, '') <> ''
$$;

-- Retenção por grupo de cadastro, teste grátis, Plus e origem. Só admin.
CREATE OR REPLACE FUNCTION app.admin_metrics() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, app AS $$
DECLARE r jsonb;
BEGIN
  IF NOT app.is_admin() THEN RAISE EXCEPTION 'sem permissão' USING ERRCODE = '42501'; END IF;
  WITH base AS (
    SELECT u.id, u.created_at::date AS d0, u.trial_used, u.premium_until, coalesce(u.ref, 'direto') AS ref FROM users u WHERE u.created_at > now() - interval '90 days'
  ), ret AS (
    SELECT n,
      count(*) FILTER (WHERE b.d0 + n <= current_date) AS elegiveis,
      count(*) FILTER (WHERE b.d0 + n <= current_date AND EXISTS (SELECT 1 FROM user_days x WHERE x.user_id = b.id AND x.day = b.d0 + n)) AS voltaram
    FROM base b CROSS JOIN (VALUES (1), (7), (30)) AS t(n) GROUP BY n
  )
  SELECT jsonb_build_object(
    'retencao', (SELECT jsonb_object_agg('d' || n, jsonb_build_object('elegiveis', elegiveis, 'voltaram', voltaram)) FROM ret),
    'cadastros90', (SELECT count(*) FROM base),
    'testes', (SELECT count(*) FROM base WHERE trial_used),
    -- quem fez o teste, já passou dele (cadastro há mais de 8 dias) e continua com Plus: virou pagante (aproximado)
    'pagantesDepoisDoTeste', (SELECT count(*) FROM base WHERE trial_used AND d0 < current_date - 8 AND premium_until >= current_date),
    'testesVencidos', (SELECT count(*) FROM base WHERE trial_used AND d0 < current_date - 8),
    'origem', (SELECT coalesce(jsonb_object_agg(ref, n), '{}'::jsonb) FROM (SELECT ref, count(*) AS n FROM base GROUP BY ref ORDER BY n DESC LIMIT 12) o),
    'ativosHoje', (SELECT count(*) FROM user_days WHERE day = current_date),
    'turmas', (SELECT count(*) FROM teams),
    'amizades30', (SELECT count(*) FROM friendships WHERE status = 'aceita' AND created_at > now() - interval '30 days')
  ) INTO r;
  RETURN r;
END $$;

REVOKE ALL ON FUNCTION app.touch_day(), app.set_ref(text), app.admin_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.touch_day(), app.set_ref(text), app.admin_metrics() TO {{APP_ROLE}};
