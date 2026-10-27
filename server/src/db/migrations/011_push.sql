-- Notificações no celular (Web Push): Pet ao Vivo, confirmação, lembrete do horário,
-- lembrete de retorno e novo pedido para a empresa.

CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE CHECK (char_length(endpoint) <= 1000 AND endpoint ~ '^https?://'),
  p256dh text NOT NULL CHECK (char_length(p256dh) <= 200),
  auth text NOT NULL CHECK (char_length(auth) <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_subscriptions_user_idx ON push_subscriptions (user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_self ON push_subscriptions USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO {{APP_ROLE}};

-- Configurações internas (chaves VAPID geradas no primeiro uso). Sem acesso direto do papel do app.
CREATE TABLE app_settings (name text PRIMARY KEY, value text NOT NULL);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION app.setting_init(p_name text, p_value text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v text;
BEGIN
  IF p_name NOT IN ('vapid') THEN RAISE EXCEPTION 'invalid_setting'; END IF;
  INSERT INTO app_settings (name, value) VALUES (p_name, p_value) ON CONFLICT (name) DO NOTHING;
  SELECT value INTO v FROM app_settings WHERE name = p_name;
  RETURN v;
END $$;

-- Lembretes já enviados (não repete).
CREATE TABLE notification_log (kind text NOT NULL, ref text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (kind, ref));
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Aparelhos do tutor de um agendamento: só para quem é da empresa do agendamento.
CREATE OR REPLACE FUNCTION app.push_targets_booking_owner(p_booking uuid)
RETURNS TABLE (endpoint text, p256dh text, auth text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT s.endpoint, s.p256dh, s.auth FROM bookings b JOIN push_subscriptions s ON s.user_id = b.user_id
  WHERE b.id = p_booking AND app.is_business_member(b.business_id)
$$;

-- Aparelhos da equipe (dono/gerente): só para quem acabou de fazer um pedido para a empresa.
CREATE OR REPLACE FUNCTION app.push_targets_business(p_business uuid)
RETURNS TABLE (endpoint text, p256dh text, auth text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT s.endpoint, s.p256dh, s.auth FROM business_members m JOIN push_subscriptions s ON s.user_id = m.user_id
  WHERE m.business_id = p_business AND m.role IN ('owner', 'manager')
    AND (EXISTS (SELECT 1 FROM bookings b WHERE b.business_id = p_business AND b.user_id = app.current_user_id() AND b.created_at > now() - interval '10 minutes')
      OR EXISTS (SELECT 1 FROM quote_requests q WHERE q.business_id = p_business AND q.user_id = app.current_user_id() AND q.created_at > now() - interval '10 minutes')
      OR EXISTS (SELECT 1 FROM customer_packages c WHERE c.business_id = p_business AND c.user_id = app.current_user_id() AND c.created_at > now() - interval '10 minutes'))
$$;

-- Aparelho que não existe mais (o serviço de push respondeu 404/410).
CREATE OR REPLACE FUNCTION app.push_forget(p_endpoint text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$ DELETE FROM push_subscriptions WHERE endpoint = p_endpoint $$;

-- Lembretes do agendador (a cada 15 min): véspera do horário e hora de voltar.
-- Marca como enviado na mesma transação, para não repetir.
CREATE OR REPLACE FUNCTION app.push_take_due(p_return_days jsonb)
RETURNS TABLE (kind text, endpoint text, p256dh text, auth text, title text, body text, url text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  RETURN QUERY
  WITH due_booking AS (
    SELECT bk.id, bk.user_id, b.name AS biz, s.name AS svc, pe.name AS pet,
      to_char(bk.starts_at AT TIME ZONE ci.timezone, 'DD/MM "às" HH24:MI') AS quando
    FROM bookings bk
    JOIN businesses b ON b.id = bk.business_id JOIN cities ci ON ci.ibge = b.city_ibge
    JOIN services s ON s.id = bk.service_id LEFT JOIN pets pe ON pe.id = bk.pet_id
    WHERE bk.status = 'confirmed' AND bk.starts_at BETWEEN now() + interval '2 hours' AND now() + interval '26 hours'
      AND EXISTS (SELECT 1 FROM push_subscriptions x WHERE x.user_id = bk.user_id)
      AND NOT EXISTS (SELECT 1 FROM notification_log l WHERE l.kind = 'booking_reminder' AND l.ref = bk.id::text)
  ), last_visit AS (
    SELECT DISTINCT ON (bk.user_id, coalesce(bk.pet_id::text, ''), bk.service_id)
      bk.id, bk.user_id, bk.pet_id, bk.service_id, bk.starts_at, b.name AS biz, b.slug, s.name AS svc, pe.name AS pet, c.slug AS cat
    FROM bookings bk
    JOIN businesses b ON b.id = bk.business_id JOIN categories c ON c.id = b.category_id
    JOIN services s ON s.id = bk.service_id LEFT JOIN pets pe ON pe.id = bk.pet_id
    WHERE bk.status = 'completed' AND b.status = 'active' AND app.plan_active(b.plan, b.plan_until)
    ORDER BY bk.user_id, coalesce(bk.pet_id::text, ''), bk.service_id, bk.starts_at DESC
  ), due_return AS (
    SELECT v.* FROM last_visit v
    WHERE p_return_days ? v.cat
      AND v.starts_at < now() - make_interval(days => (p_return_days ->> v.cat)::int)
      AND v.starts_at > now() - interval '90 days'
      AND EXISTS (SELECT 1 FROM push_subscriptions x WHERE x.user_id = v.user_id)
      AND NOT EXISTS (SELECT 1 FROM bookings nx WHERE nx.user_id = v.user_id AND nx.service_id = v.service_id
        AND nx.pet_id IS NOT DISTINCT FROM v.pet_id AND nx.starts_at > v.starts_at AND nx.status IN ('requested', 'confirmed', 'completed'))
      AND NOT EXISTS (SELECT 1 FROM notification_log l WHERE l.kind = 'return' AND l.ref = v.id::text)
  ), logged AS (
    INSERT INTO notification_log (kind, ref)
    SELECT 'booking_reminder', id::text FROM due_booking
    UNION ALL SELECT 'return', id::text FROM due_return
    ON CONFLICT DO NOTHING
    RETURNING notification_log.kind AS k, notification_log.ref AS r
  )
  SELECT 'booking_reminder'::text, x.endpoint, x.p256dh, x.auth,
    ('Lembrete: ' || d.svc)::text,
    (coalesce(d.pet || ' tem horário', 'Você tem horário') || ' em ' || d.biz || ' — ' || d.quando || '.')::text,
    '/atividades'::text
  FROM due_booking d JOIN logged l ON l.k = 'booking_reminder' AND l.r = d.id::text JOIN push_subscriptions x ON x.user_id = d.user_id
  UNION ALL
  SELECT 'return'::text, x.endpoint, x.p256dh, x.auth,
    (CASE WHEN r.pet IS NOT NULL THEN 'Hora de agendar para ' || r.pet || '?' ELSE 'Hora de agendar de novo?' END)::text,
    ('Faz ' || (current_date - (r.starts_at AT TIME ZONE 'America/Sao_Paulo')::date) || ' dias do último ' || lower(r.svc) || ' em ' || r.biz || '. Toque para marcar.')::text,
    ('/empresa/' || r.slug || '/agendar?servico=' || r.service_id)::text
  FROM due_return r JOIN logged l ON l.k = 'return' AND l.r = r.id::text JOIN push_subscriptions x ON x.user_id = r.user_id;
END $$;

REVOKE ALL ON FUNCTION app.setting_init(text, text), app.push_targets_booking_owner(uuid), app.push_targets_business(uuid),
  app.push_forget(text), app.push_take_due(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.setting_init(text, text), app.push_targets_booking_owner(uuid), app.push_targets_business(uuid),
  app.push_forget(text), app.push_take_due(jsonb) TO {{APP_ROLE}};
