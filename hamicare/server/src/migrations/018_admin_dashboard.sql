-- Painel do negócio para o Admin: usuários (novos e ativos), série dos últimos 30 dias, assinantes por origem,
-- receita estimada por mês e os pagamentos e cadastros mais recentes. Só admin.
CREATE OR REPLACE FUNCTION app.admin_dashboard(p_mensal_cents int, p_anual_cents int) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, app AS $$
DECLARE r jsonb;
BEGIN
  IF NOT app.is_admin() THEN RAISE EXCEPTION 'sem permissão' USING ERRCODE = '42501'; END IF;
  WITH
  g AS (SELECT * FROM google_subs WHERE NOT revoked AND NOT test AND expires_at > now()),
  a AS (SELECT * FROM apple_subs WHERE NOT revoked AND environment = 'Production' AND expires_at > now()),
  gd AS (SELECT DISTINCT r.user_id FROM guardian_requests r JOIN users u ON u.id = r.user_id WHERE r.status = 'atendido' AND u.premium_until >= current_date),
  plus AS (SELECT id, trial_used, created_at FROM users WHERE premium_until >= current_date),
  pay AS (
    SELECT 'Google Play' AS loja, s.user_id, s.product_id AS plano, s.expires_at, s.revoked, s.updated_at AS quando FROM google_subs s WHERE NOT s.test
    UNION ALL
    SELECT 'App Store', s.user_id, s.product_id, s.expires_at, s.revoked, s.updated_at FROM apple_subs s WHERE s.environment = 'Production'
    UNION ALL
    SELECT 'Guardião (Pix/cartão)', o.user_id, o.tier || ' · ' || o.period, NULL, o.status <> 'pago', coalesce(o.paid_at, o.created_at) FROM guardian_orders o WHERE o.provider <> 'teste' AND o.status = 'pago'
  )
  SELECT jsonb_build_object(
    'usuarios', jsonb_build_object(
      'total', (SELECT count(*) FROM users),
      'novosHoje', (SELECT count(*) FROM users WHERE created_at::date = current_date),
      'novos7', (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days'),
      'novos30', (SELECT count(*) FROM users WHERE created_at > now() - interval '30 days'),
      'ativosHoje', (SELECT count(DISTINCT user_id) FROM user_days WHERE day = current_date),
      'ativos7', (SELECT count(DISTINCT user_id) FROM user_days WHERE day > current_date - 7),
      'ativos30', (SELECT count(DISTINCT user_id) FROM user_days WHERE day > current_date - 30),
      'menores', (SELECT count(*) FROM users WHERE age_group <> '18mais')
    ),
    'serie', (
      SELECT jsonb_agg(jsonb_build_object(
        'dia', to_char(d, 'YYYY-MM-DD'),
        'novos', (SELECT count(*) FROM users WHERE created_at::date = d),
        'ativos', (SELECT count(DISTINCT user_id) FROM user_days WHERE day = d)
      ) ORDER BY d)
      FROM generate_series(current_date - 29, current_date, interval '1 day') AS t(d)
    ),
    'assinantes', jsonb_build_object(
      'plusAtivos', (SELECT count(*) FROM plus),
      'googleMensal', (SELECT count(*) FROM g WHERE product_id ILIKE '%mensal%'),
      'googleAnual', (SELECT count(*) FROM g WHERE product_id ILIKE '%anual%'),
      'appleMensal', (SELECT count(*) FROM a WHERE product_id ILIKE '%mensal%'),
      'appleAnual', (SELECT count(*) FROM a WHERE product_id ILIKE '%anual%'),
      'guardiao', (SELECT count(*) FROM gd),
      'teste', (SELECT count(*) FROM plus p WHERE p.trial_used AND p.created_at > now() - interval '8 days'
                AND NOT EXISTS (SELECT 1 FROM g WHERE g.user_id = p.id) AND NOT EXISTS (SELECT 1 FROM a WHERE a.user_id = p.id))
    ),
    -- Receita recorrente estimada por mês (preço cheio, antes da taxa da loja): mensal + anual/12.
    'mrrCents', (
      (SELECT count(*) FROM g WHERE product_id ILIKE '%mensal%') + (SELECT count(*) FROM a WHERE product_id ILIKE '%mensal%')
    ) * p_mensal_cents + (
      ((SELECT count(*) FROM g WHERE product_id ILIKE '%anual%') + (SELECT count(*) FROM a WHERE product_id ILIKE '%anual%')) * p_anual_cents / 12
    ),
    'guardiao30Cents', (SELECT coalesce(sum(amount_cents), 0) FROM guardian_orders WHERE status = 'pago' AND provider <> 'teste' AND paid_at > now() - interval '30 days'),
    'pagamentos', (
      SELECT coalesce(jsonb_agg(x ORDER BY x->>'quando' DESC), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('loja', p.loja, 'plano', p.plano, 'nome', u.name, 'email', u.email,
          'quando', to_char(p.quando, 'YYYY-MM-DD HH24:MI'), 'vence', to_char(p.expires_at, 'YYYY-MM-DD'),
          'ativo', NOT p.revoked AND (p.expires_at IS NULL OR p.expires_at > now())) AS x
        FROM pay p LEFT JOIN users u ON u.id = p.user_id ORDER BY p.quando DESC LIMIT 30
      ) q
    ),
    'recentes', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('nome', name, 'email', email, 'idade', age_group, 'origem', coalesce(ref, 'direto'),
          'criado', to_char(created_at, 'YYYY-MM-DD HH24:MI'), 'visto', to_char(last_seen_at, 'YYYY-MM-DD'),
          'plus', premium_until >= current_date) AS x
        FROM users ORDER BY created_at DESC LIMIT 30
      ) q
    )
  ) INTO r;
  RETURN r;
END $$;

REVOKE ALL ON FUNCTION app.admin_dashboard(int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.admin_dashboard(int, int) TO {{APP_ROLE}};
